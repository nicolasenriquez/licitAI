import { QueryRunner } from 'typeorm';

import { RegisteredInstanceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-instance-command.decorator';
import { FastInstanceCommand } from 'src/engine/core-modules/upgrade/interfaces/fast-instance-command.interface';

@RegisteredInstanceCommand('2.16.0', 1788000000000)
export class MpV2EvidenceRollbackCompatibilityFastInstanceCommand
  implements FastInstanceCommand
{
  public async up(_queryRunner: QueryRunner): Promise<void> {}

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TEMP TABLE mp_v2_observation_duplicates ON COMMIT DROP AS
      SELECT id, survivor_id
      FROM (
        SELECT
          id,
          FIRST_VALUE(id) OVER (
            PARTITION BY sync_run_id, codigo, payload_checksum
            ORDER BY observed_at DESC, id DESC
          ) AS survivor_id,
          ROW_NUMBER() OVER (
            PARTITION BY sync_run_id, codigo, payload_checksum
            ORDER BY observed_at DESC, id DESC
          ) AS duplicate_rank
        FROM mp.v2_observation
      ) ranked_observations
      WHERE duplicate_rank > 1
    `);
    await queryRunner.query(`
      DELETE FROM mp.v2_history
      WHERE previous_observation_id IN (SELECT id FROM mp_v2_observation_duplicates)
         OR new_observation_id IN (SELECT id FROM mp_v2_observation_duplicates)
    `);
    await queryRunner.query(`
      UPDATE mp.compra_agil AS compra_agil
      SET observation_id = duplicates.survivor_id
      FROM mp_v2_observation_duplicates AS duplicates
      WHERE compra_agil.observation_id = duplicates.id
    `);
    await queryRunner.query(`
      UPDATE mp.gold_detected_process AS gold_detected_process
      SET observation_id = duplicates.survivor_id
      FROM mp_v2_observation_duplicates AS duplicates
      WHERE gold_detected_process.observation_id = duplicates.id
    `);
    await queryRunner.query(`
      UPDATE mp.sync_run_item AS sync_run_item
      SET observation_id = duplicates.survivor_id
      FROM mp_v2_observation_duplicates AS duplicates
      WHERE sync_run_item.observation_id = duplicates.id
    `);
    await queryRunner.query(`
      UPDATE mp.stg_api_v2_compra_agil AS staging
      SET observation_id = duplicates.survivor_id
      FROM mp_v2_observation_duplicates AS duplicates
      WHERE staging.observation_id = duplicates.id
    `);
    await queryRunner.query(`
      DELETE FROM mp.v2_observation
      WHERE id IN (SELECT id FROM mp_v2_observation_duplicates)
    `);
  }
}
