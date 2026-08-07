import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';

import { DataSource, type EntityManager } from 'typeorm';

import { type MercadoPublicoApiV2CompraAgilListResponse } from 'src/engine/core-modules/mercado-publico/drivers/api/mercado-publico-api-v2-compra-agil-client.service';
import { type MercadoPublicoApiV2CompraAgilRecord } from 'src/engine/core-modules/mercado-publico/drivers/api/types/mercado-publico-api-v2-compra-agil-record.type';
import { getV2CompraAgilProviderOrderId } from 'src/engine/core-modules/mercado-publico/drivers/api/utils/classify-v2-compra-agil-lifecycle.util';
import { createJsonSha256 } from 'src/engine/core-modules/mercado-publico/drivers/api/utils/create-json-sha256.util';
import {
  type NormalizedV2CompraAgilRecord,
  normalizeV2CompraAgilRecord,
} from 'src/engine/core-modules/mercado-publico/drivers/api/utils/normalize-v2-compra-agil-record.util';

export const MERCADO_PUBLICO_V2_NORMALIZER_VERSION =
  'mercado-publico-v2-durable-1';

export type MercadoPublicoV2SnapshotKind = 'list' | 'detail';

export type MercadoPublicoV2ProjectionContext = {
  syncRunId: string;
  rawApiPayloadId: string;
  response: MercadoPublicoApiV2CompraAgilListResponse;
  record: MercadoPublicoApiV2CompraAgilRecord;
  snapshotKind: MercadoPublicoV2SnapshotKind;
};

export type MercadoPublicoV2ProjectionResult = {
  observationId: string;
  created: boolean;
  applied: boolean;
  semanticChanged: boolean;
  skipped: boolean;
};

export type MercadoPublicoV2Reprojection = {
  observationId: string;
  context: MercadoPublicoV2ProjectionContext;
};

type SemanticPayload = {
  codigo: string;
  estado: string | null;
  state_id: string | null;
  state_label: string | null;
  title: string | null;
  buyer_code: string | null;
  buyer_name: string | null;
  region: number | null;
  published_at: string | null;
  closing_at: string | null;
  provider_changed_at_raw: string | null;
  amount: string | null;
  currency_source: string | null;
  document_count: number | null;
};

type CompraAgilCurrentRow = SemanticPayload & {
  id: string;
  observation_id: string | null;
  semantic_fingerprint: string | null;
  amount_raw: string | null;
};

const toIsoOrNull = (value: Date | null): string | null =>
  value === null ? null : value.toISOString();

const buildSemanticPayload = (
  codigo: string,
  normalized: NormalizedV2CompraAgilRecord,
): SemanticPayload => ({
  codigo,
  estado: normalized.stateCode,
  state_id: normalized.stateId,
  state_label: normalized.stateLabel,
  title: normalized.title,
  buyer_code: normalized.buyerCode,
  buyer_name: normalized.buyerName,
  region: normalized.region,
  published_at: toIsoOrNull(normalized.publishedAt),
  closing_at: toIsoOrNull(normalized.closingAt),
  provider_changed_at_raw: normalized.providerChangedAtRaw,
  amount: normalized.amount,
  currency_source: normalized.currency,
  document_count: normalized.documentCount,
});

const rebuildSemanticPayload = (
  row: CompraAgilCurrentRow,
): SemanticPayload => ({
  codigo: row.codigo,
  estado: row.estado,
  state_id: row.state_id,
  state_label: row.state_label,
  title: row.title,
  buyer_code: row.buyer_code,
  buyer_name: row.buyer_name,
  region: row.region,
  published_at: row.published_at,
  closing_at: row.closing_at,
  provider_changed_at_raw: row.provider_changed_at_raw,
  amount: row.amount_raw ?? (row.amount === null ? null : String(row.amount)),
  currency_source: row.currency_source,
  document_count: row.document_count,
});

@Injectable()
export class MercadoPublicoV2ProjectionService {
  constructor(
    @InjectDataSource()
    private readonly coreDataSource: DataSource,
  ) {}

