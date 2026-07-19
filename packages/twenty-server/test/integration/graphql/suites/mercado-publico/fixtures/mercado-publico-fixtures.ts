import { rawDataSource } from 'src/database/typeorm/raw/raw.datasource';

export type SeedGoldDetectedProcessRow = {
  process_type: string;
  process_code: string;
  title: string | null;
  canonical_state: string | null;
  raw_state_code: string | null;
  raw_state_label: string | null;
  buyer_code: string | null;
  buyer_name: string | null;
  published_at: Date | null;
  closing_at: Date | null;
  source_priority: string | null;
  reconciliation_status: string | null;
  last_seen_at: Date;
};

export type SeedStgJobRunRow = {
  id: string;
  job_name: string;
  job_run_id: string;
  status: string;
  started_at: Date;
  finished_at: Date | null;
  records_fetched: number | null;
  records_staged: number | null;
  records_canonicalized: number | null;
  records_failed: number | null;
  error_summary: string | null;
  created_at?: Date;
};

export type SeedRawApiPayloadRow = {
  id: string;
  source: string;
  endpoint: string;
  request_fingerprint: string;
  payload_checksum: string;
  request_params: Record<string, unknown>;
  http_status: number;
  fetched_at: Date;
  raw_payload: Record<string, unknown>;
  schema_fingerprint: string;
  ingestion_job_id: string | null;
  error_summary: string | null;
  records_fetched: number | null;
  created_at?: Date;
};

const seededProcessCodes: string[] = [];
const seededJobRunIds: string[] = [];
const seededPayloadIds: string[] = [];

export const ensureRawDataSource = async () => {
  if (!rawDataSource.isInitialized) {
    await rawDataSource.initialize();
  }
};

export const seedGoldDetectedProcesses = async (
  rows: SeedGoldDetectedProcessRow[],
) => {
  await ensureRawDataSource();

  for (const row of rows) {
    await rawDataSource.query(
      `INSERT INTO mp.gold_detected_process
        (process_type, process_code, title, canonical_state,
         raw_state_code, raw_state_label, buyer_code, buyer_name,
         published_at, closing_at, source_priority,
         reconciliation_status, last_seen_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       ON CONFLICT (process_type, process_code) DO UPDATE SET
         title = EXCLUDED.title,
         canonical_state = EXCLUDED.canonical_state,
         raw_state_code = EXCLUDED.raw_state_code,
         raw_state_label = EXCLUDED.raw_state_label,
         buyer_code = EXCLUDED.buyer_code,
         buyer_name = EXCLUDED.buyer_name,
         published_at = EXCLUDED.published_at,
         closing_at = EXCLUDED.closing_at,
         source_priority = EXCLUDED.source_priority,
         reconciliation_status = EXCLUDED.reconciliation_status,
         last_seen_at = EXCLUDED.last_seen_at`,
      [
        row.process_type,
        row.process_code,
        row.title,
        row.canonical_state,
        row.raw_state_code,
        row.raw_state_label,
        row.buyer_code,
        row.buyer_name,
        row.published_at,
        row.closing_at,
        row.source_priority,
        row.reconciliation_status,
        row.last_seen_at,
      ],
    );
    seededProcessCodes.push(row.process_code);
  }
};

export const seedStgJobRuns = async (rows: SeedStgJobRunRow[]) => {
  await ensureRawDataSource();

  for (const row of rows) {
    await rawDataSource.query(
      `INSERT INTO mp.stg_job_run
        (id, job_name, job_run_id, status, started_at, finished_at,
         records_fetched, records_staged, records_canonicalized,
         records_failed, error_summary, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,COALESCE($12, now()))
       ON CONFLICT (job_name, job_run_id) DO UPDATE SET
         status = EXCLUDED.status,
         finished_at = EXCLUDED.finished_at,
         records_fetched = EXCLUDED.records_fetched,
         records_staged = EXCLUDED.records_staged,
         records_canonicalized = EXCLUDED.records_canonicalized,
         records_failed = EXCLUDED.records_failed,
         error_summary = EXCLUDED.error_summary`,
      [
        row.id,
        row.job_name,
        row.job_run_id,
        row.status,
        row.started_at,
        row.finished_at,
        row.records_fetched,
        row.records_staged,
        row.records_canonicalized,
        row.records_failed,
        row.error_summary,
        row.created_at ?? new Date(),
      ],
    );
    seededJobRunIds.push(row.id);
  }
};

export const seedRawApiPayloads = async (rows: SeedRawApiPayloadRow[]) => {
  await ensureRawDataSource();

  for (const row of rows) {
    await rawDataSource.query(
      `INSERT INTO mp.raw_api_payload
        (id, source, endpoint, request_fingerprint, payload_checksum,
         request_params, http_status, fetched_at, raw_payload,
         schema_fingerprint, ingestion_job_id, error_summary,
         records_fetched, created_at)
       VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,$8,$9::jsonb,$10,$11,$12,$13,
               COALESCE($14, now()))
       ON CONFLICT (source, endpoint, request_fingerprint, payload_checksum)
       DO UPDATE SET
         http_status = EXCLUDED.http_status,
         fetched_at = EXCLUDED.fetched_at,
         raw_payload = EXCLUDED.raw_payload,
         ingestion_job_id = EXCLUDED.ingestion_job_id,
         error_summary = EXCLUDED.error_summary,
         records_fetched = EXCLUDED.records_fetched`,
      [
        row.id,
        row.source,
        row.endpoint,
        row.request_fingerprint,
        row.payload_checksum,
        JSON.stringify(row.request_params),
        row.http_status,
        row.fetched_at,
        JSON.stringify(row.raw_payload),
        row.schema_fingerprint,
        row.ingestion_job_id,
        row.error_summary,
        row.records_fetched,
        row.created_at ?? new Date(),
      ],
    );
    seededPayloadIds.push(row.id);
  }
};

export const cleanupMercadoPublicoFixtures = async () => {
  if (!rawDataSource.isInitialized) return;

  const chunkSize = 100;

  for (let i = 0; i < seededPayloadIds.length; i += chunkSize) {
    const chunk = seededPayloadIds.slice(i, i + chunkSize);

    await rawDataSource.query(
      `DELETE FROM mp.raw_api_payload WHERE id = ANY($1::uuid[])`,
      [chunk],
    );
  }

  for (let i = 0; i < seededJobRunIds.length; i += chunkSize) {
    const chunk = seededJobRunIds.slice(i, i + chunkSize);

    await rawDataSource.query(
      `DELETE FROM mp.stg_job_run WHERE id = ANY($1::uuid[])`,
      [chunk],
    );
  }

  for (let i = 0; i < seededProcessCodes.length; i += chunkSize) {
    const chunk = seededProcessCodes.slice(i, i + chunkSize);

    await rawDataSource.query(
      `DELETE FROM mp.gold_detected_process WHERE process_code = ANY($1::text[])`,
      [chunk],
    );
  }

  seededPayloadIds.length = 0;
  seededJobRunIds.length = 0;
  seededProcessCodes.length = 0;
};
