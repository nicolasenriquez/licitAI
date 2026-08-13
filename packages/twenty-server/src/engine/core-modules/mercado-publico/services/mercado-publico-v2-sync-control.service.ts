import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';

import { DataSource } from 'typeorm';

import { InjectMessageQueue } from 'src/engine/core-modules/message-queue/decorators/message-queue.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';
import {
  MERCADO_PUBLICO_API_V2_COMPRA_AGIL_SOURCE,
  MERCADO_PUBLICO_V2_SYNC_COMMAND_JOB_NAME,
} from 'src/engine/core-modules/mercado-publico/mercado-publico.constants';

export type MercadoPublicoV2SyncControlAction = 'start' | 'resume' | 'cancel';

export type MercadoPublicoV2ClaimCommandResult =
  | { kind: 'claimed'; syncRunId: string; attemptId: string }
  | {
      kind: 'noop';
      reason:
        | 'already_terminal'
        | 'cancelled'
        | 'unknown_command'
        | 'missing_sync_run';
    };

export type MercadoPublicoV2SubmitCommandInput = {
  workspaceId: string;
  actorUserWorkspaceId: string;
  action: MercadoPublicoV2SyncControlAction;
  idempotencyKey: string;
  confirmed?: boolean;
  syncRunId?: string;
};

export type MercadoPublicoV2SubmitCommandResult = {
  state: 'queued' | 'reused' | 'global_sync_active' | 'cancelled';
  syncRunId?: string;
};

export type MercadoPublicoV2LatestRun = {
  syncRunId: string | null;
  safeStatus: string;
  startedAt: Date | null;
  updatedAt: Date | null;
  timeline: {
    eventType: string;
    at: Date;
    operatorName: string | null;
  }[];
};

type MercadoPublicoV2SyncCommandRow = {
  id: string;
  state: string;
  request_fingerprint: string;
  sync_run_id: string | null;
  result: MercadoPublicoV2SubmitCommandResult | null;
};

const MERCADO_PUBLICO_V2_SYNC_ACTIVE_RUN_STATUSES = [
  'queued',
  'discovering',
  'hydrating',
  'projecting',
  'reconciling',
] as const;

const isUniqueViolation = (error: unknown): boolean =>
  (error as { code?: string } | null)?.code === '23505';

export const buildMercadoPublicoV2SyncCommandFingerprint = (
  input: Pick<
    MercadoPublicoV2SubmitCommandInput,
    'action' | 'confirmed' | 'syncRunId'
  >,
): string =>
  JSON.stringify({
    action: input.action,
    confirmed: input.action === 'resume' ? undefined : input.confirmed,
    syncRunId: input.syncRunId ?? null,
  });

@Injectable()
export class MercadoPublicoV2SyncControlService {
  private readonly logger = new Logger(
    MercadoPublicoV2SyncControlService.name,
  );

  constructor(
    @InjectDataSource()
    private readonly coreDataSource: DataSource,
    @InjectMessageQueue(MessageQueue.mercadoPublicoQueue)
    private readonly messageQueueService: MessageQueueService,
  ) {}

  async isOperator({
    workspaceId,
    userWorkspaceId,
  }: {
    workspaceId: string;
    userWorkspaceId: string;
  }): Promise<boolean> {
    const rows = await this.coreDataSource.query<{ id: string }[]>(
      `
        SELECT id
        FROM mp.sync_operator
        WHERE workspace_id = $1 AND user_workspace_id = $2
        LIMIT 1
      `,
      [workspaceId, userWorkspaceId],
    );

    return rows.length > 0;
  }

