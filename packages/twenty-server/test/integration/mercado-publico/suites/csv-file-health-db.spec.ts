import { type DataSource } from 'typeorm';

import { MpSchemaFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1782340007505-mp-schema';
import { MpRawApiPayloadFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1782340007517-mp-raw-api-payload';
import { MpRawCsvFileFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1782340007600-mp-raw-csv-file';
import { MpRawCsvRowFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1782340007700-mp-raw-csv-row';
import { MpStgJobRunFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1782340007800-mp-stg-job-run';
import { MpRawCsvFileDedupeModalityFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1782340007920-mp-raw-csv-file-dedupe-modality';
import { MpRawCsvFileDedupeNullsNotDistinctFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1783191615520-mp-raw-csv-file-dedupe-nulls-not-distinct';
import { DropRawCsvFileIngestionJobIdFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1783191615514-drop-raw-csv-file-ingestion-job-id';
import { MpStgJobRunRawCsvFileLinkSlowInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-slow-1782340007930-mp-stg-job-run-raw-csv-file-link';
import { rawDataSource } from 'src/database/typeorm/raw/raw.datasource';
import { MercadoPublicoCsvFileHealthReadService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-csv-file-health-read.service';

const TRUNCATE_TABLES = `
  mp.raw_csv_file,
  mp.stg_job_run
`;

describe('Mercado Publico CSV file health (db-backed)', () => {
  let dataSource: DataSource;
  let service: MercadoPublicoCsvFileHealthReadService;

  beforeAll(async () => {
    jest.useRealTimers();

    dataSource = rawDataSource;

    if (!dataSource.isInitialized) {
      await dataSource.initialize();
    }

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
      await new MpRawCsvFileDedupeModalityFastInstanceCommand().up(queryRunner);
      await new MpRawCsvFileDedupeNullsNotDistinctFastInstanceCommand().up(
        queryRunner,
      );
      await new DropRawCsvFileIngestionJobIdFastInstanceCommand().up(
        queryRunner,
      );
      await new MpStgJobRunRawCsvFileLinkSlowInstanceCommand().up(queryRunner);

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }

    service = new MercadoPublicoCsvFileHealthReadService(dataSource);
  });

  beforeEach(async () => {
    await dataSource.query(
      `TRUNCATE TABLE ${TRUNCATE_TABLES} RESTART IDENTITY CASCADE`,
    );
  });

  afterAll(async () => {
    await dataSource.query(
      `TRUNCATE TABLE ${TRUNCATE_TABLES} RESTART IDENTITY CASCADE`,
    );

    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  });

  const insertRawCsvFileRow = async (input: {
    id: string;
    sourceDataset: string;
    sourcePeriod: string;
    sourceFileName: string;
    fileChecksum: string;
    sourceModality?: string | null;
    rowCount?: number;
  }) => {
    await dataSource.query(
      `
        INSERT INTO mp.raw_csv_file (
          id, source_system, source_dataset, source_url,
          source_file_name, source_period, source_modality,
          downloaded_at, file_checksum, file_size_bytes,
          detected_encoding, detected_delimiter, quotechar,
          header_raw, observed_columns, column_count,
          schema_fingerprint, row_count
        )
        VALUES (
          $1, 'datos-abiertos', $2, 'https://example.com/' || $3,
          $3, $4, $5,
          now(), $6, 1024,
          'utf-8', ';', '"',
          'col1;col2', '["col1","col2"]'::jsonb, 2,
          'fp-sha-1', $7
        )
      `,
      [
        input.id,
        input.sourceDataset,
        input.sourceFileName,
        input.sourcePeriod,
        input.sourceModality ?? null,
        input.fileChecksum,
        input.rowCount ?? 3,
      ],
    );
  };

  const insertStgJobRun = async (input: {
    id: string;
    jobName: string;
    status: string;
    rawCsvFileId: string | null;
    startedAt: Date;
    finishedAt: Date | null;
    recordsFetched?: number;
    recordsStaged?: number;
    recordsFailed?: number;
  }) => {
    const jobRunId = `${input.jobName}-${input.id}-run`;

    await dataSource.query(
      `
        INSERT INTO mp.stg_job_run (
          id, job_name, job_run_id, status,
          started_at, finished_at, raw_csv_file_id,
          records_fetched, records_staged, records_canonicalized, records_failed
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 0, $10)
      `,
      [
        input.id,
        input.jobName,
        jobRunId,
        input.status,
        input.startedAt,
        input.finishedAt,
        input.rawCsvFileId,
        input.recordsFetched ?? 1,
        input.recordsStaged ?? 1,
        input.recordsFailed ?? 0,
      ],
    );
  };

  it('reports parseStatus success when last load completed cleanly', async () => {
    const fileId = '00000000-0000-0000-0000-000000000001';
    const jobRunId = '00000000-0000-0000-0000-000000000002';

    await insertRawCsvFileRow({
      id: fileId,
      sourceDataset: 'oc',
      sourcePeriod: '2026-06',
      sourceFileName: 'oc-2026-06.csv',
      fileChecksum: 'cs-001',
      rowCount: 3,
    });
    await insertStgJobRun({
      id: jobRunId,
      jobName: 'csv-raw-load',
      status: 'success',
      rawCsvFileId: fileId,
      startedAt: new Date('2026-06-30T12:00:00.000Z'),
      finishedAt: new Date('2026-06-30T12:05:00.000Z'),
      recordsFetched: 3,
      recordsStaged: 3,
      recordsFailed: 0,
    });

    const result = await service.getCsvFileHealth();

    expect(result.files).toHaveLength(1);
    expect(result.files[0].parseStatus).toBe('success');
    expect(result.files[0].parseErrorCount).toBe(0);
    expect(result.files[0].parseSuccessCount).toBe(3);
    expect(result.files[0].lastLoadedAt).toBeTruthy();
    expect(result.files[0].sourceFileName).toBe('oc-2026-06.csv');
  });

  it('reports parseStatus error when some rows failed', async () => {
    const fileId = '00000000-0000-0000-0000-000000000003';
    const jobRunId = '00000000-0000-0000-0000-000000000004';

    await insertRawCsvFileRow({
      id: fileId,
      sourceDataset: 'oc',
      sourcePeriod: '2026-06',
      sourceFileName: 'oc-2026-06-b.csv',
      fileChecksum: 'cs-002',
      rowCount: 10,
    });
    await insertStgJobRun({
      id: jobRunId,
      jobName: 'csv-raw-load',
      status: 'success',
      rawCsvFileId: fileId,
      startedAt: new Date('2026-06-30T13:00:00.000Z'),
      finishedAt: new Date('2026-06-30T13:05:00.000Z'),
      recordsFetched: 10,
      recordsStaged: 8,
      recordsFailed: 2,
    });

    const result = await service.getCsvFileHealth();

    expect(result.files).toHaveLength(1);
    expect(result.files[0].parseStatus).toBe('error');
    expect(result.files[0].parseErrorCount).toBe(2);
    expect(result.files[0].parseSuccessCount).toBe(8);
    expect(result.files[0].rowCount).toBe(10);
  });

  it('reports parseStatus pending when an in-flight job exists', async () => {
    const fileId = '00000000-0000-0000-0000-000000000005';
    const completedJobId = '00000000-0000-0000-0000-000000000006';
    const inFlightJobId = '00000000-0000-0000-0000-000000000007';

    await insertRawCsvFileRow({
      id: fileId,
      sourceDataset: 'licitaciones',
      sourcePeriod: '2026-05',
      sourceFileName: 'lic-2026-05.csv',
      fileChecksum: 'cs-003',
      rowCount: 50,
    });
    await insertStgJobRun({
      id: completedJobId,
      jobName: 'csv-raw-load',
      status: 'success',
      rawCsvFileId: fileId,
      startedAt: new Date('2026-06-28T10:00:00.000Z'),
      finishedAt: new Date('2026-06-28T10:10:00.000Z'),
      recordsFetched: 50,
      recordsStaged: 50,
      recordsFailed: 0,
    });
    await insertStgJobRun({
      id: inFlightJobId,
      jobName: 'csv-raw-load',
      status: 'retryable_failed',
      rawCsvFileId: fileId,
      startedAt: new Date('2026-06-30T14:00:00.000Z'),
      finishedAt: null,
    });

    const result = await service.getCsvFileHealth();

    expect(result.files).toHaveLength(1);
    expect(result.files[0].parseStatus).toBe('pending');
    expect(result.files[0].sourcePeriod).toBe('2026-05');
  });

  it('orders by dataset asc, period desc, fileName asc', async () => {
    const fileId1 = '00000000-0000-0000-0000-000000000008';
    const fileId2 = '00000000-0000-0000-0000-000000000009';
    const fileId3 = '00000000-0000-0000-0000-000000000010';

    await insertRawCsvFileRow({
      id: fileId1,
      sourceDataset: 'oc',
      sourcePeriod: '2026-06',
      sourceFileName: 'b.csv',
      fileChecksum: 'cs-a',
    });
    await insertRawCsvFileRow({
      id: fileId2,
      sourceDataset: 'oc',
      sourcePeriod: '2026-06',
      sourceFileName: 'a.csv',
      fileChecksum: 'cs-b',
    });
    await insertRawCsvFileRow({
      id: fileId3,
      sourceDataset: 'licitaciones',
      sourcePeriod: '2026-05',
      sourceFileName: 'z.csv',
      fileChecksum: 'cs-c',
    });

    const result = await service.getCsvFileHealth();

    expect(result.files).toHaveLength(3);
    // licitaciones sorts before oc
    expect(result.files[0].sourceDataset).toBe('licitaciones');
    expect(result.files[0].sourcePeriod).toBe('2026-05');
    // oc/2026-06/a.csv sorts before oc/2026-06/b.csv
    expect(result.files[1].sourceDataset).toBe('oc');
    expect(result.files[1].sourceFileName).toBe('a.csv');
    expect(result.files[2].sourceDataset).toBe('oc');
    expect(result.files[2].sourceFileName).toBe('b.csv');
  });

  it('returns empty files list when no raw_csv_file rows exist', async () => {
    const result = await service.getCsvFileHealth();

    expect(result.files).toHaveLength(0);
    expect(result.generatedAt).toBeInstanceOf(Date);
  });

  it('reports parseStatus pending when no job_run exists for the file', async () => {
    const fileId = '00000000-0000-0000-0000-000000000011';

    await insertRawCsvFileRow({
      id: fileId,
      sourceDataset: 'oc',
      sourcePeriod: '2026-04',
      sourceFileName: 'oc-2026-04.csv',
      fileChecksum: 'cs-004',
    });

    const result = await service.getCsvFileHealth();

    expect(result.files).toHaveLength(1);
    expect(result.files[0].parseStatus).toBe('pending');
    expect(result.files[0].lastLoadedAt).toBeNull();
  });

  it('reports parseStatus error when csv-file-profile fails before any csv-raw-load run', async () => {
    const fileId = '00000000-0000-0000-0000-000000000015';
    const profileJobId = '00000000-0000-0000-0000-000000000016';

    await insertRawCsvFileRow({
      id: fileId,
      sourceDataset: 'oc',
      sourcePeriod: '2026-04',
      sourceFileName: 'oc-2026-04-profile-failed.csv',
      fileChecksum: 'cs-007',
    });
    await insertStgJobRun({
      id: profileJobId,
      jobName: 'csv-file-profile',
      status: 'failed',
      rawCsvFileId: fileId,
      startedAt: new Date('2026-04-15T09:00:00.000Z'),
      finishedAt: new Date('2026-04-15T09:01:00.000Z'),
      recordsFetched: 0,
      recordsStaged: 0,
      recordsFailed: 1,
    });

    const result = await service.getCsvFileHealth();

    expect(result.files).toHaveLength(1);
    expect(result.files[0].parseStatus).toBe('error');
    expect(result.files[0].lastLoadedAt).toBeNull();
  });

  it('reports parseStatus pending when csv-file-profile succeeded but csv-raw-load has not completed yet', async () => {
    const fileId = '00000000-0000-0000-0000-000000000017';
    const profileJobId = '00000000-0000-0000-0000-000000000018';

    await insertRawCsvFileRow({
      id: fileId,
      sourceDataset: 'oc',
      sourcePeriod: '2026-04',
      sourceFileName: 'oc-2026-04-profile-success.csv',
      fileChecksum: 'cs-008',
    });
    await insertStgJobRun({
      id: profileJobId,
      jobName: 'csv-file-profile',
      status: 'success',
      rawCsvFileId: fileId,
      startedAt: new Date('2026-04-16T09:00:00.000Z'),
      finishedAt: new Date('2026-04-16T09:01:00.000Z'),
      recordsFetched: 0,
      recordsStaged: 0,
      recordsFailed: 0,
    });

    const result = await service.getCsvFileHealth();

    expect(result.files).toHaveLength(1);
    expect(result.files[0].parseStatus).toBe('pending');
    expect(result.files[0].lastLoadedAt).toBeNull();
  });

  it('reports parseStatus pending when csv-file-profile is in flight', async () => {
    const fileId = '00000000-0000-0000-0000-000000000019';
    const profileJobId = '00000000-0000-0000-0000-000000000020';

    await insertRawCsvFileRow({
      id: fileId,
      sourceDataset: 'oc',
      sourcePeriod: '2026-04',
      sourceFileName: 'oc-2026-04-profile-in-flight.csv',
      fileChecksum: 'cs-009',
    });
    await insertStgJobRun({
      id: profileJobId,
      jobName: 'csv-file-profile',
      status: 'retryable_failed',
      rawCsvFileId: fileId,
      startedAt: new Date('2026-04-17T09:00:00.000Z'),
      finishedAt: null,
      recordsFetched: 0,
      recordsStaged: 0,
      recordsFailed: 0,
    });

    const result = await service.getCsvFileHealth();

    expect(result.files).toHaveLength(1);
    expect(result.files[0].parseStatus).toBe('pending');
    expect(result.files[0].lastLoadedAt).toBeNull();
  });

  it('reports parseStatus error when latest job status is not success', async () => {
    const fileId = '00000000-0000-0000-0000-000000000012';
    const jobRunId = '00000000-0000-0000-0000-000000000013';

    await insertRawCsvFileRow({
      id: fileId,
      sourceDataset: 'licitaciones',
      sourcePeriod: '2026-03',
      sourceFileName: 'lic-2026-03.csv',
      fileChecksum: 'cs-005',
      rowCount: 100,
    });
    await insertStgJobRun({
      id: jobRunId,
      jobName: 'csv-raw-load',
      status: 'failed',
      rawCsvFileId: fileId,
      startedAt: new Date('2026-03-15T09:00:00.000Z'),
      finishedAt: new Date('2026-03-15T09:01:00.000Z'),
      recordsFetched: 0,
      recordsStaged: 0,
      recordsFailed: 100,
    });

    const result = await service.getCsvFileHealth();

    expect(result.files).toHaveLength(1);
    expect(result.files[0].parseStatus).toBe('error');
    expect(result.files[0].parseErrorCount).toBe(100);
    expect(result.files[0].parseSuccessCount).toBe(0);
  });

  it('reports sourceModality when the raw_csv_file has it', async () => {
    const fileId = '00000000-0000-0000-0000-000000000014';

    await insertRawCsvFileRow({
      id: fileId,
      sourceDataset: 'oc',
      sourcePeriod: '2026-06',
      sourceFileName: 'oc-modality.csv',
      fileChecksum: 'cs-006',
      sourceModality: 'semestre-1',
    });

    const result = await service.getCsvFileHealth();

    expect(result.files[0].sourceModality).toBe('semestre-1');
  });
});
