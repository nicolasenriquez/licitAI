import { type DataSource } from 'typeorm';

import fixture from 'src/engine/core-modules/mercado-publico/drivers/api/__tests__/fixtures/v2-compra-agil-list.json';
import { MercadoPublicoV2NamespaceResolver } from 'src/engine/core-modules/mercado-publico/graphql/mercado-publico-v2.resolver';
import { MercadoPublicoV2ReadService } from 'src/engine/core-modules/mercado-publico/graphql/mercado-publico-v2-read.service';
import { MpCanonicalCompraAgilFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1782340007880-mp-canonical-compra-agil';
import { MpGoldReadObjectsFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1782340007910-mp-gold-read-objects';
import { MpRawApiPayloadFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1782340007517-mp-raw-api-payload';
import { MpRawCsvFileFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1782340007600-mp-raw-csv-file';
import { MpRawCsvRowFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1782340007700-mp-raw-csv-row';
import { MpSchemaFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1782340007505-mp-schema';
import { MpStgApiV2CompraAgilFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1782340007830-mp-stg-api-v2-compra-agil';
import { MpStgJobRunFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1782340007800-mp-stg-job-run';
import { MpV2GoldenPathFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1784000000000-mp-v2-golden-path';
import { RelaxMpV2CanonicalStateAndDocumentCountFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1784000000010-relax-mp-v2-canonical-state-and-document-count';
import { MpV2DurableDiscoveryHydrationFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1785000000000-mp-v2-durable-discovery-hydration';
import { MpV2CohortFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1786000000000-mp-v2-cohort';
import { MpV2EvidenceHistoryReplayFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1787000000000-mp-v2-evidence-history-replay';
import { rawDataSource } from 'src/database/typeorm/raw/raw.datasource';
import { MercadoPublicoPersistenceService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-persistence.service';
import { MercadoPublicoV2GoldenPathService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-v2-golden-path.service';
import { MercadoPublicoV2DurableSyncService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-v2-durable-sync.service';
import { MercadoPublicoV2ProjectionService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-v2-projection.service';

const applyCommands = async (dataSource: DataSource): Promise<void> => {
  const queryRunner = dataSource.createQueryRunner();

  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    await queryRunner.query(`DROP SCHEMA IF EXISTS mp CASCADE`);
    await new MpSchemaFastInstanceCommand().up(queryRunner);
    await new MpRawApiPayloadFastInstanceCommand().up(queryRunner);
    await new MpRawCsvFileFastInstanceCommand().up(queryRunner);
    await new MpRawCsvRowFastInstanceCommand().up(queryRunner);
    await new MpStgJobRunFastInstanceCommand().up(queryRunner);
    await new MpStgApiV2CompraAgilFastInstanceCommand().up(queryRunner);
    await new MpCanonicalCompraAgilFastInstanceCommand().up(queryRunner);
    await new MpGoldReadObjectsFastInstanceCommand().up(queryRunner);
    await new MpV2GoldenPathFastInstanceCommand().up(queryRunner);
    await new RelaxMpV2CanonicalStateAndDocumentCountFastInstanceCommand().up(
      queryRunner,
    );
    await new MpV2DurableDiscoveryHydrationFastInstanceCommand().up(
      queryRunner,
    );
    await new MpV2CohortFastInstanceCommand().up(queryRunner);
    await new MpV2EvidenceHistoryReplayFastInstanceCommand().up(queryRunner);

    await queryRunner.commitTransaction();
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
  }
};

const truncateTables = async (dataSource: DataSource): Promise<void> => {
  await dataSource.query(`
    TRUNCATE TABLE
      mp.gold_detected_process,
      mp.v2_cohort,
      mp.sync_run_item,
      mp.sync_run_page,
      mp.source_watermark,
      mp.v2_history,
      mp.v2_child_evidence,
      mp.v2_observation,
      mp.sync_run,
      mp.compra_agil,
      mp.stg_api_v2_compra_agil,
      mp.raw_api_payload,
      mp.stg_job_run
    RESTART IDENTITY CASCADE
  `);
};

describe('Mercado Publico V2 golden path (db-backed)', () => {
  let dataSource: DataSource;
  let goldenPathService: MercadoPublicoV2GoldenPathService;
  let readService: MercadoPublicoV2ReadService;
  let resolver: MercadoPublicoV2NamespaceResolver;

  beforeAll(async () => {
    jest.useRealTimers();
    dataSource = rawDataSource;

    if (!dataSource.isInitialized) {
      await dataSource.initialize();
    }

    await applyCommands(dataSource);

    const persistenceService = new MercadoPublicoPersistenceService(dataSource);
    const durableSyncService = new MercadoPublicoV2DurableSyncService(
      {} as never,
      persistenceService,
      dataSource,
      new MercadoPublicoV2ProjectionService(dataSource),
    );

    goldenPathService = new MercadoPublicoV2GoldenPathService(
      durableSyncService,
    );
    readService = new MercadoPublicoV2ReadService(dataSource);
    resolver = new MercadoPublicoV2NamespaceResolver(readService);
  });

  beforeEach(async () => {
    await truncateTables(dataSource);
  });

  afterAll(async () => {
    await truncateTables(dataSource);

    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  });

  it('persists fixture evidence and exposes its published projection', async () => {
    const result = await goldenPathService.runFixture(fixture);

    const syncRuns = await dataSource.query<
      { id: string; status: string; records_projected: number }[]
    >(
      `
        SELECT id, status, records_projected
        FROM mp.sync_run
        WHERE id = $1
      `,
      [result.syncRunId],
    );
    const rawPayloads = await dataSource.query<{ id: string }[]>(
      `SELECT id FROM mp.raw_api_payload`,
    );
    const stagingRows = await dataSource.query<
      { codigo: string; document_count: number | null }[]
    >(`SELECT codigo, document_count FROM mp.stg_api_v2_compra_agil`);
    const canonicalRows = await dataSource.query<
      { codigo: string; estado: string; document_count: number | null }[]
    >(`SELECT codigo, estado, document_count FROM mp.compra_agil`);
    const observations = await dataSource.query<
      { id: string; codigo: string }[]
    >(`SELECT id, codigo FROM mp.v2_observation`);
    const goldRows = await dataSource.query<
      { process_code: string; observation_id: string | null }[]
    >(`SELECT process_code, observation_id FROM mp.gold_detected_process`);
    const jobRuns = await dataSource.query<
      { job_name: string; status: string }[]
    >(`SELECT job_name, status FROM mp.stg_job_run`);
    const page = await readService.listOpportunities({}, undefined, 50);
    const connection = await resolver.opportunities(undefined, undefined, 50);

    expect(syncRuns).toEqual([
      { id: result.syncRunId, status: 'succeeded', records_projected: 1 },
    ]);
    expect(rawPayloads).toHaveLength(1);
    expect(jobRuns).toEqual([
      { job_name: 'api-v2-compra-agil-incremental', status: 'success' },
    ]);
    expect(stagingRows).toEqual([
      { codigo: 'FIXTURE-CA-001', document_count: 1 },
    ]);
    expect(canonicalRows).toEqual([
      { codigo: 'FIXTURE-CA-001', estado: 'publicada', document_count: 1 },
    ]);
    expect(observations).toEqual([
      { id: result.observationIds[0], codigo: 'FIXTURE-CA-001' },
    ]);
    expect(goldRows).toEqual([
      {
        process_code: 'FIXTURE-CA-001',
        observation_id: result.observationIds[0],
      },
    ]);
    expect(page.rows).toHaveLength(1);
    expect(page.rows[0]?.codigo).toBe('FIXTURE-CA-001');
    expect(connection.edges[0]?.node.codigo).toBe('FIXTURE-CA-001');
  });

  it('uses active cohort membership instead of canonical state for Activas', async () => {
    await goldenPathService.runFixture(fixture);
    await dataSource.query(`
      UPDATE mp.gold_detected_process
      SET canonical_state = 'cerrada'
      WHERE process_type = 'compra_agil' AND process_code = 'FIXTURE-CA-001'
    `);

    const activePage = await readService.listOpportunities();

    await dataSource.query(`
      UPDATE mp.v2_cohort
      SET status = 'terminal'
      WHERE source = 'api-v2-compra-agil'
        AND scope = 'global'
        AND codigo = 'FIXTURE-CA-001'
    `);
    const terminalPage = await readService.listOpportunities();

    expect(activePage.rows).toHaveLength(1);
    expect(activePage.rows[0]?.canonical_state).toBe('cerrada');
    expect(terminalPage.rows).toEqual([]);
  });

  it('rolls back the relaxed V2 schema when data is compatible', async () => {
    await dataSource.query(`
      INSERT INTO mp.compra_agil (
        codigo, estado, document_count, created_at, updated_at
      )
      VALUES ('FIXTURE-CA-ROLLBACK', 'publicada', 1, now(), now())
    `);

    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await new RelaxMpV2CanonicalStateAndDocumentCountFastInstanceCommand().down(
        queryRunner,
      );
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }

    const constraints = await dataSource.query<
      { conname: string; definition: string }[]
    >(
      `
        SELECT conname, pg_get_constraintdef(oid) AS definition
        FROM pg_constraint
        WHERE conrelid = 'mp.compra_agil'::regclass
          AND conname = 'ck_mp_compra_agil_estado'
      `,
    );
    const documentCountColumns = await dataSource.query<
      { table_name: string; is_nullable: boolean; has_default: boolean }[]
    >(
      `
        SELECT
          c.relname AS table_name,
          NOT a.attnotnull AS is_nullable,
          a.atthasdef AS has_default
        FROM pg_attribute a
        JOIN pg_class c ON c.oid = a.attrelid
        WHERE c.relname IN (
          'stg_api_v2_compra_agil',
          'compra_agil',
          'gold_detected_process'
        )
          AND a.attname = 'document_count'
        ORDER BY c.relname
      `,
    );

    expect(constraints).toEqual([
      {
        conname: 'ck_mp_compra_agil_estado',
        definition: expect.stringContaining('estado IS NULL'),
      },
    ]);
    expect(constraints[0]?.definition).toContain(
      "estado = ANY (ARRAY['publicada'::text, 'cerrada'::text, 'desierta'::text, 'cancelada'::text, 'proveedor_seleccionado'::text, 'oc_emitida'::text])",
    );
    expect(documentCountColumns).toEqual([
      { table_name: 'compra_agil', is_nullable: false, has_default: true },
      {
        table_name: 'gold_detected_process',
        is_nullable: false,
        has_default: true,
      },
      {
        table_name: 'stg_api_v2_compra_agil',
        is_nullable: false,
        has_default: true,
      },
    ]);

    const queryRunnerToReapply = dataSource.createQueryRunner();
    await queryRunnerToReapply.connect();
    await queryRunnerToReapply.startTransaction();

    try {
      await new RelaxMpV2CanonicalStateAndDocumentCountFastInstanceCommand().up(
        queryRunnerToReapply,
      );
      await queryRunnerToReapply.commitTransaction();
    } catch (error) {
      await queryRunnerToReapply.rollbackTransaction();
      throw error;
    } finally {
      await queryRunnerToReapply.release();
    }
  });

  it('refuses to roll back the relaxed V2 schema with unknown states or unavailable document counts', async () => {
    await dataSource.query(`
      INSERT INTO mp.compra_agil (
        codigo, estado, document_count, created_at, updated_at
      )
      VALUES
        ('FIXTURE-CA-UNKNOWN-STATE', 'firme', 1, now(), now()),
        ('FIXTURE-CA-NULL-DOCS', 'publicada', NULL, now(), now())
    `);

    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await expect(
        new RelaxMpV2CanonicalStateAndDocumentCountFastInstanceCommand().down(
          queryRunner,
        ),
      ).rejects.toThrow(
        'Cannot restore Mercado Publico V2 constraints while unknown states or unavailable document counts exist',
      );
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
    }
  });
});