  async ingest(
    context: MercadoPublicoV2ProjectionContext,
  ): Promise<MercadoPublicoV2ProjectionResult> {
    const normalized = normalizeV2CompraAgilRecord(context.record);
    const semanticPayload = buildSemanticPayload(
      context.record.codigo,
      normalized,
    );
    const semanticFingerprint = createJsonSha256(semanticPayload);
    const observedAt = context.response.fetchedAt;

    return this.coreDataSource.transaction(async (entityManager) => {
      const observationRows = await entityManager.query<{ id: string }[]>(
        `
          INSERT INTO mp.v2_observation (
            sync_run_id, raw_api_payload_id, codigo, payload_checksum,
            provider_schema_fingerprint, normalizer_version, observed_at,
            source, endpoint, snapshot_kind, request_fingerprint,
            provider_changed_at_raw, provider_changed_at, semantic_fingerprint
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
          RETURNING id
        `,
        [
          context.syncRunId,
          context.rawApiPayloadId,
          context.record.codigo,
          createJsonSha256(context.record),
          context.response.schemaFingerprint,
          MERCADO_PUBLICO_V2_NORMALIZER_VERSION,
          observedAt,
          context.response.source,
          context.response.endpoint,
          context.snapshotKind,
          context.response.requestFingerprint,
          normalized.providerChangedAtRaw,
          normalized.providerChangedAt,
          semanticFingerprint,
        ],
      );

      return this.project(
        entityManager,
        observationRows[0].id,
        context,
        semanticPayload,
        semanticFingerprint,
      );
    });
  }

  async reproject(
    observationId: string,
    context: MercadoPublicoV2ProjectionContext,
  ): Promise<MercadoPublicoV2ProjectionResult> {
    const normalized = normalizeV2CompraAgilRecord(context.record);
    const semanticPayload = buildSemanticPayload(
      context.record.codigo,
      normalized,
    );
    const semanticFingerprint = createJsonSha256(semanticPayload);

    return this.coreDataSource.transaction(async (entityManager) =>
      this.project(
        entityManager,
        observationId,
        context,
        semanticPayload,
        semanticFingerprint,
      ),
    );
  }

  async rebuild(
    reprojections: MercadoPublicoV2Reprojection[],
  ): Promise<MercadoPublicoV2ProjectionResult[]> {
    if (reprojections.length === 0) {
      return [];
    }

    const codigo = reprojections[0].context.record.codigo;

    return this.coreDataSource.transaction(async (entityManager) => {
      await entityManager.query(
        `
          UPDATE mp.compra_agil
          SET observation_id = NULL,
              semantic_fingerprint = NULL,
              provider_changed_at_raw = NULL,
              provider_changed_at = NULL,
              observed_at = NULL
          WHERE codigo = $1
        `,
        [codigo],
      );
      await entityManager.query(
        `
          UPDATE mp.gold_detected_process
          SET observation_id = NULL,
              semantic_fingerprint = NULL,
              provider_changed_at_raw = NULL,
              provider_changed_at = NULL,
              observed_at = NULL
          WHERE process_type = 'compra_agil' AND process_code = $1
        `,
        [codigo],
      );

      const results: MercadoPublicoV2ProjectionResult[] = [];

      for (const { observationId, context } of reprojections) {
        const normalized = normalizeV2CompraAgilRecord(context.record);
        const semanticPayload = buildSemanticPayload(
          context.record.codigo,
          normalized,
        );

        results.push(
          await this.project(
            entityManager,
            observationId,
            context,
            semanticPayload,
            createJsonSha256(semanticPayload),
          ),
        );
      }

      return results;
    });
  }