  async submitCommand(
    input: MercadoPublicoV2SubmitCommandInput,
  ): Promise<MercadoPublicoV2SubmitCommandResult> {
    if (input.action !== 'resume' && input.confirmed !== true) {
      throw new Error(
        'Confirmation required for Mercado Publico V2 start and cancel commands',
      );
    }

    const fingerprint = buildMercadoPublicoV2SyncCommandFingerprint(input);
    const existingCommand = await this.findCommand(
      input.workspaceId,
      input.idempotencyKey,
    );

    if (existingCommand !== undefined) {
      if (existingCommand.request_fingerprint !== fingerprint) {
        throw new Error(
          '409 Conflict: the idempotency key was reused with a different request',
        );
      }

      return (
        existingCommand.result ?? {
          state: existingCommand.state as MercadoPublicoV2SubmitCommandResult['state'],
          syncRunId: existingCommand.sync_run_id ?? undefined,
        }
      );
    }

    if (input.action === 'resume') {
      await this.assertResumableRun(input);
    }

    const commandId = await this.insertCommand(input, fingerprint);

    await this.appendAudit({
      workspaceId: input.workspaceId,
      syncCommandId: commandId,
      actorUserWorkspaceId: input.actorUserWorkspaceId,
      eventType: 'command_created',
      eventData: { action: input.action },
    });

    let result: MercadoPublicoV2SubmitCommandResult;

    if (input.action === 'start') {
      result = await this.createRunOrReuse(input, commandId);
    } else if (input.action === 'cancel') {
      result = await this.requestCancellation(input, commandId);
    } else {
      result = { state: 'queued', syncRunId: input.syncRunId };
    }

    await this.coreDataSource.query(
      `
        UPDATE mp.sync_command
        SET sync_run_id = $2, result = $3::jsonb, updated_at = now()
        WHERE id = $1
      `,
      [commandId, result.syncRunId ?? null, JSON.stringify(result)],
    );

    await this.dispatch(commandId, input, result);

    return result;
  }

  async claimCommand(
    commandId: string,
    workerId: string,
  ): Promise<MercadoPublicoV2ClaimCommandResult> {
    const commandRows = await this.coreDataSource.query<
      {
        id: string;
        workspace_id: string;
        action: string;
        state: string;
        sync_run_id: string | null;
      }[]
    >(
      `
        SELECT id, workspace_id, action, state, sync_run_id
        FROM mp.sync_command
        WHERE id = $1
      `,
      [commandId],
    );
    const command = commandRows[0];

    if (command === undefined) {
      return { kind: 'noop', reason: 'unknown_command' };
    }

    if (command.action === 'cancel') {
      await this.coreDataSource.query(
        `
          UPDATE mp.sync_run
          SET status = 'cancelled', finished_at = now(), updated_at = now()
          WHERE id = $1 AND status = 'queued'
        `,
        [command.sync_run_id],
      );
      await this.coreDataSource.query(
        `
          UPDATE mp.sync_command
          SET state = 'cancelled', finished_at = now(), updated_at = now()
          WHERE id = $1
        `,
        [commandId],
      );

      return { kind: 'noop', reason: 'cancelled' };
    }

    if (command.sync_run_id === null) {
      return { kind: 'noop', reason: 'missing_sync_run' };
    }

    const claimedRows = await this.coreDataSource.query<{ id: string }[]>(
      `
        UPDATE mp.sync_command
        SET state = 'claimed', claimed_at = now(), updated_at = now()
        WHERE id = $1 AND state = 'pending'
        RETURNING id
      `,
      [commandId],
    );

    if (claimedRows.length === 0) {
      return { kind: 'noop', reason: 'already_terminal' };
    }

    const attemptNumberRows = await this.coreDataSource.query<
      { next_attempt: string }[]
    >(
      `
        SELECT COALESCE(MAX(attempt_number), 0) + 1 AS next_attempt
        FROM mp.sync_run_attempt
        WHERE sync_command_id = $1
      `,
      [commandId],
    );
    const attemptRows = await this.coreDataSource.query<{ id: string }[]>(
      `
        INSERT INTO mp.sync_run_attempt (
          sync_run_id, sync_command_id, attempt_number, worker_id, state, heartbeat_at
        )
        VALUES ($1, $2, $3, $4, 'running', now())
        RETURNING id
      `,
      [
        command.sync_run_id,
        commandId,
        Number(attemptNumberRows[0]?.next_attempt ?? 1),
        workerId,
      ],
    );

    await this.coreDataSource.query(
      `
        UPDATE mp.sync_run
        SET heartbeat_at = now(), heartbeat_worker_id = $2, updated_at = now()
        WHERE id = $1
      `,
      [command.sync_run_id, workerId],
    );
    await this.appendAudit({
      workspaceId: command.workspace_id,
      syncRunId: command.sync_run_id,
      syncCommandId: commandId,
      eventType: 'claimed',
      eventData: { workerId, attemptId: attemptRows[0].id },
    });

    return {
      kind: 'claimed',
      syncRunId: command.sync_run_id,
      attemptId: attemptRows[0].id,
    };
  }

