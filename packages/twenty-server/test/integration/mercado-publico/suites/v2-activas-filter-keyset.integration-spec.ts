import { type DataSource } from 'typeorm';

import { MercadoPublicoV2ReadService } from 'src/engine/core-modules/mercado-publico/graphql/mercado-publico-v2-read.service';
import {
  MercadoPublicoV2NamespaceResolver,
  MercadoPublicoV2OpportunitySortEnum,
  type MercadoPublicoV2OpportunityFilterInput,
} from 'src/engine/core-modules/mercado-publico/graphql/mercado-publico-v2.resolver';
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
import { MpV2ActivasFiltersFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1789000000000-mp-v2-activas-filters';
import { rawDataSource } from 'src/database/typeorm/raw/raw.datasource';

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
    await new MpV2ActivasFiltersFastInstanceCommand().up(queryRunner);

    await queryRunner.commitTransaction();
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
  }
};

const seedActivasFixture = async (dataSource: DataSource): Promise<void> => {
  await dataSource.query(`
    INSERT INTO mp.sync_run (id, intent, source, status)
    VALUES ('00000000-0000-0000-0000-000000000001', 'fixture', 'api-v2-compra-agil', 'succeeded')
  `);

  await dataSource.query(`
    INSERT INTO mp.v2_cohort (
      source, scope, codigo, status, admitted_sync_run_id
    )
    VALUES
      ('api-v2-compra-agil', 'global', 'CA-ACT-001', 'active', '00000000-0000-0000-0000-000000000001'),
      ('api-v2-compra-agil', 'global', 'CA-ACT-002', 'active', '00000000-0000-0000-0000-000000000001'),
      ('api-v2-compra-agil', 'global', 'CA-ACT-003', 'active', '00000000-0000-0000-0000-000000000001'),
      ('api-v2-compra-agil', 'global', 'CA-ACT-004', 'active', '00000000-0000-0000-0000-000000000001'),
      ('api-v2-compra-agil', 'global', 'CA-ACT-005', 'active', '00000000-0000-0000-0000-000000000001'),
      ('api-v2-compra-agil', 'global', 'CA-ACT-006', 'active', '00000000-0000-0000-0000-000000000001'),
      ('api-v2-compra-agil', 'global', 'CA-ACT-007', 'active', '00000000-0000-0000-0000-000000000001'),
      ('api-v2-compra-agil', 'global', 'CA-ACT-008', 'active', '00000000-0000-0000-0000-000000000001'),
      ('api-v2-compra-agil', 'global', 'CA-ACT-009', 'active', '00000000-0000-0000-0000-000000000001'),
      ('api-v2-compra-agil', 'global', 'CA-ACT-010', 'active', '00000000-0000-0000-0000-000000000001'),
      ('api-v2-compra-agil', 'global', 'CA-ACT-011', 'active', '00000000-0000-0000-0000-000000000001'),
      ('api-v2-compra-agil', 'global', 'CA-ACT-012', 'active', '00000000-0000-0000-0000-000000000001'),
      ('api-v2-compra-agil', 'global', 'CA-TERM-001', 'terminal', '00000000-0000-0000-0000-000000000001'),
      ('api-v2-compra-agil', 'global', 'CA-TERM-002', 'terminal', '00000000-0000-0000-0000-000000000001')
  `);

  await dataSource.query(`
    INSERT INTO mp.gold_detected_process (
      process_type, process_code, title, canonical_state, buyer_code,
      buyer_name, region, published_at, closing_at, amount,
      currency_source, document_count, llamado
    )
    VALUES
      ('compra_agil', 'CA-ACT-001', 'Adquisición de insumos de oficina', 'publicada', '69000100-1', 'Municipio de Santiago', 13, '2026-07-01T10:00:00.000Z', '2026-07-30T10:00:00.000Z', 1000000, 'CLP', 3, 1),
      ('compra_agil', 'CA-ACT-002', 'Mantención de iluminación pública', 'cerrada', '69000100-1', 'Municipio de Santiago', 13, '2026-06-30T09:00:00.000Z', '2026-07-29T09:00:00.000Z', 500000, 'CLP', 1, 2),
      ('compra_agil', 'CA-ACT-003', 'Servicio de aseo de dependencias', 'desierta', '76000000-2', 'SERVIU Arica', 1, '2026-06-29T08:00:00.000Z', '2026-07-28T08:00:00.000Z', NULL, NULL, 0, 1),
      ('compra_agil', 'CA-ACT-004', 'Estudio de ingeniería portuaria', 'cancelada', '78000000-3', 'GORE Tarapacá', NULL, '2026-06-28T07:00:00.000Z', NULL, 2000000, 'UF', 5, NULL),
      ('compra_agil', 'CA-ACT-005', 'Suministro de equipamiento médico', 'proveedor_seleccionado', '69000000-4', 'Servicio de Salud Metropolitano', 13, '2026-06-25T12:00:00.000Z', '2026-07-25T12:00:00.000Z', 250000, 'CLP', 2, 1),
      ('compra_agil', 'CA-ACT-006', 'Reposición de señalética urbana', 'oc_emitida', '69000000-5', 'Municipalidad de Valparaíso', 5, '2026-06-20T11:00:00.000Z', '2026-07-20T11:00:00.000Z', 800000, 'USD', 1, 1),
      ('compra_agil', 'CA-ACT-007', 'Arriendo de sillas para actos cívicos', 'publicada', '69000100-1', 'Municipio de Santiago', 13, '2026-06-10T10:00:00.000Z', '2026-07-10T10:00:00.000Z', 150000, 'CLP', 0, 1),
      ('compra_agil', 'CA-ACT-008', 'Alimentación hospitalaria', 'nueva_etapa', '80000000-6', 'Hospital de Chillán', 8, '2026-06-05T10:00:00.000Z', '2026-07-05T10:00:00.000Z', NULL, NULL, 0, NULL),
      ('compra_agil', 'CA-ACT-009', 'Adquisición de computadores', 'publicada', '69000100-1', 'Municipio de Santiago', 13, '2026-06-01T10:00:00.000Z', '2026-06-30T12:00:00.000Z', 999000, 'CLP', 7, 2),
      ('compra_agil', 'CA-ACT-010', 'Construcción de veredas', 'cerrada', '71000000-7', 'GORE Antofagasta', 2, '2026-05-25T10:00:00.000Z', '2026-06-25T10:00:00.000Z', 1500000, 'CLP', 4, 1),
      ('compra_agil', 'CA-ACT-011', 'Consultoría jurídica externa', 'publicada', '85000000-8', 'Fiscalía Nacional', NULL, '2026-05-20T10:00:00.000Z', '2026-06-20T10:00:00.000Z', 50000, 'CLP', 1, 1),
      ('compra_agil', 'CA-ACT-012', 'Capacitación en liderazgo', 'desierta', '69000100-1', 'Municipio de Santiago', 13, '2026-05-15T10:00:00.000Z', NULL, 10000, 'UF', 0, 2),
      ('compra_agil', 'CA-TERM-001', 'Proceso terminal uno', 'cerrada', '69000100-1', 'Municipio de Santiago', 13, '2026-07-01T10:00:00.000Z', '2026-07-01T10:00:00.000Z', 100, 'CLP', 1, 1),
      ('compra_agil', 'CA-TERM-002', 'Proceso terminal dos', 'desierta', '69000100-1', 'Municipio de Santiago', 13, '2026-07-02T10:00:00.000Z', '2026-07-02T10:00:00.000Z', 200, 'CLP', 1, 1),
      ('compra_agil', 'CA-NOCOHORT-001', 'Fuera de la cohorte', 'publicada', '69000100-1', 'Municipio de Santiago', 13, '2026-07-03T10:00:00.000Z', '2026-07-03T10:00:00.000Z', 300, 'CLP', 1, 1)
  `);
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

const ACTIVE_CODES_IN_CLOSING_ORDER = [
  'CA-ACT-001',
  'CA-ACT-002',
  'CA-ACT-003',
  'CA-ACT-005',
  'CA-ACT-006',
  'CA-ACT-007',
  'CA-ACT-008',
  'CA-ACT-009',
  'CA-ACT-010',
  'CA-ACT-011',
  'CA-ACT-004',
  'CA-ACT-012',
];

describe('Mercado Publico V2 Activas filters and keyset (db-backed)', () => {
  let dataSource: DataSource;
  let readService: MercadoPublicoV2ReadService;
  let resolver: MercadoPublicoV2NamespaceResolver;

  beforeAll(async () => {
    jest.useRealTimers();
    dataSource = rawDataSource;

    if (!dataSource.isInitialized) {
      await dataSource.initialize();
    }

    await applyCommands(dataSource);

    readService = new MercadoPublicoV2ReadService(dataSource);
    resolver = new MercadoPublicoV2NamespaceResolver(readService);
  });

  beforeEach(async () => {
    await truncateTables(dataSource);
    await seedActivasFixture(dataSource);
  });

  afterAll(async () => {
    await truncateTables(dataSource);

    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  });

  it('lists only active cohort rows ordered by closing date then codigo', async () => {
    const page = await readService.listOpportunities({}, undefined, 100);

    expect(page.rows.map((row) => row.codigo)).toEqual(
      ACTIVE_CODES_IN_CLOSING_ORDER,
    );
    expect(page.totalCount).toBe(12);
    expect(page.hasNextPage).toBe(false);
    expect(page.rows[0]?.closing_at?.toISOString()).toBe(
      '2026-07-30T10:00:00.000Z',
    );
    expect(page.rows[10]?.closing_at).toBeNull();
  });

  it('keeps keyset pagination stable across pages without duplicates or gaps', async () => {
    const collected: string[] = [];
    const pages: string[][] = [];

    let after: string | undefined;

    do {
      const page = await readService.listOpportunities({}, after, 3);

      pages.push(page.rows.map((row) => row.codigo));
      collected.push(...page.rows.map((row) => row.codigo));
      after = page.hasNextPage ? (page.endCursor ?? undefined) : undefined;
    } while (after !== undefined);

    expect(pages[0]).toHaveLength(3);
    expect(pages).toHaveLength(4);
    expect(pages.every((codes) => codes.length === 3)).toBe(true);
    expect(collected).toEqual(ACTIVE_CODES_IN_CLOSING_ORDER);
    expect(new Set(collected).size).toBe(12);
  });

  it('filters by state, region, buyer, dates, documents, llamado, amount and currency', async () => {
    const byState = await readService.listOpportunities({
      states: ['publicada'],
    });
    const byRegion = await readService.listOpportunities({ region: 13 });
    const byBuyer = await readService.listOpportunities({
      buyer: 'santiago',
    });
    const byClosingRange = await readService.listOpportunities({
      closingAtFrom: new Date('2026-07-01T00:00:00.000Z'),
      closingAtTo: new Date('2026-07-31T23:59:59.000Z'),
    });
    const byMinDocuments = await readService.listOpportunities({
      documentCountMin: 3,
    });
    const byLlamado = await readService.listOpportunities({ llamado: 2 });
    const byMinAmount = await readService.listOpportunities({
      amountMin: '500000',
    });
    const byMaxAmount = await readService.listOpportunities({
      amountMax: '300000',
    });
    const byCurrency = await readService.listOpportunities({
      currencies: ['UF'],
    });
    const byTerminalCohort = await readService.listOpportunities({
      cohortStatus: 'terminal',
    });
    const byCombination = await readService.listOpportunities({
      region: 13,
      states: ['publicada'],
    });

    expect(byState.rows.map((row) => row.codigo).sort()).toEqual([
      'CA-ACT-001',
      'CA-ACT-007',
      'CA-ACT-009',
      'CA-ACT-011',
    ]);
    expect(byRegion.rows.map((row) => row.codigo).sort()).toEqual([
      'CA-ACT-001',
      'CA-ACT-002',
      'CA-ACT-005',
      'CA-ACT-007',
      'CA-ACT-009',
      'CA-ACT-012',
    ]);
    expect(byBuyer.rows.map((row) => row.codigo).sort()).toEqual([
      'CA-ACT-001',
      'CA-ACT-002',
      'CA-ACT-007',
      'CA-ACT-009',
      'CA-ACT-012',
    ]);
    expect(byClosingRange.rows.map((row) => row.codigo).sort()).toEqual([
      'CA-ACT-001',
      'CA-ACT-002',
      'CA-ACT-003',
      'CA-ACT-005',
      'CA-ACT-006',
      'CA-ACT-007',
      'CA-ACT-008',
    ]);
    expect(byMinDocuments.rows.map((row) => row.codigo).sort()).toEqual([
      'CA-ACT-001',
      'CA-ACT-004',
      'CA-ACT-009',
      'CA-ACT-010',
    ]);
    expect(byLlamado.rows.map((row) => row.codigo).sort()).toEqual([
      'CA-ACT-002',
      'CA-ACT-009',
      'CA-ACT-012',
    ]);
    expect(byMinAmount.rows.map((row) => row.codigo).sort()).toEqual([
      'CA-ACT-001',
      'CA-ACT-002',
      'CA-ACT-004',
      'CA-ACT-006',
      'CA-ACT-009',
      'CA-ACT-010',
    ]);
    expect(byMaxAmount.rows.map((row) => row.codigo).sort()).toEqual([
      'CA-ACT-005',
      'CA-ACT-007',
      'CA-ACT-011',
      'CA-ACT-012',
    ]);
    expect(byCurrency.rows.map((row) => row.codigo).sort()).toEqual([
      'CA-ACT-004',
      'CA-ACT-012',
    ]);
    expect(byTerminalCohort.rows.map((row) => row.codigo).sort()).toEqual([
      'CA-TERM-001',
      'CA-TERM-002',
    ]);
    expect(byCombination.rows.map((row) => row.codigo).sort()).toEqual([
      'CA-ACT-001',
      'CA-ACT-007',
      'CA-ACT-009',
    ]);
  });

  it('keeps analytics population aligned with filtered totalCount across pages and sorts', async () => {
    const filter = { region: 13, states: ['publicada'] };
    const analytics = await readService.getAnalytics(filter);
    const closingPage = await readService.listOpportunities(
      filter,
      undefined,
      1,
      'closing_at_desc',
    );
    const amountPage = await readService.listOpportunities(
      filter,
      undefined,
      1,
      'amount_asc',
    );

    expect(analytics.population).toBe(3);
    expect(analytics.population).toBe(closingPage.totalCount);
    expect(analytics.population).toBe(amountPage.totalCount);
    expect(analytics.stateBuckets).toEqual([{ key: 'publicada', count: 3 }]);
    expect(analytics.regionBuckets).toEqual([{ key: '13', count: 3 }]);
    expect(analytics.completeness).toBe('complete');
    expect(analytics.availability).toBe('available');
  });

  it('returns an empty page with zero rows as a normal result', async () => {
    const page = await readService.listOpportunities({ buyer: 'noexiste' });

    expect(page.rows).toEqual([]);
    expect(page.totalCount).toBe(0);
    expect(page.hasNextPage).toBe(false);
    expect(page.startCursor).toBeNull();
    expect(page.endCursor).toBeNull();
  });

  it('supports every sort with NULLS LAST and codigo tiebreak', async () => {
    const closingAsc = await readService.listOpportunities(
      {},
      undefined,
      100,
      'closing_at_asc',
    );
    const publishedDesc = await readService.listOpportunities(
      {},
      undefined,
      100,
      'published_at_desc',
    );
    const amountDesc = await readService.listOpportunities(
      {},
      undefined,
      100,
      'amount_desc',
    );
    const amountAsc = await readService.listOpportunities(
      {},
      undefined,
      100,
      'amount_asc',
    );

    expect(closingAsc.rows.map((row) => row.codigo).slice(0, 3)).toEqual([
      'CA-ACT-011',
      'CA-ACT-010',
      'CA-ACT-009',
    ]);
    expect(closingAsc.rows.slice(-2).map((row) => row.codigo)).toEqual([
      'CA-ACT-004',
      'CA-ACT-012',
    ]);
    expect(publishedDesc.rows[0]?.codigo).toBe('CA-ACT-001');
    expect(amountDesc.rows[0]?.codigo).toBe('CA-ACT-004');
    expect(amountDesc.rows.slice(-3).map((row) => row.codigo)).toEqual([
      'CA-ACT-012',
      'CA-ACT-003',
      'CA-ACT-008',
    ]);
    expect(amountAsc.rows[0]?.codigo).toBe('CA-ACT-012');
  });

  it('paginates by keyset within a non-default sort without duplicates', async () => {
    const pageOne = await readService.listOpportunities(
      {},
      undefined,
      5,
      'amount_desc',
    );
    const pageTwo = await readService.listOpportunities(
      {},
      pageOne.endCursor ?? undefined,
      5,
      'amount_desc',
    );
    const pageThree = await readService.listOpportunities(
      {},
      pageTwo.endCursor ?? undefined,
      5,
      'amount_desc',
    );

    expect(pageOne.rows.map((row) => row.codigo)).toEqual([
      'CA-ACT-004',
      'CA-ACT-010',
      'CA-ACT-001',
      'CA-ACT-009',
      'CA-ACT-006',
    ]);
    expect(pageTwo.rows.map((row) => row.codigo)).toEqual([
      'CA-ACT-002',
      'CA-ACT-005',
      'CA-ACT-007',
      'CA-ACT-011',
      'CA-ACT-012',
    ]);
    expect(pageThree.rows.map((row) => row.codigo)).toEqual([
      'CA-ACT-003',
      'CA-ACT-008',
    ]);
    expect(pageThree.hasNextPage).toBe(false);
  });

  it('rejects invalid ranges and cursors with BadRequest', async () => {
    await expect(
      readService.listOpportunities({
        closingAtFrom: new Date('2026-08-01T00:00:00.000Z'),
        closingAtTo: new Date('2026-07-01T00:00:00.000Z'),
      }),
    ).rejects.toThrow('closingAtFrom must not be after closingAtTo');
    await expect(
      readService.listOpportunities({
        documentCountMin: 4,
        documentCountMax: 2,
      }),
    ).rejects.toThrow('documentCountMin must not exceed documentCountMax');
    await expect(
      readService.listOpportunities({ amountMin: '9000', amountMax: '1000' }),
    ).rejects.toThrow('amountMin must not exceed amountMax');
    await expect(
      readService.listOpportunities({ amountMin: 'abc' }),
    ).rejects.toThrow('amountMin must be a decimal string');
    await expect(
      readService.listOpportunities({}, 'not-a-cursor'),
    ).rejects.toThrow('cursor is invalid');

    const closingCursor = (
      await readService.listOpportunities({}, undefined, 1, 'closing_at_asc')
    ).endCursor;

    await expect(
      readService.listOpportunities({}, closingCursor ?? undefined, 1),
    ).rejects.toThrow('cursor is invalid');
  });

  it('exposes filters, sort and llamado through the GraphQL resolver', async () => {
    const connection = await resolver.opportunities(
      { region: 13, llamado: 2 } as MercadoPublicoV2OpportunityFilterInput,
      null,
      100,
      MercadoPublicoV2OpportunitySortEnum.CLOSING_AT_DESC,
    );

    expect(connection.totalCount).toBe(3);
    expect(connection.edges.map((edge) => edge.node.codigo).sort()).toEqual([
      'CA-ACT-002',
      'CA-ACT-009',
      'CA-ACT-012',
    ]);
    expect(connection.edges[0]?.node.llamado).toBe(2);
    expect(connection.pageInfo.hasPreviousPage).toBe(false);

    const analytics = await resolver.analytics({
      region: 13,
      llamado: 2,
    } as MercadoPublicoV2OpportunityFilterInput);

    expect(analytics.population).toBe(connection.totalCount);
    expect(analytics.availability).toBe('available');
  });
});
