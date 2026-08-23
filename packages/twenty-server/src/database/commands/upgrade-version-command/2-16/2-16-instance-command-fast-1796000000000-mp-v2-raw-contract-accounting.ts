import { QueryRunner } from 'typeorm';

import { RegisteredInstanceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-instance-command.decorator';
import { FastInstanceCommand } from 'src/engine/core-modules/upgrade/interfaces/fast-instance-command.interface';

@RegisteredInstanceCommand('2.16.0', 1796000000000)
export class MpV2RawContractAccountingFastInstanceCommand
  implements FastInstanceCommand
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE mp.raw_api_payload
        ADD COLUMN IF NOT EXISTS records_accepted integer NULL,
        ADD COLUMN IF NOT EXISTS records_rejected integer NULL,
        ADD COLUMN IF NOT EXISTS contract_issues jsonb NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE mp.raw_api_payload
        DROP COLUMN IF EXISTS contract_issues,
        DROP COLUMN IF EXISTS records_rejected,
        DROP COLUMN IF EXISTS records_accepted
    `);
  }
}
