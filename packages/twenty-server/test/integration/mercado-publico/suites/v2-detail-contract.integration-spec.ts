import { type DataSource } from 'typeorm';

import {
  type MercadoPublicoV2ProjectionContext,
  MercadoPublicoV2ProjectionService,
} from 'src/engine/core-modules/mercado-publico/services/mercado-publico-v2-projection.service';
import { MpV2ActivasFiltersFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1789000000000-mp-v2-activas-filters';
import { MpCanonicalCompraAgilFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1782340007880-mp-canonical-compra-agil';
import { MpGoldReadObjectsFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1782340007910-mp-gold-read-objects';
import { MpRawApiPayloadFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1782340007517-mp-raw-api-payload';
import { MpRawCsvFileFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1782340007600-mp-raw-csv-file';
import { MpRawCsvRowFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1782340007700-mp-raw-csv-row';
import { MpSchemaFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1782340007505-mp-schema';
import { MpStgApiV2CompraAgilFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1782340007830-mp-stg-api-v2-compra-agil';
import { MpStgJobRunFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1782340007800-mp-stg-job-run';
import { MpV2CohortFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1786000000000-mp-v2-cohort';
import { MpV2DetailContractFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1790000000000-mp-v2-detail-contract';
import { MpV2DurableDiscoveryHydrationFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1785000000000-mp-v2-durable-discovery-hydration';
import { MpV2EvidenceHistoryReplayFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1787000000000-mp-v2-evidence-history-replay';
import { MpV2GoldenPathFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1784000000000-mp-v2-golden-path';
import { RelaxMpV2CanonicalStateAndDocumentCountFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1784000000010-relax-mp-v2-canonical-state-and-document-count';
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
    await new MpV2DetailContractFastInstanceCommand().up(queryRunner);

    await queryRunner.commitTransaction();
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
  }
};

const SYNC_RUN_ID = '00000000-0000-0000-0000-000000000001';
const RAW_PAYLOAD_ID = '00000000-0000-0000-0000-00000000000d';

const buildDetailFixture = (): Record<string, unknown> => ({
  codigo: 'CA-DETAIL-001',
  nombre: 'Servicio de aseo integral',
  descripcion: 'Servicio de aseo integral',
  estado: {
    codigo: 'cancelada',
    id_estado: 'st-7',
    glosa: 'Cancelada',
  },
  institucion: {
    rut: '69000100-1',
    organismo_comprador: 'Municipio de Santiago',
    region: 13,
  },
  fechas: {
    fecha_publicacion: '2026-07-01T10:00:00.000Z',
    fecha_cierre: '2026-07-30T10:00:00.000Z',
    fecha_cancelacion: '2026-07-05T10:00:00.000Z',
    fecha_ultimo_cambio: '2026-07-06T10:00:00.000Z',
  },
  presupuesto: {
    moneda: 'CLP',
    tipo_presupuesto: 'estimado',
    presupuesto_estimado: '150000',
    monto_disponible: '1000000',
  },
  entrega: {
    direccion_entrega: 'Av. Central 123',
    plazo_entrega_dias: 15,
  },
  convocatoria: {
    descripcion: 'Primer llamado',
    fecha_cierre_primer_llamado: '2026-07-29T10:00:00.000Z',
    fecha_cierre_segundo_llamado: null,
  },
  motivos: {
    motivo_cancelacion: 'Presupuesto insuficiente',
    motivo_desierta: null,
    motivo_seleccion: null,
  },
  resumen: {
    total_ofertas_recibidas: 3,
    total_demandas: 0,
    multa_sancion: '0',
  },
  documentos: [{ id: 77, nombre: 'Bases' }],
  productos_solicitados: [{ codigo_producto: 101, nombre: 'Insumo' }],
  proveedores_cotizando: [
    {
      id_cotizacion: 501,
      razon_social: 'Proveedor A',
      productos_cotizados: [{ codigo_producto: 101 }],
    },
  ],
});

const buildContext = (
  record: Record<string, unknown>,
): MercadoPublicoV2ProjectionContext => ({
  syncRunId: SYNC_RUN_ID,
  rawApiPayloadId: RAW_PAYLOAD_ID,
  snapshotKind: 'detail',
  response: {
    endpoint: 'detail',
    source: 'api-v2-compra-agil',
    requestParams: {},
    requestFingerprint: 'request-fingerprint',
    payloadChecksum: 'payload-checksum',
    schemaFingerprint: 'schema-fingerprint',
    httpStatus: 200,
    fetchedAt: new Date('2026-08-10T12:00:00.000Z'),
    rawPayload: {},
    compraAgil: [],
  },
  record: record as never,
});

const seedBase = async (dataSource: DataSource): Promise<void> => {
  await dataSource.query(
    `
      INSERT INTO mp.sync_run (id, intent, source, status)
      VALUES ($1, 'fixture', 'api-v2-compra-agil', 'succeeded')
    `,
    [SYNC_RUN_ID],
  );

  await dataSource.query(
    `
      INSERT INTO mp.raw_api_payload (
        id, source, endpoint, request_fingerprint, payload_checksum,
        request_params, http_status, fetched_at, raw_payload,
        schema_fingerprint
      )
      VALUES (
        $1, 'api-v2-compra-agil', 'detail', 'request-fingerprint',
        'payload-checksum', '{}'::jsonb, 200, now(),
        '{"compraAgil":[{"codigo":"CA-DETAIL-001"}]}'::jsonb,
        'schema-fingerprint'
      )
    `,
    [RAW_PAYLOAD_ID],
  );
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
};

const tableExists = async (
  dataSource: DataSource,
  tableName: string,
): Promise<boolean> => {
  const rows = await dataSource.query(
    `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'mp' AND table_name = $1
    `,
    [tableName],
  );

  return rows.length > 0;
};

const columnExists = async (
  dataSource: DataSource,
  tableName: string,
  columnName: string,
): Promise<boolean> => {
  const rows = await dataSource.query(
    `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'mp'
        AND table_name = $1
        AND column_name = $2
    `,
    [tableName, columnName],
  );

  return rows.length > 0;
};

describe('Mercado Publico V2 detail contract (db-backed)', () => {
  let dataSource: DataSource;
  let projection: MercadoPublicoV2ProjectionService;

  beforeAll(async () => {
    jest.useRealTimers();
    dataSource = rawDataSource;

    if (!dataSource.isInitialized) {
      await dataSource.initialize();
    }

    await applyCommands(dataSource);

    projection = new MercadoPublicoV2ProjectionService(dataSource);
  });

  beforeEach(async () => {
    await truncateTables(dataSource);
    await seedBase(dataSource);
  });

  afterAll(async () => {
    await truncateTables(dataSource);

    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  });

  it('creates the relation snapshot table and detail columns', async () => {
    expect(await tableExists(dataSource, 'v2_relation_snapshot')).toBe(true);
    expect(
      await columnExists(dataSource, 'v2_child_evidence', 'parent_provider_key'),
    ).toBe(true);
    expect(
      await columnExists(dataSource, 'v2_cohort', 'lifecycle_reason'),
    ).toBe(true);
    expect(
      await columnExists(dataSource, 'gold_detected_process', 'description'),
    ).toBe(true);
    expect(
      await columnExists(dataSource, 'gold_detected_process', 'delivery_days'),
    ).toBe(true);
    expect(
      await columnExists(dataSource, 'gold_detected_process', 'cancel_motive'),
    ).toBe(true);
    expect(
      await columnExists(dataSource, 'gold_detected_process', 'fine_penalty'),
    ).toBe(true);
  });

  it('projects child evidence with parent provider keys', async () => {
    const result = await projection.ingest(buildContext(buildDetailFixture()));

    expect(result).toMatchObject({
      created: true,
      applied: true,
      semanticChanged: false,
      skipped: false,
    });

    const children = await dataSource.query(
      `
        SELECT array_name, provider_key, parent_provider_key
        FROM mp.v2_child_evidence
        ORDER BY array_name, ordinal
      `,
    );

    expect(children).toEqual([
      { array_name: 'documentos', provider_key: '77', parent_provider_key: null },
      {
        array_name: 'productos_solicitados',
        provider_key: '101',
        parent_provider_key: null,
      },
      {
        array_name: 'proveedores_cotizando',
        provider_key: '501',
        parent_provider_key: null,
      },
      {
        array_name: 'productos_cotizados',
        provider_key: '501:101',
        parent_provider_key: '501',
      },
    ]);
  });

  it('records relation availability snapshots', async () => {
    await projection.ingest(buildContext(buildDetailFixture()));

    const snapshots = await dataSource.query(
      `
        SELECT relation, availability, total_count, source_kind
        FROM mp.v2_relation_snapshot
        ORDER BY relation
      `,
    );

    expect(snapshots).toEqual([
      {
        relation: 'documentos',
        availability: 'available',
        total_count: 1,
        source_kind: 'detail',
      },
      {
        relation: 'productos_solicitados',
        availability: 'available',
        total_count: 1,
        source_kind: 'detail',
      },
      {
        relation: 'productos_cotizados',
        availability: 'available',
        total_count: 1,
        source_kind: 'detail',
      },
      {
        relation: 'proveedores_cotizando',
        availability: 'available',
        total_count: 1,
        source_kind: 'detail',
      },
    ]);
  });

  it('persists detail fields on the gold row', async () => {
    await projection.ingest(buildContext(buildDetailFixture()));

    const rows = await dataSource.query(
      `
        SELECT
          description, delivery_address, delivery_days, cancellation_at,
          call_description, call_first_closing_at, call_second_closing_at,
          budget_type, budget_estimate, budget_currency, cancel_motive,
          deserted_motive, selection_motive, total_offers, total_demands,
          fine_penalty
        FROM mp.gold_detected_process
        WHERE process_code = 'CA-DETAIL-001'
      `,
    );

    expect(rows).toHaveLength(1);
    expect(rows[0]).toEqual({
      description: 'Servicio de aseo integral',
      delivery_address: 'Av. Central 123',
      delivery_days: 15,
      cancellation_at: new Date('2026-07-05T10:00:00.000Z'),
      call_description: 'Primer llamado',
      call_first_closing_at: new Date('2026-07-29T10:00:00.000Z'),
      call_second_closing_at: null,
      budget_type: 'estimado',
      budget_estimate: '150000',
      budget_currency: 'CLP',
      cancel_motive: 'Presupuesto insuficiente',
      deserted_motive: null,
      selection_motive: null,
      total_offers: 3,
      total_demands: 0,
      fine_penalty: '0',
    });
  });

  it('skips a replay of the same observation without duplicating rows', async () => {
    const first = await projection.ingest(buildContext(buildDetailFixture()));
    const second = await projection.ingest(buildContext(buildDetailFixture()));

    expect(first.applied).toBe(true);
    expect(second.skipped).toBe(true);

    const observationCount = await dataSource.query(
      `
        SELECT count(*)::int AS count
        FROM mp.v2_observation
      `,
    );
    const childCount = await dataSource.query(
      `
        SELECT count(*)::int AS count
        FROM mp.v2_child_evidence
      `,
    );
    const snapshotCount = await dataSource.query(
      `
        SELECT count(*)::int AS count
        FROM mp.v2_relation_snapshot
      `,
    );
    const compraAgilCount = await dataSource.query(
      `
        SELECT count(*)::int AS count
        FROM mp.compra_agil
      `,
    );

    expect(observationCount[0].count).toBe(2);
    expect(childCount[0].count).toBe(4);
    expect(snapshotCount[0].count).toBe(4);
    expect(compraAgilCount[0].count).toBe(1);
  });

  it('reverses the contract on down', async () => {
    const queryRunner = dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await new MpV2DetailContractFastInstanceCommand().down(queryRunner);
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }

    expect(await tableExists(dataSource, 'v2_relation_snapshot')).toBe(false);
    expect(
      await columnExists(dataSource, 'v2_child_evidence', 'parent_provider_key'),
    ).toBe(false);
    expect(
      await columnExists(dataSource, 'v2_cohort', 'lifecycle_reason'),
    ).toBe(false);
    expect(
      await columnExists(dataSource, 'gold_detected_process', 'fine_penalty'),
    ).toBe(false);

    const restoreQueryRunner = dataSource.createQueryRunner();

    await restoreQueryRunner.connect();
    await restoreQueryRunner.startTransaction();

    try {
      await new MpV2DetailContractFastInstanceCommand().up(restoreQueryRunner);
      await restoreQueryRunner.commitTransaction();
    } catch (error) {
      await restoreQueryRunner.rollbackTransaction();
      throw error;
    } finally {
      await restoreQueryRunner.release();
    }

    expect(await tableExists(dataSource, 'v2_relation_snapshot')).toBe(true);
  });
});
