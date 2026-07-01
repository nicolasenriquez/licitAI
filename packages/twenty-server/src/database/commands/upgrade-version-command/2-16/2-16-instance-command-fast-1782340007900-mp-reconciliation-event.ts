import { QueryRunner } from 'typeorm';

import { RegisteredInstanceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-instance-command.decorator';
import { FastInstanceCommand } from 'src/engine/core-modules/upgrade/interfaces/fast-instance-command.interface';

@RegisteredInstanceCommand('2.16.0', 1782340007900)
export class MpReconciliationEventFastInstanceCommand
  implements FastInstanceCommand
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS mp.reconciliation_event (
        id uuid NOT NULL DEFAULT gen_random_uuid(),
        event_fingerprint text NOT NULL,
        event_type text NOT NULL,
        entity_type text NOT NULL,
        entity_key text NOT NULL,
        source_a text NULL,
        source_b text NULL,
        details jsonb NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_mp_reconciliation_event" PRIMARY KEY (id),
        CONSTRAINT "uq_mp_reconciliation_event_event_fingerprint"
          UNIQUE (event_fingerprint)
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS mp.reconciliation_event`);
  }
}