  async recoverDispatches(
    staleHeartbeatMarginSeconds: number,
  ): Promise<string[]> {
    const staleClaimedIds = await this.coreDataSource.query<{ id: string }[]>(
      `
        SELECT c.id
        FROM mp.sync_command c
        JOIN mp.sync_run r ON r.id = c.sync_run_id
        WHERE c.state = 'claimed'
          AND r.heartbeat_at IS NOT NULL
          AND r.heartbeat_at < now() - make_interval(secs => $1)
      `,
      [staleHeartbeatMarginSeconds],
    );
    const staleIds = staleClaimedIds.map((row) => row.id);

    if (staleIds.length === 0) {
      const pendingRows = await this.coreDataSource.query<{ id: string }[]>(
        `
          SELECT id
          FROM mp.sync_command
          WHERE state = 'pending'
            AND (dispatched_at IS NULL OR dispatched_at < now() - interval '2 minutes')
        `,
      );

      return pendingRows.map((row) => row.id);
    }

    await this.coreDataSource.query(
      `
        UPDATE mp.sync_command c
        SET state = CASE r.status
              WHEN 'succeeded' THEN 'succeeded'
              WHEN 'cancelled' THEN 'cancelled'
              ELSE 'failed'
            END,
            finished_at = now(), updated_at = now()
        FROM mp.sync_run r
        WHERE c.id = ANY($1::uuid[])
          AND r.id = c.sync_run_id
          AND r.status NOT IN ('queued', 'discovering', 'hydrating', 'projecting', 'reconciling')
      `,
      [staleIds],
    );
    const recoverableRows = await this.coreDataSource.query<
      { id: string; workspace_id: string }[]
    >(
      `
        UPDATE mp.sync_command c
        SET state = 'pending', claimed_at = NULL, dispatched_at = now(),
            dispatch_attempts = dispatch_attempts + 1, updated_at = now()
        FROM mp.sync_run r
        WHERE c.id = ANY($1::uuid[])
          AND r.id = c.sync_run_id
          AND r.status IN ('queued', 'discovering', 'hydrating', 'projecting', 'reconciling')
        RETURNING c.id, c.workspace_id
      `,
      [staleIds],
    );
    await this.coreDataSource.query(
      `
        UPDATE mp.sync_run_attempt
        SET state = 'stale', finished_at = now(), updated_at = now()
        WHERE sync_command_id = ANY($1::uuid[]) AND state = 'running'
      `,
      [staleIds],
    );

    for (const row of recoverableRows) {
      await this.appendAudit({
        workspaceId: row.workspace_id,
        syncCommandId: row.id,
        eventType: 'heartbeat_recovery',
        eventData: {},
      });
    }

    const pendingRows = await this.coreDataSource.query<{ id: string }[]>(
      `
        SELECT id
        FROM mp.sync_command
        WHERE state = 'pending'
          AND (dispatched_at IS NULL OR dispatched_at < now() - interval '2 minutes')
      `,
    );

    return [...recoverableRows.map((row) => row.id), ...pendingRows.map((row) => row.id)];
  }

  async getLatestRun(
    workspaceId: string,
  ): Promise<MercadoPublicoV2LatestRun | null> {
    const rows = await this.coreDataSource.query<
      {
        id: string;
        status: string;
        created_at: Date | null;
        updated_at: Date | null;
      }[]
    >(
      `
        SELECT id, status, created_at, updated_at
        FROM mp.sync_run
        WHERE control_workspace_id = $1
        ORDER BY created_at DESC
        LIMIT 1
      `,
      [workspaceId],
    );
    const row = rows[0];

    if (row === undefined) {
      return null;
    }

    const timelineRows = await this.coreDataSource.query<
      {
        event_type: string;
        created_at: Date;
        operator_name: string | null;
      }[]
    >(
      `
        SELECT a.event_type, a.created_at,
               u."displayName" AS operator_name
        FROM mp.sync_run_audit a
        LEFT JOIN mp.sync_command c ON c.id = a.sync_command_id
        LEFT JOIN core.user_workspace uw ON uw.id = a.actor_user_workspace_id
        LEFT JOIN core."user" u ON u.id = uw."userId"
        WHERE a.workspace_id = $1
          AND COALESCE(a.sync_run_id, c.sync_run_id) = $2
        ORDER BY a.created_at ASC
      `,
      [workspaceId, row.id],
    );

    return {
      syncRunId: row.id,
      safeStatus: row.status,
      startedAt: row.created_at,
      updatedAt: row.updated_at,
      timeline: timelineRows.map((timelineRow) => ({
        eventType: timelineRow.event_type,
        at: timelineRow.created_at,
        operatorName: timelineRow.operator_name,
      })),
    };
  }

