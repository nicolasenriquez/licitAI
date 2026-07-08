import { type DataSource } from 'typeorm';

import { MpStgJobRunRawCsvFileLinkSlowInstanceCommand } from './2-16-instance-command-slow-1782340007930-mp-stg-job-run-raw-csv-file-link';

describe('MpStgJobRunRawCsvFileLinkSlowInstanceCommand', () => {
  describe('runDataMigration', () => {
    it('adds raw_csv_file_id before backfilling raw-load and download links', async () => {
      const query = jest.fn().mockResolvedValue(undefined);
      const dataSource = { query } as unknown as DataSource;

      const command = new MpStgJobRunRawCsvFileLinkSlowInstanceCommand();

      await command.runDataMigration(dataSource);

      expect(query).toHaveBeenCalledTimes(3);

      const [addColumnSql, rawCsvFileBackfillSql, rawCsvRowBackfillSql] =
        query.mock.calls.map(([sql]: [string]) => sql);

      expect(addColumnSql).toContain(
        'ALTER TABLE mp.stg_job_run',
      );
      expect(addColumnSql).toContain(
        'ADD COLUMN IF NOT EXISTS raw_csv_file_id uuid NULL',
      );

      expect(rawCsvFileBackfillSql).toContain('FROM mp.raw_csv_file');
      expect(rawCsvFileBackfillSql).toContain(
        'MIN(id::text)::uuid AS raw_csv_file_id',
      );
      expect(rawCsvFileBackfillSql).toContain(
        'WHERE ingestion_job_id IS NOT NULL',
      );
      expect(rawCsvFileBackfillSql).toContain(
        'HAVING COUNT(DISTINCT id) = 1',
      );
      expect(rawCsvFileBackfillSql).toContain(
        "AND jr.job_name IN ('csv-oc-download', 'csv-licitaciones-download')",
      );
      expect(rawCsvFileBackfillSql).toContain(
        'AND jr.raw_csv_file_id IS NULL',
      );
      expect(rawCsvFileBackfillSql).not.toContain("'csv-raw-load'");

      expect(rawCsvRowBackfillSql).toContain('FROM mp.raw_csv_row');
      expect(rawCsvRowBackfillSql).toContain(
        'MIN(raw_csv_file_id::text)::uuid AS raw_csv_file_id',
      );
      expect(rawCsvRowBackfillSql).toContain(
        'WHERE ingestion_job_id IS NOT NULL',
      );
      expect(rawCsvRowBackfillSql).toContain(
        'HAVING COUNT(DISTINCT raw_csv_file_id) = 1',
      );
      expect(rawCsvRowBackfillSql).toContain(
        "AND jr.job_name = 'csv-raw-load'",
      );
      expect(rawCsvRowBackfillSql).toContain(
        'AND jr.raw_csv_file_id IS NULL',
      );
    });
  });
});
