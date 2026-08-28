import { Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { Command, CommandRunner } from 'nest-commander';

import { DataSource } from 'typeorm';

import { SEED_APPLE_WORKSPACE_ID } from 'src/engine/workspace-manager/dev-seeder/core/constants/seeder-workspaces.constant';
import { USER_WORKSPACE_DATA_SEED_IDS } from 'src/engine/workspace-manager/dev-seeder/core/utils/seed-user-workspaces.util';

const SEED_ENABLED_ENV = 'MERCADO_PUBLICO_V2_E2E_READ_MODEL_SEED_ENABLED';
const SEED_SCOPE_ENV = 'MERCADO_PUBLICO_V2_E2E_READ_MODEL_SEED_SCOPE';

type SeedVerificationRow = {
  goldCount: number;
  codedBuyerCount: number;
  uncodedBuyerCount: number;
  historyCount: number;
  operatorCount: number;
  utmAmountMatches: boolean;
};

@Command({
  name: 'mercado-publico:v2:e2e-read-model-seed',
  description:
    'Seed Mercado Publico read models in an explicitly isolated E2E deployment.',
})
export class MercadoPublicoV2E2EReadModelSeedCommand extends CommandRunner {
  private readonly logger = new Logger(
    MercadoPublicoV2E2EReadModelSeedCommand.name,
  );

  constructor(
    @InjectDataSource()
    private readonly coreDataSource: DataSource,
  ) {
    super();
  }

  async run(): Promise<void> {
    if (
      process.env[SEED_ENABLED_ENV] !== 'true' ||
      process.env[SEED_SCOPE_ENV] !== 'isolated'
    ) {
      throw new Error(
        `${SEED_ENABLED_ENV}=true and ${SEED_SCOPE_ENV}=isolated are required`,
      );
    }

    await this.coreDataSource.transaction(async (entityManager) => {
      await entityManager.query(
        `
          DELETE FROM mp.sync_run_audit
          WHERE sync_run_id IN (
            '10000000-0000-4000-8000-000000000001',
            '10000000-0000-4000-8000-000000000002'
          );
          DELETE FROM mp.v2_history
          WHERE codigo IN ('FIXTURE-CA-001', 'FIXTURE-CA-UTM');
          DELETE FROM mp.gold_detected_process
          WHERE process_type = 'compra_agil'
            AND process_code LIKE 'FIXTURE-CA-%';
          DELETE FROM mp.v2_cohort
          WHERE source = 'api-v2-compra-agil'
            AND scope = 'global'
            AND codigo LIKE 'FIXTURE-CA-%';
          DELETE FROM mp.v2_observation
          WHERE id IN (
            '30000000-0000-4000-8000-000000000001',
            '30000000-0000-4000-8000-000000000002',
            '30000000-0000-4000-8000-000000000003',
            '30000000-0000-4000-8000-000000000004'
          );
          DELETE FROM mp.raw_api_payload
          WHERE id IN (
            '20000000-0000-4000-8000-000000000001',
            '20000000-0000-4000-8000-000000000002'
          );
          DELETE FROM mp.sync_run
          WHERE id IN (
            '10000000-0000-4000-8000-000000000001',
            '10000000-0000-4000-8000-000000000002'
          );

          INSERT INTO mp.sync_run (
            id, intent, source, status, started_at, finished_at,
            records_discovered, records_projected, created_at, updated_at,
            scope, request_params, records_hydrated, records_failed,
            pages_discovered, pages_checkpointed, control_workspace_id,
            control_user_workspace_id, provider_records_seen,
            records_hydration_required, records_hydration_skipped,
            discovery_complete, completion_reason, records_deferred
          ) VALUES
            (
              '10000000-0000-4000-8000-000000000001', 'fixture',
              'api-v2-compra-agil', 'succeeded', '2026-08-05T10:00:00Z',
              '2026-08-05T10:01:00Z', 4, 4, '2026-08-05T10:00:00Z',
              '2026-08-05T10:01:00Z', 'global', '{}'::jsonb, 4, 0, 1, 1,
              '${SEED_APPLE_WORKSPACE_ID}', '${USER_WORKSPACE_DATA_SEED_IDS.TIM}',
              4, 4, 0, true, 'completed', 0
            ),
            (
              '10000000-0000-4000-8000-000000000002', 'fixture',
              'api-v2-compra-agil', 'succeeded', '2026-08-06T10:00:00Z',
              '2026-08-06T10:01:00Z', 4, 4, '2026-08-06T10:00:00Z',
              '2026-08-06T10:01:00Z', 'global', '{}'::jsonb, 4, 0, 1, 1,
              '${SEED_APPLE_WORKSPACE_ID}', '${USER_WORKSPACE_DATA_SEED_IDS.TIM}',
              4, 4, 0, true, 'completed', 0
            );

          INSERT INTO mp.raw_api_payload (
            id, source, endpoint, request_fingerprint, payload_checksum,
            request_params, http_status, fetched_at, raw_payload,
            schema_fingerprint, records_fetched, records_accepted,
            records_rejected, contract_issues
          ) VALUES
            (
              '20000000-0000-4000-8000-000000000001',
              'api-v2-compra-agil', 'fixture', 'e2e-initial',
              'e2e-initial-checksum', '{}'::jsonb, 200,
              '2026-08-05T10:00:00Z', '{"fixture":"initial"}'::jsonb,
              'fixture-schema-1', 4, 4, 0, '[]'::jsonb
            ),
            (
              '20000000-0000-4000-8000-000000000002',
              'api-v2-compra-agil', 'fixture', 'e2e-changed',
              'e2e-changed-checksum', '{}'::jsonb, 200,
              '2026-08-06T10:00:00Z', '{"fixture":"changed"}'::jsonb,
              'fixture-schema-1', 4, 4, 0, '[]'::jsonb
            );

          INSERT INTO mp.v2_observation (
            id, sync_run_id, raw_api_payload_id, codigo, payload_checksum,
            provider_schema_fingerprint, normalizer_version, observed_at,
            source, endpoint, snapshot_kind, request_fingerprint,
            provider_changed_at_raw, provider_changed_at, semantic_fingerprint
          ) VALUES
            (
              '30000000-0000-4000-8000-000000000001',
              '10000000-0000-4000-8000-000000000001',
              '20000000-0000-4000-8000-000000000001', 'FIXTURE-CA-001',
              'fixture-001-before-payload', 'fixture-schema-1',
              'mercado-publico-v2-durable-1', '2026-08-05T10:00:00Z',
              'api-v2-compra-agil', 'fixture', 'list', 'e2e-initial',
              '2026-08-05T10:00:00Z', '2026-08-05T10:00:00Z',
              'fixture-001-before'
            ),
            (
              '30000000-0000-4000-8000-000000000002',
              '10000000-0000-4000-8000-000000000002',
              '20000000-0000-4000-8000-000000000002', 'FIXTURE-CA-001',
              'fixture-001-after-payload', 'fixture-schema-1',
              'mercado-publico-v2-durable-1', '2026-08-06T10:00:00Z',
              'api-v2-compra-agil', 'fixture', 'list', 'e2e-changed',
              '2026-08-06T10:00:00Z', '2026-08-06T10:00:00Z',
              'fixture-001-after'
            ),
            (
              '30000000-0000-4000-8000-000000000003',
              '10000000-0000-4000-8000-000000000001',
              '20000000-0000-4000-8000-000000000001', 'FIXTURE-CA-UTM',
              'fixture-utm-before-payload', 'fixture-schema-1',
              'mercado-publico-v2-durable-1', '2026-08-05T10:00:00Z',
              'api-v2-compra-agil', 'fixture', 'list', 'e2e-initial',
              '2026-08-05T10:00:00Z', '2026-08-05T10:00:00Z',
              'fixture-utm-before'
            ),
            (
              '30000000-0000-4000-8000-000000000004',
              '10000000-0000-4000-8000-000000000002',
              '20000000-0000-4000-8000-000000000002', 'FIXTURE-CA-UTM',
              'fixture-utm-after-payload', 'fixture-schema-1',
              'mercado-publico-v2-durable-1', '2026-08-06T10:00:00Z',
              'api-v2-compra-agil', 'fixture', 'list', 'e2e-changed',
              '2026-08-06T10:00:00Z', '2026-08-06T10:00:00Z',
              'fixture-utm-after'
            );

          INSERT INTO mp.v2_history (
            id, codigo, previous_observation_id, new_observation_id,
            semantic_fingerprint_before, semantic_fingerprint_after,
            before_json, after_json, provider_changed_at_raw,
            provider_changed_at, observed_at, normalizer_version,
            provider_schema_fingerprint, created_at
          ) VALUES
            (
              '40000000-0000-4000-8000-000000000001', 'FIXTURE-CA-001',
              '30000000-0000-4000-8000-000000000001',
              '30000000-0000-4000-8000-000000000002',
              'fixture-001-before', 'fixture-001-after',
              '{"title":"Servicio de mantencion preventiva","amount":"1500000","buyer_code":"60.000.000-0"}'::jsonb,
              '{"title":"Servicio de mantencion preventiva actualizado","amount":"1500000","buyer_code":"60.000.000-0"}'::jsonb,
              '2026-08-06T10:00:00Z', '2026-08-06T10:00:00Z',
              '2026-08-06T10:00:00Z', 'mercado-publico-v2-durable-1',
              'fixture-schema-1', '2026-08-06T10:00:00Z'
            ),
            (
              '40000000-0000-4000-8000-000000000002', 'FIXTURE-CA-UTM',
              '30000000-0000-4000-8000-000000000003',
              '30000000-0000-4000-8000-000000000004',
              'fixture-utm-before', 'fixture-utm-after',
              '{"amount":"7164900","amount_raw":"100","currency_source":"UTM"}'::jsonb,
              '{"amount":"7190000","amount_raw":"100","currency_source":"UTM"}'::jsonb,
              '2026-08-06T10:00:00Z', '2026-08-06T10:00:00Z',
              '2026-08-06T10:00:00Z', 'mercado-publico-v2-durable-1',
              'fixture-schema-1', '2026-08-06T10:00:00Z'
            );

          INSERT INTO mp.gold_detected_process (
            id, process_type, process_code, title, canonical_state,
            raw_state_code, raw_state_label, buyer_code, buyer_name,
            published_at, closing_at, source_priority, reconciliation_status,
            last_seen_at, created_at, updated_at, region, amount,
            currency_source, document_count, observation_id,
            normalizer_version, provider_schema_fingerprint, availability,
            provider_changed_at_raw, provider_changed_at, observed_at,
            persisted_at, amount_raw, semantic_fingerprint, llamado
          ) VALUES
            (
              '50000000-0000-4000-8000-000000000001', 'compra_agil',
              'FIXTURE-CA-001', 'Servicio de mantencion preventiva actualizado',
              'publicada', 'publicada', 'Publicada', '60.000.000-0',
              'Municipalidad de Ejemplo', '2026-08-01T10:00:00Z',
              '2026-09-30T16:00:00Z', 'api-v2', 'detected',
              '2026-08-06T10:00:00Z', '2026-08-06T10:00:00Z',
              '2026-08-06T10:00:00Z', 13, 1500000, 'CLP', 1,
              '30000000-0000-4000-8000-000000000002',
              'mercado-publico-v2-durable-1', 'fixture-schema-1', 'available',
              '2026-08-06T10:00:00Z', '2026-08-06T10:00:00Z',
              '2026-08-06T10:00:00Z', '2026-08-06T10:00:00Z', '1500000',
              'fixture-001-after', 1
            ),
            (
              '50000000-0000-4000-8000-000000000002', 'compra_agil',
              'FIXTURE-CA-002', 'Servicio de soporte operativo', 'publicada',
              'publicada', 'Publicada', '60.000.000-0',
              'Municipalidad de Ejemplo', '2026-08-02T10:00:00Z',
              '2026-10-01T16:00:00Z', 'api-v2', 'detected',
              '2026-08-06T10:00:00Z', '2026-08-06T10:00:00Z',
              '2026-08-06T10:00:00Z', 13, NULL, NULL, NULL, NULL,
              'mercado-publico-v2-durable-1', 'fixture-schema-1', 'available',
              '2026-08-06T10:00:00Z', '2026-08-06T10:00:00Z',
              '2026-08-06T10:00:00Z', '2026-08-06T10:00:00Z', NULL,
              'fixture-002', 1
            ),
            (
              '50000000-0000-4000-8000-000000000003', 'compra_agil',
              'FIXTURE-CA-003', 'Servicio con comprador sin codigo', 'publicada',
              'publicada', 'Publicada', NULL, 'Comprador sin codigo',
              '2026-08-03T10:00:00Z', '2026-10-02T16:00:00Z', 'api-v2',
              'detected', '2026-08-06T10:00:00Z', '2026-08-06T10:00:00Z',
              '2026-08-06T10:00:00Z', 13, 250000, 'CLP', NULL, NULL,
              'mercado-publico-v2-durable-1', 'fixture-schema-1', 'available',
              '2026-08-06T10:00:00Z', '2026-08-06T10:00:00Z',
              '2026-08-06T10:00:00Z', '2026-08-06T10:00:00Z', '250000',
              'fixture-003', 1
            ),
            (
              '50000000-0000-4000-8000-000000000004', 'compra_agil',
              'FIXTURE-CA-UTM', 'Servicio con monto en UTM', 'publicada',
              'publicada', 'Publicada', '60.000.000-0',
              'Municipalidad de Ejemplo', '2026-08-03T10:00:00Z',
              '2026-10-03T16:00:00Z', 'api-v2', 'detected',
              '2026-08-06T10:00:00Z', '2026-08-06T10:00:00Z',
              '2026-08-06T10:00:00Z', 13, 7190000, 'UTM', NULL,
              '30000000-0000-4000-8000-000000000004',
              'mercado-publico-v2-durable-1', 'fixture-schema-1', 'available',
              '2026-08-06T10:00:00Z', '2026-08-06T10:00:00Z',
              '2026-08-06T10:00:00Z', '2026-08-06T10:00:00Z', '100',
              'fixture-utm-after', 1
            );

          INSERT INTO mp.v2_cohort (
            source, scope, codigo, status, admitted_sync_run_id, admitted_at,
            updated_at
          )
          SELECT
            'api-v2-compra-agil', 'global', codigo, 'active',
            '10000000-0000-4000-8000-000000000001',
            '2026-08-05T10:00:00Z', '2026-08-06T10:00:00Z'
          FROM unnest(ARRAY[
            'FIXTURE-CA-001', 'FIXTURE-CA-002', 'FIXTURE-CA-003',
            'FIXTURE-CA-UTM'
          ]) AS fixture(codigo);
        `,
      );

      await entityManager.query(
        `
          INSERT INTO mp.sync_operator (
            workspace_id, user_workspace_id, assigned_by_user_workspace_id
          )
          VALUES ($1, $2, $2)
          ON CONFLICT (workspace_id, user_workspace_id) DO NOTHING
        `,
        [SEED_APPLE_WORKSPACE_ID, USER_WORKSPACE_DATA_SEED_IDS.TIM],
      );

      const verificationRows = await entityManager.query<SeedVerificationRow[]>(
        `
          SELECT
            COUNT(*)::integer AS "goldCount",
            COUNT(*) FILTER (
              WHERE buyer_code = '60.000.000-0'
            )::integer AS "codedBuyerCount",
            COUNT(*) FILTER (
              WHERE buyer_code IS NULL
            )::integer AS "uncodedBuyerCount",
            (
              SELECT COUNT(*)::integer
              FROM mp.v2_history
              WHERE codigo IN ('FIXTURE-CA-001', 'FIXTURE-CA-UTM')
            ) AS "historyCount",
            (
              SELECT COUNT(*)::integer
              FROM mp.sync_operator
              WHERE workspace_id = $1 AND user_workspace_id = $2
            ) AS "operatorCount",
            BOOL_AND(
              amount = 7190000
              AND amount_raw = '100'
              AND currency_source = 'UTM'
            ) FILTER (WHERE process_code = 'FIXTURE-CA-UTM')
              AS "utmAmountMatches"
          FROM mp.gold_detected_process
          WHERE process_type = 'compra_agil'
            AND process_code LIKE 'FIXTURE-CA-%'
        `,
        [SEED_APPLE_WORKSPACE_ID, USER_WORKSPACE_DATA_SEED_IDS.TIM],
      );
      const verification = verificationRows[0];

      if (
        verification?.goldCount !== 4 ||
        verification.codedBuyerCount !== 3 ||
        verification.uncodedBuyerCount !== 1 ||
        verification.historyCount !== 2 ||
        verification.operatorCount !== 1 ||
        verification.utmAmountMatches !== true
      ) {
        throw new Error(
          'Mercado Publico V2 E2E read-model seed verification failed',
        );
      }
    });

    this.logger.log(
      'Mercado Publico V2 E2E read models ready: FIXTURE-CA-001, FIXTURE-CA-UTM, 60.000.000-0',
    );
  }
}
