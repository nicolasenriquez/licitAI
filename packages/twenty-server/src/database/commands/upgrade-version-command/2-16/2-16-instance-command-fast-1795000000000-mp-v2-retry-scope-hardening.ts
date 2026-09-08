import { QueryRunner } from 'typeorm';

import { RegisteredInstanceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-instance-command.decorator';
import { FastInstanceCommand } from 'src/engine/core-modules/upgrade/interfaces/fast-instance-command.interface';

@RegisteredInstanceCommand('2.16.0', 1795000000000)
export class MpV2RetryScopeHardeningFastInstanceCommand
  implements FastInstanceCommand
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE mp.sync_run_item
        ADD COLUMN IF NOT EXISTS retry_count integer NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS max_attempts integer NOT NULL DEFAULT 3,
        ADD COLUMN IF NOT EXISTS next_retry_at timestamptz NULL,
        ADD COLUMN IF NOT EXISTS failure_class text NULL
    `);

    await queryRunner.query(`
      ALTER TABLE mp.sync_run_item
        DROP CONSTRAINT IF EXISTS "ck_mp_sync_run_item_status",
        ADD CONSTRAINT "ck_mp_sync_run_item_status"
          CHECK (status IN (
            'pending',
            'processing',
            'succeeded',
            'lifecycle_terminal',
            'failed',
            'deferred',
            'dead_letter'
          )),
        ADD CONSTRAINT "ck_mp_sync_run_item_retry_count_non_negative"
          CHECK (retry_count >= 0),
        ADD CONSTRAINT "ck_mp_sync_run_item_max_attempts_positive"
          CHECK (max_attempts > 0)
    `);

    await queryRunner.query(`
      ALTER TABLE mp.sync_command
        DROP CONSTRAINT IF EXISTS "ck_mp_sync_command_action",
        ADD CONSTRAINT "ck_mp_sync_command_action"
          CHECK (action IN ('start', 'resume', 'cancel', 'retry_failed')),
        DROP CONSTRAINT IF EXISTS "ck_mp_sync_command_scope"
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_mp_sync_run_item_retry_due"
        ON mp.sync_run_item (status, next_retry_at, updated_at)
        WHERE status IN ('deferred', 'dead_letter')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const incompatibleRows = (await queryRunner.query(`
      SELECT COUNT(*)::text AS incompatible_count
      FROM mp.sync_run_item
      WHERE status = 'dead_letter'
         OR retry_count > 0
         OR next_retry_at IS NOT NULL
         OR failure_class IS NOT NULL
    `)) as { incompatible_count: string }[];

    if (Number(incompatibleRows[0]?.incompatible_count ?? '0') > 0) {
      throw new Error(
        'Cannot roll back Mercado Publico V2 retry hardening while retry evidence exists',
      );
    }

    const incompatibleCommands = (await queryRunner.query(`
      SELECT COUNT(*)::text AS incompatible_count
      FROM mp.sync_command
      WHERE action = 'retry_failed' OR scope <> 'global'
    `)) as { incompatible_count: string }[];

    if (Number(incompatibleCommands[0]?.incompatible_count ?? '0') > 0) {
      throw new Error(
        'Cannot roll back Mercado Publico V2 retry hardening while scoped commands exist',
      );
    }

    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_mp_sync_run_item_retry_due"`,
    );
    await queryRunner.query(`
      ALTER TABLE mp.sync_command
        DROP CONSTRAINT IF EXISTS "ck_mp_sync_command_action",
        ADD CONSTRAINT "ck_mp_sync_command_action"
          CHECK (action IN ('start', 'resume', 'cancel')),
        ADD CONSTRAINT "ck_mp_sync_command_scope"
          CHECK (scope = 'global')
    `);
    await queryRunner.query(`
      ALTER TABLE mp.sync_run_item
        DROP CONSTRAINT IF EXISTS "ck_mp_sync_run_item_status",
        DROP CONSTRAINT IF EXISTS "ck_mp_sync_run_item_retry_count_non_negative",
        DROP CONSTRAINT IF EXISTS "ck_mp_sync_run_item_max_attempts_positive",
        ADD CONSTRAINT "ck_mp_sync_run_item_status"
          CHECK (status IN (
            'pending',
            'processing',
            'succeeded',
            'lifecycle_terminal',
            'failed',
            'deferred'
          )),
        DROP COLUMN IF EXISTS failure_class,
        DROP COLUMN IF EXISTS next_retry_at,
        DROP COLUMN IF EXISTS max_attempts,
        DROP COLUMN IF EXISTS retry_count
    `);
  }
}
