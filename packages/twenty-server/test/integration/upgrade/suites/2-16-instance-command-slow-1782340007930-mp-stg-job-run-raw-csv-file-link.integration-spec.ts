import { config } from 'dotenv';

import { DataSource } from 'typeorm';

import { MpSchemaFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1782340007505-mp-schema';
import { MpRawApiPayloadFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1782340007517-mp-raw-api-payload';
import { MpRawCsvFileFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1782340007600-mp-raw-csv-file';
import { MpRawCsvRowFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1782340007700-mp-raw-csv-row';
import { MpStgJobRunFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1782340007800-mp-stg-job-run';
import { DropRawCsvFileIngestionJobIdFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1783191615514-drop-raw-csv-file-ingestion-job-id';
import { MpStgJobRunRawCsvFileLinkSlowInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-slow-1782340007930-mp-stg-job-run-raw-csv-file-link';
import { DropRawCsvFileIngestionJobIdSlowInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-slow-1783191615515-drop-raw-csv-file-ingestion-job-id';
import { MercadoPublicoPersistenceService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-persistence.service';

jest.useRealTimers();

config({
  path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env',
  override: true,
});

describe('2.16 CSV job-link migrations (integration)', () => {
  let dataSource: DataSource;
  let persistenceService: MercadoPublicoPersistenceService;

  const seedJobRun = async ({
    id,
    jobName,
  }: {
    id: string;
    jobName: string;
  }) => {
    await dataSource.query(
      `
        INSERT INTO mp.stg_job_run (
          id,
          job_name,
          job_run_id,
          status,
          started_at,
          finished_at
        )
        VALUES ($1, $2, $3, 'success', now(), now())
      `,
      [id, jobName, `${jobName}-${id}`],
    );
  };

  const seedRawCsvFile = async ({
    id,
    fileChecksum,
    ingestionJobId,
    rowCount,
  }: {
    id: string;
    fileChecksum: string;
    ingestionJobId: string | null;
    rowCount: number;
  }) => {
    await dataSource.query(
      `
        INSERT INTO mp.raw_csv_file (
          id,
          source_system,
          source_dataset,
          source_url,
          source_file_name,
          source_period,
          source_modality,
          downloaded_at,
          file_checksum,
          file_size_bytes,
          compression_type,
          detected_encoding,
          detected_delimiter,
          quotechar,
          header_raw,
          observed_columns,
          column_count,
          schema_fingerprint,
          row_count,
          ingestion_job_id
        )
        VALUES (
          $1,
          'datos-abiertos',
          'licitaciones',
          'https://example.com/file.csv',
          $2,
          '2026-01',
          NULL,
          now(),
          $3,
          10,
          NULL,
          'latin-1',
          ';',
          NULL,
          'h1;h2',
          '[]'::jsonb,
          2,
          $3,
          $4,
          $5
        )
      `,
      [id, `${id}.csv`, fileChecksum, rowCount, ingestionJobId],
    );
  };

  const seedRawCsvRow = async ({
    id,
    rawCsvFileId,
    ingestionJobId,
    rowNumber,
  }: {
    id: string;
    rawCsvFileId: string;
    ingestionJobId: string;
    rowNumber: number;
  }) => {
    await dataSource.query(
      `
        INSERT INTO mp.raw_csv_row (
          id,
          raw_csv_file_id,
          ingestion_job_id,
          source_dataset,
          source_file_name,
          source_period,
          row_number,
          raw_row_text,
          raw_row_json,
          row_checksum,
          parse_status,
          parse_error
        )
        VALUES (
          $1,
          $2,
          $3,
          'licitaciones',
          'rows.csv',
          '2026-01',
          $4,
          'raw',
          NULL,
          $5,
          'success',
          NULL
        )
      `,
      [id, rawCsvFileId, ingestionJobId, rowNumber, `${id}-checksum`],
    );
  };

  const getJobLink = async (jobRunId: string): Promise<string | null> => {
    const [row] = await dataSource.query(
      `SELECT raw_csv_file_id FROM mp.stg_job_run WHERE id = $1`,
      [jobRunId],
    );

    return row?.raw_csv_file_id ?? null;
  };

  const columnExists = async (
    tableName: string,
    columnName: string,
  ): Promise<boolean> => {
    const [row] = await dataSource.query(
      `
        SELECT EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'mp'
            AND table_name = $1
            AND column_name = $2
        ) AS exists
      `,
      [tableName, columnName],
    );

    return row.exists as boolean;
  };

  const constraintExists = async (constraintName: string): Promise<boolean> => {
    const [row] = await dataSource.query(
      `
        SELECT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = $1
        ) AS exists
      `,
      [constraintName],
    );

    return row.exists as boolean;
  };

  beforeAll(async () => {
    dataSource = new DataSource({
      type: 'postgres',
      url: process.env.PG_DATABASE_URL,
      schema: 'core',
      entities: [],
      synchronize: false,
    });
    await dataSource.initialize();
    persistenceService = new MercadoPublicoPersistenceService(dataSource);

    const queryRunner = dataSource.createQueryRunner();

    await queryRunner.connect();

    try {
      await queryRunner.query(`DROP SCHEMA IF EXISTS mp CASCADE`);
      await new MpSchemaFastInstanceCommand().up(queryRunner);
      await new MpRawApiPayloadFastInstanceCommand().up(queryRunner);
      await new MpRawCsvFileFastInstanceCommand().up(queryRunner);
      await new MpRawCsvRowFastInstanceCommand().up(queryRunner);
      await new MpStgJobRunFastInstanceCommand().up(queryRunner);
    } finally {
      await queryRunner.release();
    }
  }, 30000);

  afterEach(async () => {
    await dataSource.query(
      `
        TRUNCATE TABLE
          mp.raw_csv_row,
          mp.stg_job_run,
          mp.raw_csv_file
        CASCADE
      `,
    );

    if (!(await columnExists('raw_csv_file', 'ingestion_job_id'))) {
      const queryRunner = dataSource.createQueryRunner();

      await queryRunner.connect();

      try {
        await new DropRawCsvFileIngestionJobIdSlowInstanceCommand().down(
          queryRunner,
        );
      } finally {
        await queryRunner.release();
      }
    }
  });

  afterAll(async () => {
    await dataSource.query(`DROP SCHEMA IF EXISTS mp CASCADE`);
    await dataSource?.destroy();
  });

  it('backfills deterministic raw-load and download links without inventing a zero-row raw-load link', async () => {
    const linkCommand = new MpStgJobRunRawCsvFileLinkSlowInstanceCommand();

    await seedJobRun({
      id: '00000000-0000-4000-8000-000000000101',
      jobName: 'csv-oc-download',
    });
    await seedJobRun({
      id: '00000000-0000-4000-8000-000000000102',
      jobName: 'csv-raw-load',
    });
    await seedJobRun({
      id: '00000000-0000-4000-8000-000000000103',
      jobName: 'csv-licitaciones-download',
    });
    await seedJobRun({
      id: '00000000-0000-4000-8000-000000000104',
      jobName: 'csv-raw-load',
    });

    await seedRawCsvFile({
      id: '10000000-0000-4000-8000-000000000101',
      fileChecksum: 'checksum-a',
      ingestionJobId: '00000000-0000-4000-8000-000000000101',
      rowCount: 2,
    });
    await seedRawCsvFile({
      id: '10000000-0000-4000-8000-000000000102',
      fileChecksum: 'checksum-b',
      ingestionJobId: '00000000-0000-4000-8000-000000000103',
      rowCount: 0,
    });

    await seedRawCsvRow({
      id: '20000000-0000-4000-8000-000000000101',
      rawCsvFileId: '10000000-0000-4000-8000-000000000101',
      ingestionJobId: '00000000-0000-4000-8000-000000000102',
      rowNumber: 1,
    });
    await seedRawCsvRow({
      id: '20000000-0000-4000-8000-000000000102',
      rawCsvFileId: '10000000-0000-4000-8000-000000000101',
      ingestionJobId: '00000000-0000-4000-8000-000000000102',
      rowNumber: 2,
    });

    await linkCommand.runDataMigration(dataSource);

    expect(await getJobLink('00000000-0000-4000-8000-000000000101')).toBe(
      '10000000-0000-4000-8000-000000000101',
    );
    expect(await getJobLink('00000000-0000-4000-8000-000000000102')).toBe(
      '10000000-0000-4000-8000-000000000101',
    );
    expect(await getJobLink('00000000-0000-4000-8000-000000000103')).toBe(
      '10000000-0000-4000-8000-000000000102',
    );
    expect(await getJobLink('00000000-0000-4000-8000-000000000104')).toBeNull();
  });

  it('creates csv job runs before the slow link column exists and links them once the slow schema is present', async () => {
    const rawCsvFile = {
      id: '10000000-0000-4000-8000-000000000301',
      fileChecksum: 'checksum-job-link',
      ingestionJobId: null,
      rowCount: 1,
    };

    await seedRawCsvFile(rawCsvFile);

    expect(await columnExists('stg_job_run', 'raw_csv_file_id')).toBe(false);

    const fastOnlyJobRun = await persistenceService.createJobRun(
      'csv-raw-load',
      {
        rawCsvFileId: rawCsvFile.id,
      },
    );

    const [fastOnlyRow] = await dataSource.query<
      Array<{ raw_csv_file_id_exists: boolean }>
    >(
      `
        SELECT EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'mp'
            AND table_name = 'stg_job_run'
            AND column_name = 'raw_csv_file_id'
        ) AS raw_csv_file_id_exists
      `,
    );

    expect(fastOnlyRow.raw_csv_file_id_exists).toBe(false);

    const [legacyShapeRow] = await dataSource.query<Array<{ status: string }>>(
      `SELECT status FROM mp.stg_job_run WHERE id = $1`,
      [fastOnlyJobRun.id],
    );

    expect(legacyShapeRow.status).toBe('failed');

    const queryRunner = dataSource.createQueryRunner();

    await queryRunner.connect();

    try {
      await new MpStgJobRunRawCsvFileLinkSlowInstanceCommand().up(queryRunner);
    } finally {
      await queryRunner.release();
    }

    expect(await columnExists('stg_job_run', 'raw_csv_file_id')).toBe(true);

    const linkedJobRun = await persistenceService.createJobRun('csv-raw-load', {
      rawCsvFileId: rawCsvFile.id,
    });

    expect(await getJobLink(linkedJobRun.id)).toBe(rawCsvFile.id);
  });

  it('leaves ambiguous download and raw-load candidates unlinked', async () => {
    const linkCommand = new MpStgJobRunRawCsvFileLinkSlowInstanceCommand();

    await seedJobRun({
      id: '00000000-0000-4000-8000-000000000201',
      jobName: 'csv-oc-download',
    });
    await seedJobRun({
      id: '00000000-0000-4000-8000-000000000202',
      jobName: 'csv-raw-load',
    });

    await seedRawCsvFile({
      id: '10000000-0000-4000-8000-000000000201',
      fileChecksum: 'checksum-c',
      ingestionJobId: '00000000-0000-4000-8000-000000000201',
      rowCount: 0,
    });
    await seedRawCsvFile({
      id: '10000000-0000-4000-8000-000000000202',
      fileChecksum: 'checksum-d',
      ingestionJobId: '00000000-0000-4000-8000-000000000201',
      rowCount: 0,
    });

    await seedRawCsvFile({
      id: '10000000-0000-4000-8000-000000000203',
      fileChecksum: 'checksum-e',
      ingestionJobId: null,
      rowCount: 1,
    });
    await seedRawCsvFile({
      id: '10000000-0000-4000-8000-000000000204',
      fileChecksum: 'checksum-f',
      ingestionJobId: null,
      rowCount: 1,
    });

    await seedRawCsvRow({
      id: '20000000-0000-4000-8000-000000000201',
      rawCsvFileId: '10000000-0000-4000-8000-000000000203',
      ingestionJobId: '00000000-0000-4000-8000-000000000202',
      rowNumber: 1,
    });
    await seedRawCsvRow({
      id: '20000000-0000-4000-8000-000000000202',
      rawCsvFileId: '10000000-0000-4000-8000-000000000204',
      ingestionJobId: '00000000-0000-4000-8000-000000000202',
      rowNumber: 2,
    });

    await linkCommand.runDataMigration(dataSource);

    expect(await getJobLink('00000000-0000-4000-8000-000000000201')).toBeNull();
    expect(await getJobLink('00000000-0000-4000-8000-000000000202')).toBeNull();
  });

  it('keeps raw_csv_file.ingestion_job_id available through backfill and drops it only in the slow cleanup command', async () => {
    const fastDropCommand =
      new DropRawCsvFileIngestionJobIdFastInstanceCommand();
    const linkCommand = new MpStgJobRunRawCsvFileLinkSlowInstanceCommand();
    const cleanupCommand =
      new DropRawCsvFileIngestionJobIdSlowInstanceCommand();
    const queryRunner = dataSource.createQueryRunner();

    await queryRunner.connect();

    try {
      expect(await columnExists('raw_csv_file', 'ingestion_job_id')).toBe(true);
      expect(
        await constraintExists('fk_mp_raw_csv_file_ingestion_job_id'),
      ).toBe(true);

      await fastDropCommand.up(queryRunner);

      expect(await columnExists('raw_csv_file', 'ingestion_job_id')).toBe(true);
      expect(
        await constraintExists('fk_mp_raw_csv_file_ingestion_job_id'),
      ).toBe(true);

      await linkCommand.runDataMigration(dataSource);

      expect(await columnExists('raw_csv_file', 'ingestion_job_id')).toBe(true);

      await cleanupCommand.up(queryRunner);

      expect(await columnExists('raw_csv_file', 'ingestion_job_id')).toBe(
        false,
      );
      expect(
        await constraintExists('fk_mp_raw_csv_file_ingestion_job_id'),
      ).toBe(false);
    } finally {
      await queryRunner.release();
    }
  });
});
