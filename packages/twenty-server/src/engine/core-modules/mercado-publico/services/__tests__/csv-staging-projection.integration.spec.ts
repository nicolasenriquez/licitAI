import { type DataSource } from 'typeorm';

import { MercadoPublicoCsvStagingProjectionService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-csv-staging-projection.service';
import { MercadoPublicoPersistenceService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-persistence.service';

describe('MercadoPublicoCsvStagingProjectionService (integration-shaped)', () => {
  let service: MercadoPublicoCsvStagingProjectionService;
  let stagedOcRows: Array<Record<string, unknown>>;
  let stagedLicitacionRows: Array<Record<string, unknown>>;

  function buildDataSource(seededTables: {
    rawCsvFile: Record<string, unknown>[];
    rawCsvRow: Array<{
      id: string;
      row_number: number;
      raw_row_json: string[] | null;
      parse_status: string;
    }>;
  }): DataSource {
    stagedOcRows = [];
    stagedLicitacionRows = [];

    return {
      query: jest.fn(async (sql: string, params: unknown[]) => {
        const normalizedSql = sql.replace(/\s+/g, ' ').trim();

        if (normalizedSql.includes('INSERT INTO mp.stg_csv_orden_compra')) {
          const valuesMatch = normalizedSql.match(/VALUES\s+(.+)/s);

          if (valuesMatch) {
            const valuesBlock = valuesMatch[1].trim();
            const rowStrings = valuesBlock.split(/\),\s*\(/);
            const paramGroups: unknown[][] = [];

            let currentGroup: unknown[] = [];
            for (const p of params) {
              currentGroup.push(p);
              if (currentGroup.length === 24) {
                paramGroups.push([...currentGroup]);
                currentGroup = [];
              }
            }
            if (currentGroup.length > 0) {
              paramGroups.push(currentGroup);
            }

            for (let i = 0; i < rowStrings.length && i < paramGroups.length; i++) {
              const group = paramGroups[i];
              stagedOcRows.push({
                raw_csv_row_id: group[0],
                source_dataset: group[1],
                source_period: group[2],
                codigo: group[3],
                source_id: group[4],
                iditem: group[5],
                codigo_licitacion: group[6],
                fecha_envio: group[7],
                estado: group[8],
                descripcion_tipo_oc: group[9],
                codigo_abreviado_tipo_oc: group[10],
                codigo_tipo: group[11],
                tipo_moneda_oc: group[12],
                monto_total_oc_pesos_chilenos: group[13],
                impuestos_oc: group[14],
                unidad_compra: group[15],
                nombre_proveedor: group[16],
                codigo_producto_onu: group[17],
                total_linea_neto: group[18],
                es_compra_agil: group[19],
                es_trato_directo: group[20],
                forma_de_pago: group[21],
                codigo_convenio_marco: group[22],
                all_observed_fields: group[23],
              });
            }
          }
          return [];
        }

        if (normalizedSql.includes('INSERT INTO mp.stg_csv_licitacion')) {
          let currentGroup: unknown[] = [];
          for (const p of params) {
            currentGroup.push(p);
            if (currentGroup.length === 22) {
              stagedLicitacionRows.push({
                raw_csv_row_id: currentGroup[0],
                source_dataset: currentGroup[1],
                source_period: currentGroup[2],
                codigo_externo: currentGroup[3],
                codigo: currentGroup[4],
                codigoitem: currentGroup[5],
                codigo_proveedor: currentGroup[6],
                rut_proveedor: currentGroup[7],
                nombre_de_la_oferta: currentGroup[8],
                estado_oferta: currentGroup[9],
                oferta_seleccionada: currentGroup[10],
                cantidad_ofertada: currentGroup[11],
                valor_total_ofertado: currentGroup[12],
                tipo_de_adquisicion: currentGroup[13],
                fecha_publicacion: currentGroup[14],
                fecha_adjudicacion: currentGroup[15],
                estado: currentGroup[16],
                nombre_unidad: currentGroup[17],
                nombre_producto_generico: currentGroup[18],
                cantidad_adjudicada: currentGroup[19],
                monto_estimado_adjudicado: currentGroup[20],
                all_observed_fields: currentGroup[21],
              });
              currentGroup = [];
            }
          }
          return [];
        }

        if (normalizedSql.startsWith('INSERT INTO mp.stg_job_run')) {
          return [{ id: 'job-integration-id', job_run_id: 'run-int-1' }];
        }

        if (normalizedSql.includes('UPDATE mp.stg_job_run')) {
          return [];
        }

        if (normalizedSql.includes('SELECT observed_columns FROM mp.raw_csv_file')) {
          const fileId = params[0];
          const file = seededTables.rawCsvFile.find((f) => f.id === fileId);
          return file ? [{ observed_columns: file.observed_columns }] : [];
        }

        if (normalizedSql.includes('SELECT COUNT(*)::text AS count FROM mp.raw_csv_row')) {
          return [{ count: String(seededTables.rawCsvRow.length) }];
        }

        if (normalizedSql.includes('FROM mp.raw_csv_file WHERE id =')) {
          const fileId = params[0];
          const file = seededTables.rawCsvFile.find((f) => f.id === fileId);
          return file ? [file] : [];
        }

        if (
          normalizedSql.includes('FROM mp.raw_csv_row') &&
          normalizedSql.includes('row_number >')
        ) {
          const rowNumberExclusiveStart = Number(params[1]);
          const limit = Number(params[2]);

          return seededTables.rawCsvRow
            .filter(
              (row) =>
                row.parse_status === 'success' &&
                row.row_number > rowNumberExclusiveStart,
            )
            .slice(0, limit);
        }

        if (normalizedSql.includes('FROM mp.raw_csv_file WHERE id IN')) {
          const fileId = params[0];
          const file = seededTables.rawCsvFile.find((f) => f.id === fileId);
          return file ? [file] : [];
        }

        return [];
      }),
    } as unknown as DataSource;
  }

  describe('OC staging projection end-to-end', () => {
    beforeEach(() => {
      const ocObservedColumns = [
        'Codigo', 'ID', 'IDItem', 'CodigoLicitacion', 'FechaEnvio', 'Estado',
        'DescripcionTipoOC', 'CodigoAbreviadoTipoOC', 'CodigoTipo', 'TipoMonedaOC',
        'MontoTotalOC_PesosChilenos', 'ImpuestosOC', 'UnidadCompra', 'NombreProveedor',
        'CodigoProductoONU', 'TotalLineaNeto', 'EsCompraAgil', 'EsTratoDirecto',
        'Forma de Pago', 'Codigo_ConvenioMarco',
      ];

      const dataSource = buildDataSource({
        rawCsvFile: [
          {
            id: 'oc-file-int-id',
            source_system: 'datos-abiertos',
            source_dataset: 'oc',
            source_url: 'https://example.com/oc.csv',
            source_file_name: '2026-6.csv',
            source_period: '2026-06',
            source_modality: null,
            downloaded_at: new Date(),
            file_checksum: 'abc',
            file_size_bytes: 500,
            compression_type: null,
            detected_encoding: 'latin-1',
            detected_delimiter: ';',
            quotechar: '"',
            header_raw: ocObservedColumns.join(';'),
            observed_columns: ocObservedColumns,
            column_count: 20,
            schema_fingerprint: 'x',
            row_count: 2,
            ingestion_job_id: null,
          },
        ],
        rawCsvRow: [
          {
            id: 'oc-row-1',
            row_number: 1,
            raw_row_json: ['OC-001', 'ID-001', 'ITEM-1', 'L1', '2026-01-15', 'Enviada a proveedor', 'Convenio Marco', 'CM', 'CM', 'CLP', '10000000,00', '1900000,00', 'Unidad Central', 'Proveedor Ejemplo S.A.', '30001234', '8100000,00', 'Si', 'No', '30 dias', 'CM-2020'],
            parse_status: 'success',
          },
          {
            id: 'oc-row-2',
            row_number: 2,
            raw_row_json: ['OC-001', 'ID-002', 'ITEM-2', 'L1', '2026-01-16', 'En proceso', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
            parse_status: 'success',
          },
        ],
      });

      const persistenceService = new MercadoPublicoPersistenceService(dataSource);
      service = new MercadoPublicoCsvStagingProjectionService(persistenceService);
    });

    it('should project OC rows to stg_csv_orden_compra with correct column mapping', async () => {
      await service.run({ raw_csv_file_id: 'oc-file-int-id' });

      expect(stagedOcRows).toHaveLength(2);

      const row = stagedOcRows[0];

      expect(row.raw_csv_row_id).toBe('oc-row-1');
      expect(row.codigo).toBe('OC-001');
      expect(row.iditem).toBe('ITEM-1');
      expect(row.codigo_licitacion).toBe('L1');
      expect(row.es_compra_agil).toBe('Si');
      expect(row).not.toHaveProperty('raw_csv_file_id');
      expect(row.all_observed_fields).toBeDefined();
    });

    it('should handle sparse rows with empty string values', async () => {
      await service.run({ raw_csv_file_id: 'oc-file-int-id' });

      const sparseRow = stagedOcRows[1];

      expect(sparseRow.codigo).toBe('OC-001');
      expect(sparseRow.iditem).toBe('ITEM-2');
      expect(sparseRow.estado).toBe('En proceso');
      expect(sparseRow.descripcion_tipo_oc).toBeNull();
    });

    it('should set source_dataset to oc', async () => {
      await service.run({ raw_csv_file_id: 'oc-file-int-id' });

      for (const row of stagedOcRows) {
        expect(row.source_dataset).toBe('oc');
      }
    });
  });

  describe('licitacion staging projection end-to-end', () => {
    beforeEach(() => {
      const licObservedColumns = [
        'CodigoExterno', 'Codigo', 'Codigoitem', 'CodigoProveedor', 'RutProveedor',
        'Nombre de la Oferta', 'Estado Oferta', 'Oferta seleccionada',
        'Cantidad Ofertada', 'Valor Total Ofertado', 'Tipo de Adquisicion',
        'FechaPublicacion', 'FechaAdjudicacion', 'Estado', 'NombreUnidad',
        'Nombre producto genrico', 'CantidadAdjudicada', 'Monto Estimado Adjudicado',
      ];

      const dataSource = buildDataSource({
        rawCsvFile: [
          {
            id: 'lic-file-int-id',
            source_system: 'datos-abiertos',
            source_dataset: 'licitaciones',
            source_url: 'https://example.com/lic.csv',
            source_file_name: 'lic_2026-6.csv',
            source_period: '2026-06',
            source_modality: null,
            downloaded_at: new Date(),
            file_checksum: 'def',
            file_size_bytes: 1000,
            compression_type: null,
            detected_encoding: 'latin-1',
            detected_delimiter: ';',
            quotechar: '"',
            header_raw: licObservedColumns.join(';'),
            observed_columns: licObservedColumns,
            column_count: 18,
            schema_fingerprint: 'y',
            row_count: 2,
            ingestion_job_id: null,
          },
        ],
        rawCsvRow: [
          {
            id: 'lic-row-1',
            row_number: 1,
            raw_row_json: ['L1', 'COD-001', '1', 'P001', '11111111-1', 'Oferta Principal', 'Aceptada', 'Si', '100', '8000000,00', 'LP', '2026-01-15', '2026-03-10', 'Publicada', 'Unidad de Compras', 'Producto Generico', '50', '15000000,50'],
            parse_status: 'success',
          },
          {
            id: 'lic-row-2',
            row_number: 2,
            raw_row_json: ['L1', 'COD-001', '1', 'P002', '22222222-2', 'Oferta Alternativa', 'Rechazada', 'No', '80', '7500000,00', 'LP', '2026-01-15', '2026-03-10', 'Publicada', 'Unidad de Compras', 'Producto Generico', '50', '15000000,50'],
            parse_status: 'success',
          },
        ],
      });

      const persistenceService = new MercadoPublicoPersistenceService(dataSource);
      service = new MercadoPublicoCsvStagingProjectionService(persistenceService);
    });

    it('should project licitacion rows with correct item+offer grain', async () => {
      await service.run({ raw_csv_file_id: 'lic-file-int-id' });

      expect(stagedLicitacionRows).toHaveLength(2);
    });

    it('should preserve raw Oferta seleccionada', async () => {
      await service.run({ raw_csv_file_id: 'lic-file-int-id' });

      expect(stagedLicitacionRows[0].oferta_seleccionada).toBe('Si');
      expect(stagedLicitacionRows[1].oferta_seleccionada).toBe('No');
    });

    it('should accept repeated CodigoExterno+Codigoitem with different suppliers', async () => {
      await service.run({ raw_csv_file_id: 'lic-file-int-id' });

      expect(stagedLicitacionRows[0].codigo_externo).toBe('L1');
      expect(stagedLicitacionRows[0].codigoitem).toBe('1');
      expect(stagedLicitacionRows[1].codigo_externo).toBe('L1');
      expect(stagedLicitacionRows[1].codigoitem).toBe('1');
      expect(stagedLicitacionRows[0].codigo_proveedor).toBe('P001');
      expect(stagedLicitacionRows[1].codigo_proveedor).toBe('P002');
    });

    it('should preserve all_observed_fields as raw row JSON array', async () => {
      await service.run({ raw_csv_file_id: 'lic-file-int-id' });

      expect(stagedLicitacionRows[0]).not.toHaveProperty('raw_csv_file_id');
      expect(stagedLicitacionRows[0].all_observed_fields).toBeDefined();
    });
  });
});
