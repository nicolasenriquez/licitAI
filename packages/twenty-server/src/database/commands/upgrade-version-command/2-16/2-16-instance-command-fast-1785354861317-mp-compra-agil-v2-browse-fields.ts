import { type QueryRunner } from 'typeorm';

import { RegisteredInstanceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-instance-command.decorator';
import { type FastInstanceCommand } from 'src/engine/core-modules/upgrade/interfaces/fast-instance-command.interface';

@RegisteredInstanceCommand('2.16.0', 1785354861317)
export class MpCompraAgilV2BrowseFieldsFastInstanceCommand
  implements FastInstanceCommand
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE mp.stg_api_v2_compra_agil
        ADD COLUMN title text,
        ADD COLUMN buyer_name text
    `);
    await queryRunner.query(`
      ALTER TABLE mp.compra_agil
        ADD COLUMN title text,
        ADD COLUMN buyer_name text
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE mp.compra_agil
        DROP COLUMN buyer_name,
        DROP COLUMN title
    `);
    await queryRunner.query(`
      ALTER TABLE mp.stg_api_v2_compra_agil
        DROP COLUMN buyer_name,
        DROP COLUMN title
    `);
  }
}
