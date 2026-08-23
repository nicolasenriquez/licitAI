import { DataSource, QueryRunner } from 'typeorm';

import { RegisteredInstanceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-instance-command.decorator';
import { SlowInstanceCommand } from 'src/engine/core-modules/upgrade/interfaces/slow-instance-command.interface';

const STAGING_UNIQUE_CONSTRAINT =
  'uq_mp_stg_api_v2_compra_agil_raw_snapshot_codigo';

@RegisteredInstanceCommand('2.16.0', 1795000000000, { type: 'slow' })
export class MpV2StagingIdempotencySlowInstanceCommand
  implements SlowInstanceCommand
{
  public async runDataMigration(dataSource: DataSource): Promise<void> {
    await dataSource.transaction(async (entityManager) => {
      await entityManager.query(`
        LOCK TABLE mp.stg_api_v2_compra_agil
          IN SHARE ROW EXCLUSIVE MODE
      `);

      await entityManager.query(`
        WITH ranked_staging AS (
          SELECT
            id,
            ROW_NUMBER() OVER (
              PARTITION BY raw_api_payload_id, snapshot_kind, codigo
              ORDER BY
                (observation_id IS NOT NULL) DESC,
                persisted_at DESC,
                id DESC
            ) AS duplicate_rank
          FROM mp.stg_api_v2_compra_agil
        )
        DELETE FROM mp.stg_api_v2_compra_agil AS staging
        USING ranked_staging
        WHERE staging.id = ranked_staging.id
          AND ranked_staging.duplicate_rank > 1
      `);

      await entityManager.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS
          "${STAGING_UNIQUE_CONSTRAINT}"
        ON mp.stg_api_v2_compra_agil (
          raw_api_payload_id,
          snapshot_kind,
          codigo
        )
      `);
    });
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS
        "${STAGING_UNIQUE_CONSTRAINT}"
      ON mp.stg_api_v2_compra_agil (
        raw_api_payload_id,
        snapshot_kind,
        codigo
      )
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = '${STAGING_UNIQUE_CONSTRAINT}'
            AND conrelid = 'mp.stg_api_v2_compra_agil'::regclass
        ) THEN
          ALTER TABLE mp.stg_api_v2_compra_agil
            ADD CONSTRAINT "${STAGING_UNIQUE_CONSTRAINT}"
            UNIQUE USING INDEX "${STAGING_UNIQUE_CONSTRAINT}";
        END IF;
      END
      $$
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE mp.stg_api_v2_compra_agil
        DROP CONSTRAINT IF EXISTS "${STAGING_UNIQUE_CONSTRAINT}"
    `);
  }
}
