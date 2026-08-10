import { type DataSource } from 'typeorm';

import { MpSchemaFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1782340007505-mp-schema';
import { MpRawApiPayloadFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1782340007517-mp-raw-api-payload';
import { MpRawCsvFileFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1782340007600-mp-raw-csv-file';
import { MpRawCsvRowFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1782340007700-mp-raw-csv-row';
import { MpStgJobRunFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1782340007800-mp-stg-job-run';
import { MpStgApiV1LicitacionFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1782340007810-mp-stg-api-v1-licitacion';
import { MpCanonicalLicitacionFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1782340007860-mp-canonical-licitacion';
import { MpRawCsvFileDedupeModalityFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1782340007920-mp-raw-csv-file-dedupe-modality';
import { DropRawCsvFileIngestionJobIdFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1783191615514-drop-raw-csv-file-ingestion-job-id';
import { MpStgJobRunRawCsvFileLinkSlowInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-slow-1782340007930-mp-stg-job-run-raw-csv-file-link';
import { rawDataSource } from 'src/database/typeorm/raw/raw.datasource';
import {
  MERCADO_PUBLICO_API_V1_LICITACIONES_BY_DATE_ENDPOINT,
  MERCADO_PUBLICO_API_V1_LICITACIONES_DETAIL_BY_CODIGO_ENDPOINT,
  MERCADO_PUBLICO_API_V1_LICITACIONES_SOURCE,
} from 'src/engine/core-modules/mercado-publico/mercado-publico.constants';
import { type MercadoPublicoApiV1LicitacionesByDateResponse } from 'src/engine/core-modules/mercado-publico/drivers/api/mercado-publico-api-v1-licitaciones-client.service';
import { MercadoPublicoCanonicalRefreshService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-canonical-refresh.service';
import { MercadoPublicoPersistenceService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-persistence.service';

const truncateMercadoPublicoTables = async (dataSource: DataSource) => {
  await dataSource.query(`
    TRUNCATE TABLE
      mp.stg_api_v1_licitacion,
      mp.licitacion,
      mp.raw_api_payload,
      mp.raw_csv_row,
      mp.raw_csv_file,
      mp.stg_job_run
    RESTART IDENTITY CASCADE
  `);
};

const applyMercadoPublicoApiCommands = async (dataSource: DataSource) => {
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
    await new MpStgApiV1LicitacionFastInstanceCommand().up(queryRunner);
    await new MpCanonicalLicitacionFastInstanceCommand().up(queryRunner);
    await new MpRawCsvFileDedupeModalityFastInstanceCommand().up(queryRunner);
    await new MpStgJobRunRawCsvFileLinkSlowInstanceCommand().up(queryRunner);
    await new DropRawCsvFileIngestionJobIdFastInstanceCommand().up(queryRunner);

    await queryRunner.commitTransaction();
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
  }
};

describe('Mercado Publico V1 licitaciones list-to-detail canonical refresh (db-backed)', () => {
  let dataSource: DataSource;
  let persistenceService: MercadoPublicoPersistenceService;
  let canonicalRefreshService: MercadoPublicoCanonicalRefreshService;

  beforeAll(async () => {
    jest.useRealTimers();

    dataSource = rawDataSource;

    if (!dataSource.isInitialized) {
      await dataSource.initialize();
    }

    await applyMercadoPublicoApiCommands(dataSource);

    persistenceService = new MercadoPublicoPersistenceService(dataSource);
    canonicalRefreshService = new MercadoPublicoCanonicalRefreshService(
      dataSource,
    );
  });

  beforeEach(async () => {
    await truncateMercadoPublicoTables(dataSource);
  });

  afterAll(async () => {
    await truncateMercadoPublicoTables(dataSource);

    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  });

  it('ingests V1 licitaciones list snapshots from raw to staging to canonical', async () => {
    const listJobRun = await persistenceService.createJobRun(
      'api-v1-licitaciones-by-date',
    );
    const fetchedAt = new Date('2026-06-15T12:00:00.000Z');
    const listResponse: MercadoPublicoApiV1LicitacionesByDateResponse = {
      endpoint: MERCADO_PUBLICO_API_V1_LICITACIONES_BY_DATE_ENDPOINT,
      source: MERCADO_PUBLICO_API_V1_LICITACIONES_SOURCE,
      requestParams: { fecha: '15062026' },
      requestFingerprint: 'req-list-2026-06-15',
      payloadChecksum: 'payload-list-2026-06-15',
      schemaFingerprint: 'schema-list-v1-licitaciones',
      httpStatus: 200,
      fetchedAt,
      rawPayload: {
        Listado: [
          {
            CodigoExterno: 'L1',
            Codigo: '1001',
            CodigoEstado: '5',
            Estado: 'Publicada',
            CodigoTipo: 'LP',
            Nombre: 'Licitacion Uno',
            FechaPublicacion: '2026-06-10',
            FechaCierre: '2026-06-20',
            CodigoOrganismo: 'BUY-1',
            NombreOrganismo: 'Municipalidad Uno',
          },
          {
            CodigoExterno: 'L2',
            Codigo: '1002',
            CodigoEstado: '6',
            Estado: 'Cerrada',
            CodigoTipo: 'LE',
            Nombre: 'Licitacion Dos',
            FechaPublicacion: '2026-06-11',
            FechaCierre: '2026-06-21',
            CodigoOrganismo: 'BUY-2',
            NombreOrganismo: 'Municipalidad Dos',
          },
        ],
      },
      licitaciones: [
        {
          CodigoExterno: 'L1',
          Codigo: '1001',
          CodigoEstado: '5',
          Estado: 'Publicada',
          CodigoTipo: 'LP',
          Nombre: 'Licitacion Uno',
          FechaPublicacion: '2026-06-10',
          FechaCierre: '2026-06-20',
          CodigoOrganismo: 'BUY-1',
          NombreOrganismo: 'Municipalidad Uno',
        },
        {
          CodigoExterno: 'L2',
          Codigo: '1002',
          CodigoEstado: '6',
          Estado: 'Cerrada',
          CodigoTipo: 'LE',
          Nombre: 'Licitacion Dos',
          FechaPublicacion: '2026-06-11',
          FechaCierre: '2026-06-21',
          CodigoOrganismo: 'BUY-2',
          NombreOrganismo: 'Municipalidad Dos',
        },
      ],
    };

    const persistedList = await persistenceService.persistV1LicitacionesSnapshot({
      jobRunRecordId: listJobRun.id,
      apiResponse: listResponse,
      snapshotKind: 'list',
    });
    const canonicalizedCount =
      await canonicalRefreshService.refreshV1LicitacionesFromApiSnapshot(
        persistedList.rawApiPayloadId,
      );

    await persistenceService.finalizeJobRun({
      jobRunRecordId: listJobRun.id,
      status: 'success',
      finishedAt: new Date('2026-06-15T12:01:00.000Z'),
      recordsFetched: persistedList.recordsFetched,
      recordsStaged: persistedList.recordsStaged,
      recordsCanonicalized: canonicalizedCount,
      recordsFailed: 0,
    });

    const rawPayloadRows = await dataSource.query<
      Array<{
        endpoint: string;
        request_params: { fecha: string };
        raw_payload: { Listado: Array<{ CodigoExterno: string }> };
      }>
    >(
      `
        SELECT endpoint, request_params, raw_payload
        FROM mp.raw_api_payload
        WHERE source = $1
        ORDER BY created_at ASC
      `,
      [MERCADO_PUBLICO_API_V1_LICITACIONES_SOURCE],
    );
    const stagingRows = await dataSource.query<
      Array<{ codigo_externo: string; snapshot_kind: string }>
    >(
      `
        SELECT codigo_externo, snapshot_kind
        FROM mp.stg_api_v1_licitacion
        ORDER BY codigo_externo ASC
      `,
    );
    const canonicalRows = await dataSource.query<
      Array<{
        codigo_externo: string;
        title: string;
        canonical_state: string;
        raw_state_code: string;
        raw_state_label: string;
        canonical_type: string;
      }>
    >(
      `
        SELECT
          codigo_externo,
          title,
          canonical_state,
          raw_state_code,
          raw_state_label,
          canonical_type
        FROM mp.licitacion
        ORDER BY codigo_externo ASC
      `,
    );
    const [jobRunRow] = await dataSource.query<
      Array<{
        status: string;
        records_fetched: number;
        records_staged: number;
        records_canonicalized: number;
      }>
    >(
      `
        SELECT
          status,
          records_fetched,
          records_staged,
          records_canonicalized
        FROM mp.stg_job_run
        WHERE id = $1
      `,
      [listJobRun.id],
    );

    expect(persistedList.recordsFetched).toBe(2);
    expect(canonicalizedCount).toBe(2);
    expect(rawPayloadRows).toHaveLength(1);
    expect(rawPayloadRows[0]?.endpoint).toBe(
      MERCADO_PUBLICO_API_V1_LICITACIONES_BY_DATE_ENDPOINT,
    );
    expect(rawPayloadRows[0]?.request_params).toMatchObject({
      fecha: '15062026',
    });
    expect(rawPayloadRows[0]?.raw_payload.Listado).toHaveLength(2);
    expect(stagingRows).toEqual([
      { codigo_externo: 'L1', snapshot_kind: 'list' },
      { codigo_externo: 'L2', snapshot_kind: 'list' },
    ]);
    expect(canonicalRows).toEqual([
      {
        codigo_externo: 'L1',
        title: 'Licitacion Uno',
        canonical_state: 'publicada',
        raw_state_code: '5',
        raw_state_label: 'Publicada',
        canonical_type: 'licitacion_publica',
      },
      {
        codigo_externo: 'L2',
        title: 'Licitacion Dos',
        canonical_state: 'cerrada',
        raw_state_code: '6',
        raw_state_label: 'Cerrada',
        canonical_type: 'licitacion_especial',
      },
    ]);
    expect(jobRunRow).toEqual({
      status: 'success',
      records_fetched: 2,
      records_staged: 2,
      records_canonicalized: 2,
    });
  });

  it('rehydrates canonical licitacion from detail payloads without null regressions and persists detail raw payloads separately', async () => {
    const listJobRun = await persistenceService.createJobRun(
      'api-v1-licitaciones-by-date',
    );
    const listSnapshot =
      await persistenceService.persistV1LicitacionesSnapshot({
        jobRunRecordId: listJobRun.id,
        snapshotKind: 'list',
        apiResponse: {
          endpoint: MERCADO_PUBLICO_API_V1_LICITACIONES_BY_DATE_ENDPOINT,
          source: MERCADO_PUBLICO_API_V1_LICITACIONES_SOURCE,
          requestParams: { fecha: '15062026' },
          requestFingerprint: 'req-list-l1',
          payloadChecksum: 'payload-list-l1',
          schemaFingerprint: 'schema-list-l1',
          httpStatus: 200,
          fetchedAt: new Date('2026-06-15T10:00:00.000Z'),
          rawPayload: {
            Listado: [
              {
                CodigoExterno: 'L1',
                Codigo: '1001',
                CodigoEstado: '5',
                Estado: 'Publicada',
                CodigoTipo: 'LP',
                Nombre: 'Titulo Lista',
                FechaPublicacion: '2026-06-10',
                FechaCierre: '2026-06-20',
                CodigoOrganismo: 'BUY-1',
                NombreOrganismo: null,
              },
            ],
          },
          licitaciones: [
            {
              CodigoExterno: 'L1',
              Codigo: '1001',
              CodigoEstado: '5',
              Estado: 'Publicada',
              CodigoTipo: 'LP',
              Nombre: 'Titulo Lista',
              FechaPublicacion: '2026-06-10',
              FechaCierre: '2026-06-20',
              CodigoOrganismo: 'BUY-1',
              NombreOrganismo: null,
            },
          ],
        },
      });

    await canonicalRefreshService.refreshV1LicitacionesFromApiSnapshot(
      listSnapshot.rawApiPayloadId,
    );

    const sparseDetailJobRun = await persistenceService.createJobRun(
      'api-v1-licitacion-detail-by-codigo',
    );
    const sparseDetailSnapshot =
      await persistenceService.persistV1LicitacionesSnapshot({
        jobRunRecordId: sparseDetailJobRun.id,
        snapshotKind: 'detail',
        apiResponse: {
          endpoint: MERCADO_PUBLICO_API_V1_LICITACIONES_DETAIL_BY_CODIGO_ENDPOINT,
          source: MERCADO_PUBLICO_API_V1_LICITACIONES_SOURCE,
          requestParams: { codigo: 'L1' },
          requestFingerprint: 'req-detail-l1',
          payloadChecksum: 'payload-detail-l1-sparse',
          schemaFingerprint: 'schema-detail-l1-sparse',
          httpStatus: 200,
          fetchedAt: new Date('2026-06-16T10:00:00.000Z'),
          rawPayload: {
            CodigoExterno: 'L1',
            Nombre: null,
            CodigoEstado: null,
            Estado: null,
            NombreOrganismo: 'Municipalidad Detalle',
            FechaCierre: '1900-01-01',
          },
          licitaciones: [
            {
              CodigoExterno: 'L1',
              Nombre: null,
              CodigoEstado: null,
              Estado: null,
              NombreOrganismo: 'Municipalidad Detalle',
              FechaCierre: '1900-01-01',
            },
          ],
        },
      });

    await canonicalRefreshService.refreshV1LicitacionesFromApiSnapshot(
      sparseDetailSnapshot.rawApiPayloadId,
    );

    const richDetailJobRun = await persistenceService.createJobRun(
      'api-v1-licitacion-detail-by-codigo',
    );
    const richDetailSnapshot =
      await persistenceService.persistV1LicitacionesSnapshot({
        jobRunRecordId: richDetailJobRun.id,
        snapshotKind: 'detail',
        apiResponse: {
          endpoint: MERCADO_PUBLICO_API_V1_LICITACIONES_DETAIL_BY_CODIGO_ENDPOINT,
          source: MERCADO_PUBLICO_API_V1_LICITACIONES_SOURCE,
          requestParams: { codigo: 'L1' },
          requestFingerprint: 'req-detail-l1',
          payloadChecksum: 'payload-detail-l1-rich',
          schemaFingerprint: 'schema-detail-l1-rich',
          httpStatus: 200,
          fetchedAt: new Date('2026-06-17T10:00:00.000Z'),
          rawPayload: {
            CodigoExterno: 'L1',
            CodigoEstado: '8',
            Estado: 'Adjudicada',
            Nombre: 'Titulo Detalle',
            NombreOrganismo: 'Municipalidad Detalle',
            FechaAdjudicacion: '2026-06-17',
          },
          licitaciones: [
            {
              CodigoExterno: 'L1',
              CodigoEstado: '8',
              Estado: 'Adjudicada',
              Nombre: 'Titulo Detalle',
              NombreOrganismo: 'Municipalidad Detalle',
              FechaAdjudicacion: '2026-06-17',
            },
          ],
        },
      });

    await canonicalRefreshService.refreshV1LicitacionesFromApiSnapshot(
      richDetailSnapshot.rawApiPayloadId,
    );

    const [canonicalRow] = await dataSource.query<
      Array<{
        codigo_externo: string;
        title: string;
        canonical_state: string;
        raw_state_code: string;
        raw_state_label: string;
        buyer_name: string | null;
        fecha_cierre: string | null;
        is_sentinel_1900_cierre: boolean;
        fecha_adjudicacion: string | null;
      }>
    >(
      `
        SELECT
          codigo_externo,
          title,
          canonical_state,
          raw_state_code,
          raw_state_label,
          buyer_name,
          fecha_cierre::text,
          is_sentinel_1900_cierre,
          fecha_adjudicacion::text
        FROM mp.licitacion
        WHERE codigo_externo = 'L1'
      `,
    );
    const rawPayloadRows = await dataSource.query<
      Array<{ endpoint: string; payload_checksum: string }>
    >(
      `
        SELECT endpoint, payload_checksum
        FROM mp.raw_api_payload
        WHERE source = $1
        ORDER BY created_at ASC
      `,
      [MERCADO_PUBLICO_API_V1_LICITACIONES_SOURCE],
    );

    expect(canonicalRow).toEqual({
      codigo_externo: 'L1',
      title: 'Titulo Detalle',
      canonical_state: 'adjudicada',
      raw_state_code: '8',
      raw_state_label: 'Adjudicada',
      buyer_name: 'Municipalidad Detalle',
      fecha_cierre: null,
      is_sentinel_1900_cierre: true,
      fecha_adjudicacion: '2026-06-17',
    });
    expect(rawPayloadRows).toEqual([
      {
        endpoint: MERCADO_PUBLICO_API_V1_LICITACIONES_BY_DATE_ENDPOINT,
        payload_checksum: 'payload-list-l1',
      },
      {
        endpoint: MERCADO_PUBLICO_API_V1_LICITACIONES_DETAIL_BY_CODIGO_ENDPOINT,
        payload_checksum: 'payload-detail-l1-sparse',
      },
      {
        endpoint: MERCADO_PUBLICO_API_V1_LICITACIONES_DETAIL_BY_CODIGO_ENDPOINT,
        payload_checksum: 'payload-detail-l1-rich',
      },
    ]);
  });
});
