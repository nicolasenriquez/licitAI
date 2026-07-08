import { readFileSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import crypto from 'crypto';

import { BadRequestException } from '@nestjs/common';

import { MercadoPublicoCsvRawLoadService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-csv-raw-load.service';
import { MercadoPublicoConfigService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-config.service';
import { MercadoPublicoPersistenceService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-persistence.service';

type InsertRawCsvRowInput = {
  rawCsvFileId: string;
  ingestionJobId: string;
  sourceDataset: string;
  sourceFileName: string;
  sourcePeriod: string;
  rowNumber: number;
  rawRowText: string;
  rawRowJson: string[] | null;
  rowChecksum: string;
  parseStatus: 'success' | 'error';
  parseError: string | null;
};

const FIXTURES_DIR = join(
  __dirname,
  '..',
  '..',
  'services',
  'utils',
  '__tests__',
  'csv',
  'fixtures',
);

function prepareStorageRoot(
  fixtureFilename: string,
  sourceDataset: string,
  sourcePeriod: string,
): string {
  const storageRoot = join(tmpdir(), crypto.randomUUID());
  const targetDir = join(storageRoot, sourceDataset, sourcePeriod, '_default');

  mkdirSync(targetDir, { recursive: true });

  const fixtureContent = readFileSync(join(FIXTURES_DIR, fixtureFilename));

  writeFileSync(join(targetDir, 'fixture.csv'), fixtureContent);

  return storageRoot;
}

describe('MercadoPublicoCsvRawLoadService — licitaciones', () => {
  let service: MercadoPublicoCsvRawLoadService;
  let persistenceService: jest.Mocked<MercadoPublicoPersistenceService>;
  let capturedRows: InsertRawCsvRowInput[];
  let storageRoot: string;

  const mockJobRunRecord = {
    id: 'job-run-lic-id',
    jobRunId: 'run-lic-1',
    startedAt: new Date(),
  };

  beforeEach(() => {
    capturedRows = [];
    storageRoot = '';

    persistenceService = {
      createJobRun: jest.fn().mockResolvedValue(mockJobRunRecord),
      finalizeJobRun: jest.fn(),
      getRawCsvFileMetaById: jest.fn().mockResolvedValue({
        id: 'csv-lic-file-id',
        source_dataset: 'licitaciones',
        source_period: '2026-06',
        source_modality: null,
        source_file_name: 'fixture.csv',
        detected_encoding: 'latin-1',
        detected_delimiter: ';',
        quotechar: '"',
      }),
      insertRawCsvRows: jest
        .fn()
        .mockImplementation(async (input: { rows: InsertRawCsvRowInput[] }) => {
          capturedRows.push(...input.rows);
        }),
    } as unknown as jest.Mocked<MercadoPublicoPersistenceService>;
  });

  function createService(): MercadoPublicoCsvRawLoadService {
    const configService = {
      getSettings: jest.fn().mockReturnValue({
        csvStorageRoot: storageRoot,
      }),
    } as unknown as jest.Mocked<MercadoPublicoConfigService>;

    return new MercadoPublicoCsvRawLoadService(
      configService,
      persistenceService,
    );
  }

  function successRows(): InsertRawCsvRowInput[] {
    return capturedRows.filter((r) => r.parseStatus === 'success');
  }

  describe('minimal latin-1 semicolon fixture', () => {
    beforeEach(() => {
      storageRoot = prepareStorageRoot(
        'licitaciones-minimal-latin1-semicolon.csv',
        'licitaciones',
        '2026-06',
      );
      service = createService();
    });

    it('should load all 5 data rows (skip header, skip empty lines)', async () => {
      await service.run({ raw_csv_file_id: 'csv-lic-file-id' });

      expect(persistenceService.createJobRun).toHaveBeenCalledWith(
        'csv-raw-load',
        { rawCsvFileId: 'csv-lic-file-id' },
      );
      expect(successRows()).toHaveLength(5);
      expect(
        capturedRows.filter((r) => r.parseStatus === 'error'),
      ).toHaveLength(0);
    });

    it('should set source_dataset to licitaciones on every row', async () => {
      await service.run({ raw_csv_file_id: 'csv-lic-file-id' });

      for (const row of capturedRows) {
        expect(row.sourceDataset).toBe('licitaciones');
      }
    });
  });

  describe('repeated CodigoExterno across Codigoitem', () => {
    beforeEach(() => {
      storageRoot = prepareStorageRoot(
        'licitaciones-repeated-codigo-externo-with-codigoitem.csv',
        'licitaciones',
        '2026-06',
      );
      service = createService();
    });

    it('should persist all rows with repeated CodigoExterno', async () => {
      await service.run({ raw_csv_file_id: 'csv-lic-file-id' });

      expect(successRows()).toHaveLength(6);
    });

    it('should not enforce uniqueness on CodigoExterno in raw rows', async () => {
      await service.run({ raw_csv_file_id: 'csv-lic-file-id' });

      const l1rows = capturedRows.filter(
        (r) => r.parseStatus === 'success' && r.rawRowText.startsWith('L1;'),
      );

      expect(l1rows).toHaveLength(3);
    });

    it('should capture different Codigoitem values for repeated CodigoExterno', async () => {
      await service.run({ raw_csv_file_id: 'csv-lic-file-id' });

      const codigoitemValues = capturedRows
        .filter((r) => r.parseStatus === 'success')
        .map((r) => (r.rawRowJson ?? [])[1]);

      const unique = [...new Set(codigoitemValues)].filter(Boolean);

      expect(unique.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('repeated CodigoExterno across supplier/offer', () => {
    beforeEach(() => {
      storageRoot = prepareStorageRoot(
        'licitaciones-repeated-codigo-externo-with-supplier-offer.csv',
        'licitaciones',
        '2026-06',
      );
      service = createService();
    });

    it('should persist all rows for same CodigoExterno+Codigoitem with different suppliers', async () => {
      await service.run({ raw_csv_file_id: 'csv-lic-file-id' });

      expect(successRows()).toHaveLength(4);
    });

    it('should preserve raw Oferta seleccionada value before boolean normalization', async () => {
      await service.run({ raw_csv_file_id: 'csv-lic-file-id' });

      const rowWithSi = capturedRows.find(
        (r) =>
          r.parseStatus === 'success' &&
          Array.isArray(r.rawRowJson) &&
          r.rawRowJson[5] === 'Si',
      );

      expect(rowWithSi).toBeDefined();
      expect(rowWithSi!.rawRowJson![5]).toBe('Si');
    });

    it('should preserve latin-1 accented text when decoding rows', async () => {
      await service.run({ raw_csv_file_id: 'csv-lic-file-id' });

      const accentedRow = capturedRows.find(
        (row) =>
          row.parseStatus === 'success' &&
          Array.isArray(row.rawRowJson) &&
          row.rawRowJson[2] === 'P003',
      );

      expect(accentedRow).toBeDefined();
      expect(accentedRow!.rawRowJson![3]).toBe('Oferta económica');
    });
  });

  describe('110-column unusual column names', () => {
    beforeEach(() => {
      storageRoot = prepareStorageRoot(
        'licitaciones-110-columns-with-unusual-names.csv',
        'licitaciones',
        '2026-06',
      );
      service = createService();
    });

    it('should parse 110-column rows without dropping columns', async () => {
      await service.run({ raw_csv_file_id: 'csv-lic-file-id' });

      expect(successRows()).toHaveLength(2);
    });

    it('should preserve 110 values in rawRowJson for each row', async () => {
      await service.run({ raw_csv_file_id: 'csv-lic-file-id' });

      const row1 = successRows()[0];

      expect(row1).toBeDefined();
      expect(Array.isArray(row1!.rawRowJson)).toBe(true);

      const values = row1!.rawRowJson as string[];

      expect(values.length).toBe(110);
    });

    it('should not require all columns to be populated in every row (sparse row accepted)', async () => {
      await service.run({ raw_csv_file_id: 'csv-lic-file-id' });

      const row2 = capturedRows.find(
        (r) =>
          r.parseStatus === 'success' &&
          Array.isArray(r.rawRowJson) &&
          r.rawRowJson[0] === 'L2',
      );

      expect(row2).toBeDefined();

      const populated = (row2!.rawRowJson as string[]).filter(
        (v) => v !== undefined && v !== '',
      );

      expect(populated.length).toBeLessThan(110);
    });

    it('should set parseStatus success for all well-formed rows', async () => {
      await service.run({ raw_csv_file_id: 'csv-lic-file-id' });

      const errors = capturedRows.filter((r) => r.parseStatus === 'error');

      expect(errors).toHaveLength(0);
    });
  });

  describe('accented nombre_producto_generico header variant', () => {
    beforeEach(() => {
      storageRoot = prepareStorageRoot(
        'licitaciones-accented-producto-generico.csv',
        'licitaciones',
        '2026-06',
      );

      persistenceService.getRawCsvFileMetaById = jest.fn().mockResolvedValue({
        id: 'csv-lic-file-id',
        source_dataset: 'licitaciones',
        source_period: '2026-06',
        source_modality: null,
        source_file_name: 'fixture.csv',
        detected_encoding: 'utf-8',
        detected_delimiter: ';',
        quotechar: '"',
      });

      service = createService();
    });

    it('should map nombre_producto_generico via accented alias', async () => {
      await service.run({ raw_csv_file_id: 'csv-lic-file-id' });

      const success = successRows();

      expect(success).toHaveLength(2);
      expect(success[0]!.rawRowJson![4]).toBe('Producto Genérico A');
      expect(success[1]!.rawRowJson![4]).toBe('Producto Genérico B');
    });
  });

  describe('parsePayload for licitaciones context', () => {
    beforeEach(() => {
      storageRoot = '/tmp/csv';
      service = createService();
    });

    it('should throw BadRequestException when raw_csv_file_id is missing', async () => {
      await expect(service.run({})).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when raw_csv_file_id is empty', async () => {
      await expect(service.run({ raw_csv_file_id: '' })).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
