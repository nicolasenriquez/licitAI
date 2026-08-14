import { type QueryRunner } from 'typeorm';

import { RegisteredInstanceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-instance-command.decorator';
import { FastInstanceCommand } from 'src/engine/core-modules/upgrade/interfaces/fast-instance-command.interface';

@RegisteredInstanceCommand('2.16.0', 1790999999999)
export class MpV2SyncOperationsPreflightFastInstanceCommand
  implements FastInstanceCommand
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const duplicateActiveRuns = (await queryRunner.query(`
      SELECT source, scope, COUNT(*)::text AS run_count
      FROM mp.sync_run
      WHERE source = 'api-v2-compra-agil'
        AND status IN ('queued', 'discovering', 'hydrating', 'projecting', 'reconciling')
      GROUP BY source, scope
      HAVING COUNT(*) > 1
    `)) as { source: string; scope: string; run_count: string }[];

    if (duplicateActiveRuns.length > 0) {
      throw new Error(
        'Cannot create the Mercado Publico V2 one-active-run constraint while duplicate active runs exist',
      );
    }
  }

  public async down(): Promise<void> {}
}