  private async project(
    entityManager: EntityManager,
    observationId: string,
    context: MercadoPublicoV2ProjectionContext,
    semanticPayload: SemanticPayload,
    semanticFingerprint: string,
  ): Promise<MercadoPublicoV2ProjectionResult> {
    const currentRows = await entityManager.query<CompraAgilCurrentRow[]>(
      `
        SELECT
          id,
          codigo,
          estado,
          state_id,
          state_label,
          title,
          buyer_code,
          buyer_name,
          region,
          published_at,
          closing_at,
          provider_changed_at_raw,
          amount,
          amount_raw,
          currency_source,
          document_count,
          observation_id,
          semantic_fingerprint
        FROM mp.compra_agil
        WHERE codigo = $1
      `,
      [context.record.codigo],
    );
    const previous = currentRows[0];

    if (previous !== undefined && previous.observation_id === observationId) {
      return {
        observationId,
        created: false,
        applied: false,
        semanticChanged: false,
        skipped: true,
      };
    }

    const normalized = normalizeV2CompraAgilRecord(context.record);
    const observedAt = context.response.fetchedAt;
    const providerOrderId = getV2CompraAgilProviderOrderId(context.record);
    const schemaFingerprint = context.response.schemaFingerprint;

    const upsertedRows = await entityManager.query<{ id: string }[]>(
      `
        INSERT INTO mp.compra_agil (
          codigo, estado, state_id, state_label, id_orden_compra, region, title,
          buyer_code, buyer_name, published_at, closing_at, amount, amount_raw,
          currency_source, document_count, observation_id, normalizer_version,
          provider_schema_fingerprint, provider_changed_at_raw,
          provider_changed_at, observed_at, last_seen_at, semantic_fingerprint,
          persisted_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
          $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, now(), now())
        ON CONFLICT (codigo) DO UPDATE SET
          estado = EXCLUDED.estado,
          state_id = EXCLUDED.state_id,
          state_label = EXCLUDED.state_label,
          id_orden_compra = EXCLUDED.id_orden_compra,
          region = EXCLUDED.region,
          title = EXCLUDED.title,
          buyer_code = EXCLUDED.buyer_code,
          buyer_name = EXCLUDED.buyer_name,
          published_at = EXCLUDED.published_at,
          closing_at = EXCLUDED.closing_at,
          amount = EXCLUDED.amount,
          amount_raw = EXCLUDED.amount_raw,
          currency_source = EXCLUDED.currency_source,
          document_count = EXCLUDED.document_count,
          observation_id = EXCLUDED.observation_id,
          normalizer_version = EXCLUDED.normalizer_version,
          provider_schema_fingerprint = EXCLUDED.provider_schema_fingerprint,
          provider_changed_at_raw = EXCLUDED.provider_changed_at_raw,
          provider_changed_at = EXCLUDED.provider_changed_at,
          observed_at = GREATEST(COALESCE(mp.compra_agil.observed_at, EXCLUDED.observed_at), EXCLUDED.observed_at),
          persisted_at = now(),
          last_seen_at = GREATEST(mp.compra_agil.last_seen_at, EXCLUDED.last_seen_at),
          semantic_fingerprint = EXCLUDED.semantic_fingerprint,
          updated_at = now()
        WHERE
          (
            EXCLUDED.provider_changed_at IS NOT NULL
            AND mp.compra_agil.provider_changed_at IS NULL
          )
          OR EXCLUDED.provider_changed_at > mp.compra_agil.provider_changed_at
          OR (
            EXCLUDED.provider_changed_at IS NOT DISTINCT FROM
              mp.compra_agil.provider_changed_at
            AND EXCLUDED.observed_at >
              COALESCE(mp.compra_agil.observed_at, '-infinity'::timestamptz)
          )
        RETURNING id
      `,
      [
        context.record.codigo,
        normalized.stateCode,
        normalized.stateId,
        normalized.stateLabel,
        providerOrderId,
        normalized.region,
        normalized.title,
        normalized.buyerCode,
        normalized.buyerName,
        normalized.publishedAt,
        normalized.closingAt,
        normalized.amount,
        normalized.amount,
        normalized.currency,
        normalized.documentCount,
        observationId,
        MERCADO_PUBLICO_V2_NORMALIZER_VERSION,
        schemaFingerprint,
        normalized.providerChangedAtRaw,
        normalized.providerChangedAt,
        observedAt,
        observedAt,
        semanticFingerprint,
      ],
    );

    const applied = upsertedRows.length > 0;
    const created = applied && previous === undefined;
    const semanticChanged =
      applied &&
      previous !== undefined &&
      previous.semantic_fingerprint !== null &&
      previous.semantic_fingerprint !== semanticFingerprint;

    if (semanticChanged && previous !== undefined) {
      const previousSemantic = rebuildSemanticPayload(previous);

      await entityManager.query(
        `
          INSERT INTO mp.v2_history (
            codigo, previous_observation_id, new_observation_id,
            semantic_fingerprint_before, semantic_fingerprint_after,
            before_json, after_json, provider_changed_at_raw,
            provider_changed_at, observed_at, normalizer_version,
            provider_schema_fingerprint
          )
          VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8, $9, $10, $11, $12)
          ON CONFLICT (codigo, new_observation_id) DO NOTHING
        `,
        [
          context.record.codigo,
          previous.observation_id,
          observationId,
          previous.semantic_fingerprint,
          semanticFingerprint,
          JSON.stringify(previousSemantic),
          JSON.stringify(semanticPayload),
          normalized.providerChangedAtRaw,
          normalized.providerChangedAt,
          observedAt,
          MERCADO_PUBLICO_V2_NORMALIZER_VERSION,
          schemaFingerprint,
        ],
      );
    }

    if (applied) {
      await this.projectGoldRow(
        entityManager,
        context,
        observationId,
        semanticFingerprint,
      );
      await this.projectChildren(entityManager, observationId, context.record);
      await entityManager.query(
        `
          UPDATE mp.stg_api_v2_compra_agil
          SET observation_id = $1
          WHERE raw_api_payload_id = $2
            AND codigo = $3
            AND observation_id IS NULL
        `,
        [observationId, context.rawApiPayloadId, context.record.codigo],
      );
    }

    return {
      observationId,
      created,
      applied,
      semanticChanged,
      skipped: previous !== undefined && !applied,
    };
  }

