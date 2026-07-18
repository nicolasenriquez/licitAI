import { QueryRunner } from 'typeorm';

import { RegisteredInstanceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-instance-command.decorator';
import { FastInstanceCommand } from 'src/engine/core-modules/upgrade/interfaces/fast-instance-command.interface';

@RegisteredInstanceCommand('2.16.0', 1784000000000)
export class MpStgJobRunAddSkippedStatusFastInstanceCommand
  implements FastInstanceCommand
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE IF EXISTS mp.stg_job_run
      DROP CONSTRAINT IF EXISTS "ck_mp_stg_job_run_status"
    `);

    await queryRunner.query(`
      ALTER TABLE IF EXISTS mp.stg_job_run
      ADD CONSTRAINT "ck_mp_stg_job_run_status"
        CHECK (status IN (
          'success',
          'failed',
          'soft_miss',
          'param_error',
          'retryable_failed',
          'skipped'
        ))
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE IF EXISTS mp.stg_job_run
      DROP CONSTRAINT IF EXISTS "ck_mp_stg_job_run_status"
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF to_regclass('mp.stg_job_run') IS NOT NULL THEN
          UPDATE mp.stg_job_run
          SET status = 'soft_miss'
          WHERE status = 'skipped';
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      ALTER TABLE IF EXISTS mp.stg_job_run
      ADD CONSTRAINT "ck_mp_stg_job_run_status"
        CHECK (status IN (
          'success',
          'failed',
          'soft_miss',
          'param_error',
          'retryable_failed'
        ))
    `);
  }
}
