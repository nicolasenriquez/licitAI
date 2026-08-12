import { QueryRunner } from 'typeorm';

import { RegisteredInstanceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-instance-command.decorator';
import { FastInstanceCommand } from 'src/engine/core-modules/upgrade/interfaces/fast-instance-command.interface';

@RegisteredInstanceCommand('2.16.0', 1791000000000)
export class MpV2SyncOperationsFastInstanceCommand
  implements FastInstanceCommand
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE mp.sync_run
        ADD COLUMN IF NOT EXISTS control_workspace_id uuid NULL,
        ADD COLUMN IF NOT EXISTS control_user_workspace_id uuid NULL,
        ADD COLUMN IF NOT EXISTS cancellation_requested_at timestamptz NULL,
        ADD COLUMN IF NOT EXISTS cancellation_requested_by_user_workspace_id uuid NULL,
        ADD COLUMN IF NOT EXISTS heartbeat_at timestamptz NULL,
        ADD COLUMN IF NOT EXISTS heartbeat_worker_id text NULL
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS mp.sync_operator (
        id uuid NOT NULL DEFAULT gen_random_uuid(),
        workspace_id uuid NOT NULL,
        user_workspace_id uuid NOT NULL,
        assigned_by_user_workspace_id uuid NULL,
        assigned_at timestamptz NOT NULL DEFAULT now(),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_mp_sync_operator" PRIMARY KEY (id),
        CONSTRAINT "uq_mp_sync_operator_workspace_user_workspace"
          UNIQUE (workspace_id, user_workspace_id)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS mp.sync_command (
        id uuid NOT NULL DEFAULT gen_random_uuid(),
        idempotency_key uuid NOT NULL,
        workspace_id uuid NOT NULL,
        actor_user_workspace_id uuid NOT NULL,
        action text NOT NULL,
        intent text NOT NULL DEFAULT 'incremental',
        scope text NOT NULL DEFAULT 'global',
        request_fingerprint text NOT NULL,
        request_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
        sync_run_id uuid NULL,
        state text NOT NULL DEFAULT 'pending',
        result jsonb NULL,
        error_summary text NULL,
        dispatch_attempts integer NOT NULL DEFAULT 0,
        dispatched_at timestamptz NULL,
        claimed_at timestamptz NULL,
        finished_at timestamptz NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_mp_sync_command" PRIMARY KEY (id),
        CONSTRAINT "uq_mp_sync_command_workspace_idempotency_key"
          UNIQUE (workspace_id, idempotency_key),
        CONSTRAINT "ck_mp_sync_command_action"
          CHECK (action IN ('start', 'resume', 'cancel')),
        CONSTRAINT "ck_mp_sync_command_scope"
          CHECK (scope = 'global'),
        CONSTRAINT "ck_mp_sync_command_state"
          CHECK (state IN ('pending', 'claimed', 'succeeded', 'failed', 'reused', 'cancelled')),
        CONSTRAINT "ck_mp_sync_command_dispatch_attempts_non_negative"
          CHECK (dispatch_attempts >= 0),
        CONSTRAINT "fk_mp_sync_command_sync_run"
          FOREIGN KEY (sync_run_id) REFERENCES mp.sync_run(id) ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS mp.sync_run_attempt (
        id uuid NOT NULL DEFAULT gen_random_uuid(),
        sync_run_id uuid NOT NULL,
        sync_command_id uuid NOT NULL,
        attempt_number integer NOT NULL,
        worker_id text NULL,
        state text NOT NULL DEFAULT 'running',
        heartbeat_at timestamptz NULL,
        started_at timestamptz NOT NULL DEFAULT now(),
        finished_at timestamptz NULL,
        error_summary text NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_mp_sync_run_attempt" PRIMARY KEY (id),
        CONSTRAINT "uq_mp_sync_run_attempt_command_number"
          UNIQUE (sync_command_id, attempt_number),
        CONSTRAINT "ck_mp_sync_run_attempt_number_positive"
          CHECK (attempt_number > 0),
        CONSTRAINT "ck_mp_sync_run_attempt_state"
          CHECK (state IN ('running', 'succeeded', 'failed', 'stale', 'cancelled')),
        CONSTRAINT "fk_mp_sync_run_attempt_sync_run"
          FOREIGN KEY (sync_run_id) REFERENCES mp.sync_run(id) ON DELETE CASCADE,
        CONSTRAINT "fk_mp_sync_run_attempt_sync_command"
          FOREIGN KEY (sync_command_id) REFERENCES mp.sync_command(id) ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS mp.sync_run_audit (
        id uuid NOT NULL DEFAULT gen_random_uuid(),
        workspace_id uuid NOT NULL,
        sync_run_id uuid NULL,
        sync_command_id uuid NULL,
        sync_run_attempt_id uuid NULL,
        actor_user_workspace_id uuid NULL,
        event_type text NOT NULL,
        event_data jsonb NOT NULL DEFAULT '{}'::jsonb,
        created_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_mp_sync_run_audit" PRIMARY KEY (id),
        CONSTRAINT "fk_mp_sync_run_audit_sync_run"
          FOREIGN KEY (sync_run_id) REFERENCES mp.sync_run(id) ON DELETE SET NULL,
        CONSTRAINT "fk_mp_sync_run_audit_sync_command"
          FOREIGN KEY (sync_command_id) REFERENCES mp.sync_command(id) ON DELETE SET NULL,
        CONSTRAINT "fk_mp_sync_run_audit_sync_run_attempt"
          FOREIGN KEY (sync_run_attempt_id) REFERENCES mp.sync_run_attempt(id) ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_mp_sync_command_pending"
        ON mp.sync_command (state, created_at)
        WHERE state IN ('pending', 'claimed')
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_mp_sync_run_audit_workspace_created"
        ON mp.sync_run_audit (workspace_id, created_at DESC)
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "uq_mp_sync_run_active_v2_source_scope"
        ON mp.sync_run (source, scope)
        WHERE source = 'api-v2-compra-agil'
          AND status IN ('queued', 'discovering', 'hydrating', 'projecting', 'reconciling')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const incompatibleRows = (await queryRunner.query(`
      SELECT COUNT(*)::text AS incompatible_count
      FROM (
        SELECT id
        FROM mp.sync_operator
        UNION ALL
        SELECT id
        FROM mp.sync_command
        UNION ALL
        SELECT id
        FROM mp.sync_run_attempt
        UNION ALL
        SELECT id
        FROM mp.sync_run_audit
        UNION ALL
        SELECT id
        FROM mp.sync_run
        WHERE control_workspace_id IS NOT NULL
           OR control_user_workspace_id IS NOT NULL
           OR cancellation_requested_at IS NOT NULL
           OR cancellation_requested_by_user_workspace_id IS NOT NULL
           OR heartbeat_at IS NOT NULL
           OR heartbeat_worker_id IS NOT NULL
      ) g3_data
    `)) as { incompatible_count: string }[];

    if (Number(incompatibleRows[0]?.incompatible_count ?? '0') > 0) {
      throw new Error(
        'Cannot roll back Mercado Publico V2 sync operations while control data exists',
      );
    }

    await queryRunner.query(
      `DROP INDEX IF EXISTS "uq_mp_sync_run_active_v2_source_scope"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_mp_sync_run_audit_workspace_created"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_mp_sync_command_pending"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS mp.sync_run_audit`);
    await queryRunner.query(`DROP TABLE IF EXISTS mp.sync_run_attempt`);
    await queryRunner.query(`DROP TABLE IF EXISTS mp.sync_command`);
    await queryRunner.query(`DROP TABLE IF EXISTS mp.sync_operator`);
    await queryRunner.query(`
      ALTER TABLE mp.sync_run
        DROP COLUMN IF EXISTS heartbeat_worker_id,
        DROP COLUMN IF EXISTS heartbeat_at,
        DROP COLUMN IF EXISTS cancellation_requested_by_user_workspace_id,
        DROP COLUMN IF EXISTS cancellation_requested_at,
        DROP COLUMN IF EXISTS control_user_workspace_id,
        DROP COLUMN IF EXISTS control_workspace_id
    `);
  }
}
