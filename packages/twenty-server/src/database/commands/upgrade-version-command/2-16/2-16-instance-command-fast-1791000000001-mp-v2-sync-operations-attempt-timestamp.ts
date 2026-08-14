import { type QueryRunner } from 'typeorm';

import { RegisteredInstanceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-instance-command.decorator';
import { FastInstanceCommand } from 'src/engine/core-modules/upgrade/interfaces/fast-instance-command.interface';

@RegisteredInstanceCommand('2.16.0', 1791000000001)
export class MpV2SyncOperationsAttemptTimestampFastInstanceCommand
  implements FastInstanceCommand
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE mp.sync_run_attempt
        ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now()
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const attemptRows = (await queryRunner.query(`
      SELECT COUNT(*)::text AS attempt_count
      FROM mp.sync_run_attempt
    `)) as { attempt_count: string }[];

    if (Number(attemptRows[0]?.attempt_count ?? 0) > 0) {
      throw new Error(
        'Cannot remove mp.sync_run_attempt.updated_at while attempt data exists',
      );
    }

    await queryRunner.query(`
      ALTER TABLE mp.sync_run_attempt
        DROP COLUMN IF EXISTS updated_at
    `);
  }
}
