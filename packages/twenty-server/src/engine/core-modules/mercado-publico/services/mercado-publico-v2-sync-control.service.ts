import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';

import { DataSource, EntityManager } from 'typeorm';

import { isValidUuid } from 'twenty-shared/utils';

import { UserInputError } from 'src/engine/core-modules/graphql/utils/graphql-errors.util';
import { InjectMessageQueue } from 'src/engine/core-modules/message-queue/decorators/message-queue.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';
import {
  MERCADO_PUBLICO_API_V2_COMPRA_AGIL_SOURCE,
  MERCADO_PUBLICO_V2_MAX_NORMAL_RETRIES,
  MERCADO_PUBLICO_V2_SYNC_COMMAND_JOB_NAME,
} from 'src/engine/core-modules/mercado-publico/mercado-publico.constants';
import { MercadoPublicoConfigService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-config.service';
import {
  MercadoPublicoV2DurableSyncService,
  buildCompraAgilRequestParams,
} from 'src/engine/core-modules/mercado-publico/services/mercado-publico-v2-durable-sync.service';
import { normalizeMercadoPublicoV2SyncInput } from 'src/engine/core-modules/mercado-publico/services/utils/normalize-mercado-publico-v2-sync-input.util';

export type MercadoPublicoV2SyncControlAction =
  | 'start'
  | 'resume'
  | 'cancel'
  | 'retry_failed';

export type MercadoPublicoV2ClaimCommandResult =
  | {
      kind: 'claimed';
      syncRunId: string;
      attemptId: string;
      attemptNumber: number;
    }
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
  maxPages?: number;
  mode?: string;
  publishedFrom?: string;
  publishedTo?: string;
  status?: string;
};

export type MercadoPublicoV2SubmitCommandResult = {
  state: 'queued' | 'reused' | 'global_sync_active' | 'cancelled';
  syncRunId?: string;
};

export type MercadoPublicoV2LatestRun = {
  runId: string;
  mode: 'incremental' | 'backfill';
  scope: string;
  safeStatus: string;
  safeSummary: string | null;
  canResume: boolean;
  recordsDiscovered: number;
  recordsHydrated: number;
  recordsFailed: number;
  recordsDeferred: number;
  recordsRetryable: number;
  recordsPermanentFailed: number;
  recordsProjected: number;
  nextRetryAt: Date | null;
  quotaResetAt: Date | null;
  canRetryFailedItems: boolean;
  monitoringHealth: 'fresh' | 'stale' | 'unavailable';
  dataFreshness: 'current' | 'partial' | 'unknown';
  discoveryComplete: boolean;
  completionReason: string | null;
  startedAt: Date | null;
  updatedAt: Date | null;
  timeline: {
    eventType: string;
    at: Date;
    operatorName: string | null;
  }[];
  httpAttempts: {
    at: Date;
    endpoint: string;
    httpStatus: number | null;
    latencyMs: number;
    attemptNumber: number;
    retryable: boolean;
    failureClass: string | null;
  }[];
};

export type MercadoPublicoV2SyncRunSummary = Pick<
  MercadoPublicoV2LatestRun,
  | 'runId'
  | 'mode'
  | 'scope'
  | 'safeStatus'
  | 'safeSummary'
  | 'recordsDiscovered'
  | 'recordsHydrated'
  | 'recordsFailed'
  | 'recordsDeferred'
  | 'recordsRetryable'
  | 'recordsPermanentFailed'
  | 'recordsProjected'
  | 'nextRetryAt'
  | 'quotaResetAt'
  | 'canRetryFailedItems'
  | 'monitoringHealth'
  | 'dataFreshness'
  | 'completionReason'
  | 'startedAt'
  | 'updatedAt'
>;

