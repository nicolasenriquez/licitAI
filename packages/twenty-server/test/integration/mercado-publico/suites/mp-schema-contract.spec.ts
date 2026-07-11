import { rawDataSource } from 'src/database/typeorm/raw/raw.datasource';

const expectedMercadoPublicoTables = [
  'raw_api_payload',
  'raw_csv_file',
  'raw_csv_row',
  'stg_job_run',
  'stg_api_v1_licitacion',
  'stg_api_v1_orden_compra',
  'stg_api_v2_compra_agil',
  'stg_csv_licitacion',
  'stg_csv_orden_compra',
  'licitacion',
  'licitacion_adjudicacion',
  'licitacion_item',
  'licitacion_oferta',
  'orden_compra',
  'orden_compra_item',
  'compra_agil',
  'compra_agil_cotizacion',
  'compra_agil_producto_solicitado',
  'reconciliation_public_market_entities',
  'reconciliation_event',
  'gold_api_quota_usage',
  'gold_conciliacion_licitacion_oc',
  'gold_csv_file_health',
  'gold_detected_process',
  'gold_pipeline_health',
] as const;

describe('Mercado Publico schema contract (db-backed)', () => {
  beforeAll(async () => {
    if (!rawDataSource.isInitialized) {
      await rawDataSource.initialize();
    }
  });

  afterAll(async () => {
    if (rawDataSource.isInitialized) {
      await rawDataSource.destroy();
    }
  });

  it('should find every required mp table when the database is initialized', async () => {
    const tableRows = await rawDataSource.query<{ table_name: string }[]>(
      `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'mp'
        AND table_name = ANY($1::text[])
      ORDER BY table_name
    `,
      [expectedMercadoPublicoTables],
    );

    expect(tableRows.map(({ table_name: tableName }) => tableName)).toEqual(
      [...expectedMercadoPublicoTables].sort(),
    );
  });
});
