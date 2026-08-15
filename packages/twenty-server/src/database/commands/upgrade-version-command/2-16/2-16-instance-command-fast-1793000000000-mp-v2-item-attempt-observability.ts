import { QueryRunner } from 'typeorm';

import { RegisteredInstanceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-instance-command.decorator';
import { FastInstanceCommand } from 'src/engine/core-modules/upgrade/interfaces/fast-instance-command.interface';

@RegisteredInstanceCommand('2.16.0', 1793000000000)
export class MpV2ItemAttemptObservabilityFastInstanceCommand
  implements FastInstanceCommand
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE mp.sync_run_page
        ADD COLUMN IF NOT EXISTS records_returned integer NOT NULL DEFAULT 0
    `);

    await queryRunner.query(`
      ALTER TABLE mp.sync_run
        ADD COLUMN IF NOT EXISTS provider_records_seen integer NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS records_hydration_required integer NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS records_hydration_skipped integer NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS discovery_complete boolean NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS completion_reason text NULL
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS mp.sync_run_item_attempt (
        id uuid NOT NULL DEFAULT gen_random_uuid(),
        sync_run_id uuid NOT NULL,
        sync_run_item_id uuid NOT NULL,
        attempt_number integer NOT NULL,
        endpoint text NOT NULL,
        request_started_at timestamptz NOT NULL,
        request_finished_at timestamptz NOT NULL,
        latency_ms integer NOT NULL,
        http_status integer NULL,
        transport_error_code text NULL,
        provider_error_code text NULL,
        provider_error_message text NULL,
        failure_class text NULL,
        retryable boolean NOT NULL,
        retry_after_seconds integer NULL,
        raw_api_payload_id uuid NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_mp_sync_run_item_attempt" PRIMARY KEY (id),
        CONSTRAINT "uq_mp_sync_run_item_attempt_item_number"
          UNIQUE (sync_run_item_id, attempt_number),
        CONSTRAINT "ck_mp_sync_run_item_attempt_number_positive"
          CHECK (attempt_number > 0),
        CONSTRAINT "ck_mp_sync_run_item_attempt_latency_non_negative"
          CHECK (latency_ms >= 0),
        CONSTRAINT "fk_mp_sync_run_item_attempt_sync_run"
          FOREIGN KEY (sync_run_id) REFERENCES mp.sync_run(id) ON DELETE CASCADE,
        CONSTRAINT "fk_mp_sync_run_item_attempt_sync_run_item"
          FOREIGN KEY (sync_run_item_id) REFERENCES mp.sync_run_item(id) ON DELETE CASCADE,
        CONSTRAINT "fk_mp_sync_run_item_attempt_raw_payload"
          FOREIGN KEY (raw_api_payload_id) REFERENCES mp.raw_api_payload(id) ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_mp_sync_run_item_attempt_run_endpoint"
        ON mp.sync_run_item_attempt (sync_run_id, endpoint, created_at)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const incompatibleRows = (await queryRunner.query(`
      SELECT COUNT(*)::text AS incompatible_count
      FROM mp.sync_run_item_attempt
    `)) as { incompatible_count: string }[];

    if (Number(incompatibleRows[0]?.incompatible_count ?? '0') > 0) {
      throw new Error(
        'Cannot remove Mercado Publico V2 item attempt evidence while attempt rows exist',
      );
    }

    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_mp_sync_run_item_attempt_run_endpoint"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS mp.sync_run_item_attempt`);
    await queryRunner.query(`
      ALTER TABLE mp.sync_run
        DROP COLUMN IF EXISTS completion_reason,
        DROP COLUMN IF EXISTS discovery_complete,
        DROP COLUMN IF EXISTS records_hydration_skipped,
        DROP COLUMN IF EXISTS records_hydration_required,
        DROP COLUMN IF EXISTS provider_records_seen
    `);
    await queryRunner.query(`
      ALTER TABLE mp.sync_run_page
        DROP COLUMN IF EXISTS records_returned
    `);
  }
}