const getMercadoPublicoV2SyncSafeSummary = (
  status: string,
  errorStage: string | null,
): string | null => {
  if (status === 'cancelled') {
    return 'La ejecución fue cancelada.';
  }

  if (status === 'partial_failed' && errorStage === 'discovering') {
    return 'La ejecución quedó pausada antes de terminar el descubrimiento. Puedes reanudarla.';
  }

  if (status === 'partial_failed' || status === 'failed') {
    return 'La ejecución no se completó.';
  }

  return null;
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

const DEFAULT_MAX_PAGES = 50;

const MERCADO_PUBLICO_V2_DEBT_RECOVERY_BATCH_LIMIT = 10;

const getMaxPages = (value: number | undefined): number | undefined => {
  const maxPages = value;

  if (
    maxPages !== undefined &&
    (!Number.isInteger(maxPages) ||
      maxPages < 1 ||
      maxPages > DEFAULT_MAX_PAGES)
  ) {
    throw new UserInputError(
      `Mercado Publico V2 max pages must be an integer between 1 and ${DEFAULT_MAX_PAGES}`,
    );
  }

  return maxPages;
};

export const buildMercadoPublicoV2SyncCommandFingerprint = (
  input: Pick<
    MercadoPublicoV2SubmitCommandInput,
    | 'action'
    | 'confirmed'
    | 'maxPages'
    | 'mode'
    | 'publishedFrom'
    | 'publishedTo'
    | 'status'
  >,
): string => {
  const normalized =
    input.action === 'start'
      ? normalizeMercadoPublicoV2SyncInput(input)
      : undefined;

  return JSON.stringify({
    action: input.action,
    confirmed:
      input.action === 'resume' || input.action === 'retry_failed'
        ? undefined
        : input.confirmed,
    maxPages: input.action === 'start' ? input.maxPages : undefined,
    mode: normalized?.mode,
    scope: normalized?.scope,
    publishedFrom: normalized?.publishedFrom,
    publishedTo: normalized?.publishedTo,
    status: normalized?.status,
  });
};

@Injectable()
export class MercadoPublicoV2SyncControlService {
  private readonly logger = new Logger(MercadoPublicoV2SyncControlService.name);

  constructor(
    @InjectDataSource()
    private readonly coreDataSource: DataSource,
    @InjectMessageQueue(MessageQueue.mercadoPublicoQueue)
    private readonly messageQueueService: MessageQueueService,
    private readonly mercadoPublicoConfigService: MercadoPublicoConfigService,
    private readonly mercadoPublicoV2DurableSyncService: MercadoPublicoV2DurableSyncService,
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
    if (!isValidUuid(input.idempotencyKey)) {
      throw new UserInputError(
        'The Mercado Publico V2 command idempotency key must be a valid UUID',
      );
    }

    if (
      (input.action === 'start' || input.action === 'cancel') &&
      input.confirmed !== true
    ) {
      throw new Error(
        'Confirmation required for Mercado Publico V2 start and cancel commands',
      );
    }

    if (input.action === 'start') {
      getMaxPages(input.maxPages);
      normalizeMercadoPublicoV2SyncInput(input);
    }

    const fingerprint = buildMercadoPublicoV2SyncCommandFingerprint(input);
    const submission = await this.coreDataSource.transaction(
      async (entityManager) => {
        const existingCommand = await this.findCommand(
          entityManager,
          input.workspaceId,
          input.idempotencyKey,
        );

        if (existingCommand !== undefined) {
          if (existingCommand.request_fingerprint !== fingerprint) {
            throw new ConflictException(
              '409 Conflict: the idempotency key was reused with a different request',
            );
          }

          return {
            commandId: existingCommand.id,
            result: existingCommand.result ?? {
              state:
                existingCommand.state as MercadoPublicoV2SubmitCommandResult['state'],
              syncRunId: existingCommand.sync_run_id ?? undefined,
            },
            shouldDispatch: false,
          };
        }

        const command = await this.insertCommand(
          entityManager,
          input,
          fingerprint,
        );

        if (!command.created) {
          return {
            commandId: command.id,
            result: command.result ?? {
              state:
                command.state as MercadoPublicoV2SubmitCommandResult['state'],
              syncRunId: command.sync_run_id ?? undefined,
            },
            shouldDispatch: false,
          };
        }

        const commandId = command.id;

        await this.appendAudit(entityManager, {
          workspaceId: input.workspaceId,
          syncCommandId: commandId,
          actorUserWorkspaceId: input.actorUserWorkspaceId,
          eventType: 'command_created',
          eventData: { action: input.action },
        });

        const result =
          input.action === 'start'
            ? await this.createRunOrReuse(entityManager, input, commandId)
            : input.action === 'cancel'
              ? await this.requestCancellation(entityManager, input, commandId)
              : input.action === 'retry_failed'
                ? {
                    state: 'queued' as const,
                    syncRunId: await this.assertRetryFailedRun(
                      entityManager,
                      input,
                    ),
                  }
                : {
                    state: 'queued' as const,
                    syncRunId: await this.assertResumableRun(
                      entityManager,
                      input,
                    ),
                  };

        await entityManager.query(
          `
            UPDATE mp.sync_command
            SET sync_run_id = $2,
                result = $3::jsonb,
                state = CASE WHEN action = 'cancel' THEN 'succeeded' ELSE state END,
                finished_at = CASE WHEN action = 'cancel' THEN now() ELSE finished_at END,
                updated_at = now()
            WHERE id = $1
          `,
          [commandId, result.syncRunId ?? null, JSON.stringify(result)],
        );

        return {
          commandId,
          result,
          shouldDispatch:
            input.action !== 'cancel' && result.state === 'queued',
        };
      },
    );

    if (submission.shouldDispatch) {
      await this.dispatch(submission.commandId, input, submission.result);
    }

    return submission.result;
  }

  async claimCommand(
    commandId: string,
    workerId: string,
  ): Promise<MercadoPublicoV2ClaimCommandResult> {
    return this.coreDataSource.transaction(async (entityManager) => {
      const commandRows = await entityManager.query<
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

      if (command.sync_run_id === null) {
        return { kind: 'noop', reason: 'missing_sync_run' };
      }

      const claimedRows = await entityManager.query<{ id: string }[]>(
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

      const attemptNumberRows = await entityManager.query<
        { next_attempt: string }[]
      >(
        `
        SELECT COALESCE(MAX(attempt_number), 0) + 1 AS next_attempt
        FROM mp.sync_run_attempt
        WHERE sync_command_id = $1
      `,
        [commandId],
      );
      const attemptRows = await entityManager.query<{ id: string }[]>(
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

      await entityManager.query(
        `
        UPDATE mp.sync_run
        SET heartbeat_at = now(), heartbeat_worker_id = $2, updated_at = now()
        WHERE id = $1
      `,
        [command.sync_run_id, workerId],
      );
      await this.appendAudit(entityManager, {
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
        attemptNumber: Number(attemptNumberRows[0]?.next_attempt ?? 1),
      };
    });
  }

  async finalizeCommand({
    commandId,
    attemptId,
    attemptNumber,
    status,
    errorSummary,
  }: {
    commandId: string;
    attemptId: string;
    attemptNumber: number;
    status:
      | 'succeeded'
      | 'partial_failed'
      | 'retryable_failed'
      | 'failed'
      | 'cancelled';
    errorSummary?: string;
  }): Promise<void> {
    const retryLimit = Math.min(
      this.mercadoPublicoConfigService.getSettings().httpMaxRetries,
      MERCADO_PUBLICO_V2_MAX_NORMAL_RETRIES,
    );
    const canRetry =
      status === 'retryable_failed' && attemptNumber <= retryLimit;
    const commandState = canRetry
      ? 'pending'
      : status === 'succeeded'
        ? 'succeeded'
        : status === 'cancelled'
          ? 'cancelled'
          : 'failed';
    const attemptState =
      status === 'succeeded'
        ? 'succeeded'
        : status === 'cancelled'
          ? 'cancelled'
          : 'failed';

    await this.coreDataSource.transaction(async (entityManager) => {
      const commands = await entityManager.query<
        { workspace_id: string; sync_run_id: string }[]
      >(
        `
            UPDATE mp.sync_command
            SET state = $2,
                error_summary = $3,
                claimed_at = CASE WHEN $2 = 'pending' THEN NULL ELSE claimed_at END,
                finished_at = CASE WHEN $2 = 'pending' THEN NULL ELSE now() END,
                updated_at = now()
            WHERE id = $1 AND state = 'claimed'
              AND EXISTS (
                SELECT 1
                FROM mp.sync_run_attempt attempt
                WHERE attempt.id = $4
                  AND attempt.sync_command_id = id
                  AND attempt.state = 'running'
              )
            RETURNING workspace_id, sync_run_id
          `,
        [commandId, commandState, errorSummary ?? null, attemptId],
      );
      const command = commands[0];

      if (command === undefined) {
        return;
      }

      await entityManager.query(
        `
          UPDATE mp.sync_run_attempt
          SET state = $2,
              error_summary = $3,
              finished_at = now(),
              updated_at = now()
          WHERE id = $1 AND state = 'running'
        `,
        [attemptId, attemptState, errorSummary ?? null],
      );
      await this.appendAudit(entityManager, {
        workspaceId: command.workspace_id,
        syncRunId: command.sync_run_id,
        syncCommandId: commandId,
        syncRunAttemptId: attemptId,
        eventType: `run_${status}`,
        eventData: {},
      });
    });
  }

  async deferCommand({
    commandId,
    attemptId,
    retryAt,
  }: {
    commandId: string;
    attemptId: string;
    retryAt: Date;
  }): Promise<void> {
    const delayMs = Math.max(0, retryAt.getTime() - Date.now());
    const errorSummary = 'retryable_failed: provider rate limit reset required';

    const commands = await this.coreDataSource.query<
      { workspace_id: string; sync_run_id: string }[]
    >(
      `
        UPDATE mp.sync_command
        SET state = 'pending',
            claimed_at = NULL,
            error_summary = $2,
            finished_at = NULL,
            dispatched_at = $3,
            dispatch_attempts = dispatch_attempts + 1,
            updated_at = now()
        WHERE id = $1 AND state = 'claimed'
        RETURNING workspace_id, sync_run_id
      `,
      [commandId, errorSummary, retryAt],
    );
    const command = commands[0];

    if (command === undefined) {
      return;
    }

    await this.coreDataSource.query(
      `
        UPDATE mp.sync_run_attempt
        SET state = 'failed',
            error_summary = $2,
            finished_at = now(),
            updated_at = now()
        WHERE id = $1 AND state = 'running'
      `,
      [attemptId, errorSummary],
    );
    await this.messageQueueService.add(
      MERCADO_PUBLICO_V2_SYNC_COMMAND_JOB_NAME,
      { commandId },
      { delay: delayMs, retryLimit: 0 },
    );
    await this.appendAudit(this.coreDataSource, {
      workspaceId: command.workspace_id,
      syncRunId: command.sync_run_id,
      syncCommandId: commandId,
      syncRunAttemptId: attemptId,
      eventType: 'run_deferred_rate_limit',
      eventData: { retryAt: retryAt.toISOString() },
    });
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
          AND (
            r.heartbeat_at < now() - make_interval(secs => $1)
            OR (
              r.heartbeat_at IS NULL
              AND c.claimed_at < now() - make_interval(secs => $1)
            )
          )
      `,
      [staleHeartbeatMarginSeconds],
    );
    const staleIds = staleClaimedIds.map((row) => row.id);

    if (staleIds.length === 0) {
      return this.reclaimPendingCommands();
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
      await this.appendAudit(this.coreDataSource, {
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

    return [
      ...recoverableRows.map((row) => row.id),
      ...pendingRows.map((row) => row.id),
    ];
  }

  private async reclaimPendingCommands(): Promise<string[]> {
    const rows = await this.coreDataSource.query<{ id: string }[]>(
      `
        UPDATE mp.sync_command
        SET dispatched_at = now(), updated_at = now()
        WHERE state = 'pending'
          AND (dispatched_at IS NULL OR dispatched_at < now() - interval '2 minutes')
        RETURNING id
      `,
    );

    return rows.map((row) => row.id);
  }

  async recoverDeferredHydrations(): Promise<number> {
    const settings = this.mercadoPublicoConfigService.getSettings();
    const baseBackoffSeconds = Math.max(
      1,
      Math.ceil(settings.httpRetryBackoffMs / 1000),
    );
    const dueRows = await this.coreDataSource.query<
      { id: string; codigo: string }[]
    >(
      `
        SELECT id, codigo
        FROM mp.sync_run_item
        WHERE status = 'deferred'
          AND (
            next_retry_at <= now()
            OR (
              next_retry_at IS NULL
              AND updated_at <= now() - make_interval(secs => pow(2, LEAST(attempts, 12)) * $1)
            )
          )
          AND NOT EXISTS (
            SELECT 1
            FROM mp.compra_agil current
            INNER JOIN mp.v2_observation observation
              ON observation.id = current.observation_id
            WHERE current.codigo = mp.sync_run_item.codigo
              AND observation.snapshot_kind = 'detail'
              AND current.observed_at > mp.sync_run_item.updated_at
          )
        ORDER BY updated_at ASC
        LIMIT $2
      `,
      [baseBackoffSeconds, MERCADO_PUBLICO_V2_DEBT_RECOVERY_BATCH_LIMIT],
    );
    let dispatched = 0;

    for (const row of dueRows) {
      const claimed = await this.coreDataSource.query<{ codigo: string }[]>(
        `
          UPDATE mp.sync_run_item
          SET attempts = attempts + 1, updated_at = now()
          WHERE id = $1
            AND status = 'deferred'
            AND (
              next_retry_at <= now()
              OR (
                next_retry_at IS NULL
                AND updated_at <= now() - make_interval(secs => pow(2, LEAST(attempts, 12)) * $2)
              )
            )
          RETURNING codigo
        `,
        [row.id, baseBackoffSeconds],
      );

      if (claimed.length === 0) {
        continue;
      }

      try {
        const recovery = await this.mercadoPublicoV2DurableSyncService.start(
          { id: claimed[0].codigo },
          'recovery',
        );

        if (recovery.status === 'succeeded') {
          await this.settleRecoveredDeferredItem(row.id, recovery.syncRunId);
        }
        dispatched += 1;
      } catch (error) {
        this.logger.warn(
          `Failed to recover deferred Mercado Publico V2 item ${claimed[0].codigo}: ${(error as Error).message}`,
        );
      }
    }

    return dispatched;
  }

  private async settleRecoveredDeferredItem(
    itemId: string,
    recoverySyncRunId: string,
  ): Promise<void> {
    await this.coreDataSource.transaction(async (entityManager) => {
      const settledRows = await entityManager.query<{ sync_run_id: string }[]>(
        `
          UPDATE mp.sync_run_item original
          SET status = recovered.status,
              raw_api_payload_id = recovered.raw_api_payload_id,
              observation_id = recovered.observation_id,
              error_stage = NULL,
              error_summary = NULL,
              failure_class = NULL,
              next_retry_at = NULL,
              hydrated_at = recovered.hydrated_at,
              updated_at = now()
          FROM mp.sync_run_item recovered
          WHERE original.id = $1
            AND original.status = 'deferred'
            AND recovered.sync_run_id = $2
            AND recovered.codigo = original.codigo
            AND recovered.status IN ('succeeded', 'lifecycle_terminal')
          RETURNING original.sync_run_id
        `,
        [itemId, recoverySyncRunId],
      );
      const originalSyncRunId = settledRows[0]?.sync_run_id;

      if (originalSyncRunId === undefined) {
        return;
      }

      await entityManager.query(
        `
          UPDATE mp.sync_run run
          SET records_hydrated = counts.records_hydrated,
              records_failed = counts.records_failed,
              records_deferred = counts.records_deferred,
              records_projected = counts.records_projected,
              status = CASE
                WHEN run.status = 'partial_failed'
                  AND run.discovery_complete
                  AND counts.records_failed = 0
                  AND counts.records_deferred = 0
                THEN 'succeeded'
                ELSE run.status
              END,
              error_stage = CASE
                WHEN run.status = 'partial_failed'
                  AND run.discovery_complete
                  AND counts.records_failed = 0
                  AND counts.records_deferred = 0
                THEN NULL
                ELSE run.error_stage
              END,
              error_retryable = CASE
                WHEN run.status = 'partial_failed'
                  AND run.discovery_complete
                  AND counts.records_failed = 0
                  AND counts.records_deferred = 0
                THEN NULL
                ELSE run.error_retryable
              END,
              error_summary = CASE
                WHEN run.status = 'partial_failed'
                  AND run.discovery_complete
                  AND counts.records_failed = 0
                  AND counts.records_deferred = 0
                THEN NULL
                ELSE run.error_summary
              END,
              finished_at = CASE
                WHEN run.status = 'partial_failed'
                  AND run.discovery_complete
                  AND counts.records_failed = 0
                  AND counts.records_deferred = 0
                THEN now()
                ELSE run.finished_at
              END,
              updated_at = now()
          FROM (
            SELECT
              COUNT(*) FILTER (WHERE hydrated_at IS NOT NULL)::integer
                AS records_hydrated,
              COUNT(*) FILTER (WHERE status IN ('failed', 'dead_letter'))::integer
                AS records_failed,
              COUNT(*) FILTER (WHERE status = 'deferred')::integer
                AS records_deferred,
              COUNT(*) FILTER (WHERE observation_id IS NOT NULL)::integer
                AS records_projected
            FROM mp.sync_run_item
            WHERE sync_run_id = $1
          ) counts
          WHERE run.id = $1
        `,
        [originalSyncRunId],
      );
    });
  }

  async getLatestRun(
    workspaceId: string,
  ): Promise<MercadoPublicoV2LatestRun | null> {
    const rows = await this.coreDataSource.query<
      {
        id: string;
        intent: string;
        scope: string;
        status: string;
        error_stage: string | null;
        records_discovered: string | null;
        records_hydrated: string | null;
        records_failed: string | null;
        records_deferred: string | null;
        records_retryable: string | null;
        records_permanent_failed: string | null;
        records_projected: string | null;
        next_retry_at: Date | null;
        quota_reset_at: Date | null;
        can_retry_failed_items: boolean;
        discovery_complete: boolean;
        completion_reason: string | null;
        created_at: Date | null;
        updated_at: Date | null;
      }[]
    >(
      `
        SELECT run.id, run.intent, run.scope, run.status, run.error_stage,
               run.records_discovered, run.records_hydrated,
               run.records_failed, run.records_deferred, run.records_projected,
               discovery_complete, completion_reason, run.created_at, run.updated_at,
               (
                 SELECT MIN(item.next_retry_at)
                 FROM mp.sync_run_item item
                 WHERE item.sync_run_id = run.id AND item.status = 'deferred'
               ) AS next_retry_at,
               (
                 SELECT COUNT(*)
                 FROM mp.sync_run_item item
                 WHERE item.sync_run_id = run.id
                   AND item.status IN ('failed', 'deferred', 'dead_letter')
                   AND (
                     item.failure_class IN ('retryable_failed', 'rate_limit')
                     OR item.error_summary LIKE 'retryable_failed%'
                   )
               ) AS records_retryable,
               (
                 SELECT COUNT(*)
                 FROM mp.sync_run_item item
                 WHERE item.sync_run_id = run.id
                   AND item.status IN ('failed', 'dead_letter')
                   AND NOT (
                     COALESCE(item.failure_class, '') IN ('retryable_failed', 'rate_limit')
                     OR COALESCE(item.error_summary, '') LIKE 'retryable_failed%'
                   )
               ) AS records_permanent_failed,
               EXISTS (
                 SELECT 1
                 FROM mp.sync_run_item item
                 WHERE item.sync_run_id = run.id
                   AND item.status IN ('failed', 'deferred', 'dead_letter')
                   AND (
                     item.failure_class IN ('retryable_failed', 'rate_limit')
                     OR item.error_summary LIKE 'retryable_failed%'
                   )
               ) AS can_retry_failed_items,
               quota.reset_at AS quota_reset_at
        FROM mp.sync_run run
        LEFT JOIN mp.gold_api_quota_usage quota
          ON quota.source = $2
        WHERE run.control_workspace_id = $1
        ORDER BY run.created_at DESC
        LIMIT 1
      `,
      [workspaceId, MERCADO_PUBLICO_API_V2_COMPRA_AGIL_SOURCE],
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
               concat_ws(' ', u."firstName", u."lastName") AS operator_name
        FROM mp.sync_run_audit a
        LEFT JOIN mp.sync_command c ON c.id = a.sync_command_id
        LEFT JOIN core."userWorkspace" uw ON uw.id = a.actor_user_workspace_id
        LEFT JOIN core."user" u ON u.id = uw."userId"
        WHERE a.workspace_id = $1
          AND COALESCE(a.sync_run_id, c.sync_run_id) = $2
        ORDER BY a.created_at ASC
      `,
      [workspaceId, row.id],
    );
    const httpAttemptRows = await this.coreDataSource.query<
      {
        request_started_at: Date;
        endpoint: string;
        http_status: number | null;
        latency_ms: number;
        attempt_number: number;
        retryable: boolean;
        failure_class: string | null;
      }[]
    >(
      `
        SELECT request_started_at, endpoint, http_status, latency_ms,
               attempt_number, retryable, failure_class
        FROM mp.sync_run_item_attempt
        WHERE sync_run_id = $1
        ORDER BY request_started_at DESC
        LIMIT 100
      `,
      [row.id],
    );

    return {
      runId: row.id,
      mode: row.intent === 'backfill' ? 'backfill' : 'incremental',
      scope: row.scope,
      safeStatus: row.status,
      safeSummary: getMercadoPublicoV2SyncSafeSummary(
        row.status,
        row.error_stage,
      ),
      canResume:
        row.discovery_complete &&
        (row.status === 'partial_failed' ||
          (row.status === 'cancelled' && row.error_stage === 'hydrating')),
      recordsDiscovered: Number(row.records_discovered ?? 0),
      recordsHydrated: Number(row.records_hydrated ?? 0),
      recordsFailed: Number(row.records_failed ?? 0),
      recordsDeferred: Number(row.records_deferred ?? 0),
      recordsRetryable: Number(row.records_retryable ?? 0),
      recordsPermanentFailed: Number(row.records_permanent_failed ?? 0),
      recordsProjected: Number(row.records_projected ?? 0),
      nextRetryAt: row.next_retry_at,
      quotaResetAt: row.quota_reset_at,
      canRetryFailedItems: row.can_retry_failed_items,
      monitoringHealth: 'fresh',
      dataFreshness:
        row.status === 'succeeded'
          ? 'current'
          : row.status === 'partial_failed'
            ? 'partial'
            : 'unknown',
      discoveryComplete: row.discovery_complete,
      completionReason: row.completion_reason,
      startedAt: row.created_at,
      updatedAt: row.updated_at,
      timeline: timelineRows.map((timelineRow) => ({
        eventType: timelineRow.event_type,
        at: timelineRow.created_at,
        operatorName: timelineRow.operator_name,
      })),
      httpAttempts: httpAttemptRows.map((attempt) => ({
        at: attempt.request_started_at,
        endpoint: attempt.endpoint,
        httpStatus: attempt.http_status,
        latencyMs: attempt.latency_ms,
        attemptNumber: attempt.attempt_number,
        retryable: attempt.retryable,
        failureClass: attempt.failure_class,
      })),
    };
  }

  async getRunHistory(
    workspaceId: string,
    requestedLimit = 10,
  ): Promise<MercadoPublicoV2SyncRunSummary[]> {
    const limit = Math.min(Math.max(Math.floor(requestedLimit), 1), 10);
    const rows = await this.coreDataSource.query<
      {
        id: string;
        intent: string;
        scope: string;
        status: string;
        error_stage: string | null;
        records_discovered: string | null;
        records_hydrated: string | null;
        records_failed: string | null;
        records_deferred: string | null;
        records_retryable: string | null;
        records_permanent_failed: string | null;
        records_projected: string | null;
        next_retry_at: Date | null;
        quota_reset_at: Date | null;
        can_retry_failed_items: boolean;
        completion_reason: string | null;
        created_at: Date | null;
        updated_at: Date | null;
      }[]
    >(
      `
        WITH latest_run AS (
          SELECT id
          FROM mp.sync_run
          WHERE control_workspace_id = $1
          ORDER BY created_at DESC
          LIMIT 1
        )
        SELECT run.id, run.intent, run.scope, run.status, run.error_stage,
               run.records_discovered, run.records_hydrated,
               run.records_failed, run.records_deferred, run.records_projected,
               completion_reason, run.created_at, run.updated_at,
               (
                 SELECT MIN(item.next_retry_at)
                 FROM mp.sync_run_item item
                 WHERE item.sync_run_id = run.id AND item.status = 'deferred'
               ) AS next_retry_at,
               (
                 SELECT COUNT(*)
                 FROM mp.sync_run_item item
                 WHERE item.sync_run_id = run.id
                   AND item.status IN ('failed', 'deferred', 'dead_letter')
                   AND (
                     item.failure_class IN ('retryable_failed', 'rate_limit')
                     OR item.error_summary LIKE 'retryable_failed%'
                   )
               ) AS records_retryable,
               (
                 SELECT COUNT(*)
                 FROM mp.sync_run_item item
                 WHERE item.sync_run_id = run.id
                   AND item.status IN ('failed', 'dead_letter')
                   AND NOT (
                     COALESCE(item.failure_class, '') IN ('retryable_failed', 'rate_limit')
                     OR COALESCE(item.error_summary, '') LIKE 'retryable_failed%'
                   )
               ) AS records_permanent_failed,
               EXISTS (
                 SELECT 1
                 FROM mp.sync_run_item item
                 WHERE item.sync_run_id = run.id
                   AND item.status IN ('failed', 'deferred', 'dead_letter')
                   AND (
                     item.failure_class IN ('retryable_failed', 'rate_limit')
                     OR item.error_summary LIKE 'retryable_failed%'
                   )
               ) AS can_retry_failed_items,
               quota.reset_at AS quota_reset_at
        FROM mp.sync_run run
        LEFT JOIN mp.gold_api_quota_usage quota
          ON quota.source = $2
        WHERE run.control_workspace_id = $1
          AND run.id IS DISTINCT FROM (SELECT id FROM latest_run)
        ORDER BY run.created_at DESC
        LIMIT $3
      `,
      [workspaceId, MERCADO_PUBLICO_API_V2_COMPRA_AGIL_SOURCE, limit],
    );

    return rows.map((row) => ({
      runId: row.id,
      mode: row.intent === 'backfill' ? 'backfill' : 'incremental',
      scope: row.scope,
      safeStatus: row.status,
      safeSummary: getMercadoPublicoV2SyncSafeSummary(
        row.status,
        row.error_stage,
      ),
      recordsDiscovered: Number(row.records_discovered ?? 0),
      recordsHydrated: Number(row.records_hydrated ?? 0),
      recordsFailed: Number(row.records_failed ?? 0),
      recordsDeferred: Number(row.records_deferred ?? 0),
      recordsRetryable: Number(row.records_retryable ?? 0),
      recordsPermanentFailed: Number(row.records_permanent_failed ?? 0),
      recordsProjected: Number(row.records_projected ?? 0),
      nextRetryAt: row.next_retry_at,
      quotaResetAt: row.quota_reset_at,
      canRetryFailedItems: row.can_retry_failed_items,
      monitoringHealth: 'fresh' as const,
      dataFreshness:
        row.status === 'succeeded'
          ? ('current' as const)
          : row.status === 'partial_failed'
            ? ('partial' as const)
            : ('unknown' as const),
      completionReason: row.completion_reason,
      startedAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  private async assertResumableRun(
    entityManager: EntityManager,
    input: MercadoPublicoV2SubmitCommandInput,
  ): Promise<string> {
    const rows = await entityManager.query<{ id: string }[]>(
      `
        WITH resumable_run AS (
          SELECT id
          FROM mp.sync_run
          WHERE control_workspace_id = $1
            AND discovery_complete = true
            AND (
              status = 'partial_failed'
              OR (status = 'cancelled' AND error_stage = 'hydrating')
            )
          ORDER BY created_at DESC
          LIMIT 1
          FOR UPDATE
        )
        UPDATE mp.sync_run r
        SET status = 'hydrating',
            cancellation_requested_at = NULL,
            cancellation_requested_by_user_workspace_id = NULL,
            error_stage = NULL,
            error_summary = NULL,
            finished_at = NULL,
            updated_at = now()
        FROM resumable_run
        WHERE r.id = resumable_run.id
        RETURNING r.id
      `,
      [input.workspaceId],
    );

    if (rows[0] === undefined) {
      throw new ConflictException(
        '409 Conflict: the Mercado Publico V2 sync run is not resumable',
      );
    }

    await entityManager.query(
      `
        UPDATE mp.sync_run_item
        SET status = 'pending', error_stage = NULL,
            error_summary = NULL, updated_at = now()
        WHERE sync_run_id = $1
          AND status IN ('failed', 'deferred')
          AND error_stage = 'hydrating'
          AND (error_summary LIKE 'retryable%' OR error_summary = 'soft_miss')
      `,
      [rows[0].id],
    );

    return rows[0].id;
  }

  private async assertRetryFailedRun(
    entityManager: EntityManager,
    input: MercadoPublicoV2SubmitCommandInput,
  ): Promise<string> {
    const rows = await entityManager.query<{ id: string }[]>(
      `
        SELECT id
        FROM mp.sync_run
        WHERE control_workspace_id = $1
          AND status IN ('partial_failed', 'succeeded')
          AND EXISTS (
            SELECT 1
            FROM mp.sync_run_item item
            WHERE item.sync_run_id = mp.sync_run.id
              AND item.status IN ('failed', 'deferred', 'dead_letter')
              AND (
                item.failure_class IN ('retryable_failed', 'rate_limit')
                OR item.error_summary LIKE 'retryable_failed%'
              )
          )
        ORDER BY created_at DESC
        LIMIT 1
        FOR UPDATE
      `,
      [input.workspaceId],
    );

    if (rows[0] === undefined) {
      throw new ConflictException(
        '409 Conflict: there are no failed Mercado Publico V2 items to retry',
      );
    }

    await entityManager.query(
      `
        UPDATE mp.sync_run_item
        SET status = 'pending',
            attempts = 0,
            next_retry_at = NULL,
            error_stage = NULL,
            error_summary = NULL,
            updated_at = now()
        WHERE sync_run_id = $1
          AND status IN ('failed', 'deferred', 'dead_letter')
          AND (
            failure_class IN ('retryable_failed', 'rate_limit')
            OR error_summary LIKE 'retryable_failed%'
          )
      `,
      [rows[0].id],
    );
    await entityManager.query(
      `
        UPDATE mp.sync_run
        SET status = 'hydrating',
            cancellation_requested_at = NULL,
            error_stage = NULL,
            error_retryable = NULL,
            error_summary = NULL,
            finished_at = NULL,
            updated_at = now()
        WHERE id = $1
      `,
      [rows[0].id],
    );

    return rows[0].id;
  }

  private async findCommand(
    entityManager: EntityManager,
    workspaceId: string,
    idempotencyKey: string,
  ): Promise<MercadoPublicoV2SyncCommandRow | undefined> {
    const rows = await entityManager.query<MercadoPublicoV2SyncCommandRow[]>(
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
    entityManager: EntityManager,
    input: MercadoPublicoV2SubmitCommandInput,
    fingerprint: string,
  ): Promise<MercadoPublicoV2SyncCommandRow & { created: boolean }> {
    const rows = await entityManager.query<{ id: string }[]>(
      `
        INSERT INTO mp.sync_command (
          idempotency_key, workspace_id, actor_user_workspace_id, action,
          intent, scope, request_fingerprint, request_payload, state
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, 'pending')
        ON CONFLICT ON CONSTRAINT uq_mp_sync_command_workspace_idempotency_key
        DO NOTHING
        RETURNING id
      `,
      [
        input.idempotencyKey,
        input.workspaceId,
        input.actorUserWorkspaceId,
        input.action,
        input.mode === 'backfill' ? 'backfill' : 'incremental',
        input.action === 'start'
          ? normalizeMercadoPublicoV2SyncInput(input).scope
          : 'global',
        fingerprint,
        JSON.stringify(input),
      ],
    );

    if (rows[0] === undefined) {
      const command = await this.findCommand(
        entityManager,
        input.workspaceId,
        input.idempotencyKey,
      );

      if (command === undefined) {
        throw new Error('Unable to load the Mercado Publico V2 sync command');
      }

      if (command.request_fingerprint !== fingerprint) {
        throw new ConflictException(
          '409 Conflict: the idempotency key was reused with a different request',
        );
      }

      return { ...command, created: false };
    }

    return {
      id: rows[0].id,
      state: 'pending',
      request_fingerprint: fingerprint,
      sync_run_id: null,
      result: null,
      created: true,
    };
  }

  private async createRunOrReuse(
    entityManager: EntityManager,
    input: MercadoPublicoV2SubmitCommandInput,
    commandId: string,
  ): Promise<MercadoPublicoV2SubmitCommandResult> {
    const normalized = normalizeMercadoPublicoV2SyncInput(input);
    const watermarkBefore =
      normalized.mode === 'backfill'
        ? null
        : await this.readWatermark(entityManager, normalized.scope);
    const requestParams = buildCompraAgilRequestParams(
      normalized.requestPayload,
      watermarkBefore,
    );
    const maxPages = getMaxPages(input.maxPages);
    const rows = await entityManager.query<{ id: string }[]>(
      `
        INSERT INTO mp.sync_run (
          intent, source, scope, status, request_params, watermark_before,
          control_workspace_id, control_user_workspace_id
        )
        VALUES ($1, $2, $3, 'queued', $4::jsonb, $5, $6, $7)
        ON CONFLICT DO NOTHING
        RETURNING id
      `,
      [
        normalized.mode,
        MERCADO_PUBLICO_API_V2_COMPRA_AGIL_SOURCE,
        normalized.scope,
        JSON.stringify({
          ...normalized.requestPayload,
          ...requestParams,
          ...(maxPages === undefined ? {} : { max_pages: maxPages }),
        }),
        watermarkBefore,
        input.workspaceId,
        input.actorUserWorkspaceId,
      ],
    );

    if (rows[0] !== undefined) {
      const syncRunId = rows[0].id;

      await this.appendAudit(entityManager, {
        workspaceId: input.workspaceId,
        syncRunId,
        syncCommandId: commandId,
        actorUserWorkspaceId: input.actorUserWorkspaceId,
        eventType: 'run_created',
        eventData: {},
      });

      return { state: 'queued', syncRunId };
    }

    const activeRun = await this.findActiveRun(
      entityManager,
      normalizeMercadoPublicoV2SyncInput(input).scope,
    );

    if (activeRun === undefined) {
      throw new Error('Unable to load the active Mercado Publico V2 sync run');
    }

    const isSameWorkspace =
      activeRun.control_workspace_id === input.workspaceId;

    await entityManager.query(
      `
        UPDATE mp.sync_command
        SET state = 'reused', sync_run_id = $2, updated_at = now()
        WHERE id = $1
      `,
      [commandId, isSameWorkspace ? activeRun.id : null],
    );
    await this.appendAudit(entityManager, {
      workspaceId: input.workspaceId,
      syncRunId: isSameWorkspace ? activeRun.id : null,
      syncCommandId: commandId,
      actorUserWorkspaceId: input.actorUserWorkspaceId,
      eventType: 'reused',
      eventData: {},
    });

    return isSameWorkspace
      ? { state: 'reused', syncRunId: activeRun.id }
      : { state: 'global_sync_active' };
  }

  private async readWatermark(
    entityManager: EntityManager,
    scope: string,
  ): Promise<Date | null> {
    const rows = await entityManager.query<{ watermark_at: Date | null }[]>(
      `
        SELECT watermark_at
        FROM mp.source_watermark
        WHERE source = $1 AND scope = $2
      `,
      [MERCADO_PUBLICO_API_V2_COMPRA_AGIL_SOURCE, scope],
    );

    return rows[0]?.watermark_at ?? null;
  }

  private async findActiveRun(
    entityManager: EntityManager,
    scope = 'global',
  ): Promise<{ id: string; control_workspace_id: string } | undefined> {
    const rows = await entityManager.query<
      { id: string; control_workspace_id: string }[]
    >(
      `
        SELECT id, control_workspace_id
        FROM mp.sync_run
        WHERE source = $1
          AND scope = $2
          AND status IN (${MERCADO_PUBLICO_V2_SYNC_ACTIVE_RUN_STATUSES.map(
            (status) => `'${status}'`,
          ).join(', ')})
        ORDER BY created_at DESC
        LIMIT 1
      `,
      [MERCADO_PUBLICO_API_V2_COMPRA_AGIL_SOURCE, scope],
    );

    return rows[0];
  }

  private async requestCancellation(
    entityManager: EntityManager,
    input: MercadoPublicoV2SubmitCommandInput,
    commandId: string,
  ): Promise<MercadoPublicoV2SubmitCommandResult> {
    const rows = await entityManager.query<{ id: string; status: string }[]>(
      `
        SELECT id, status
        FROM mp.sync_run
        WHERE control_workspace_id = $1
          AND status IN (${MERCADO_PUBLICO_V2_SYNC_ACTIVE_RUN_STATUSES.map(
            (status) => `'${status}'`,
          ).join(', ')})
        ORDER BY created_at DESC
        LIMIT 1
        FOR UPDATE
      `,
      [input.workspaceId],
    );
    const run = rows[0];

    if (run === undefined) {
      throw new ConflictException(
        '409 Conflict: there is no active Mercado Publico V2 sync run',
      );
    }

    if (run.status === 'queued') {
      await entityManager.query(
        `
          UPDATE mp.sync_run
          SET status = 'cancelled',
              error_stage = 'queued',
              cancellation_requested_at = now(),
              cancellation_requested_by_user_workspace_id = $2,
              finished_at = now(),
              updated_at = now()
          WHERE id = $1
        `,
        [run.id, input.actorUserWorkspaceId],
      );
      await entityManager.query(
        `
          UPDATE mp.sync_command
          SET state = 'cancelled', finished_at = now(), updated_at = now()
          WHERE sync_run_id = $1
            AND action IN ('start', 'resume')
            AND state IN ('pending', 'claimed')
        `,
        [run.id],
      );
    } else {
      await entityManager.query(
        `
          UPDATE mp.sync_run
          SET cancellation_requested_at = now(),
              cancellation_requested_by_user_workspace_id = $2,
              updated_at = now()
          WHERE id = $1
        `,
        [run.id, input.actorUserWorkspaceId],
      );
    }

    await this.appendAudit(entityManager, {
      workspaceId: input.workspaceId,
      syncRunId: run.id,
      syncCommandId: commandId,
      actorUserWorkspaceId: input.actorUserWorkspaceId,
      eventType: 'cancellation_requested',
      eventData: {},
    });

    return { state: 'cancelled', syncRunId: run.id };
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
        {
          retryLimit: MERCADO_PUBLICO_V2_MAX_NORMAL_RETRIES,
          backoff: {
            type: 'fixed',
            delay:
              this.mercadoPublicoConfigService.getSettings().httpRetryBackoffMs,
          },
        },
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
      await this.appendAudit(this.coreDataSource, {
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
      await this.appendAudit(this.coreDataSource, {
        workspaceId: input.workspaceId,
        syncRunId: result.syncRunId ?? null,
        syncCommandId: commandId,
        actorUserWorkspaceId: input.actorUserWorkspaceId,
        eventType: 'dispatch_failed',
        eventData: {},
      });
    }
  }

  private async appendAudit(
    entityManager: DataSource | EntityManager,
    {
      workspaceId,
      syncRunId,
      syncCommandId,
      syncRunAttemptId,
      actorUserWorkspaceId,
      eventType,
      eventData,
    }: {
      workspaceId: string;
      syncRunId?: string | null;
      syncCommandId?: string | null;
      syncRunAttemptId?: string | null;
      actorUserWorkspaceId?: string | null;
      eventType: string;
      eventData: Record<string, unknown>;
    },
  ): Promise<void> {
    await entityManager.query(
      `
        INSERT INTO mp.sync_run_audit (
          workspace_id, sync_run_id, sync_command_id, sync_run_attempt_id,
          actor_user_workspace_id, event_type, event_data
        )
        VALUES ($1, $2, $3, $4, $5, '${eventType}', $6::jsonb)
      `,
      [
        workspaceId,
        syncRunId ?? null,
        syncCommandId ?? null,
        syncRunAttemptId ?? null,
        actorUserWorkspaceId ?? null,
        JSON.stringify(eventData),
      ],
    );
  }
}
