import { DataSource, QueryRunner } from 'typeorm';

import { RegisteredInstanceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-instance-command.decorator';
import { SlowInstanceCommand } from 'src/engine/core-modules/upgrade/interfaces/slow-instance-command.interface';

@RegisteredInstanceCommand('2.16.0', 1794000000000, { type: 'slow' })
export class MpV2ItemLifecycleStatusSlowInstanceCommand
  implements SlowInstanceCommand
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE mp.sync_run
        ADD COLUMN IF NOT EXISTS records_deferred integer NOT NULL DEFAULT 0
    `);
  }

  public async runDataMigration(dataSource: DataSource): Promise<void> {
    await dataSource.transaction(async (entityManager) => {
      await entityManager.query(`
        ALTER TABLE mp.sync_run_item
          DROP CONSTRAINT IF EXISTS "ck_mp_sync_run_item_status"
      `);

      await entityManager.query(`
        UPDATE mp.sync_run_item
        SET status = CASE
              WHEN error_summary IS NULL THEN 'lifecycle_terminal'
              WHEN error_summary LIKE 'retryable_failed%' THEN 'deferred'
              ELSE 'failed'
            END
        WHERE status = 'terminal'
      `);

      await entityManager.query(`
        ALTER TABLE mp.sync_run_item
          ADD CONSTRAINT "ck_mp_sync_run_item_status"
            CHECK (status IN (
              'pending',
              'processing',
              'succeeded',
              'lifecycle_terminal',
              'failed',
              'deferred'
            ))
      `);
    });
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const incompatibleRows = (await queryRunner.query(`
      SELECT COUNT(*)::text AS incompatible_count
      FROM mp.sync_run_item
      WHERE status IN ('lifecycle_terminal', 'failed', 'deferred')
    `)) as { incompatible_count: string }[];

    if (Number(incompatibleRows[0]?.incompatible_count ?? '0') > 0) {
      throw new Error(
        'Cannot roll back Mercado Publico V2 item lifecycle statuses while split-status rows exist',
      );
    }

    await queryRunner.query(`
      ALTER TABLE mp.sync_run_item
        DROP CONSTRAINT IF EXISTS "ck_mp_sync_run_item_status",
        ADD CONSTRAINT "ck_mp_sync_run_item_status"
          CHECK (status IN ('pending', 'processing', 'succeeded', 'terminal'))
    `);

    await queryRunner.query(`
      ALTER TABLE mp.sync_run
        DROP COLUMN IF EXISTS records_deferred
    `);
  }
}
