import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';

import { DataSource } from 'typeorm';

import {
  type MercadoPublicoCsvFileHealth,
  type MercadoPublicoCsvFileHealthEntry,
} from 'src/engine/core-modules/mercado-publico/types/csv-file-health-read.types';

type RawCsvFileRow = {
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
  last_loaded_at: Date | null;
  has_in_flight_pipeline_job: boolean;
  latest_completed_load_job_status: string | null;
  latest_completed_load_records_fetched: number | null;
  latest_completed_load_records_staged: number | null;
  latest_completed_load_records_failed: number | null;
  latest_completed_profile_job_status: string | null;
};

const FILE_SQL = `
  SELECT
    rf.id,
    rf.source_dataset,
    rf.source_modality,
    rf.source_period,
    rf.source_file_name,
    rf.file_checksum,
    rf.detected_encoding,
    rf.detected_delimiter,
    rf.schema_fingerprint,
    rf.row_count,
    latest_success_load.finished_at AS last_loaded_at,
    COALESCE(in_flight_pipeline_job.has_in_flight_pipeline_job, false) AS has_in_flight_pipeline_job,
    latest_completed_load_job.status AS latest_completed_load_job_status,
    latest_completed_load_job.records_fetched AS latest_completed_load_records_fetched,
    latest_completed_load_job.records_staged AS latest_completed_load_records_staged,
    latest_completed_load_job.records_failed AS latest_completed_load_records_failed,
    latest_completed_profile_job.status AS latest_completed_profile_job_status
  FROM mp.raw_csv_file rf
  LEFT JOIN LATERAL (
    SELECT jr.finished_at
    FROM mp.stg_job_run jr
    WHERE
      jr.job_name = 'csv-raw-load'
      AND jr.status = 'success'
      AND jr.raw_csv_file_id = rf.id
      AND jr.finished_at IS NOT NULL
    ORDER BY jr.finished_at DESC, jr.started_at DESC
    LIMIT 1
  ) latest_success_load ON true
  LEFT JOIN LATERAL (
    SELECT
      jr.status,
      jr.records_fetched,
      jr.records_staged,
      jr.records_failed
    FROM mp.stg_job_run jr
    WHERE
      jr.job_name = 'csv-raw-load'
      AND jr.raw_csv_file_id = rf.id
      AND jr.finished_at IS NOT NULL
    ORDER BY jr.finished_at DESC, jr.started_at DESC
    LIMIT 1
  ) latest_completed_load_job ON true
  LEFT JOIN LATERAL (
    SELECT jr.status
    FROM mp.stg_job_run jr
    WHERE
      jr.job_name = 'csv-file-profile'
      AND jr.raw_csv_file_id = rf.id
      AND jr.finished_at IS NOT NULL
    ORDER BY jr.finished_at DESC, jr.started_at DESC
    LIMIT 1
  ) latest_completed_profile_job ON true
  LEFT JOIN LATERAL (
    SELECT true AS has_in_flight_pipeline_job
    FROM mp.stg_job_run jr
    WHERE
      jr.job_name IN ('csv-file-profile', 'csv-raw-load')
      AND jr.raw_csv_file_id = rf.id
      AND jr.finished_at IS NULL
      AND jr.started_at > COALESCE(
        (
          SELECT MAX(completed_jr.finished_at)
          FROM mp.stg_job_run completed_jr
          WHERE
            completed_jr.job_name IN ('csv-file-profile', 'csv-raw-load')
            AND completed_jr.raw_csv_file_id = rf.id
            AND completed_jr.finished_at IS NOT NULL
        ),
        '-infinity'::timestamptz
      )
    ORDER BY jr.started_at DESC
    LIMIT 1
  ) in_flight_pipeline_job ON true
  ORDER BY
    rf.source_dataset ASC,
    rf.source_period DESC,
    rf.source_file_name ASC
`;

// ponytail: gold_csv_file_health table stays unwritten in phase 1 (no CSV cadence).
// This read contract aggregates live from raw_csv_file + stg_job_run, matching
// the pipeline-health pattern (gold_pipeline_health also stays empty).
@Injectable()
export class MercadoPublicoCsvFileHealthReadService {
  constructor(
    @InjectDataSource()
    private readonly coreDataSource: DataSource,
  ) {}

  async getCsvFileHealth(): Promise<MercadoPublicoCsvFileHealth> {
    const fileRows = await this.coreDataSource.query<RawCsvFileRow[]>(FILE_SQL);

    if (fileRows.length === 0) {
      return { files: [], generatedAt: new Date() };
    }

    const files: MercadoPublicoCsvFileHealthEntry[] = fileRows.map(
      (fileRow: RawCsvFileRow) => {
        const errorCount = fileRow.latest_completed_load_records_failed ?? 0;
        const successCount = fileRow.latest_completed_load_records_staged ?? 0;
        const parseStatus = this.getParseStatus(fileRow);

        return {
          sourceDataset: fileRow.source_dataset,
          sourceModality: fileRow.source_modality ?? null,
          sourcePeriod: fileRow.source_period,
          sourceFileName: fileRow.source_file_name,
          fileChecksum: fileRow.file_checksum,
          detectedEncoding: fileRow.detected_encoding || null,
          detectedDelimiter: fileRow.detected_delimiter || null,
          schemaFingerprint: fileRow.schema_fingerprint || null,
          rowCount: fileRow.row_count,
          parseStatus,
          parseErrorCount: errorCount,
          parseSuccessCount: successCount,
          lastLoadedAt: fileRow.last_loaded_at ?? null,
          freshness: null,
        };
      },
    );

    return { files, generatedAt: new Date() };
  }

  private getParseStatus(fileRow: RawCsvFileRow): string {
    if (fileRow.has_in_flight_pipeline_job) {
      return 'pending';
    }

    if (fileRow.latest_completed_load_job_status) {
      if (fileRow.latest_completed_load_job_status !== 'success') {
        return 'error';
      }

      if (fileRow.latest_completed_load_records_fetched !== fileRow.row_count) {
        return 'error';
      }

      if ((fileRow.latest_completed_load_records_failed ?? 0) > 0) {
        return 'error';
      }

      return 'success';
    }

    if (!fileRow.latest_completed_profile_job_status) {
      return 'pending';
    }

    if (fileRow.latest_completed_profile_job_status !== 'success') {
      return 'error';
    }

    return 'pending';
  }
}
