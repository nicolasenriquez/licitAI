import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';

import { DataSource, type EntityManager } from 'typeorm';

import { type MercadoPublicoApiV2CompraAgilListResponse } from 'src/engine/core-modules/mercado-publico/drivers/api/mercado-publico-api-v2-compra-agil-client.service';
import { type MercadoPublicoApiV2CompraAgilRecord } from 'src/engine/core-modules/mercado-publico/drivers/api/types/mercado-publico-api-v2-compra-agil-record.type';
import {
  getV2CompraAgilCallNumber,
  getV2CompraAgilProviderOrderId,
} from 'src/engine/core-modules/mercado-publico/drivers/api/utils/classify-v2-compra-agil-lifecycle.util';
import { coerceToNullableString } from 'src/engine/core-modules/mercado-publico/drivers/api/utils/coerce-to-nullable-string.util';
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
        WHERE CASE
          WHEN EXCLUDED.provider_changed_at IS NOT NULL
            AND mp.compra_agil.provider_changed_at IS NULL
          THEN TRUE
          WHEN EXCLUDED.provider_changed_at IS NOT NULL
            AND mp.compra_agil.provider_changed_at IS NOT NULL
          THEN (
            EXCLUDED.provider_changed_at > mp.compra_agil.provider_changed_at
            OR (
              EXCLUDED.provider_changed_at = mp.compra_agil.provider_changed_at
              AND ROW(
                EXCLUDED.observed_at,
                COALESCE(EXCLUDED.semantic_fingerprint, '')
              ) > ROW(
                COALESCE(mp.compra_agil.observed_at, '-infinity'::timestamptz),
                COALESCE(mp.compra_agil.semantic_fingerprint, '')
              )
            )
          )
          ELSE ROW(
            EXCLUDED.observed_at,
            COALESCE(EXCLUDED.semantic_fingerprint, '')
          ) > ROW(
            COALESCE(mp.compra_agil.observed_at, '-infinity'::timestamptz),
            COALESCE(mp.compra_agil.semantic_fingerprint, '')
          )
        END
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
      await this.projectChildren(
        entityManager,
        observationId,
        context,
      );
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
          document_count, llamado, observation_id, normalizer_version,
          provider_schema_fingerprint, availability, source_priority,
          provider_changed_at_raw, provider_changed_at, observed_at,
          last_seen_at, semantic_fingerprint, persisted_at, created_at,
          updated_at, description, delivery_address, delivery_days,
          cancellation_at, call_description, call_first_closing_at,
          call_second_closing_at, budget_type, budget_estimate,
          budget_currency, cancel_motive, deserted_motive, selection_motive,
          total_offers, total_demands, fine_penalty
        )
        VALUES ('compra_agil', $1, $2, $3, $3, $4, $5, $6, $7, $8, $9,
          $10, $11, $12, $13, $14, $15, $16, $17, $18, 'available', 'api-v2',
          $19, $20, $21, $21, $22, now(), now(), now(),
          $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35,
          $36, $37, $38)
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
          llamado = EXCLUDED.llamado,
          observation_id = EXCLUDED.observation_id,
          normalizer_version = EXCLUDED.normalizer_version,
          provider_schema_fingerprint = EXCLUDED.provider_schema_fingerprint,
          provider_changed_at_raw = EXCLUDED.provider_changed_at_raw,
          provider_changed_at = EXCLUDED.provider_changed_at,
          observed_at = GREATEST(COALESCE(mp.gold_detected_process.observed_at, EXCLUDED.observed_at), EXCLUDED.observed_at),
          persisted_at = now(),
          last_seen_at = GREATEST(mp.gold_detected_process.last_seen_at, EXCLUDED.last_seen_at),
          semantic_fingerprint = EXCLUDED.semantic_fingerprint,
          description = EXCLUDED.description,
          delivery_address = EXCLUDED.delivery_address,
          delivery_days = EXCLUDED.delivery_days,
          cancellation_at = EXCLUDED.cancellation_at,
          call_description = EXCLUDED.call_description,
          call_first_closing_at = EXCLUDED.call_first_closing_at,
          call_second_closing_at = EXCLUDED.call_second_closing_at,
          budget_type = EXCLUDED.budget_type,
          budget_estimate = EXCLUDED.budget_estimate,
          budget_currency = EXCLUDED.budget_currency,
          cancel_motive = EXCLUDED.cancel_motive,
          deserted_motive = EXCLUDED.deserted_motive,
          selection_motive = EXCLUDED.selection_motive,
          total_offers = EXCLUDED.total_offers,
          total_demands = EXCLUDED.total_demands,
          fine_penalty = EXCLUDED.fine_penalty,
          updated_at = now()
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
        getV2CompraAgilCallNumber(context.record),
        observationId,
        MERCADO_PUBLICO_V2_NORMALIZER_VERSION,
        schemaFingerprint,
        normalized.providerChangedAtRaw,
        normalized.providerChangedAt,
        observedAt,
        semanticFingerprint,
        normalized.description,
        normalized.deliveryAddress,
        normalized.deliveryDays,
        normalized.cancellationAt,
        normalized.callDescription,
        normalized.callFirstClosingAt,
        normalized.callSecondClosingAt,
        normalized.budgetType,
        normalized.budgetEstimate,
        normalized.budgetCurrency,
        normalized.cancelMotive,
        normalized.desertedMotive,
        normalized.selectionMotive,
        normalized.totalOffers,
        normalized.totalDemands,
        normalized.finePenalty,
      ],
    );
  }

  private async projectChildren(
    entityManager: EntityManager,
    observationId: string,
    context: MercadoPublicoV2ProjectionContext,
  ): Promise<void> {
    const { record } = context;
    const children: Array<{
      arrayName: string;
      providerKey: string | null;
      ordinal: number;
      element: unknown;
    }> = [];
    const nextOrdinalByArray = new Map<string, number>();
    const appendChild = (
      arrayName: string,
      element: unknown,
      providerKey: string | null,
    ): void => {
      const ordinal = nextOrdinalByArray.get(arrayName) ?? 0;

      nextOrdinalByArray.set(arrayName, ordinal + 1);
      children.push({ arrayName, providerKey, ordinal, element });
    };
    const appendArray = <Element>(
      arrayName: string,
      elements: Element[] | undefined,
      providerKeyFor: (element: Element) => string | null,
    ): void => {
      if (!Array.isArray(elements)) {
        return;
      }

      for (const element of elements) {
        appendChild(arrayName, element, providerKeyFor(element));
      }
    };

    appendArray('documentos', record.documentos, (document) =>
      coerceToNullableString(document.id),
    );
    appendArray(
      'productos_solicitados',
      record.productos_solicitados,
      (product) => coerceToNullableString(product.codigo_producto),
    );
    appendArray(
      'proveedores_cotizando',
      record.proveedores_cotizando,
      (provider) => coerceToNullableString(provider.id_cotizacion),
    );

    if (Array.isArray(record.proveedores_cotizando)) {
      for (const [providerOrdinal, provider] of record.proveedores_cotizando.entries()) {
        if (!Array.isArray(provider.productos_cotizados)) {
          continue;
        }

        const providerIdentifier = coerceToNullableString(
          provider.id_cotizacion,
        );

        for (const [productOrdinal, product] of provider.productos_cotizados.entries()) {
          const productIdentifier = coerceToNullableString(
            product.codigo_producto,
          );
          const nestedKey = `${providerIdentifier ?? providerOrdinal}:${productIdentifier ?? productOrdinal}`;

          appendChild('productos_cotizados', product, nestedKey);
        }
      }
    }

    await this.projectRelationSnapshots(entityManager, observationId, context);

    if (children.length === 0) {
      return;
    }

    const placeholders: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    for (const child of children) {
      const parentProviderKey =
        child.arrayName === 'productos_cotizados'
          ? child.providerKey?.split(':', 1)[0] ?? null
          : null;

      placeholders.push(
        `($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4}, $${paramIndex + 5}, $${paramIndex + 6}, $${paramIndex + 7})`,
      );
      params.push(
        observationId,
        record.codigo,
        child.arrayName,
        child.providerKey,
        child.ordinal,
        createJsonSha256(child.element),
        JSON.stringify(child.element),
        parentProviderKey,
      );
      paramIndex += 8;
    }

    await entityManager.query(
      `
        INSERT INTO mp.v2_child_evidence (
          observation_id, codigo, array_name, provider_key, ordinal,
          element_checksum, element_json, parent_provider_key
        )
        VALUES ${placeholders.join(', ')}
        ON CONFLICT (observation_id, array_name, ordinal) DO NOTHING
      `,
      params,
    );
  }

  private async projectRelationSnapshots(
    entityManager: EntityManager,
    observationId: string,
    context: MercadoPublicoV2ProjectionContext,
  ): Promise<void> {
    const { record } = context;
    const nestedProductTotal = Array.isArray(record.proveedores_cotizando)
      ? record.proveedores_cotizando.reduce(
          (total, provider) =>
            total + (Array.isArray(provider.productos_cotizados)
              ? provider.productos_cotizados.length
              : 0),
          0,
        )
      : 0;
    const nestedProductPresent = Array.isArray(
      record.proveedores_cotizando,
    )
      ? record.proveedores_cotizando.some((provider) =>
          Array.isArray(provider.productos_cotizados),
        )
      : false;
    const snapshots: Array<{
      relation: string;
      availability: 'available' | 'unavailable';
      totalCount: number;
    }> = [
      {
        relation: 'documentos',
        availability: Array.isArray(record.documentos)
          ? 'available'
          : 'unavailable',
        totalCount: Array.isArray(record.documentos)
          ? record.documentos.length
          : 0,
      },
      {
        relation: 'productos_solicitados',
        availability: Array.isArray(record.productos_solicitados)
          ? 'available'
          : 'unavailable',
        totalCount: Array.isArray(record.productos_solicitados)
          ? record.productos_solicitados.length
          : 0,
      },
      {
        relation: 'proveedores_cotizando',
        availability: Array.isArray(record.proveedores_cotizando)
          ? 'available'
          : 'unavailable',
        totalCount: Array.isArray(record.proveedores_cotizando)
          ? record.proveedores_cotizando.length
          : 0,
      },
      {
        relation: 'productos_cotizados',
        availability: nestedProductPresent ? 'available' : 'unavailable',
        totalCount: nestedProductPresent ? nestedProductTotal : 0,
      },
    ];
    const placeholders: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    for (const snapshot of snapshots) {
      placeholders.push(
        `($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4}, $${paramIndex + 5})`,
      );
      params.push(
        observationId,
        record.codigo,
        snapshot.relation,
        snapshot.availability,
        snapshot.totalCount,
        context.snapshotKind,
      );
      paramIndex += 6;
    }

    await entityManager.query(
      `
        INSERT INTO mp.v2_relation_snapshot (
          observation_id, codigo, relation, availability, total_count,
          source_kind
        )
        VALUES ${placeholders.join(', ')}
        ON CONFLICT (observation_id, relation) DO UPDATE SET
          availability = EXCLUDED.availability,
          total_count = EXCLUDED.total_count,
          source_kind = EXCLUDED.source_kind,
          projected_at = now()
      `,
      params,
    );
  }
}