  private async assertResumableRun(
    input: MercadoPublicoV2SubmitCommandInput,
  ): Promise<void> {
    const rows = await this.coreDataSource.query<
      { status: string; error_stage: string | null }[]
    >(
      `
        SELECT status, error_stage
        FROM mp.sync_run
        WHERE id = $1 AND control_workspace_id = $2
      `,
      [input.syncRunId, input.workspaceId],
    );
    const run = rows[0];
    const isResumable =
      run !== undefined &&
      (run.status === 'partial_failed' || run.status === 'cancelled') &&
      run.error_stage !== 'discovering';

    if (!isResumable) {
      throw new Error(
        '409 Conflict: the Mercado Publico V2 sync run is not resumable',
      );
    }
  }

  private async findCommand(
    workspaceId: string,
    idempotencyKey: string,
  ): Promise<MercadoPublicoV2SyncCommandRow | undefined> {
    const rows = await this.coreDataSource.query<
      MercadoPublicoV2SyncCommandRow[]
    >(
      `
        SELECT id, state, request_fingerprint, sync_run_id, result
        FROM mp.sync_command
        WHERE workspace_id = $1 AND idempotency_key = $2
      `,
      [workspaceId, idempotencyKey],
    );

    return rows[0];
  }

  private async insertCommand(
    input: MercadoPublicoV2SubmitCommandInput,
    fingerprint: string,
  ): Promise<string> {
    const rows = await this.coreDataSource.query<{ id: string }[]>(
      `
        INSERT INTO mp.sync_command (
          idempotency_key, workspace_id, actor_user_workspace_id, action,
          intent, scope, request_fingerprint, request_payload, state
        )
        VALUES ($1, $2, $3, $4, 'incremental', 'global', $5, $6::jsonb, 'pending')
        RETURNING id
      `,
      [
        input.idempotencyKey,
        input.workspaceId,
        input.actorUserWorkspaceId,
        input.action,
        fingerprint,
        JSON.stringify(input),
      ],
    );

    return rows[0].id;
  }

  private async createRunOrReuse(
    input: MercadoPublicoV2SubmitCommandInput,
    commandId: string,
  ): Promise<MercadoPublicoV2SubmitCommandResult> {
    try {
      const rows = await this.coreDataSource.query<{ id: string }[]>(
        `
          INSERT INTO mp.sync_run (
            intent, source, scope, status,
            control_workspace_id, control_user_workspace_id
          )
          VALUES ('incremental', $1, 'global', 'queued', $2, $3)
          RETURNING id
        `,
        [
          MERCADO_PUBLICO_API_V2_COMPRA_AGIL_SOURCE,
          input.workspaceId,
          input.actorUserWorkspaceId,
        ],
      );
      const syncRunId = rows[0].id;

      await this.appendAudit({
        workspaceId: input.workspaceId,
        syncRunId,
        syncCommandId: commandId,
        actorUserWorkspaceId: input.actorUserWorkspaceId,
        eventType: 'run_created',
        eventData: {},
      });

      return { state: 'queued', syncRunId };
    } catch (error) {
      if (!isUniqueViolation(error)) {
        throw error;
      }

      const activeRun = await this.findActiveRun();

      if (activeRun === undefined) {
        throw error;
      }

      const isSameWorkspace = activeRun.control_workspace_id === input.workspaceId;

      await this.coreDataSource.query(
        `
          UPDATE mp.sync_command
          SET state = 'reused', sync_run_id = $2, updated_at = now()
          WHERE id = $1
        `,
        [commandId, isSameWorkspace ? activeRun.id : null],
      );
      await this.appendAudit({
        workspaceId: input.workspaceId,
        syncRunId: isSameWorkspace ? activeRun.id : null,
        syncCommandId: commandId,
        actorUserWorkspaceId: input.actorUserWorkspaceId,
        eventType: 'reused',
        eventData: {},
      });

      if (isSameWorkspace) {
        return { state: 'reused', syncRunId: activeRun.id };
      }

      return { state: 'global_sync_active' };
    }
  }

