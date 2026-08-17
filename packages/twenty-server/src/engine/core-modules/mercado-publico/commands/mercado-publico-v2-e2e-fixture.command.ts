import { InjectDataSource } from '@nestjs/typeorm';
import { Logger } from '@nestjs/common';
import { Command, CommandRunner } from 'nest-commander';

import { DataSource } from 'typeorm';

import { mercadoPublicoV2E2EFixture } from 'src/engine/core-modules/mercado-publico/drivers/api/fixtures/mercado-publico-v2-e2e.fixture';
import { MercadoPublicoV2DurableSyncService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-v2-durable-sync.service';
import { SEED_APPLE_WORKSPACE_ID } from 'src/engine/workspace-manager/dev-seeder/core/constants/seeder-workspaces.constant';
import { USER_WORKSPACE_DATA_SEED_IDS } from 'src/engine/workspace-manager/dev-seeder/core/utils/seed-user-workspaces.util';

const FIXTURE_ENABLED_ENV = 'MERCADO_PUBLICO_V2_E2E_FIXTURE_ENABLED';
const FIXTURE_SCOPE_ENV = 'MERCADO_PUBLICO_V2_E2E_FIXTURE_SCOPE';

type FixtureVerificationRow = {
  total: string;
  codedBuyer: string;
  uncodedBuyer: string;
};

@Command({
  name: 'mercado-publico:v2:e2e-fixture',
  description:
    'Reset and seed the isolated Mercado Publico V2 E2E fixture. Requires explicit disposable-environment flags.',
})
export class MercadoPublicoV2E2EFixtureCommand extends CommandRunner {
  private readonly logger = new Logger(MercadoPublicoV2E2EFixtureCommand.name);

  constructor(
    private readonly mercadoPublicoV2DurableSyncService: MercadoPublicoV2DurableSyncService,
    @InjectDataSource()
    private readonly coreDataSource: DataSource,
  ) {
    super();
  }

  async run(): Promise<void> {
    if (
      process.env[FIXTURE_ENABLED_ENV] !== 'true' ||
      process.env[FIXTURE_SCOPE_ENV] !== 'isolated'
    ) {
      throw new Error(
        `${FIXTURE_ENABLED_ENV}=true and ${FIXTURE_SCOPE_ENV}=isolated are required`,
      );
    }

    await this.coreDataSource.query(`
      TRUNCATE TABLE
        mp.gold_detected_process,
        mp.v2_cohort,
        mp.sync_run_item,
        mp.sync_run_page,
        mp.source_watermark,
        mp.v2_history,
        mp.v2_relation_snapshot,
        mp.v2_child_evidence,
        mp.v2_observation,
        mp.sync_run,
        mp.compra_agil,
        mp.stg_api_v2_compra_agil,
        mp.raw_api_payload,
        mp.stg_job_run
      RESTART IDENTITY CASCADE
    `);

    const initial = await this.mercadoPublicoV2DurableSyncService.runFixture(
      mercadoPublicoV2E2EFixture.initial,
    );
    const changed = await this.mercadoPublicoV2DurableSyncService.runFixture(
      mercadoPublicoV2E2EFixture.changed,
    );

    const verificationRows = await this.coreDataSource.query<
      FixtureVerificationRow[]
    >(`
      SELECT
        COUNT(*)::text AS total,
        COUNT(*) FILTER (WHERE buyer_code = '60.000.000-0')::text AS "codedBuyer",
        COUNT(*) FILTER (WHERE buyer_code IS NULL)::text AS "uncodedBuyer"
      FROM mp.gold_detected_process
      WHERE process_type = 'compra_agil'
    `);
    const historyRows = await this.coreDataSource.query<{ count: string }[]>(`
      SELECT COUNT(*)::text AS count
      FROM mp.v2_history
      WHERE codigo = 'FIXTURE-CA-001'
    `);
    const utmHistoryRows = await this.coreDataSource.query<{ count: string }[]>(
      `
        SELECT COUNT(*)::text AS count
        FROM mp.v2_history
        WHERE codigo = 'FIXTURE-CA-UTM'
      `,
    );
    const utmAmountRows = await this.coreDataSource.query<
      {
        amount: string;
        amount_raw: string;
        currency_source: string;
      }[]
    >(`
      SELECT amount, amount_raw, currency_source
      FROM mp.gold_detected_process
      WHERE process_type = 'compra_agil' AND process_code = 'FIXTURE-CA-UTM'
    `);
    const verification = verificationRows[0];
    const utmAmount = utmAmountRows[0];

    if (
      initial.status !== 'succeeded' ||
      changed.status !== 'succeeded' ||
      verification?.total !== '4' ||
      verification.codedBuyer !== '3' ||
      verification.uncodedBuyer !== '1' ||
      historyRows[0]?.count !== '1' ||
      utmHistoryRows[0]?.count !== '1' ||
      utmAmount?.amount !== '7190000' ||
      utmAmount?.amount_raw !== '100' ||
      utmAmount?.currency_source !== 'UTM'
    ) {
      throw new Error('Mercado Publico V2 E2E fixture verification failed');
    }

    await this.coreDataSource.query(
      `
        INSERT INTO mp.sync_operator (
          workspace_id,
          user_workspace_id,
          assigned_by_user_workspace_id
        )
        VALUES ($1, $2, $2)
        ON CONFLICT (workspace_id, user_workspace_id) DO NOTHING
      `,
      [SEED_APPLE_WORKSPACE_ID, USER_WORKSPACE_DATA_SEED_IDS.TIM],
    );

    this.logger.log(
      'Mercado Publico V2 E2E fixture ready: FIXTURE-CA-001, FIXTURE-CA-UTM, 60.000.000-0',
    );
  }
}
