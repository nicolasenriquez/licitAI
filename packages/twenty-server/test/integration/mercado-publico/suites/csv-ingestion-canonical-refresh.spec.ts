import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

import { type DataSource } from 'typeorm';

import { MpSchemaFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1782340007505-mp-schema';
import { MpRawApiPayloadFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1782340007517-mp-raw-api-payload';
import { MpRawCsvFileFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1782340007600-mp-raw-csv-file';
import { MpRawCsvRowFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1782340007700-mp-raw-csv-row';
import { MpStgJobRunFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1782340007800-mp-stg-job-run';
import { MpStgCsvOrdenCompraFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1782340007840-mp-stg-csv-orden-compra';
import { MpStgCsvLicitacionFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1782340007850-mp-stg-csv-licitacion';
import { MpCanonicalLicitacionFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1782340007860-mp-canonical-licitacion';
import { MpCanonicalOrdenCompraFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1782340007870-mp-canonical-orden-compra';
import { MpRawCsvFileDedupeModalityFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1782340007920-mp-raw-csv-file-dedupe-modality';
import { MpRawCsvFileDedupeNullsNotDistinctFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1783191615520-mp-raw-csv-file-dedupe-nulls-not-distinct';
import { DropRawCsvFileIngestionJobIdFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1783191615514-drop-raw-csv-file-ingestion-job-id';
import { MpStgJobRunRawCsvFileLinkSlowInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-slow-1782340007930-mp-stg-job-run-raw-csv-file-link';
import { rawDataSource } from 'src/database/typeorm/raw/raw.datasource';
import {
  MERCADO_PUBLICO_CSV_LICITACIONES_DATASET,
  MERCADO_PUBLICO_CSV_OC_DATASET,
  MERCADO_PUBLICO_CSV_SOURCE_SYSTEM,
} from 'src/engine/core-modules/mercado-publico/mercado-publico.constants';
import { MercadoPublicoCanonicalRefreshService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-canonical-refresh.service';
import { MercadoPublicoCsvProfileService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-csv-profile.service';
import { MercadoPublicoCsvProfilingService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-csv-profiling.service';
import { MercadoPublicoCsvRawLoadService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-csv-raw-load.service';
import { MercadoPublicoCsvStagingProjectionService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-csv-staging-projection.service';
import { MercadoPublicoPersistenceService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-persistence.service';

const truncateMercadoPublicoTables = async (dataSource: DataSource) => {
  await dataSource.query(`
    TRUNCATE TABLE
      mp.orden_compra_item,
      mp.orden_compra,
      mp.licitacion_adjudicacion,
      mp.licitacion_oferta,
      mp.licitacion_item,
      mp.licitacion,
      mp.stg_csv_orden_compra,
      mp.stg_csv_licitacion,
      mp.raw_csv_row,
      mp.raw_csv_file,
      mp.raw_api_payload,
      mp.stg_job_run
    RESTART IDENTITY CASCADE
  `);
};

const applyMercadoPublicoCsvCommands = async (dataSource: DataSource) => {
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
    await new MpStgCsvOrdenCompraFastInstanceCommand().up(queryRunner);
    await new MpStgCsvLicitacionFastInstanceCommand().up(queryRunner);
    await new MpCanonicalLicitacionFastInstanceCommand().up(queryRunner);
    await new MpCanonicalOrdenCompraFastInstanceCommand().up(queryRunner);
    await new MpRawCsvFileDedupeModalityFastInstanceCommand().up(queryRunner);
    await new MpRawCsvFileDedupeNullsNotDistinctFastInstanceCommand().up(
      queryRunner,
    );
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

const createStorageRoot = () => mkdtempSync(join(tmpdir(), 'mp-csv-4-7-'));

const writeCsvFixture = (input: {
  storageRoot: string;
  sourceDataset: string;
  sourcePeriod: string;
  sourceFileName: string;
  content: string;
}) => {
  const filePath = join(
    input.storageRoot,
    input.sourceDataset,
    input.sourcePeriod,
    '_default',
    input.sourceFileName,
  );

  mkdirSync(join(input.storageRoot, input.sourceDataset, input.sourcePeriod, '_default'), {
    recursive: true,
  });
  writeFileSync(filePath, Buffer.from(input.content, 'latin1'));
};

describe('Mercado Publico CSV profiling -> raw load -> canonical refresh (db-backed)', () => {
  let dataSource: DataSource;
  let persistenceService: MercadoPublicoPersistenceService;
  let csvProfileService: MercadoPublicoCsvProfileService;
  let csvRawLoadService: MercadoPublicoCsvRawLoadService;
  let csvStagingProjectionService: MercadoPublicoCsvStagingProjectionService;
  let canonicalRefreshService: MercadoPublicoCanonicalRefreshService;
  let storageRoot: string;

  beforeAll(async () => {
    jest.useRealTimers();

    dataSource = rawDataSource;

    if (!dataSource.isInitialized) {
      await dataSource.initialize();
    }

    await applyMercadoPublicoCsvCommands(dataSource);

    persistenceService = new MercadoPublicoPersistenceService(dataSource);

    const configService = {
      getSettings: () => ({
        csvStorageRoot: storageRoot,
      }),
    };

    const profilingService = new MercadoPublicoCsvProfilingService(
      configService as never,
      persistenceService,
    );

    csvProfileService = new MercadoPublicoCsvProfileService(
      profilingService,
      persistenceService,
    );
    csvRawLoadService = new MercadoPublicoCsvRawLoadService(
      configService as never,
      persistenceService,
    );
    csvStagingProjectionService = new MercadoPublicoCsvStagingProjectionService(
      persistenceService,
    );
    canonicalRefreshService = new MercadoPublicoCanonicalRefreshService(
      dataSource,
    );
  });

  beforeEach(async () => {
    storageRoot = createStorageRoot();
    await truncateMercadoPublicoTables(dataSource);
  });

  afterEach(() => {
    rmSync(storageRoot, { recursive: true, force: true });
  });

  afterAll(async () => {
    await truncateMercadoPublicoTables(dataSource);

    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  });

  it('profiles, raw-loads, stages, and canonicalizes OC CSV rows', async () => {
    const sourceFileName = 'oc-2026-06.csv';

    writeCsvFixture({
      storageRoot,
      sourceDataset: MERCADO_PUBLICO_CSV_OC_DATASET,
      sourcePeriod: '2026-06',
      sourceFileName,
      content:
        'Codigo;ID;IDItem;CodigoLicitacion;FechaEnvio;Estado;DescripcionTipoOC;CodigoAbreviadoTipoOC;CodigoTipo;TipoMonedaOC;MontoTotalOC_PesosChilenos;ImpuestosOC;UnidadCompra;NombreProveedor;CodigoProductoONU;TotalLineaNeto;EsCompraAgil;EsTratoDirecto;Forma de Pago;Codigo_ConvenioMarco\r\n' +
        'OC-1;SRC-1;ITEM-1;L1;1900-01-01;Recepci\xf3n conforme;Convenio Marco;CM;CM;CLP;20700794,94;1900000,00;Unidad Central;Proveedor Uno;30001234;8100000,00;Si;No;30 d\xedas;CM-2020\r\n' +
        'OC-1;SRC-2;ITEM-2;;2026-05-20;En proceso;;;;NA;;Unidad Central;Proveedor Uno;30005678;0,1;;;;\r\n',
    });

    const download = await persistenceService.persistCsvDownload({
      sourceSystem: MERCADO_PUBLICO_CSV_SOURCE_SYSTEM,
      sourceDataset: MERCADO_PUBLICO_CSV_OC_DATASET,
      sourceUrl: 'https://example.com/oc-2026-06.csv',
      sourceFileName,
      sourcePeriod: '2026-06',
      sourceModality: null,
      fileChecksum: 'oc-file-sha-1',
      fileSizeBytes: 512,
      compressionType: null,
    });

    await csvProfileService.run({ raw_csv_file_id: download.rawCsvFileId });
    await csvRawLoadService.run({ raw_csv_file_id: download.rawCsvFileId });
    await csvStagingProjectionService.run({
      raw_csv_file_id: download.rawCsvFileId,
    });

    await dataSource.query(`
      INSERT INTO mp.orden_compra (codigo, source_priority)
      VALUES ('OC-1', 'csv-datos-abiertos')
    `);

    const canonicalCounts =
      await canonicalRefreshService.refreshCanonicalFromCsvSnapshot(
        download.rawCsvFileId,
      );

    const [fileRow] = await dataSource.query<
      Array<{
        detected_encoding: string;
        detected_delimiter: string;
        quotechar: string | null;
        row_count: number;
      }>
    >(
      `
        SELECT detected_encoding, detected_delimiter, quotechar, row_count
        FROM mp.raw_csv_file
        WHERE id = $1
      `,
      [download.rawCsvFileId],
    );
    const rawRows = await dataSource.query<
      Array<{
        row_number: number;
        parse_status: string;
        raw_row_json: string[];
      }>
    >(
      `
        SELECT row_number, parse_status, raw_row_json
        FROM mp.raw_csv_row
        WHERE raw_csv_file_id = $1
        ORDER BY row_number ASC
      `,
      [download.rawCsvFileId],
    );
    const stagedRows = await dataSource.query<
      Array<{ codigo: string; iditem: string; fecha_envio: string | null }>
    >(
      `
        SELECT codigo, iditem, fecha_envio
        FROM mp.stg_csv_orden_compra
        ORDER BY iditem ASC
      `,
    );
    const canonicalItems = await dataSource.query<
      Array<{ iditem: string; codigo: string; raw_total_linea_neto: string | null }>
    >(
      `
        SELECT iditem, codigo, raw_total_linea_neto
        FROM mp.orden_compra_item
        ORDER BY iditem ASC
      `,
    );
    const jobRuns = await dataSource.query<
      Array<{ job_name: string; status: string; raw_csv_file_id: string | null }>
    >(
      `
        SELECT job_name, status, raw_csv_file_id
        FROM mp.stg_job_run
        WHERE job_name IN ('csv-file-profile', 'csv-raw-load', 'csv-staging-projection')
        ORDER BY created_at ASC
      `,
    );

    expect(fileRow).toEqual({
      detected_encoding: 'latin-1',
      detected_delimiter: ';',
      quotechar: null,
      row_count: 2,
    });
    expect(rawRows).toHaveLength(2);
    expect(rawRows[0]?.parse_status).toBe('success');
    expect(rawRows[0]?.raw_row_json[4]).toBe('1900-01-01');
    expect(rawRows[1]?.raw_row_json).toContain('NA');
    expect(stagedRows).toEqual([
      { codigo: 'OC-1', iditem: 'ITEM-1', fecha_envio: '1900-01-01' },
      { codigo: 'OC-1', iditem: 'ITEM-2', fecha_envio: '2026-05-20' },
    ]);
    expect(canonicalCounts.ordenCompraItems).toBe(2);
    expect(canonicalCounts.total).toBe(2);
    expect(canonicalItems).toEqual([
      { iditem: 'ITEM-1', codigo: 'OC-1', raw_total_linea_neto: '8100000,00' },
      { iditem: 'ITEM-2', codigo: 'OC-1', raw_total_linea_neto: null },
    ]);
    expect(jobRuns).toEqual([
      {
        job_name: 'csv-file-profile',
        status: 'success',
        raw_csv_file_id: download.rawCsvFileId,
      },
      {
        job_name: 'csv-raw-load',
        status: 'success',
        raw_csv_file_id: download.rawCsvFileId,
      },
      {
        job_name: 'csv-staging-projection',
        status: 'success',
        raw_csv_file_id: download.rawCsvFileId,
      },
    ]);
  });

  it('profiles, raw-loads, stages, and canonicalizes licitaciones CSV rows with supplier-offer grain', async () => {
    const sourceFileName = 'licitaciones-2026-06.csv';

    writeCsvFixture({
      storageRoot,
      sourceDataset: MERCADO_PUBLICO_CSV_LICITACIONES_DATASET,
      sourcePeriod: '2026-06',
      sourceFileName,
      content:
        'CodigoExterno;Codigo;Codigoitem;CodigoProveedor;RutProveedor;Nombre de la Oferta;Estado Oferta;Oferta seleccionada;Cantidad Ofertada;Valor Total Ofertado;Tipo de Adquisicion;FechaPublicacion;FechaAdjudicacion;Estado;NombreUnidad;Nombre producto genrico;CantidadAdjudicada;Monto Estimado Adjudicado\r\n' +
        'L1;COD-001;1;P001;11111111-1;Oferta econ\xf3mica;Aceptada;Si;100;8000000,00;LP;2026-01-15;2026-03-10;Publicada;Unidad de Compras;Producto gen\xe9rico;50;15000000,50\r\n' +
        'L1;COD-001;1;P002;22222222-2;Oferta alternativa;Rechazada;No;80;7500000,00;LP;2026-01-15;2026-03-10;Publicada;Unidad de Compras;Producto gen\xe9rico;40;14000000,25\r\n',
    });

    const download = await persistenceService.persistCsvDownload({
      sourceSystem: MERCADO_PUBLICO_CSV_SOURCE_SYSTEM,
      sourceDataset: MERCADO_PUBLICO_CSV_LICITACIONES_DATASET,
      sourceUrl: 'https://example.com/licitaciones-2026-06.csv',
      sourceFileName,
      sourcePeriod: '2026-06',
      sourceModality: null,
      fileChecksum: 'licitaciones-file-sha-1',
      fileSizeBytes: 768,
      compressionType: null,
    });

    await csvProfileService.run({ raw_csv_file_id: download.rawCsvFileId });
    await csvRawLoadService.run({ raw_csv_file_id: download.rawCsvFileId });
    await csvStagingProjectionService.run({
      raw_csv_file_id: download.rawCsvFileId,
    });

    await dataSource.query(`
      INSERT INTO mp.licitacion (codigo_externo, source_priority)
      VALUES ('L1', 'csv-datos-abiertos')
    `);

    const canonicalCounts =
      await canonicalRefreshService.refreshCanonicalFromCsvSnapshot(
        download.rawCsvFileId,
      );

    const [fileRow] = await dataSource.query<
      Array<{
        detected_encoding: string;
        detected_delimiter: string;
        quotechar: string | null;
        row_count: number;
        column_count: number;
      }>
    >(
      `
        SELECT
          detected_encoding,
          detected_delimiter,
          quotechar,
          row_count,
          column_count
        FROM mp.raw_csv_file
        WHERE id = $1
      `,
      [download.rawCsvFileId],
    );
    const rawRows = await dataSource.query<
      Array<{ row_number: number; parse_status: string; raw_row_json: string[] }>
    >(
      `
        SELECT row_number, parse_status, raw_row_json
        FROM mp.raw_csv_row
        WHERE raw_csv_file_id = $1
        ORDER BY row_number ASC
      `,
      [download.rawCsvFileId],
    );
    const stagedRows = await dataSource.query<
      Array<{
        codigo_externo: string;
        codigoitem: string;
        codigo_proveedor: string;
        oferta_seleccionada: string | null;
      }>
    >(
      `
        SELECT codigo_externo, codigoitem, codigo_proveedor, oferta_seleccionada
        FROM mp.stg_csv_licitacion
        ORDER BY codigo_proveedor ASC
      `,
    );
    const canonicalItems = await dataSource.query<
      Array<{ codigo_externo: string; codigoitem: string; nombre_producto_generico: string | null }>
    >(
      `
        SELECT codigo_externo, codigoitem, nombre_producto_generico
        FROM mp.licitacion_item
      `,
    );
    const canonicalOfertas = await dataSource.query<
      Array<{
        codigo_proveedor: string | null;
        nombre_de_la_oferta: string;
        is_oferta_seleccionada: boolean | null;
        raw_oferta_seleccionada: string | null;
      }>
    >(
      `
        SELECT
          codigo_proveedor,
          nombre_de_la_oferta,
          is_oferta_seleccionada,
          raw_oferta_seleccionada
        FROM mp.licitacion_oferta
        ORDER BY codigo_proveedor ASC
      `,
    );
    const canonicalAdjudicaciones = await dataSource.query<
      Array<{ rut_proveedor: string; raw_monto_adjudicado: string | null }>
    >(
      `
        SELECT rut_proveedor, raw_monto_adjudicado
        FROM mp.licitacion_adjudicacion
        ORDER BY rut_proveedor ASC
      `,
    );

    expect(fileRow).toEqual({
      detected_encoding: 'latin-1',
      detected_delimiter: ';',
      quotechar: null,
      row_count: 2,
      column_count: 18,
    });
    expect(rawRows).toHaveLength(2);
    expect(rawRows[0]?.raw_row_json[5]).toBe('Oferta económica');
    expect(rawRows[0]?.raw_row_json[7]).toBe('Si');
    expect(stagedRows).toEqual([
      {
        codigo_externo: 'L1',
        codigoitem: '1',
        codigo_proveedor: 'P001',
        oferta_seleccionada: 'Si',
      },
      {
        codigo_externo: 'L1',
        codigoitem: '1',
        codigo_proveedor: 'P002',
        oferta_seleccionada: 'No',
      },
    ]);
    expect(canonicalCounts).toEqual({
      licitacionItems: 1,
      licitacionOfertas: 2,
      licitacionAdjudicaciones: 2,
      ordenCompraItems: 0,
      total: 5,
    });
    expect(canonicalItems).toEqual([
      {
        codigo_externo: 'L1',
        codigoitem: '1',
        nombre_producto_generico: 'Producto genérico',
      },
    ]);
    expect(canonicalOfertas).toEqual([
      {
        codigo_proveedor: 'P001',
        nombre_de_la_oferta: 'Oferta económica',
        is_oferta_seleccionada: true,
        raw_oferta_seleccionada: 'Si',
      },
      {
        codigo_proveedor: 'P002',
        nombre_de_la_oferta: 'Oferta alternativa',
        is_oferta_seleccionada: false,
        raw_oferta_seleccionada: 'No',
      },
    ]);
    expect(canonicalAdjudicaciones).toEqual([
      { rut_proveedor: '11111111-1', raw_monto_adjudicado: '15000000,50' },
      { rut_proveedor: '22222222-2', raw_monto_adjudicado: '14000000,25' },
    ]);
  });
});
