import { type DataSource } from 'typeorm';

import { MercadoPublicoCsvFileHealthReadService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-csv-file-health-read.service';

type StoredRawCsvFileRow = {
  id: string;
  source_dataset: string;
  source_modality: string | null;
  source_period: string;
  source_file_name: string;
  file_checksum: string;
  detected_encoding: string;
  detected_delimiter: string;
  schema_fingerprint: string;
  row_count: number;
};

type StoredStgJobRunRow = {
  id: string;
  job_name: string;
  status: string;
  started_at: Date;
  finished_at: Date | null;
  raw_csv_file_id: string | null;
  records_fetched?: number | null;
  records_staged?: number | null;
  records_failed?: number | null;
};

class CsvFileHealthStore {
  private rawCsvFileRows: StoredRawCsvFileRow[] = [];
  private stgJobRunRows: StoredStgJobRunRow[] = [];

  registerRawCsvFiles(rows: StoredRawCsvFileRow[]): void {
    this.rawCsvFileRows = [...rows];
  }

  registerStgJobRuns(rows: StoredStgJobRunRow[]): void {
    this.stgJobRunRows = [...rows];
  }

  query<T>(sql: string): T[] {
    if (
      sql.includes('FROM mp.raw_csv_file rf') &&
      sql.includes('latest_completed_pipeline_job_status')
    ) {
      return this.fileQuery() as T[];
    }

    throw new Error(`Unrecognized query: ${sql.substring(0, 80)}`);
  }

  private fileQuery() {
    const sorted = [...this.rawCsvFileRows].sort((a, b) => {
      const dataset = a.source_dataset.localeCompare(b.source_dataset);

      if (dataset !== 0) {
        return dataset;
      }

      const period = b.source_period.localeCompare(a.source_period);

      if (period !== 0) {
        return period;
      }

      return a.source_file_name.localeCompare(b.source_file_name);
    });

    return sorted.map((row) => {
      const matchingJobRuns = this.stgJobRunRows.filter(
        (jobRun) =>
          ['csv-file-profile', 'csv-raw-load'].includes(jobRun.job_name) &&
          jobRun.raw_csv_file_id === row.id,
      );
      const rawLoadJobRuns = matchingJobRuns.filter(
        (jobRun) => jobRun.job_name === 'csv-raw-load',
      );

      const latestSuccessLoad = [...rawLoadJobRuns]
        .filter(
          (jobRun) =>
            jobRun.status === 'success' && jobRun.finished_at instanceof Date,
        )
        .sort((left, right) => {
          const finished =
            right.finished_at!.getTime() - left.finished_at!.getTime();

          if (finished !== 0) {
            return finished;
          }

          return right.started_at.getTime() - left.started_at.getTime();
        })[0];

      const latestCompletedPipelineJob = [...matchingJobRuns]
        .filter((jobRun) => jobRun.finished_at instanceof Date)
        .sort((left, right) => {
          const finished =
            right.finished_at!.getTime() - left.finished_at!.getTime();

          if (finished !== 0) {
            return finished;
          }

          return right.started_at.getTime() - left.started_at.getTime();
        })[0];

      const latestCompletedFinishedAt =
        latestCompletedPipelineJob?.finished_at ?? null;

      const hasInFlightPipelineJob = matchingJobRuns.some(
        (jobRun) =>
          jobRun.finished_at === null &&
          jobRun.started_at.getTime() >
            (latestCompletedFinishedAt?.getTime() ?? Number.NEGATIVE_INFINITY),
      );

      return {
        id: row.id,
        source_dataset: row.source_dataset,
        source_modality: row.source_modality,
        source_period: row.source_period,
        source_file_name: row.source_file_name,
        file_checksum: row.file_checksum,
        detected_encoding: row.detected_encoding,
        detected_delimiter: row.detected_delimiter,
        schema_fingerprint: row.schema_fingerprint,
        row_count: row.row_count,
        last_loaded_at: latestSuccessLoad?.finished_at ?? null,
        has_in_flight_pipeline_job: hasInFlightPipelineJob,
        latest_completed_pipeline_job_name:
          latestCompletedPipelineJob?.job_name ?? null,
        latest_completed_pipeline_job_status:
          latestCompletedPipelineJob?.status ?? null,
        latest_completed_records_fetched:
          latestCompletedPipelineJob?.records_fetched ?? null,
        latest_completed_records_staged:
          latestCompletedPipelineJob?.records_staged ?? null,
        latest_completed_records_failed:
          latestCompletedPipelineJob?.records_failed ?? null,
      };
    });
  }
}

describe('MercadoPublicoCsvFileHealthReadService (integration-shaped)', () => {
  const store = new CsvFileHealthStore();
  const buildDataSource = () =>
    ({
      query: jest.fn(async (sql: string) => store.query(sql)),
    }) as unknown as jest.Mocked<DataSource>;

  let service: MercadoPublicoCsvFileHealthReadService;

  beforeEach(() => {
    store.registerRawCsvFiles([]);
    store.registerStgJobRuns([]);
    service = new MercadoPublicoCsvFileHealthReadService(buildDataSource());
  });

  it('returns per-file health from the latest completed load and the latest successful load', async () => {
    const successAt = new Date('2026-07-04T10:00:00.000Z');
    const rerunAt = new Date('2026-07-04T12:00:00.000Z');

    store.registerRawCsvFiles([
      {
        id: 'f1',
        source_dataset: 'oc',
        source_modality: 'mes-6',
        source_period: '2026-06',
        source_file_name: '2026-6.csv',
        file_checksum: 'abc',
        detected_encoding: 'latin-1',
        detected_delimiter: ';',
        schema_fingerprint: 'fp1',
        row_count: 100,
      },
      {
        id: 'f2',
        source_dataset: 'licitaciones',
        source_modality: null,
        source_period: '2026-05',
        source_file_name: 'licitaciones.csv',
        file_checksum: 'def',
        detected_encoding: 'latin-1',
        detected_delimiter: ';',
        schema_fingerprint: 'fp2',
        row_count: 50,
      },
    ]);

    store.registerStgJobRuns([
      {
        id: 'jr1',
        job_name: 'csv-raw-load',
        status: 'success',
        started_at: new Date('2026-07-04T09:00:00.000Z'),
        finished_at: successAt,
        raw_csv_file_id: 'f1',
        records_fetched: 100,
        records_staged: 100,
        records_failed: 0,
      },
      {
        id: 'jr2',
        job_name: 'csv-raw-load',
        status: 'success',
        started_at: new Date('2026-07-04T11:00:00.000Z'),
        finished_at: rerunAt,
        raw_csv_file_id: 'f2',
        records_fetched: 50,
        records_staged: 49,
        records_failed: 1,
      },
    ]);

    const result = await service.getCsvFileHealth();

    expect(result.files).toHaveLength(2);

    const lic = result.files[0];

    expect(lic.sourceDataset).toBe('licitaciones');
    expect(lic.parseStatus).toBe('error');
    expect(lic.parseErrorCount).toBe(1);
    expect(lic.parseSuccessCount).toBe(49);
    expect(lic.lastLoadedAt).toEqual(rerunAt);

    const oc = result.files[1];

    expect(oc.sourceDataset).toBe('oc');
    expect(oc.sourcePeriod).toBe('2026-06');
    expect(oc.sourceFileName).toBe('2026-6.csv');
    expect(oc.fileChecksum).toBe('abc');
    expect(oc.detectedEncoding).toBe('latin-1');
    expect(oc.detectedDelimiter).toBe(';');
    expect(oc.schemaFingerprint).toBe('fp1');
    expect(oc.rowCount).toBe(100);
    expect(oc.sourceModality).toBe('mes-6');
    expect(oc.parseStatus).toBe('success');
    expect(oc.parseErrorCount).toBe(0);
    expect(oc.parseSuccessCount).toBe(100);
    expect(oc.lastLoadedAt).toEqual(successAt);
    expect(oc.freshness).toBeNull();
  });

  it('reports error for a partial failed load even if raw rows from that failed run were persisted', async () => {
    const previousSuccessAt = new Date('2026-07-04T08:00:00.000Z');
    const failedAt = new Date('2026-07-04T12:00:00.000Z');

    store.registerRawCsvFiles([
      {
        id: 'f1',
        source_dataset: 'oc',
        source_modality: null,
        source_period: '2026-06',
        source_file_name: '2026-6.csv',
        file_checksum: 'abc',
        detected_encoding: 'latin-1',
        detected_delimiter: ';',
        schema_fingerprint: 'fp1',
        row_count: 100,
      },
    ]);

    store.registerStgJobRuns([
      {
        id: 'jr-success',
        job_name: 'csv-raw-load',
        status: 'success',
        started_at: new Date('2026-07-04T07:00:00.000Z'),
        finished_at: previousSuccessAt,
        raw_csv_file_id: 'f1',
        records_fetched: 100,
        records_staged: 100,
        records_failed: 0,
      },
      {
        id: 'jr-failed',
        job_name: 'csv-raw-load',
        status: 'failed',
        started_at: new Date('2026-07-04T11:00:00.000Z'),
        finished_at: failedAt,
        raw_csv_file_id: 'f1',
        records_fetched: null,
        records_staged: null,
        records_failed: null,
      },
    ]);

    const result = await service.getCsvFileHealth();

    expect(result.files[0].parseStatus).toBe('error');
    expect(result.files[0].parseSuccessCount).toBe(0);
    expect(result.files[0].parseErrorCount).toBe(0);
    expect(result.files[0].lastLoadedAt).toEqual(previousSuccessAt);
  });

  it('returns pending when a file has no linked completed load', async () => {
    store.registerRawCsvFiles([
      {
        id: 'f1',
        source_dataset: 'oc',
        source_modality: null,
        source_period: '2026-06',
        source_file_name: '2026-6.csv',
        file_checksum: 'abc',
        detected_encoding: 'latin-1',
        detected_delimiter: ';',
        schema_fingerprint: 'fp1',
        row_count: 100,
      },
    ]);

    const result = await service.getCsvFileHealth();

    expect(result.files[0].parseStatus).toBe('pending');
    expect(result.files[0].lastLoadedAt).toBeNull();
  });

  it('returns error when a failed csv-file-profile is the latest completed pipeline job', async () => {
    store.registerRawCsvFiles([
      {
        id: 'f1',
        source_dataset: 'oc',
        source_modality: null,
        source_period: '2026-06',
        source_file_name: '2026-6.csv',
        file_checksum: 'abc',
        detected_encoding: 'latin-1',
        detected_delimiter: ';',
        schema_fingerprint: 'fp1',
        row_count: 100,
      },
    ]);

    store.registerStgJobRuns([
      {
        id: 'jr-profile',
        job_name: 'csv-file-profile',
        status: 'failed',
        started_at: new Date('2026-07-04T07:00:00.000Z'),
        finished_at: new Date('2026-07-04T08:00:00.000Z'),
        raw_csv_file_id: 'f1',
      },
    ]);

    const result = await service.getCsvFileHealth();

    expect(result.files[0].parseStatus).toBe('error');
    expect(result.files[0].lastLoadedAt).toBeNull();
  });

  it('returns pending when a successful csv-file-profile is the latest completed pipeline job', async () => {
    store.registerRawCsvFiles([
      {
        id: 'f1',
        source_dataset: 'oc',
        source_modality: null,
        source_period: '2026-06',
        source_file_name: '2026-6.csv',
        file_checksum: 'abc',
        detected_encoding: 'latin-1',
        detected_delimiter: ';',
        schema_fingerprint: 'fp1',
        row_count: 100,
      },
    ]);

    store.registerStgJobRuns([
      {
        id: 'jr-profile',
        job_name: 'csv-file-profile',
        status: 'success',
        started_at: new Date('2026-07-04T07:00:00.000Z'),
        finished_at: new Date('2026-07-04T08:00:00.000Z'),
        raw_csv_file_id: 'f1',
      },
    ]);

    const result = await service.getCsvFileHealth();

    expect(result.files[0].parseStatus).toBe('pending');
    expect(result.files[0].lastLoadedAt).toBeNull();
  });

  it('keeps pending while a csv-file-profile job is in flight', async () => {
    store.registerRawCsvFiles([
      {
        id: 'f1',
        source_dataset: 'oc',
        source_modality: null,
        source_period: '2026-06',
        source_file_name: '2026-6.csv',
        file_checksum: 'abc',
        detected_encoding: 'latin-1',
        detected_delimiter: ';',
        schema_fingerprint: 'fp1',
        row_count: 100,
      },
    ]);

    store.registerStgJobRuns([
      {
        id: 'jr-profile',
        job_name: 'csv-file-profile',
        status: 'failed',
        started_at: new Date('2026-07-04T09:00:00.000Z'),
        finished_at: null,
        raw_csv_file_id: 'f1',
      },
    ]);

    const result = await service.getCsvFileHealth();

    expect(result.files[0].parseStatus).toBe('pending');
    expect(result.files[0].lastLoadedAt).toBeNull();
  });

  it('keeps pending while a load is still in flight', async () => {
    const previousSuccessAt = new Date('2026-07-04T08:00:00.000Z');

    store.registerRawCsvFiles([
      {
        id: 'f1',
        source_dataset: 'oc',
        source_modality: null,
        source_period: '2026-06',
        source_file_name: '2026-6.csv',
        file_checksum: 'abc',
        detected_encoding: 'latin-1',
        detected_delimiter: ';',
        schema_fingerprint: 'fp1',
        row_count: 100,
      },
    ]);

    store.registerStgJobRuns([
      {
        id: 'jr-success',
        job_name: 'csv-raw-load',
        status: 'success',
        started_at: new Date('2026-07-04T07:00:00.000Z'),
        finished_at: previousSuccessAt,
        raw_csv_file_id: 'f1',
        records_fetched: 100,
        records_staged: 100,
        records_failed: 0,
      },
      {
        id: 'jr-in-flight',
        job_name: 'csv-raw-load',
        status: 'failed',
        started_at: new Date('2026-07-04T09:00:00.000Z'),
        finished_at: null,
        raw_csv_file_id: 'f1',
      },
    ]);

    const result = await service.getCsvFileHealth();

    expect(result.files[0].parseStatus).toBe('pending');
    expect(result.files[0].lastLoadedAt).toEqual(previousSuccessAt);
  });

  it('uses the newest completion when overlapping runs finish out of start order', async () => {
    const newerFinishedAt = new Date('2026-07-04T12:00:00.000Z');
    const olderFinishedLaterAt = new Date('2026-07-04T13:00:00.000Z');

    store.registerRawCsvFiles([
      {
        id: 'f1',
        source_dataset: 'oc',
        source_modality: null,
        source_period: '2026-06',
        source_file_name: '2026-6.csv',
        file_checksum: 'abc',
        detected_encoding: 'latin-1',
        detected_delimiter: ';',
        schema_fingerprint: 'fp1',
        row_count: 100,
      },
    ]);

    store.registerStgJobRuns([
      {
        id: 'jr-long-running-success',
        job_name: 'csv-raw-load',
        status: 'success',
        started_at: new Date('2026-07-04T08:00:00.000Z'),
        finished_at: olderFinishedLaterAt,
        raw_csv_file_id: 'f1',
        records_fetched: 100,
        records_staged: 100,
        records_failed: 0,
      },
      {
        id: 'jr-retry-failed',
        job_name: 'csv-raw-load',
        status: 'failed',
        started_at: new Date('2026-07-04T11:00:00.000Z'),
        finished_at: newerFinishedAt,
        raw_csv_file_id: 'f1',
        records_fetched: null,
        records_staged: null,
        records_failed: null,
      },
    ]);

    const result = await service.getCsvFileHealth();

    expect(result.files[0].parseStatus).toBe('success');
    expect(result.files[0].parseSuccessCount).toBe(100);
    expect(result.files[0].parseErrorCount).toBe(0);
    expect(result.files[0].lastLoadedAt).toEqual(olderFinishedLaterAt);
  });

  it('ignores a stale unfinished run after a newer successful completion', async () => {
    const previousSuccessAt = new Date('2026-07-04T12:00:00.000Z');

    store.registerRawCsvFiles([
      {
        id: 'f1',
        source_dataset: 'oc',
        source_modality: null,
        source_period: '2026-06',
        source_file_name: '2026-6.csv',
        file_checksum: 'abc',
        detected_encoding: 'latin-1',
        detected_delimiter: ';',
        schema_fingerprint: 'fp1',
        row_count: 100,
      },
    ]);

    store.registerStgJobRuns([
      {
        id: 'jr-stale-in-flight',
        job_name: 'csv-raw-load',
        status: 'failed',
        started_at: new Date('2026-07-04T07:00:00.000Z'),
        finished_at: null,
        raw_csv_file_id: 'f1',
      },
      {
        id: 'jr-success',
        job_name: 'csv-raw-load',
        status: 'success',
        started_at: new Date('2026-07-04T11:00:00.000Z'),
        finished_at: previousSuccessAt,
        raw_csv_file_id: 'f1',
        records_fetched: 100,
        records_staged: 100,
        records_failed: 0,
      },
    ]);

    const result = await service.getCsvFileHealth();

    expect(result.files[0].parseStatus).toBe('success');
    expect(result.files[0].parseSuccessCount).toBe(100);
    expect(result.files[0].parseErrorCount).toBe(0);
    expect(result.files[0].lastLoadedAt).toEqual(previousSuccessAt);
  });

  it('ignores a stale unfinished run after a newer failed completion', async () => {
    const previousSuccessAt = new Date('2026-07-04T08:00:00.000Z');
    const failedAt = new Date('2026-07-04T12:00:00.000Z');

    store.registerRawCsvFiles([
      {
        id: 'f1',
        source_dataset: 'oc',
        source_modality: null,
        source_period: '2026-06',
        source_file_name: '2026-6.csv',
        file_checksum: 'abc',
        detected_encoding: 'latin-1',
        detected_delimiter: ';',
        schema_fingerprint: 'fp1',
        row_count: 100,
      },
    ]);

    store.registerStgJobRuns([
      {
        id: 'jr-success',
        job_name: 'csv-raw-load',
        status: 'success',
        started_at: new Date('2026-07-04T07:00:00.000Z'),
        finished_at: previousSuccessAt,
        raw_csv_file_id: 'f1',
        records_fetched: 100,
        records_staged: 100,
        records_failed: 0,
      },
      {
        id: 'jr-stale-in-flight',
        job_name: 'csv-raw-load',
        status: 'failed',
        started_at: new Date('2026-07-04T09:00:00.000Z'),
        finished_at: null,
        raw_csv_file_id: 'f1',
      },
      {
        id: 'jr-failed',
        job_name: 'csv-raw-load',
        status: 'failed',
        started_at: new Date('2026-07-04T11:00:00.000Z'),
        finished_at: failedAt,
        raw_csv_file_id: 'f1',
        records_fetched: null,
        records_staged: null,
        records_failed: null,
      },
    ]);

    const result = await service.getCsvFileHealth();

    expect(result.files[0].parseStatus).toBe('error');
    expect(result.files[0].parseSuccessCount).toBe(0);
    expect(result.files[0].parseErrorCount).toBe(0);
    expect(result.files[0].lastLoadedAt).toEqual(previousSuccessAt);
  });

  it('uses the direct job-run file link for backfilled historic runs', async () => {
    const historicLoadAt = new Date('2026-07-04T08:00:00.000Z');

    store.registerRawCsvFiles([
      {
        id: 'f1',
        source_dataset: 'oc',
        source_modality: null,
        source_period: '2026-06',
        source_file_name: '2026-6.csv',
        file_checksum: 'abc',
        detected_encoding: 'latin-1',
        detected_delimiter: ';',
        schema_fingerprint: 'fp1',
        row_count: 100,
      },
    ]);

    store.registerStgJobRuns([
      {
        id: 'jr-backfilled',
        job_name: 'csv-raw-load',
        status: 'success',
        started_at: new Date('2026-07-04T07:00:00.000Z'),
        finished_at: historicLoadAt,
        raw_csv_file_id: 'f1',
        records_fetched: 100,
        records_staged: 100,
        records_failed: 0,
      },
    ]);

    const result = await service.getCsvFileHealth();

    expect(result.files[0].parseStatus).toBe('success');
    expect(result.files[0].lastLoadedAt).toEqual(historicLoadAt);
  });

  it('ignores csv-raw-load job runs that have no raw_csv_file_id link', async () => {
    store.registerRawCsvFiles([
      {
        id: 'f1',
        source_dataset: 'oc',
        source_modality: null,
        source_period: '2026-06',
        source_file_name: '2026-6.csv',
        file_checksum: 'abc',
        detected_encoding: 'latin-1',
        detected_delimiter: ';',
        schema_fingerprint: 'fp1',
        row_count: 0,
      },
    ]);

    store.registerStgJobRuns([
      {
        id: 'jr-download',
        job_name: 'csv-raw-load',
        status: 'success',
        started_at: new Date('2026-07-04T07:00:00.000Z'),
        finished_at: new Date('2026-07-04T08:00:00.000Z'),
        raw_csv_file_id: null,
        records_fetched: 0,
        records_staged: 0,
        records_failed: 0,
      },
    ]);

    const result = await service.getCsvFileHealth();

    expect(result.files[0].parseStatus).toBe('pending');
    expect(result.files[0].lastLoadedAt).toBeNull();
  });

  it('ignores a stale unfinished legacy run after a newer linked completion', async () => {
    const linkedSuccessAt = new Date('2026-07-04T12:00:00.000Z');

    store.registerRawCsvFiles([
      {
        id: 'f1',
        source_dataset: 'oc',
        source_modality: null,
        source_period: '2026-06',
        source_file_name: '2026-6.csv',
        file_checksum: 'abc',
        detected_encoding: 'latin-1',
        detected_delimiter: ';',
        schema_fingerprint: 'fp1',
        row_count: 100,
      },
    ]);

    store.registerStgJobRuns([
      {
        id: 'jr-stale-legacy',
        job_name: 'csv-raw-load',
        status: 'failed',
        started_at: new Date('2026-07-04T07:00:00.000Z'),
        finished_at: null,
        raw_csv_file_id: null,
      },
      {
        id: 'jr-linked-success',
        job_name: 'csv-raw-load',
        status: 'success',
        started_at: new Date('2026-07-04T11:00:00.000Z'),
        finished_at: linkedSuccessAt,
        raw_csv_file_id: 'f1',
        records_fetched: 100,
        records_staged: 100,
        records_failed: 0,
      },
    ]);

    const result = await service.getCsvFileHealth();

    expect(result.files[0].parseStatus).toBe('success');
    expect(result.files[0].lastLoadedAt).toEqual(linkedSuccessAt);
  });

  it('sorts by source_dataset ASC, source_period DESC, source_file_name ASC', async () => {
    store.registerRawCsvFiles([
      {
        id: 'f1',
        source_dataset: 'oc',
        source_modality: null,
        source_period: '2026-05',
        source_file_name: 'b.csv',
        file_checksum: 'chk1',
        detected_encoding: '',
        detected_delimiter: '',
        schema_fingerprint: '',
        row_count: 0,
      },
      {
        id: 'f2',
        source_dataset: 'licitaciones',
        source_modality: null,
        source_period: '2026-06',
        source_file_name: 'a.csv',
        file_checksum: 'chk2',
        detected_encoding: '',
        detected_delimiter: '',
        schema_fingerprint: '',
        row_count: 0,
      },
      {
        id: 'f3',
        source_dataset: 'oc',
        source_modality: null,
        source_period: '2026-06',
        source_file_name: 'a.csv',
        file_checksum: 'chk3',
        detected_encoding: '',
        detected_delimiter: '',
        schema_fingerprint: '',
        row_count: 0,
      },
    ]);

    const result = await service.getCsvFileHealth();

    expect(result.files).toHaveLength(3);
    expect(result.files[0].sourceDataset).toBe('licitaciones');
    expect(result.files[0].sourcePeriod).toBe('2026-06');
    expect(result.files[1].sourceDataset).toBe('oc');
    expect(result.files[1].sourcePeriod).toBe('2026-06');
    expect(result.files[2].sourceDataset).toBe('oc');
    expect(result.files[2].sourcePeriod).toBe('2026-05');
  });
});
