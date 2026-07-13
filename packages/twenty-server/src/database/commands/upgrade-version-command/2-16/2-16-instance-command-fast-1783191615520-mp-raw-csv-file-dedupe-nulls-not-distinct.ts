import { QueryRunner } from 'typeorm';

import { RegisteredInstanceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-instance-command.decorator';
import { FastInstanceCommand } from 'src/engine/core-modules/upgrade/interfaces/fast-instance-command.interface';

@RegisteredInstanceCommand('2.16.0', 1783191615520)
export class MpRawCsvFileDedupeNullsNotDistinctFastInstanceCommand
  implements FastInstanceCommand
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const duplicateGroups = (await queryRunner.query(`
      SELECT COUNT(*)::text AS duplicate_group_count
      FROM (
        SELECT
          source_dataset,
          source_period,
          source_modality,
          file_checksum
        FROM mp.raw_csv_file
        GROUP BY
          source_dataset,
          source_period,
          source_modality,
          file_checksum
        HAVING COUNT(*) > 1
      ) duplicate_groups
    `)) as Array<{ duplicate_group_count: string }>;

    const duplicateGroupCount = Number(
      duplicateGroups[0]?.duplicate_group_count ?? 0,
    );

    if (duplicateGroupCount > 0) {
      throw new Error(
        'Cannot apply NULLS NOT DISTINCT dedupe constraint: ' +
          duplicateGroupCount +
          ' duplicate raw CSV file groups exist',
      );
    }

    await queryRunner.query(`
      ALTER TABLE mp.raw_csv_file
      DROP CONSTRAINT IF EXISTS "uk_mp_raw_csv_file_dedupe"
    `);

    await queryRunner.query(`
      ALTER TABLE mp.raw_csv_file
      ADD CONSTRAINT "uk_mp_raw_csv_file_dedupe"
        UNIQUE NULLS NOT DISTINCT (
          source_dataset,
          source_period,
          source_modality,
          file_checksum
        )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE mp.raw_csv_file
      DROP CONSTRAINT IF EXISTS "uk_mp_raw_csv_file_dedupe"
    `);

    await queryRunner.query(`
      ALTER TABLE mp.raw_csv_file
      ADD CONSTRAINT "uk_mp_raw_csv_file_dedupe"
        UNIQUE (source_dataset, source_period, source_modality, file_checksum)
    `);
  }
}
