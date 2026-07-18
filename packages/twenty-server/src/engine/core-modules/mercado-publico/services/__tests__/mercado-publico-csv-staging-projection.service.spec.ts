import { MercadoPublicoCsvStagingProjectionService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-csv-staging-projection.service';
import { MercadoPublicoPersistenceService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-persistence.service';
import { MercadoPublicoRecordedJobFailureError } from 'src/engine/core-modules/mercado-publico/services/utils/mercado-publico-recorded-job-failure.error';

describe('MercadoPublicoCsvStagingProjectionService', () => {
  let service: MercadoPublicoCsvStagingProjectionService;
  let persistenceService: jest.Mocked<MercadoPublicoPersistenceService>;

  const mockJobRunRecord = {
    id: 'job-run-proj-id',
    jobRunId: 'run-proj-1',
    startedAt: new Date(),
  };

  beforeEach(() => {
    persistenceService = {
      createJobRun: jest.fn().mockResolvedValue(mockJobRunRecord),
      linkJobRunToRawCsvFile: jest.fn(),
      finalizeJobRun: jest.fn(),
      getRawCsvFileMetaById: jest.fn(),
      getRawCsvFileById: jest.fn(),
      getRawCsvFileObservedColumns: jest.fn(),
      countRawCsvRowsByFileId: jest.fn(),
      getRawCsvRowsPageByFileId: jest.fn(),
      insertStgCsvOrdenCompraRows: jest.fn(),
      insertStgCsvLicitacionRows: jest.fn(),
      deleteStgCsvOrdenCompraRowsByRawFileId: jest.fn(),
      deleteStgCsvLicitacionRowsByRawFileId: jest.fn(),
    } as unknown as jest.Mocked<MercadoPublicoPersistenceService>;

    service = new MercadoPublicoCsvStagingProjectionService(persistenceService);
  });

  describe('parsePayload', () => {
    it('should record and reject when raw_csv_file_id is missing', async () => {
      await expect(service.run({})).rejects.toBeInstanceOf(
        MercadoPublicoRecordedJobFailureError,
      );
    });

    it('should record and reject when raw_csv_file_id is empty', async () => {
      await expect(service.run({ raw_csv_file_id: '' })).rejects.toBeInstanceOf(
        MercadoPublicoRecordedJobFailureError,
      );
    });
  });

  it('does not link a missing raw CSV file', async () => {
    persistenceService.getRawCsvFileById = jest.fn().mockResolvedValue(null);

    await expect(
      service.run({ raw_csv_file_id: 'missing-id' }),
    ).rejects.toThrow('raw_csv_file row not found');

    expect(persistenceService.linkJobRunToRawCsvFile).not.toHaveBeenCalled();
  });
  describe('OC staging projection', () => {
    const fileMeta = {
      id: 'csv-file-oc-id',
      source_dataset: 'oc',
      source_period: '2026-06',
      source_file_name: '2026-6.csv',
      detected_delimiter: ';',
      quotechar: '"',
    };

    const rawFileRow = {
      id: 'csv-file-oc-id',
      source_system: 'datos-abiertos',
      source_dataset: 'oc',
      source_url: 'https://example.com/oc.csv',
      source_file_name: '2026-6.csv',
      source_period: '2026-06',
      source_modality: null,
      file_checksum: 'abc123',
      file_size_bytes: 1000,
      compression_type: null,
    };

    const observedColumns = [
      'Codigo',
      'IDItem',
      'FechaEnvio',
      'Estado',
      'UnknownCol_X',
    ];

    const rawRows = [
      {
        id: 'raw-row-1',
        raw_row_json: [
          'OC-001',
          'ITEM-1',
          '2026-01-15',
          'Enviada a proveedor',
          'extra-val',
        ],
        parse_status: 'success',
      },
      {
        id: 'raw-row-2',
        raw_row_json: [
          'OC-001',
          'ITEM-2',
          '2026-01-16',
          'En proceso',
          'extra-val-2',
        ],
        parse_status: 'success',
      },
    ];

    beforeEach(() => {
      persistenceService.getRawCsvFileMetaById = jest
        .fn()
        .mockResolvedValue(fileMeta);
      persistenceService.getRawCsvFileById = jest
        .fn()
        .mockResolvedValue(rawFileRow);
      persistenceService.getRawCsvFileObservedColumns = jest
        .fn()
        .mockResolvedValue(observedColumns);
      persistenceService.countRawCsvRowsByFileId = jest
        .fn()
        .mockResolvedValue(2);
      persistenceService.getRawCsvRowsPageByFileId = jest
        .fn()
        .mockResolvedValueOnce(
          rawRows.map((row, index) => ({
            ...row,
            row_number: index + 1,
          })),
        )
        .mockResolvedValueOnce([]);
    });

    it('should insert OC staging rows', async () => {
      await service.run({ raw_csv_file_id: 'csv-file-oc-id' });

      expect(persistenceService.createJobRun).toHaveBeenCalledWith(
        'csv-staging-projection',
      );
      expect(persistenceService.linkJobRunToRawCsvFile).toHaveBeenCalledWith(
        mockJobRunRecord.id,
        'csv-file-oc-id',
      );
      expect(
        persistenceService.insertStgCsvOrdenCompraRows,
      ).toHaveBeenCalledTimes(1);

      const call = persistenceService.insertStgCsvOrdenCompraRows.mock.calls[0];

      if (call && call.length > 0) {
        const rows = (call[0] as { rows: Array<Record<string, unknown>> }).rows;

        expect(rows).toHaveLength(2);
        expect(rows[0].rawCsvRowId).toBe('raw-row-1');
        expect(rows[1].rawCsvRowId).toBe('raw-row-2');
        expect(rows[0]).not.toHaveProperty('rawCsvFileId');
      }
    });

    it('should preserve unknown columns in all_observed_fields', async () => {
      await service.run({ raw_csv_file_id: 'csv-file-oc-id' });

      const call = persistenceService.insertStgCsvOrdenCompraRows.mock.calls[0];

      if (call && call.length > 0) {
        const rows = (call[0] as { rows: Array<Record<string, unknown>> }).rows;

        expect(rows[0].allObservedFields).toEqual(rawRows[0].raw_row_json);
      }
    });

    it('should set sourceDataset to oc', async () => {
      await service.run({ raw_csv_file_id: 'csv-file-oc-id' });

      const call = persistenceService.insertStgCsvOrdenCompraRows.mock.calls[0];

      if (call && call.length > 0) {
        const rows = (call[0] as { rows: Array<Record<string, unknown>> }).rows;

        expect(rows[0].sourceDataset).toBe('oc');
      }
    });

    it('should skip rows with parseStatus !== success', async () => {
      persistenceService.countRawCsvRowsByFileId = jest
        .fn()
        .mockResolvedValue(3);
      persistenceService.getRawCsvRowsPageByFileId = jest
        .fn()
        .mockResolvedValueOnce([
          {
            id: 'r1',
            row_number: 1,
            raw_row_json: ['A', 'B', 'C', 'D', 'E'],
            parse_status: 'success',
          },
          {
            id: 'r2',
            row_number: 2,
            raw_row_json: ['F', 'G', 'H', 'I', 'J'],
            parse_status: 'error',
          },
          {
            id: 'r3',
            row_number: 3,
            raw_row_json: ['K', 'L', 'M', 'N', 'O'],
            parse_status: 'success',
          },
        ])
        .mockResolvedValueOnce([]);

      await expect(
        service.run({ raw_csv_file_id: 'csv-file-oc-id' }),
      ).rejects.toBeInstanceOf(MercadoPublicoRecordedJobFailureError);

      const call = persistenceService.insertStgCsvOrdenCompraRows.mock.calls[0];

      if (call && call.length > 0) {
        const rows = (call[0] as { rows: Array<Record<string, unknown>> }).rows;

        expect(rows).toHaveLength(2);
        expect(rows[0].rawCsvRowId).toBe('r1');
        expect(rows[1].rawCsvRowId).toBe('r3');
      }
    });
  });

  describe('licitacion staging projection', () => {
    const fileMeta = {
      id: 'csv-file-lic-id',
      source_dataset: 'licitaciones',
      source_period: '2026-06',
      source_file_name: 'lic_2026-6.csv',
      detected_delimiter: ';',
      quotechar: '"',
    };

    const rawFileRow = {
      id: 'csv-file-lic-id',
      source_system: 'datos-abiertos',
      source_dataset: 'licitaciones',
      source_url: 'https://example.com/lic.csv',
      source_file_name: 'lic_2026-6.csv',
      source_period: '2026-06',
      source_modality: null,
      file_checksum: 'def456',
      file_size_bytes: 2000,
      compression_type: null,
    };

    const licObservedColumns = [
      'CodigoExterno',
      'Codigoitem',
      'CodigoProveedor',
      'Nombre de la Oferta',
      'Oferta seleccionada',
      'Estado',
      'NombreUnidad',
    ];

    const rawRows = [
      {
        id: 'rl-1',
        raw_row_json: [
          'L1',
          '1',
          'P001',
          'Oferta A',
          'Si',
          'Publicada',
          'Municipio X',
        ],
        parse_status: 'success',
      },
      {
        id: 'rl-2',
        raw_row_json: [
          'L1',
          '1',
          'P002',
          'Oferta B',
          'No',
          'Publicada',
          'Municipio X',
        ],
        parse_status: 'success',
      },
    ];

    beforeEach(() => {
      persistenceService.getRawCsvFileMetaById = jest
        .fn()
        .mockResolvedValue(fileMeta);
      persistenceService.getRawCsvFileById = jest
        .fn()
        .mockResolvedValue(rawFileRow);
      persistenceService.getRawCsvFileObservedColumns = jest
        .fn()
        .mockResolvedValue(licObservedColumns);
      persistenceService.countRawCsvRowsByFileId = jest
        .fn()
        .mockResolvedValue(2);
      persistenceService.getRawCsvRowsPageByFileId = jest
        .fn()
        .mockResolvedValueOnce(
          rawRows.map((row, index) => ({
            ...row,
            row_number: index + 1,
          })),
        )
        .mockResolvedValueOnce([]);
    });

    it('should insert licitacion staging rows', async () => {
      await service.run({ raw_csv_file_id: 'csv-file-lic-id' });

      expect(
        persistenceService.insertStgCsvLicitacionRows,
      ).toHaveBeenCalledTimes(1);

      const call = persistenceService.insertStgCsvLicitacionRows.mock.calls[0];

      if (call && call.length > 0) {
        const rows = (call[0] as { rows: Array<Record<string, unknown>> }).rows;

        expect(rows).toHaveLength(2);
        expect(rows[0].rawCsvRowId).toBe('rl-1');
        expect(rows[1].rawCsvRowId).toBe('rl-2');
      }
    });

    it('should preserve raw Oferta seleccionada', async () => {
      await service.run({ raw_csv_file_id: 'csv-file-lic-id' });

      const call = persistenceService.insertStgCsvLicitacionRows.mock.calls[0];

      if (call && call.length > 0) {
        const rows = (call[0] as { rows: Array<Record<string, unknown>> }).rows;

        expect(rows[0].ofertaSeleccionada).toBe('Si');
        expect(rows[1].ofertaSeleccionada).toBe('No');
      }
    });

    it('should finalize job run with success', async () => {
      await service.run({ raw_csv_file_id: 'csv-file-lic-id' });

      expect(persistenceService.finalizeJobRun).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          recordsFetched: 2,
          recordsStaged: 2,
        }),
      );
    });

    it('should fail an enabled zero-record projection with a reason', async () => {
      persistenceService.countRawCsvRowsByFileId = jest
        .fn()
        .mockResolvedValue(0);
      persistenceService.getRawCsvRowsPageByFileId = jest
        .fn()
        .mockResolvedValue([]);

      await expect(
        service.run({ raw_csv_file_id: 'csv-file-lic-id' }),
      ).rejects.toBeInstanceOf(MercadoPublicoRecordedJobFailureError);

      expect(persistenceService.finalizeJobRun).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'failed',
          recordsFetched: 0,
          recordsStaged: 0,
          recordsFailed: 1,
          errorSummary: expect.any(String),
        }),
      );
    });
  });
});
