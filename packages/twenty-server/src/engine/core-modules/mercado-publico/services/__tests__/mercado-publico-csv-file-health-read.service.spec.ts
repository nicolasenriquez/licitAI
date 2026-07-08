import { type DataSource } from 'typeorm';

import { MercadoPublicoCsvFileHealthReadService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-csv-file-health-read.service';

describe('MercadoPublicoCsvFileHealthReadService', () => {
  const mockQuery = jest.fn();
  const mockCoreDataSource = {
    query: mockQuery,
  } as unknown as jest.Mocked<DataSource>;

  const service = new MercadoPublicoCsvFileHealthReadService(
    mockCoreDataSource,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const buildFileRow = (overrides: Partial<Record<string, unknown>> = {}) => ({
    id: 'file-uuid-1',
    source_dataset: 'oc',
    source_modality: null,
    source_period: '2026-06',
    source_file_name: '2026-6.csv',
    file_checksum: 'abc123',
    detected_encoding: 'latin-1',
    detected_delimiter: ';',
    schema_fingerprint: 'fp1',
    row_count: 100,
    last_loaded_at: null,
    has_in_flight_pipeline_job: false,
    latest_completed_load_job_status: null,
    latest_completed_load_records_fetched: null,
    latest_completed_load_records_staged: null,
    latest_completed_load_records_failed: null,
    latest_completed_profile_job_status: null,
    ...overrides,
  });

  it('returns empty files array when no raw_csv_file rows exist', async () => {
    mockQuery.mockResolvedValueOnce([]);

    const result = await service.getCsvFileHealth();

    expect(result.files).toEqual([]);
    expect(result.generatedAt).toBeInstanceOf(Date);
    expect(mockQuery).toHaveBeenCalledTimes(1);
  });

  it('returns one entry per raw_csv_file row with file metadata', async () => {
    mockQuery.mockResolvedValueOnce([
      buildFileRow({ id: 'f1', source_dataset: 'oc' }),
      buildFileRow({
        id: 'f2',
        source_dataset: 'licitaciones',
        source_period: '2026-05',
      }),
    ]);

    const result = await service.getCsvFileHealth();

    expect(result.files).toHaveLength(2);

    const oc = result.files[0];

    expect(oc.sourceDataset).toBe('oc');
    expect(oc.sourcePeriod).toBe('2026-06');
    expect(oc.sourceFileName).toBe('2026-6.csv');
    expect(oc.fileChecksum).toBe('abc123');
    expect(oc.detectedEncoding).toBe('latin-1');
    expect(oc.detectedDelimiter).toBe(';');
    expect(oc.schemaFingerprint).toBe('fp1');
    expect(oc.rowCount).toBe(100);
    expect(oc.sourceModality).toBeNull();
    expect(result.generatedAt).toBeInstanceOf(Date);
    expect(mockQuery).toHaveBeenCalledTimes(1);
  });

  it('converts empty profiling fields to null', async () => {
    mockQuery.mockResolvedValueOnce([
      buildFileRow({
        detected_encoding: '',
        detected_delimiter: '',
        schema_fingerprint: '',
      }),
    ]);

    const result = await service.getCsvFileHealth();

    expect(result.files[0].detectedEncoding).toBeNull();
    expect(result.files[0].detectedDelimiter).toBeNull();
    expect(result.files[0].schemaFingerprint).toBeNull();
  });

  it('reports success from the latest completed successful load', async () => {
    const loadedAt = new Date('2026-07-04T10:00:00.000Z');

    mockQuery.mockResolvedValueOnce([
      buildFileRow({
        id: 'f1',
        last_loaded_at: loadedAt,
        latest_completed_load_job_status: 'success',
        latest_completed_load_records_fetched: 100,
        latest_completed_load_records_staged: 100,
        latest_completed_load_records_failed: 0,
      }),
    ]);

    const result = await service.getCsvFileHealth();

    expect(result.files[0].parseStatus).toBe('success');
    expect(result.files[0].parseSuccessCount).toBe(100);
    expect(result.files[0].parseErrorCount).toBe(0);
    expect(result.files[0].lastLoadedAt).toEqual(loadedAt);
  });

  it('reports error when the latest completed successful load has failed rows', async () => {
    mockQuery.mockResolvedValueOnce([
      buildFileRow({
        id: 'f1',
        latest_completed_load_job_status: 'success',
        latest_completed_load_records_fetched: 100,
        latest_completed_load_records_staged: 98,
        latest_completed_load_records_failed: 2,
      }),
    ]);

    const result = await service.getCsvFileHealth();

    expect(result.files[0].parseStatus).toBe('error');
    expect(result.files[0].parseSuccessCount).toBe(98);
    expect(result.files[0].parseErrorCount).toBe(2);
  });

  it('reports error from the latest completed failed load and keeps lastLoadedAt from the prior success', async () => {
    const previousSuccessAt = new Date('2026-07-04T10:00:00.000Z');

    mockQuery.mockResolvedValueOnce([
      buildFileRow({
        id: 'f1',
        last_loaded_at: previousSuccessAt,
        latest_completed_load_job_status: 'failed',
      }),
    ]);

    const result = await service.getCsvFileHealth();

    expect(result.files[0].parseStatus).toBe('error');
    expect(result.files[0].parseSuccessCount).toBe(0);
    expect(result.files[0].parseErrorCount).toBe(0);
    expect(result.files[0].lastLoadedAt).toEqual(previousSuccessAt);
  });

  it('reports success for a completed empty-file load', async () => {
    const loadedAt = new Date('2026-07-04T10:00:00.000Z');

    mockQuery.mockResolvedValueOnce([
      buildFileRow({
        id: 'f1',
        row_count: 0,
        last_loaded_at: loadedAt,
        latest_completed_load_job_status: 'success',
        latest_completed_load_records_fetched: 0,
        latest_completed_load_records_staged: 0,
        latest_completed_load_records_failed: 0,
      }),
    ]);

    const result = await service.getCsvFileHealth();

    expect(result.files[0].parseStatus).toBe('success');
    expect(result.files[0].lastLoadedAt).toEqual(loadedAt);
  });

  it('updates lastLoadedAt for a successful unchanged-file rerun with zero staged rows', async () => {
    const rerunAt = new Date('2026-07-04T12:00:00.000Z');

    mockQuery.mockResolvedValueOnce([
      buildFileRow({
        id: 'f1',
        last_loaded_at: rerunAt,
        latest_completed_load_job_status: 'success',
        latest_completed_load_records_fetched: 100,
        latest_completed_load_records_staged: 0,
        latest_completed_load_records_failed: 0,
      }),
    ]);

    const result = await service.getCsvFileHealth();

    expect(result.files[0].parseStatus).toBe('success');
    expect(result.files[0].parseSuccessCount).toBe(0);
    expect(result.files[0].lastLoadedAt).toEqual(rerunAt);
  });

  it('reports pending while a csv-raw-load job is in flight', async () => {
    mockQuery.mockResolvedValueOnce([
      buildFileRow({
        id: 'f1',
        has_in_flight_pipeline_job: true,
        latest_completed_load_job_status: 'success',
        latest_completed_load_records_fetched: 100,
        latest_completed_load_records_staged: 100,
        latest_completed_load_records_failed: 0,
      }),
    ]);

    const result = await service.getCsvFileHealth();

    expect(result.files[0].parseStatus).toBe('pending');
  });

  it('never reports success when records_fetched does not match row_count', async () => {
    mockQuery.mockResolvedValueOnce([
      buildFileRow({
        id: 'f1',
        row_count: 100,
        latest_completed_load_job_status: 'success',
        latest_completed_load_records_fetched: 99,
        latest_completed_load_records_staged: 99,
        latest_completed_load_records_failed: 0,
      }),
    ]);

    const result = await service.getCsvFileHealth();

    expect(result.files[0].parseStatus).toBe('error');
  });

  it('reports pending when no completed load is linked to the file', async () => {
    mockQuery.mockResolvedValueOnce([buildFileRow({ id: 'f1' })]);

    const result = await service.getCsvFileHealth();

    expect(result.files[0].parseStatus).toBe('pending');
    expect(result.files[0].parseSuccessCount).toBe(0);
    expect(result.files[0].parseErrorCount).toBe(0);
    expect(result.files[0].lastLoadedAt).toBeNull();
  });

  it('reports error when the latest completed profile job failed and no load exists', async () => {
    mockQuery.mockResolvedValueOnce([
      buildFileRow({
        latest_completed_profile_job_status: 'failed',
      }),
    ]);

    const result = await service.getCsvFileHealth();

    expect(result.files[0].parseStatus).toBe('error');
    expect(result.files[0].lastLoadedAt).toBeNull();
  });

  it('reports pending when the latest completed profile job succeeded and no load exists', async () => {
    mockQuery.mockResolvedValueOnce([
      buildFileRow({
        latest_completed_profile_job_status: 'success',
      }),
    ]);

    const result = await service.getCsvFileHealth();

    expect(result.files[0].parseStatus).toBe('pending');
    expect(result.files[0].lastLoadedAt).toBeNull();
  });

  it('reports pending while a csv-file-profile job is in flight', async () => {
    mockQuery.mockResolvedValueOnce([
      buildFileRow({
        has_in_flight_pipeline_job: true,
        latest_completed_profile_job_status: 'failed',
      }),
    ]);

    const result = await service.getCsvFileHealth();

    expect(result.files[0].parseStatus).toBe('pending');
  });

  it('returns null freshness in phase 1', async () => {
    mockQuery.mockResolvedValueOnce([buildFileRow()]);

    const result = await service.getCsvFileHealth();

    expect(result.files[0].freshness).toBeNull();
  });

  it('returns generatedAt timestamp close to now', async () => {
    const before = Date.now();

    mockQuery.mockResolvedValueOnce([]);

    const result = await service.getCsvFileHealth();
    const after = Date.now();

    expect(result.generatedAt.getTime()).toBeGreaterThanOrEqual(before);
    expect(result.generatedAt.getTime()).toBeLessThanOrEqual(after);
  });

  it('preserves sourceModality when present', async () => {
    mockQuery.mockResolvedValueOnce([
      buildFileRow({ source_modality: 'mes-6' }),
    ]);

    const result = await service.getCsvFileHealth();

    expect(result.files[0].sourceModality).toBe('mes-6');
  });

  it('keeps a successful load as success after a later successful profile rerun', async () => {
    const loadedAt = new Date('2026-07-04T10:00:00.000Z');

    mockQuery.mockResolvedValueOnce([
      buildFileRow({
        last_loaded_at: loadedAt,
        latest_completed_load_job_status: 'success',
        latest_completed_load_records_fetched: 100,
        latest_completed_load_records_staged: 100,
        latest_completed_load_records_failed: 0,
        latest_completed_profile_job_status: 'success',
      }),
    ]);

    const result = await service.getCsvFileHealth();

    expect(result.files[0].parseStatus).toBe('success');
    expect(result.files[0].parseSuccessCount).toBe(100);
    expect(result.files[0].parseErrorCount).toBe(0);
    expect(result.files[0].lastLoadedAt).toEqual(loadedAt);
  });

  it('keeps load counters after a later failed profile rerun', async () => {
    mockQuery.mockResolvedValueOnce([
      buildFileRow({
        latest_completed_load_job_status: 'success',
        latest_completed_load_records_fetched: 100,
        latest_completed_load_records_staged: 100,
        latest_completed_load_records_failed: 0,
        latest_completed_profile_job_status: 'failed',
      }),
    ]);

    const result = await service.getCsvFileHealth();

    expect(result.files[0].parseStatus).toBe('success');
    expect(result.files[0].parseSuccessCount).toBe(100);
    expect(result.files[0].parseErrorCount).toBe(0);
  });
});