  private async projectGoldRow(
    entityManager: EntityManager,
    context: MercadoPublicoV2ProjectionContext,
    observationId: string,
    semanticFingerprint: string,
  ): Promise<void> {
    const normalized = normalizeV2CompraAgilRecord(context.record);
    const observedAt = context.response.fetchedAt;
    const schemaFingerprint = context.response.schemaFingerprint;

    await entityManager.query(
      `
        INSERT INTO mp.gold_detected_process (
          process_type, process_code, title, canonical_state, raw_state_code,
          raw_state_id, raw_state_label, buyer_code, buyer_name, region,
          published_at, closing_at, amount, amount_raw, currency_source,
          document_count, observation_id, normalizer_version,
          provider_schema_fingerprint, availability, source_priority,
          provider_changed_at_raw, provider_changed_at, observed_at,
          last_seen_at, semantic_fingerprint, persisted_at, created_at,
          updated_at
        )
        VALUES ('compra_agil', $1, $2, $3, $3, $4, $5, $6, $7, $8, $9,
          $10, $11, $12, $13, $14, $15, $16, $17, 'available', 'api-v2',
          $18, $19, $20, $20, $21, now(), now(), now())
        ON CONFLICT (process_type, process_code) DO UPDATE SET
          title = EXCLUDED.title,
          canonical_state = EXCLUDED.canonical_state,
          raw_state_code = EXCLUDED.raw_state_code,
          raw_state_id = EXCLUDED.raw_state_id,
          raw_state_label = EXCLUDED.raw_state_label,
          buyer_code = EXCLUDED.buyer_code,
          buyer_name = EXCLUDED.buyer_name,
          region = EXCLUDED.region,
          published_at = EXCLUDED.published_at,
          closing_at = EXCLUDED.closing_at,
          amount = EXCLUDED.amount,
          amount_raw = EXCLUDED.amount_raw,
          currency_source = EXCLUDED.currency_source,
          document_count = EXCLUDED.document_count,
          observation_id = EXCLUDED.observation_id,
          normalizer_version = EXCLUDED.normalizer_version,
          provider_schema_fingerprint = EXCLUDED.provider_schema_fingerprint,
          provider_changed_at_raw = EXCLUDED.provider_changed_at_raw,
          provider_changed_at = EXCLUDED.provider_changed_at,
          observed_at = GREATEST(COALESCE(mp.gold_detected_process.observed_at, EXCLUDED.observed_at), EXCLUDED.observed_at),
          persisted_at = now(),
          last_seen_at = GREATEST(mp.gold_detected_process.last_seen_at, EXCLUDED.last_seen_at),
          semantic_fingerprint = EXCLUDED.semantic_fingerprint,
          updated_at = now()
        WHERE
          (
            EXCLUDED.provider_changed_at IS NOT NULL
            AND mp.gold_detected_process.provider_changed_at IS NULL
          )
          OR EXCLUDED.provider_changed_at > mp.gold_detected_process.provider_changed_at
          OR (
            EXCLUDED.provider_changed_at IS NOT DISTINCT FROM
              mp.gold_detected_process.provider_changed_at
            AND EXCLUDED.observed_at >
              COALESCE(mp.gold_detected_process.observed_at, '-infinity'::timestamptz)
          )
      `,
      [
        context.record.codigo,
        normalized.title,
        normalized.stateCode,
        normalized.stateId,
        normalized.stateLabel,
        normalized.buyerCode,
        normalized.buyerName,
        normalized.region,
        normalized.publishedAt,
        normalized.closingAt,
        normalized.amount,
        normalized.amount,
        normalized.currency,
        normalized.documentCount,
        observationId,
        MERCADO_PUBLICO_V2_NORMALIZER_VERSION,
        schemaFingerprint,
        normalized.providerChangedAtRaw,
        normalized.providerChangedAt,
        observedAt,
        semanticFingerprint,
      ],
    );
  }

  private async projectChildren(
    entityManager: EntityManager,
    observationId: string,
    record: MercadoPublicoApiV2CompraAgilRecord,
  ): Promise<void> {
    if (!Array.isArray(record.documentos)) {
      return;
    }

    const placeholders: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    for (const [ordinal, document] of record.documentos.entries()) {
      placeholders.push(
        `($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4}, $${paramIndex + 5}, $${paramIndex + 6})`,
      );
      params.push(
        observationId,
        record.codigo,
        'documentos',
        typeof document?.id === 'string' || typeof document?.id === 'number'
          ? String(document.id)
          : null,
        ordinal,
        createJsonSha256(document),
        JSON.stringify(document),
      );
      paramIndex += 7;
    }

    if (placeholders.length === 0) {
      return;
    }

    await entityManager.query(
      `
        INSERT INTO mp.v2_child_evidence (
          observation_id, codigo, array_name, provider_key, ordinal,
          element_checksum, element_json
        )
        VALUES ${placeholders.join(', ')}
        ON CONFLICT (observation_id, array_name, ordinal) DO NOTHING
      `,
      params,
    );
  }
}