  private async findActiveRun(): Promise<
    { id: string; control_workspace_id: string } | undefined
  > {
    const rows = await this.coreDataSource.query<
      { id: string; control_workspace_id: string }[]
    >(
      `
        SELECT id, control_workspace_id
        FROM mp.sync_run
        WHERE source = $1
          AND scope = 'global'
          AND status IN (${MERCADO_PUBLICO_V2_SYNC_ACTIVE_RUN_STATUSES.map(
            (status) => `'${status}'`,
          ).join(', ')})
        ORDER BY created_at DESC
        LIMIT 1
      `,
      [MERCADO_PUBLICO_API_V2_COMPRA_AGIL_SOURCE],
    );

    return rows[0];
  }

  private async requestCancellation(
    input: MercadoPublicoV2SubmitCommandInput,
    commandId: string,
  ): Promise<MercadoPublicoV2SubmitCommandResult> {
    await this.coreDataSource.query(
      `
        UPDATE mp.sync_run
        SET cancellation_requested_at = now(),
            cancellation_requested_by_user_workspace_id = $2,
            updated_at = now()
        WHERE control_workspace_id = $1
          AND status IN (${MERCADO_PUBLICO_V2_SYNC_ACTIVE_RUN_STATUSES.map(
            (status) => `'${status}'`,
          ).join(', ')})
      `,
      [input.workspaceId, input.actorUserWorkspaceId],
    );
    await this.appendAudit({
      workspaceId: input.workspaceId,
      syncCommandId: commandId,
      actorUserWorkspaceId: input.actorUserWorkspaceId,
      eventType: 'cancellation_requested',
      eventData: {},
    });

    return { state: 'cancelled' };
  }

  private async dispatch(
    commandId: string,
    input: MercadoPublicoV2SubmitCommandInput,
    result: MercadoPublicoV2SubmitCommandResult,
  ): Promise<void> {
    try {
      await this.messageQueueService.add(
        MERCADO_PUBLICO_V2_SYNC_COMMAND_JOB_NAME,
        { commandId },
      );
      await this.coreDataSource.query(
        `
          UPDATE mp.sync_command
          SET dispatched_at = now(),
              dispatch_attempts = dispatch_attempts + 1,
              updated_at = now()
          WHERE id = $1
        `,
        [commandId],
      );
      await this.appendAudit({
        workspaceId: input.workspaceId,
        syncRunId: result.syncRunId ?? null,
        syncCommandId: commandId,
        actorUserWorkspaceId: input.actorUserWorkspaceId,
        eventType: 'dispatched',
        eventData: { jobName: MERCADO_PUBLICO_V2_SYNC_COMMAND_JOB_NAME },
      });
    } catch (error) {
      this.logger.warn(
        `Failed to dispatch Mercado Publico V2 sync command ${commandId}: ${(error as Error).message}`,
      );
      await this.appendAudit({
        workspaceId: input.workspaceId,
        syncRunId: result.syncRunId ?? null,
        syncCommandId: commandId,
        actorUserWorkspaceId: input.actorUserWorkspaceId,
        eventType: 'dispatch_failed',
        eventData: {},
      });
    }
  }

  private async appendAudit({
    workspaceId,
    syncRunId,
    syncCommandId,
    actorUserWorkspaceId,
    eventType,
    eventData,
  }: {
    workspaceId: string;
    syncRunId?: string | null;
    syncCommandId?: string | null;
    actorUserWorkspaceId?: string | null;
    eventType: string;
    eventData: Record<string, unknown>;
  }): Promise<void> {
    await this.coreDataSource.query(
      `
        INSERT INTO mp.sync_run_audit (
          workspace_id, sync_run_id, sync_command_id,
          actor_user_workspace_id, event_type, event_data
        )
        VALUES ($1, $2, $3, $4, '${eventType}', $5::jsonb)
      `,
      [
        workspaceId,
        syncRunId ?? null,
        syncCommandId ?? null,
        actorUserWorkspaceId ?? null,
        JSON.stringify(eventData),
      ],
    );
  }
}
