import { QueryRunner } from 'typeorm';

import { RegisteredInstanceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-instance-command.decorator';
import { FastInstanceCommand } from 'src/engine/core-modules/upgrade/interfaces/fast-instance-command.interface';

@RegisteredInstanceCommand('2.16.0', 1786000000000)
export class MpV2CohortFastInstanceCommand implements FastInstanceCommand {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS mp.v2_cohort (
        source text NOT NULL,
        scope text NOT NULL,
        codigo text NOT NULL,
        status text NOT NULL CHECK (status IN ('active', 'terminal')),
        admitted_sync_run_id uuid NOT NULL REFERENCES mp.sync_run(id),
        terminal_sync_run_id uuid NULL REFERENCES mp.sync_run(id),
        admitted_at timestamptz NOT NULL DEFAULT now(),
        terminal_at timestamptz NULL,
        updated_at timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY (source, scope, codigo)
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_mp_v2_cohort_active
        ON mp.v2_cohort (source, scope, codigo)
        WHERE status = 'active'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_mp_v2_cohort_active`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS mp.v2_cohort`);
  }
}
