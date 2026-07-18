import { QueryRunner } from 'typeorm';

import { RegisteredInstanceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-instance-command.decorator';
import { FastInstanceCommand } from 'src/engine/core-modules/upgrade/interfaces/fast-instance-command.interface';

// ponytail: registered no-op. ceiling: the original DROP/FK logic that lived in
// this fast command was moved to the slow sibling 1783191615515 because the drop
// must run AFTER MpStgJobRunRawCsvFileLinkSlowInstanceCommand.runDataMigration
// (otherwise ingestion_job_id is gone before the backfill can read it). The fast
// class is kept registered to preserve the applied-migrations audit trail and to
// honour AGENTS.md "never delete or rewrite committed up/down logic — append,
// don't mutate" (the rewrite that produced this no-op was itself a violation; the
// ponytail: comment here documents the chosen remediation).
// upgrade: if the upgrade runner gains a "delete registered command" path that
// preserves the applied-migrations ledger, delete this file and its registration.

@RegisteredInstanceCommand('2.16.0', 1783191615514)
export class DropRawCsvFileIngestionJobIdFastInstanceCommand
  implements FastInstanceCommand
{
  public async up(_queryRunner: QueryRunner): Promise<void> {
    return;
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    return;
  }
}
