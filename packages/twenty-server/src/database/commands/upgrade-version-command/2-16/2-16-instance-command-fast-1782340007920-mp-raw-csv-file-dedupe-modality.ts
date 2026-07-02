import { QueryRunner } from 'typeorm';

import { RegisteredInstanceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-instance-command.decorator';
import { FastInstanceCommand } from 'src/engine/core-modules/upgrade/interfaces/fast-instance-command.interface';

@RegisteredInstanceCommand('2.16.0', 1782340007920)
export class MpRawCsvFileDedupeModalityFastInstanceCommand
  implements FastInstanceCommand
{
  public async up(queryRunner: QueryRunner): Promise<void> {
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

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE mp.raw_csv_file
      DROP CONSTRAINT IF EXISTS "uk_mp_raw_csv_file_dedupe"
    `);

    await queryRunner.query(`
      ALTER TABLE mp.raw_csv_file
      ADD CONSTRAINT "uk_mp_raw_csv_file_dedupe"
        UNIQUE (source_dataset, source_period, file_checksum)
    `);
  }
}
