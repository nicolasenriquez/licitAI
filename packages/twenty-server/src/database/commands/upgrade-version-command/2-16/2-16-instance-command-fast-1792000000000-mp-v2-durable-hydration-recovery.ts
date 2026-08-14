import { QueryRunner } from 'typeorm';

import { RegisteredInstanceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-instance-command.decorator';
import { FastInstanceCommand } from 'src/engine/core-modules/upgrade/interfaces/fast-instance-command.interface';

@RegisteredInstanceCommand('2.16.0', 1792000000000)
export class MpV2DurableHydrationRecoveryFastInstanceCommand
  implements FastInstanceCommand
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE mp.sync_run
        ADD COLUMN IF NOT EXISTS execution_key uuid NULL
    `);

    await queryRunner.query(`
      ALTER TABLE mp.sync_run_item
        ADD COLUMN IF NOT EXISTS hydration_required boolean NOT NULL DEFAULT true,
        ADD COLUMN IF NOT EXISTS hydration_reason text NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_mp_sync_run_execution_key"
        ON mp.sync_run (execution_key)
        WHERE execution_key IS NOT NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_mp_sync_run_item_pending_hydration"
        ON mp.sync_run_item (sync_run_id, discovery_page, id)
        WHERE status = 'pending' AND hydration_required = true
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const incompatibleRows = (await queryRunner.query(`
      SELECT COUNT(*)::text AS incompatible_count
      FROM mp.sync_run run
      LEFT JOIN mp.sync_run_item item ON item.sync_run_id = run.id
      WHERE run.execution_key IS NOT NULL
         OR item.hydration_required = false
         OR item.hydration_reason IS NOT NULL
    `)) as { incompatible_count: string }[];

    if (Number(incompatibleRows[0]?.incompatible_count ?? '0') > 0) {
      throw new Error(
        'Cannot roll back Mercado Publico V2 hydration recovery while execution or hydration decisions exist',
      );
    }

    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_mp_sync_run_item_pending_hydration"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_mp_sync_run_execution_key"`,
    );
    await queryRunner.query(`
      ALTER TABLE mp.sync_run_item
        DROP COLUMN IF EXISTS hydration_reason,
        DROP COLUMN IF EXISTS hydration_required
    `);
    await queryRunner.query(`
      ALTER TABLE mp.sync_run
        DROP COLUMN IF EXISTS execution_key
    `);
  }
}
