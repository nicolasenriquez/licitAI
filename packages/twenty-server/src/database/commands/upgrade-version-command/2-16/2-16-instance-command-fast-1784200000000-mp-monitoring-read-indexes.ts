import { QueryRunner } from 'typeorm';

import { RegisteredInstanceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-instance-command.decorator';
import { FastInstanceCommand } from 'src/engine/core-modules/upgrade/interfaces/fast-instance-command.interface';

@RegisteredInstanceCommand('2.16.0', 1784200000000)
export class MpMonitoringReadIndexesFastInstanceCommand
  implements FastInstanceCommand
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_mp_stg_job_run_started_at
      ON mp.stg_job_run (started_at DESC, id DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_mp_raw_api_payload_fetched_at
      ON mp.raw_api_payload (fetched_at DESC, id DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_mp_raw_api_payload_ingestion_job_id_fetched_at
      ON mp.raw_api_payload (ingestion_job_id, fetched_at DESC, id DESC)
      WHERE ingestion_job_id IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_mp_raw_api_payload_ingestion_job_id_fetched_at
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_mp_raw_api_payload_fetched_at
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_mp_stg_job_run_started_at
    `);
  }
}
