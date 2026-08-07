import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';

import { DataSource } from 'typeorm';

import { type MercadoPublicoApiV2CompraAgilListResponse } from 'src/engine/core-modules/mercado-publico/drivers/api/mercado-publico-api-v2-compra-agil-client.service';
import { type MercadoPublicoApiV2CompraAgilRecord } from 'src/engine/core-modules/mercado-publico/drivers/api/types/mercado-publico-api-v2-compra-agil-record.type';
import { classifyFailure } from 'src/engine/core-modules/mercado-publico/drivers/api/utils/classify-http-failure.util';
import { extractV2CompraAgilListRecords } from 'src/engine/core-modules/mercado-publico/drivers/api/utils/extract-v2-compra-agil-list-records.util';
import { normalizeV2CompraAgilRecord } from 'src/engine/core-modules/mercado-publico/drivers/api/utils/normalize-v2-compra-agil-record.util';
import {
  MERCADO_PUBLICO_API_V2_COMPRA_AGIL_LIST_ENDPOINT,
  MERCADO_PUBLICO_API_V2_COMPRA_AGIL_SOURCE,
} from 'src/engine/core-modules/mercado-publico/mercado-publico.constants';
import { MercadoPublicoPersistenceService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-persistence.service';
import { MercadoPublicoV2ProjectionService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-v2-projection.service';

export type MercadoPublicoV2EvidenceReplayResult = {
  syncRunId: string;
  intent: 'replay' | 'backfill';
  status: 'succeeded' | 'partial_failed';
  recordsReplayed: number;
  recordsCreated: number;
  recordsUpdated: number;
  recordsSkipped: number;
  historyWritten: number;
  recordsFailed: number;
};

type EvidenceObservationRow = {
  id: string;
  codigo: string;
  raw_api_payload_id: string;
  payload_checksum: string;
  provider_schema_fingerprint: string;
  normalizer_version: string;
  observed_at: Date;
  source: string;
  endpoint: string | null;
  snapshot_kind: 'list' | 'detail' | null;
  request_fingerprint: string | null;
  provider_changed_at_raw: string | null;
  raw_payload: unknown;
};

type ReplayRunContext = {
  syncRunId: string;
  sourceSyncRunId: string | null;
  scope: string;
  intent: 'replay' | 'backfill';
};

type ReplayRunItem = {
  id: string;
  codigo: string;
  status: string;
};

type ReplayCounters = {
  recordsCreated: number;
  recordsUpdated: number;
  recordsSkipped: number;
  historyWritten: number;
  recordsFailed: number;
};

const LATEST_OBSERVATION_ORDER =
  'o.provider_changed_at DESC NULLS LAST, o.observed_at DESC, o.id DESC';

@Injectable()
export class MercadoPublicoV2EvidenceReplayService {
  private readonly logger = new Logger(
    MercadoPublicoV2EvidenceReplayService.name,
  );

  constructor(
    private readonly mercadoPublicoPersistenceService: MercadoPublicoPersistenceService,
    private readonly mercadoPublicoV2ProjectionService: MercadoPublicoV2ProjectionService,
    @InjectDataSource()
    private readonly coreDataSource: DataSource,
  ) {}

  async replay(
    syncRunId: string,
  ): Promise<MercadoPublicoV2EvidenceReplayResult> {
    const sourceRunRows = await this.coreDataSource.query<
      { intent: string; scope: string }[]
    >(
      `SELECT intent, scope FROM mp.sync_run WHERE id = $1`,
      [syncRunId],
    );
    const sourceRun = sourceRunRows[0];

    if (sourceRun === undefined) {
      throw new Error(`Mercado Publico V2 sync run ${syncRunId} was not found`);
    }

    const context: ReplayRunContext = {
      syncRunId: await this.createReplayRun('replay', sourceRun.scope),
      sourceSyncRunId: syncRunId,
      scope: sourceRun.scope,
      intent: 'replay',
    };

    return this.execute(context);
  }

  async backfill(
    scope = 'global',
  ): Promise<MercadoPublicoV2EvidenceReplayResult> {
    const context: ReplayRunContext = {
      syncRunId: await this.createReplayRun('backfill', scope),
      sourceSyncRunId: null,
      scope,
      intent: 'backfill',
    };

    return this.execute(context);
  }

  private async execute(
    context: ReplayRunContext,
  ): Promise<MercadoPublicoV2EvidenceReplayResult> {
    const jobRunRecord =
      await this.mercadoPublicoPersistenceService.createJobRun(
        'api-v2-compra-agil-incremental',
      );

    try {
      await this.coreDataSource.query(
        `UPDATE mp.sync_run SET status = 'projecting', updated_at = now() WHERE id = $1`,
        [context.syncRunId],
      );
      await this.seedItems(context);
      const counters = await this.processItems(context);

      return this.finishReplayRun(context, jobRunRecord.id, counters);
    } catch (error) {
      await this.failReplayRun(context, jobRunRecord.id, error);

      throw error;
    }
  }

  private async createReplayRun(
    intent: 'replay' | 'backfill',
    scope: string,
  ): Promise<string> {
    const rows = await this.coreDataSource.query<{ id: string }[]>(
      `
        INSERT INTO mp.sync_run (intent, source, scope, status, request_params)
        VALUES ($1, $2, $3, 'queued', '{}'::jsonb)
        RETURNING id
      `,
      [intent, MERCADO_PUBLICO_API_V2_COMPRA_AGIL_SOURCE, scope],
    );

    return rows[0].id;
  }

  private async seedItems(context: ReplayRunContext): Promise<void> {
    if (context.sourceSyncRunId !== null) {
      await this.coreDataSource.query(
        `
          INSERT INTO mp.sync_run_item (
            sync_run_id, codigo, discovery_page, raw_api_payload_id,
            payload_checksum, status
          )
          SELECT $1, o.codigo, 0, o.raw_api_payload_id, o.payload_checksum, 'pending'
          FROM (
            SELECT DISTINCT ON (o.codigo)
              o.codigo,
              o.raw_api_payload_id,
              o.payload_checksum,
              o.provider_changed_at,
              o.observed_at,
              o.id
            FROM mp.v2_observation o
            WHERE o.sync_run_id = $2
            ORDER BY o.codigo, ${LATEST_OBSERVATION_ORDER}
          ) o
          ON CONFLICT (sync_run_id, codigo) DO NOTHING
        `,
        [context.syncRunId, context.sourceSyncRunId],
      );

      return;
    }

    await this.coreDataSource.query(
      `
        INSERT INTO mp.sync_run_item (
          sync_run_id, codigo, discovery_page, raw_api_payload_id,
          payload_checksum, status
        )
        SELECT $1, c.codigo, 0, o.raw_api_payload_id, o.payload_checksum, 'pending'
        FROM mp.v2_cohort c
        JOIN LATERAL (
          SELECT o.raw_api_payload_id, o.payload_checksum
          FROM mp.v2_observation o
          WHERE o.codigo = c.codigo
          ORDER BY ${LATEST_OBSERVATION_ORDER}
          LIMIT 1
        ) o ON true
        WHERE c.source = $2
          AND c.scope = $3
          AND c.status = 'active'
        ON CONFLICT (sync_run_id, codigo) DO NOTHING
      `,
      [
        context.syncRunId,
        MERCADO_PUBLICO_API_V2_COMPRA_AGIL_SOURCE,
        context.scope,
      ],
    );
  }

  private async processItems(
    context: ReplayRunContext,
  ): Promise<ReplayCounters> {
    const items = await this.coreDataSource.query<ReplayRunItem[]>(
      `
        SELECT id, codigo, status
        FROM mp.sync_run_item
        WHERE sync_run_id = $1 AND status = 'pending'
        ORDER BY id ASC
      `,
      [context.syncRunId],
    );
    const counters: ReplayCounters = {
      recordsCreated: 0,
      recordsUpdated: 0,
      recordsSkipped: 0,
      historyWritten: 0,
      recordsFailed: 0,
    };

    for (const item of items) {
      await this.coreDataSource.query(
        `
          UPDATE mp.sync_run_item
          SET status = 'processing', attempts = attempts + 1, updated_at = now()
          WHERE id = $1 AND status = 'pending'
        `,
        [item.id],
      );

      try {
        await this.processEvidenceItem(context, item, counters);
      } catch (error) {
        counters.recordsFailed += 1;
        await this.markItemPending(
          item.id,
          `${classifyFailure(error)}: evidence replay failed`,
        );
      }
    }

    return counters;
  }

  private async processEvidenceItem(
    context: ReplayRunContext,
    item: ReplayRunItem,
    counters: ReplayCounters,
  ): Promise<void> {
    const observation = await this.loadLatestObservation(
      context,
      item.codigo,
    );

    if (observation === undefined) {
      throw new Error(`replay evidence missing for ${item.codigo}`);
    }

    const record = extractV2CompraAgilListRecords(
      observation.raw_payload,
    ).find((candidate) => candidate.codigo === item.codigo);

    if (record === undefined) {
      throw new Error(`replay evidence record missing for ${item.codigo}`);
    }

    const result = await this.mercadoPublicoV2ProjectionService.reproject(
      observation.id,
      {
        syncRunId: context.syncRunId,
        rawApiPayloadId: observation.raw_api_payload_id,
        response: this.buildResponseFromObservation(observation, record),
        record,
        snapshotKind: observation.snapshot_kind ?? 'detail',
      },
    );

    if (result.created) {
      counters.recordsCreated += 1;
    } else if (result.applied) {
      counters.recordsUpdated += 1;
    } else if (result.skipped) {
      counters.recordsSkipped += 1;
    }

    if (result.semanticChanged) {
      counters.historyWritten += 1;
    }

    await this.markItemSucceeded(item.id, observation.id, record);
  }

  private async loadLatestObservation(
    context: ReplayRunContext,
    codigo: string,
  ): Promise<EvidenceObservationRow | undefined> {
    const rows = await this.coreDataSource.query<EvidenceObservationRow[]>(
      `
        SELECT
          o.id,
          o.codigo,
          o.raw_api_payload_id,
          o.payload_checksum,
          o.provider_schema_fingerprint,
          o.normalizer_version,
          o.observed_at,
          o.source,
          o.endpoint,
          o.snapshot_kind,
          o.request_fingerprint,
          o.provider_changed_at_raw,
          p.raw_payload
        FROM mp.v2_observation o
        JOIN mp.raw_api_payload p ON p.id = o.raw_api_payload_id
        WHERE o.codigo = $1
          ${context.sourceSyncRunId === null ? '' : 'AND o.sync_run_id = $2'}
        ORDER BY ${LATEST_OBSERVATION_ORDER}
        LIMIT 1
      `,
      context.sourceSyncRunId === null
        ? [codigo]
        : [codigo, context.sourceSyncRunId],
    );

    return rows[0];
  }

  private buildResponseFromObservation(
    observation: EvidenceObservationRow,
    record: MercadoPublicoApiV2CompraAgilRecord,
  ): MercadoPublicoApiV2CompraAgilListResponse {
    return {
      endpoint:
        observation.endpoint ?? MERCADO_PUBLICO_API_V2_COMPRA_AGIL_LIST_ENDPOINT,
      source: observation.source as MercadoPublicoApiV2CompraAgilListResponse['source'],
      requestParams: {},
      requestFingerprint: observation.request_fingerprint ?? 'evidence-replay',
      payloadChecksum: observation.payload_checksum,
      schemaFingerprint: observation.provider_schema_fingerprint,
      httpStatus: 200,
      fetchedAt: observation.observed_at,
      rawPayload: observation.raw_payload,
      compraAgil: [record],
    };
  }

  private async markItemSucceeded(
    itemId: string,
    observationId: string,
    record: MercadoPublicoApiV2CompraAgilRecord,
  ): Promise<void> {
    const normalized = normalizeV2CompraAgilRecord(record);

    await this.coreDataSource.query(
      `
        UPDATE mp.sync_run_item
        SET status = 'succeeded',
            observation_id = $2,
            state_id = $3,
            state_code = $4,
            state_label = $5,
            provider_changed_at_raw = $6,
            provider_changed_at = $7,
            error_stage = NULL,
            error_summary = NULL,
            hydrated_at = now(),
            updated_at = now()
        WHERE id = $1
      `,
      [
        itemId,
        observationId,
        normalized.stateId,
        normalized.stateCode,
        normalized.stateLabel,
        normalized.providerChangedAtRaw,
        normalized.providerChangedAt,
      ],
    );
  }

  private async markItemPending(
    itemId: string,
    errorSummary: string,
  ): Promise<void> {
    await this.coreDataSource.query(
      `
        UPDATE mp.sync_run_item
        SET status = 'pending', error_stage = 'projecting',
            error_summary = $2, updated_at = now()
        WHERE id = $1
      `,
      [itemId, errorSummary],
    );
  }

  private async finishReplayRun(
    context: ReplayRunContext,
    jobRunRecordId: string,
    counters: ReplayCounters,
  ): Promise<MercadoPublicoV2EvidenceReplayResult> {
    const status =
      counters.recordsFailed > 0 ? 'partial_failed' : 'succeeded';

    await this.coreDataSource.query(
      `
        UPDATE mp.sync_run
        SET status = $2,
            records_discovered = (
              SELECT COUNT(*) FROM mp.sync_run_item WHERE sync_run_id = $1
            ),
            records_hydrated = (
              SELECT COUNT(*) FROM mp.sync_run_item
              WHERE sync_run_id = $1 AND status IN ('succeeded', 'terminal')
            ),
            records_projected = (
              SELECT COUNT(*) FROM mp.sync_run_item
              WHERE sync_run_id = $1 AND status IN ('succeeded', 'terminal')
            ),
            records_failed = $3,
            finished_at = now(),
            updated_at = now()
        WHERE id = $1
      `,
      [context.syncRunId, status, counters.recordsFailed],
    );
    await this.mercadoPublicoPersistenceService.finalizeJobRun({
      jobRunRecordId,
      status: status === 'succeeded' ? 'success' : 'failed',
      finishedAt: new Date(),
      recordsFetched: counters.recordsCreated + counters.recordsUpdated,
      recordsCanonicalized: counters.recordsCreated + counters.recordsUpdated,
      recordsFailed: counters.recordsFailed,
      errorSummary:
        status === 'partial_failed'
          ? 'partial_failed: one or more evidence items failed to replay'
          : undefined,
    });

    const recordsReplayed =
      counters.recordsCreated +
      counters.recordsUpdated +
      counters.recordsSkipped;

    this.logger.log(
      `Mercado Publico V2 ${context.intent} ${context.syncRunId} finished as ${status}`,
    );

    return {
      syncRunId: context.syncRunId,
      intent: context.intent,
      status,
      recordsReplayed,
      recordsCreated: counters.recordsCreated,
      recordsUpdated: counters.recordsUpdated,
      recordsSkipped: counters.recordsSkipped,
      historyWritten: counters.historyWritten,
      recordsFailed: counters.recordsFailed,
    };
  }

  private async failReplayRun(
    context: ReplayRunContext,
    jobRunRecordId: string,
    error: unknown,
  ): Promise<void> {
    const errorSummary = `${classifyFailure(error)}: ${context.intent} failed`;

    await this.coreDataSource.query(
      `
        UPDATE mp.sync_run
        SET status = 'failed', error_stage = 'projecting',
            error_retryable = false, error_summary = $2,
            finished_at = now(), updated_at = now()
        WHERE id = $1
      `,
      [context.syncRunId, errorSummary],
    );
    await this.mercadoPublicoPersistenceService.finalizeJobRun({
      jobRunRecordId,
      status: 'failed',
      finishedAt: new Date(),
      errorSummary,
      recordsFailed: 1,
    });
  }
}
