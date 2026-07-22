import crypto from 'crypto';
import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';

import { DataSource, type EntityManager } from 'typeorm';

// ponytail: this file uses ceiling markers per the local ponytail convention,
// which overrides AGENTS.md "no comments" for deferral documentation only.
import {
  MERCADO_PUBLICO_RECONCILIATION_HEURISTIC_ITEM_AMOUNT_TOLERANCE_RATIO,
  MERCADO_PUBLICO_RECONCILIATION_HEURISTIC_MATCH_TYPES,
  MERCADO_PUBLICO_RECONCILIATION_EXACT_MATCH_TYPES,
  MERCADO_PUBLICO_RECONCILIATION_MATCH_CONFIDENCE,
  MERCADO_PUBLICO_RECONCILIATION_MATCH_CONFIDENCE_LOW,
  MERCADO_PUBLICO_RECONCILIATION_MATCH_CONFIDENCE_MEDIUM,
  MERCADO_PUBLICO_RECONCILIATION_MATCH_CONFIDENCE_UNKNOWN,
  MERCADO_PUBLICO_RECONCILIATION_MATCHED_BY,
  MERCADO_PUBLICO_RECONCILIATION_SOURCE_API_V1_LICITACIONES,
  MERCADO_PUBLICO_RECONCILIATION_SOURCE_API_V1_OC,
  MERCADO_PUBLICO_RECONCILIATION_SOURCE_API_V2_COMPRA_AGIL,
  MERCADO_PUBLICO_RECONCILIATION_SOURCE_CSV,
  MERCADO_PUBLICO_RECONCILIATION_MATCH_TYPES_THAT_SUPPRESS_UNMATCHED,
} from 'src/engine/core-modules/mercado-publico/mercado-publico.constants';

type ReconciliationPair = {
  entityASource: string;
  entityAType: string;
  entityAKey: string;
  entityBSource: string;
  entityBType: string;
  entityBKey: string;
  matchType: string;
};

type ReconciliationEventRow = {
  eventType: string;
  entityType: string;
  entityKey: string;
  sourceA: string | null;
  sourceB: string | null;
  details: Record<string, unknown> | null;
};

type MercadoPublicoProcessType = 'licitacion' | 'orden_compra' | 'compra_agil';

@Injectable()
export class MercadoPublicoReconciliationService {
  private readonly logger = new Logger(
    MercadoPublicoReconciliationService.name,
  );

  constructor(
    @InjectDataSource()
    private readonly coreDataSource: DataSource,
  ) {}

  async refreshAllExactReconciliation(): Promise<{
    exactCodigoExterno: number;
    csvApiSameBusinessKey: number;
    exactCodigoLicitacion: number;
    exactCompraAgilIdOrdenCompra: number;
    total: number;
  }> {
    return this.coreDataSource.transaction(async (entityManager) => {
      const exactCodigoExterno =
        await this.reconcileExactCodigoExterno(entityManager);
      const csvApiSameBusinessKey =
        await this.reconcileCsvApiSameBusinessKey(entityManager);
      const exactCodigoLicitacion =
        await this.reconcileExactCodigoLicitacion(entityManager);
      const exactCompraAgilIdOrdenCompra =
        await this.reconcileExactCompraAgilIdOrdenCompra(entityManager);

      const total =
        exactCodigoExterno +
        csvApiSameBusinessKey +
        exactCodigoLicitacion +
        exactCompraAgilIdOrdenCompra;

      this.logger.log(
        `Exact reconciliation complete: codigo_externo=${exactCodigoExterno}, ` +
          `csv_api_same_business_key=${csvApiSameBusinessKey}, ` +
          `codigo_licitacion=${exactCodigoLicitacion}, ` +
          `compra_agil_id_orden_compra=${exactCompraAgilIdOrdenCompra}, ` +
          `total=${total}`,
      );

      return {
        exactCodigoExterno,
        csvApiSameBusinessKey,
        exactCodigoLicitacion,
        exactCompraAgilIdOrdenCompra,
        total,
      };
    });
  }

  async refreshAllHeuristicReconciliation(): Promise<{
    candidates: number;
    unmatched: number;
    events: number;
    goldProcessesMaterialized: number;
    total: number;
  }> {
    const candidateSupplier = await this.coreDataSource.transaction(
      async (entityManager) => this.reconcileCandidateSupplier(entityManager),
    );
    const candidateItem = await this.coreDataSource.transaction(
      async (entityManager) => this.reconcileCandidateItem(entityManager),
    );
    const unmatched = await this.coreDataSource.transaction(
      async (entityManager) => this.reconcileUnmatched(entityManager),
    );
    const stateMismatchEvents = await this.coreDataSource.transaction(
      async (entityManager) => this.reconcileStateMismatchEvents(entityManager),
    );
    const sourcePeriodEvents = await this.coreDataSource.transaction(
      async (entityManager) =>
        this.reconcileSourcePeriodRerunEvents(entityManager),
    );
    const goldProcessesMaterialized = await this.coreDataSource.transaction(
      async (entityManager) => this.materializeGoldProcesses(entityManager),
    );

    const candidates = candidateSupplier + candidateItem;
    const events = stateMismatchEvents + sourcePeriodEvents;
    const total = candidates + unmatched + events;

    this.logger.log(
      `Heuristic reconciliation complete: candidates=${candidates}, ` +
        `unmatched=${unmatched}, ` +
        `events=${events}, ` +
        `goldProcessesMaterialized=${goldProcessesMaterialized}, ` +
        `total=${total}`,
    );

    return {
      candidates,
      unmatched,
      events,
      goldProcessesMaterialized,
      total,
    };
  }

  private async reconcileCandidateSupplier(
    entityManager: EntityManager,
  ): Promise<number> {
    // ponytail: same tolerance constant for _amount heuristics, split when supplier/item ratios diverge
    const tolerance =
      MERCADO_PUBLICO_RECONCILIATION_HEURISTIC_ITEM_AMOUNT_TOLERANCE_RATIO;

    const rows = await entityManager.query<
      { api_codigo: string; csv_codigo: string }[]
    >(
      `
        -- Source contract: docs/business/mercado-publico-source-contract.md
        -- (CSV column \`MontoTotalOC_PesosChilenos\` line 309; comma-decimal rule
        -- line 361-366: "Convert comma decimals only in validated numeric canonical
        -- fields; record parse failures instead of dropping the row or column.")
        SELECT DISTINCT
          api.codigo AS api_codigo,
          csv.codigo AS csv_codigo
        FROM mp.stg_api_v1_orden_compra api
        INNER JOIN mp.stg_csv_orden_compra csv
          ON lower(trim(csv.nombre_proveedor)) = lower(trim(api.nombre_proveedor))
        WHERE api.nombre_proveedor IS NOT NULL
          AND csv.nombre_proveedor IS NOT NULL
          AND api.monto_total_oc IS NOT NULL
          AND csv.monto_total_oc_pesos_chilenos IS NOT NULL
          AND api.monto_total_oc ~ '^-?[0-9]+([.,][0-9]+)?$'
          AND csv.monto_total_oc_pesos_chilenos ~ '^-?[0-9]+([.,][0-9]+)?$'
          AND abs(replace(api.monto_total_oc, ',', '.')::numeric - replace(csv.monto_total_oc_pesos_chilenos, ',', '.')::numeric)
              / NULLIF(replace(api.monto_total_oc, ',', '.')::numeric, 0) <= $1
          AND NOT EXISTS (
            SELECT 1 FROM mp.reconciliation_public_market_entities r
            WHERE r.match_type = 'csv_api_same_business_key'
              AND r.entity_a_key = api.codigo
              AND r.entity_b_type = 'orden_compra'
              AND r.entity_b_source = $2
              AND r.entity_b_key = csv.codigo
          )
      `,
      [tolerance, MERCADO_PUBLICO_RECONCILIATION_SOURCE_CSV],
    );

    if (rows.length === 0) {
      return 0;
    }

    const pairs: ReconciliationPair[] = rows.map((r) => ({
      entityASource: MERCADO_PUBLICO_RECONCILIATION_SOURCE_API_V1_OC,
      entityAType: 'orden_compra',
      entityAKey: r.api_codigo,
      entityBSource: MERCADO_PUBLICO_RECONCILIATION_SOURCE_CSV,
      entityBType: 'orden_compra',
      entityBKey: r.csv_codigo,
      matchType: 'candidate_supplier_amount',
    }));

    return this.bulkUpsertPairs(
      entityManager,
      pairs,
      // ponytail: medium confidence, upgrade to high when RUT equality + amount ratio prove
      MERCADO_PUBLICO_RECONCILIATION_MATCH_CONFIDENCE_MEDIUM,
    );
  }

  private async reconcileCandidateItem(
    entityManager: EntityManager,
  ): Promise<number> {
    // ponytail: same tolerance constant as reconcileCandidateSupplier, split when item/supplier diverge
    const tolerance =
      MERCADO_PUBLICO_RECONCILIATION_HEURISTIC_ITEM_AMOUNT_TOLERANCE_RATIO;

    const rows = await entityManager.query<
      { codigo_externo: string; codigoitem: string }[]
    >(
      `
        SELECT DISTINCT
          lic_item.codigo_externo,
          lic_item.codigoitem
        FROM mp.licitacion_item lic_item
        INNER JOIN mp.stg_csv_licitacion stg
          ON stg.codigoitem = lic_item.codigoitem
          AND stg.codigo_externo = lic_item.codigo_externo
        WHERE lic_item.monto_estimado IS NOT NULL
          AND stg.monto_estimado_adjudicado IS NOT NULL
          AND stg.monto_estimado_adjudicado ~ '^-?[0-9]+([.,][0-9]+)?$'
          AND abs(lic_item.monto_estimado - replace(stg.monto_estimado_adjudicado, ',', '.')::numeric)
              / NULLIF(lic_item.monto_estimado, 0) <= $1
          AND NOT EXISTS (
            SELECT 1 FROM mp.reconciliation_public_market_entities r
            WHERE r.match_type = 'exact_codigo_externo'
              AND r.entity_a_key = lic_item.codigo_externo
          )
      `,
      [tolerance],
    );

    if (rows.length === 0) {
      return 0;
    }

    // ponytail: self-pair under CSV source, pointer that Canonical has an item row with monto
    const pairs: ReconciliationPair[] = rows.map((r) => ({
      entityASource: MERCADO_PUBLICO_RECONCILIATION_SOURCE_CSV,
      entityAType: 'licitacion_item',
      entityAKey: `${r.codigo_externo}+${r.codigoitem}`,
      entityBSource: MERCADO_PUBLICO_RECONCILIATION_SOURCE_CSV,
      entityBType: 'licitacion',
      entityBKey: r.codigo_externo,
      matchType: 'candidate_item_amount',
    }));

    return this.bulkUpsertPairs(
      entityManager,
      pairs,
      // ponytail: low confidence, upgrade when amount tolerance proves
      MERCADO_PUBLICO_RECONCILIATION_MATCH_CONFIDENCE_LOW,
    );
  }

  private async reconcileUnmatched(
    entityManager: EntityManager,
  ): Promise<number> {
    const rows = await entityManager.query<
      { entity_key: string; entity_type: MercadoPublicoProcessType }[]
    >(
      `
        SELECT codigo_externo AS entity_key, 'licitacion' AS entity_type
        FROM mp.licitacion
        WHERE NOT EXISTS (
          SELECT 1 FROM mp.reconciliation_public_market_entities r
          WHERE (
            (r.entity_a_type = 'licitacion' AND r.entity_a_key = mp.licitacion.codigo_externo)
            OR (
              r.entity_b_type = 'licitacion'
              AND r.entity_b_key = mp.licitacion.codigo_externo
              AND r.entity_a_type = 'licitacion'
            )
          )
          AND r.match_type = ANY($1::text[])
        )
        UNION ALL
        SELECT codigo AS entity_key, 'orden_compra' AS entity_type
        FROM mp.orden_compra
        WHERE NOT EXISTS (
          SELECT 1 FROM mp.reconciliation_public_market_entities r
          WHERE (
            (r.entity_a_type = 'orden_compra' AND r.entity_a_key = mp.orden_compra.codigo)
            OR (r.entity_b_type = 'orden_compra' AND r.entity_b_key = mp.orden_compra.codigo)
          )
          AND r.match_type = ANY($1::text[])
        )
        UNION ALL
        SELECT codigo AS entity_key, 'compra_agil' AS entity_type
        FROM mp.compra_agil
        WHERE NOT EXISTS (
          SELECT 1 FROM mp.reconciliation_public_market_entities r
          WHERE (
            (r.entity_a_type = 'compra_agil' AND r.entity_a_key = mp.compra_agil.codigo)
            OR (r.entity_b_type = 'compra_agil' AND r.entity_b_key = mp.compra_agil.codigo)
          )
          AND r.match_type = ANY($1::text[])
        )
      `,
      [MERCADO_PUBLICO_RECONCILIATION_MATCH_TYPES_THAT_SUPPRESS_UNMATCHED],
    );

    if (rows.length === 0) {
      return 0;
    }

    const events: ReconciliationEventRow[] = rows.map((r) => ({
      eventType: 'manual_review_required',
      entityType: r.entity_type,
      entityKey: r.entity_key,
      sourceA: null,
      sourceB: null,
      details: { reason: 'no_reconciliation_row' },
    }));

    await this.bulkInsertEvents(entityManager, events);

    const sourceByProcessType: Record<string, string> = {
      licitacion: MERCADO_PUBLICO_RECONCILIATION_SOURCE_API_V1_LICITACIONES,
      orden_compra: MERCADO_PUBLICO_RECONCILIATION_SOURCE_API_V1_OC,
      compra_agil: MERCADO_PUBLICO_RECONCILIATION_SOURCE_API_V2_COMPRA_AGIL,
    };
    const unmatchedPairs = events.map((event) => ({
      entityASource: sourceByProcessType[event.entityType],
      entityAType: event.entityType,
      entityAKey: event.entityKey,
      entityBSource: MERCADO_PUBLICO_RECONCILIATION_SOURCE_CSV,
      entityBType: event.entityType,
      entityBKey: event.entityKey,
      matchType: 'unmatched',
    }));
    let insertedUnmatchedCount = 0;
    const maxRowsPerInsert = 5000;

    for (
      let index = 0;
      index < unmatchedPairs.length;
      index += maxRowsPerInsert
    ) {
      const chunk = unmatchedPairs.slice(index, index + maxRowsPerInsert);
      const valuePlaceholders: string[] = [];
      const params: unknown[] = [];
      let paramIndex = 1;

      for (const pair of chunk) {
        valuePlaceholders.push(
          `($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4}, $${paramIndex + 5}, $${paramIndex + 6}, $${paramIndex + 7}, $${paramIndex + 8})`,
        );
        params.push(
          pair.entityASource,
          pair.entityAType,
          pair.entityAKey,
          pair.entityBSource,
          pair.entityBType,
          pair.entityBKey,
          pair.matchType,
          MERCADO_PUBLICO_RECONCILIATION_MATCH_CONFIDENCE_UNKNOWN,
          MERCADO_PUBLICO_RECONCILIATION_MATCHED_BY,
        );
        paramIndex += 9;
      }

      const chunkInsertedRows = await entityManager.query<
        { entity_a_key: string; entity_a_type: string }[]
      >(
        `
          INSERT INTO mp.reconciliation_public_market_entities (
            entity_a_source,
            entity_a_type,
            entity_a_key,
            entity_b_source,
            entity_b_type,
            entity_b_key,
            match_type,
            match_confidence,
            matched_by
          )
          VALUES ${valuePlaceholders.join(', ')}
          ON CONFLICT (entity_a_source, entity_a_type, entity_a_key, entity_b_source, entity_b_type, entity_b_key, match_type) DO NOTHING
          RETURNING entity_a_key, entity_a_type
        `,
        params,
      );

      insertedUnmatchedCount += chunkInsertedRows.length;
    }

    return insertedUnmatchedCount;
  }

  private async reconcileStateMismatchEvents(
    entityManager: EntityManager,
  ): Promise<number> {
    const rows = await entityManager.query<
      {
        codigo_externo: string;
        canonical_state: string;
        latest_staging_estado: string;
      }[]
    >(
      `
        SELECT DISTINCT ON (r.entity_a_key)
          r.entity_a_key AS codigo_externo,
          lic.canonical_state,
          staging.estado AS latest_staging_estado
        FROM mp.reconciliation_public_market_entities r
        INNER JOIN mp.licitacion lic ON lic.codigo_externo = r.entity_a_key
        INNER JOIN LATERAL (
          SELECT s.estado, s.fetched_at
          FROM mp.stg_api_v1_licitacion s
          WHERE s.codigo_externo = r.entity_a_key
          ORDER BY s.fetched_at DESC
          LIMIT 1
        ) staging ON true
        WHERE r.match_type = 'exact_codigo_externo'
          AND lic.canonical_state IS NOT NULL
          AND lic.canonical_state IS DISTINCT FROM staging.estado
        ORDER BY r.entity_a_key
      `,
    );

    if (rows.length === 0) {
      return 0;
    }

    const events: ReconciliationEventRow[] = rows.map((r) => ({
      eventType: 'state_mismatch',
      entityType: 'licitacion',
      entityKey: r.codigo_externo,
      sourceA: MERCADO_PUBLICO_RECONCILIATION_SOURCE_API_V1_LICITACIONES,
      sourceB: MERCADO_PUBLICO_RECONCILIATION_SOURCE_CSV,
      details: {
        canonicalState: r.canonical_state,
        latestStagingEstado: r.latest_staging_estado,
      },
    }));

    return this.bulkInsertEvents(entityManager, events);
  }

  // ponytail: compares only newest vs second-newest checksum per period.
  // Intermediate A->B->C transitions that landed between scheduled runs and
  // were superseded before this scan are not emitted; idempotent fingerprints
  // persist any previously emitted mismatch. Full pairwise scan if a regulator
  // requires every transition audited.
  private async reconcileSourcePeriodRerunEvents(
    entityManager: EntityManager,
  ): Promise<number> {
    const rows = await entityManager.query<
      {
        source_dataset: string;
        source_period: string;
        checksum_older: string;
        checksum_newer: string;
      }[]
    >(
      `
        SELECT
          dataset.source_dataset,
          dataset.source_period,
          newer.file_checksum AS checksum_newer,
          older.file_checksum AS checksum_older
        FROM (
          SELECT DISTINCT source_dataset, source_period
          FROM mp.raw_csv_file
        ) dataset
        INNER JOIN LATERAL (
          SELECT id, file_checksum, downloaded_at
          FROM mp.raw_csv_file
          WHERE source_dataset = dataset.source_dataset
            AND source_period = dataset.source_period
          ORDER BY downloaded_at DESC, id DESC
          LIMIT 1
        ) newer ON true
        INNER JOIN LATERAL (
          SELECT id, file_checksum, downloaded_at
          FROM mp.raw_csv_file
          WHERE source_dataset = dataset.source_dataset
            AND source_period = dataset.source_period
            AND id <> newer.id
          ORDER BY downloaded_at DESC, id DESC
          LIMIT 1
        ) older ON true
        WHERE newer.file_checksum IS DISTINCT FROM older.file_checksum
      `,
    );

    if (rows.length === 0) {
      return 0;
    }

    const events: ReconciliationEventRow[] = rows.map((r) => ({
      eventType: 'source_period_rerun_mismatch',
      entityType: r.source_dataset === 'oc' ? 'orden_compra' : 'licitacion',
      entityKey: r.source_period,
      sourceA: MERCADO_PUBLICO_RECONCILIATION_SOURCE_CSV,
      sourceB: MERCADO_PUBLICO_RECONCILIATION_SOURCE_CSV,
      details: {
        sourceDataset: r.source_dataset,
        sourcePeriod: r.source_period,
        checksumOlder: r.checksum_older,
        checksumNewer: r.checksum_newer,
      },
    }));

    return this.bulkInsertEvents(entityManager, events);
  }

  private async bulkInsertEvents(
    entityManager: EntityManager,
    events: ReconciliationEventRow[],
  ): Promise<number> {
    // ponytail: per-row INSERT, set-based bulk when cold-path volume proves it
    if (events.length === 0) {
      return 0;
    }

    let inserted = 0;

    for (const event of events) {
      const fingerprint = this.computeEventFingerprint(
        event.eventType,
        event.entityType,
        event.entityKey,
        event.sourceA,
        event.sourceB,
        event.details,
      );

      const result = await entityManager.query<{ upserted: number }[]>(
        `
          INSERT INTO mp.reconciliation_event (
            event_fingerprint,
            event_type,
            entity_type,
            entity_key,
            source_a,
            source_b,
            details
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (event_fingerprint) DO NOTHING
          RETURNING 1 AS upserted
        `,
        [
          fingerprint,
          event.eventType,
          event.entityType,
          event.entityKey,
          event.sourceA,
          event.sourceB,
          event.details ? JSON.stringify(event.details) : null,
        ],
      );

      inserted += result.length;
    }

    return inserted;
  }

  // ponytail: insert-order coupling on details — key-sort JSON.stringify on first non-literal caller
  private computeEventFingerprint(
    eventType: string,
    entityType: string,
    entityKey: string,
    sourceA: string | null,
    sourceB: string | null,
    details: Record<string, unknown> | null,
  ): string {
    const payload = [
      eventType,
      entityType,
      entityKey,
      sourceA ?? '',
      sourceB ?? '',
      JSON.stringify(details ?? {}),
    ].join('|');

    return crypto.createHash('sha256').update(payload, 'utf-8').digest('hex');
  }

  private async materializeGoldProcesses(
    entityManager: EntityManager,
  ): Promise<number> {
    const rows = await entityManager.query<{ process_type: string }[]>(
      `
        WITH canonical AS (
          SELECT
            'licitacion' AS process_type,
            codigo_externo AS process_code,
            title,
            canonical_state,
            raw_state_code,
            raw_state_label,
            buyer_code,
            buyer_name,
            fecha_publicacion::timestamptz AS published_at,
            fecha_cierre::timestamptz AS closing_at,
            source_priority,
            last_seen_at
          FROM mp.licitacion

          UNION ALL

          SELECT
            'orden_compra' AS process_type,
            codigo AS process_code,
            NULL AS title,
            canonical_state,
            raw_state_code,
            raw_state_label,
            NULL AS buyer_code,
            NULL AS buyer_name,
            NULL::timestamptz AS published_at,
            NULL::timestamptz AS closing_at,
            source_priority,
            last_seen_at
          FROM mp.orden_compra

          UNION ALL

          SELECT
            'compra_agil' AS process_type,
            codigo AS process_code,
            NULL AS title,
            estado AS canonical_state,
            NULL AS raw_state_code,
            NULL AS raw_state_label,
            NULL AS buyer_code,
            NULL AS buyer_name,
            fecha_publicacion AS published_at,
            fecha_cierre AS closing_at,
            NULL AS source_priority,
            last_seen_at
          FROM mp.compra_agil
        ),
        status_by_entity AS (
          SELECT
            canonical.process_type,
            canonical.process_code,
            CASE
              WHEN EXISTS (
                SELECT 1
                FROM mp.reconciliation_public_market_entities r
                WHERE (
                  (r.entity_a_type = canonical.process_type AND r.entity_a_key = canonical.process_code)
                  OR (r.entity_b_type = canonical.process_type AND r.entity_b_key = canonical.process_code)
                )
                AND r.match_type = ANY($1::text[])
              ) THEN 'exact'
              WHEN EXISTS (
                SELECT 1
                FROM mp.reconciliation_public_market_entities r
                WHERE (
                  (r.entity_a_type = canonical.process_type AND r.entity_a_key = canonical.process_code)
                  OR (r.entity_b_type = canonical.process_type AND r.entity_b_key = canonical.process_code)
                )
                AND r.match_type = ANY($2::text[])
              ) THEN 'candidate'
              WHEN EXISTS (
                SELECT 1
                FROM mp.reconciliation_public_market_entities r
                WHERE (
                  (r.entity_a_type = canonical.process_type AND r.entity_a_key = canonical.process_code)
                  OR (r.entity_b_type = canonical.process_type AND r.entity_b_key = canonical.process_code)
                )
                AND r.match_type = 'unmatched'
              ) THEN 'unmatched'
              ELSE NULL
            END AS reconciliation_status
          FROM canonical
        )
        INSERT INTO mp.gold_detected_process (
          process_type,
          process_code,
          title,
          canonical_state,
          raw_state_code,
          raw_state_label,
          buyer_code,
          buyer_name,
          published_at,
          closing_at,
          source_priority,
          reconciliation_status,
          last_seen_at,
          created_at,
          updated_at
        )
        SELECT
          canonical.process_type,
          canonical.process_code,
          canonical.title,
          canonical.canonical_state,
          canonical.raw_state_code,
          canonical.raw_state_label,
          canonical.buyer_code,
          canonical.buyer_name,
          canonical.published_at,
          canonical.closing_at,
          canonical.source_priority,
          status_by_entity.reconciliation_status,
          canonical.last_seen_at,
          now(),
          now()
        FROM canonical
        INNER JOIN status_by_entity
          ON status_by_entity.process_type = canonical.process_type
          AND status_by_entity.process_code = canonical.process_code
        ON CONFLICT (process_type, process_code) DO UPDATE
        SET title = EXCLUDED.title,
            canonical_state = EXCLUDED.canonical_state,
            raw_state_code = EXCLUDED.raw_state_code,
            raw_state_label = EXCLUDED.raw_state_label,
            buyer_code = EXCLUDED.buyer_code,
            buyer_name = EXCLUDED.buyer_name,
            published_at = EXCLUDED.published_at,
            closing_at = EXCLUDED.closing_at,
            source_priority = EXCLUDED.source_priority,
            reconciliation_status = EXCLUDED.reconciliation_status,
            last_seen_at = GREATEST(mp.gold_detected_process.last_seen_at, EXCLUDED.last_seen_at),
            updated_at = now()
        RETURNING process_type
      `,
      [
        MERCADO_PUBLICO_RECONCILIATION_EXACT_MATCH_TYPES,
        MERCADO_PUBLICO_RECONCILIATION_HEURISTIC_MATCH_TYPES.filter(
          (matchType) => matchType !== 'unmatched',
        ),
      ],
    );

    return rows.length;
  }

  private async reconcileExactCodigoExterno(
    entityManager: EntityManager,
  ): Promise<number> {
    const rows = await entityManager.query<{ codigo_externo: string }[]>(
      `
        SELECT sa.codigo_externo
        FROM mp.stg_api_v1_licitacion sa
        WHERE sa.codigo_externo IS NOT NULL
        INTERSECT
        SELECT sc.codigo_externo
        FROM mp.stg_csv_licitacion sc
        WHERE sc.codigo_externo IS NOT NULL
      `,
    );

    if (rows.length === 0) {
      return 0;
    }

    const pairs: ReconciliationPair[] = rows.map((r) => ({
      entityASource: MERCADO_PUBLICO_RECONCILIATION_SOURCE_API_V1_LICITACIONES,
      entityAType: 'licitacion',
      entityAKey: r.codigo_externo,
      entityBSource: MERCADO_PUBLICO_RECONCILIATION_SOURCE_CSV,
      entityBType: 'licitacion',
      entityBKey: r.codigo_externo,
      matchType: 'exact_codigo_externo',
    }));

    const upsertedCount = await this.bulkUpsertPairs(entityManager, pairs);

    return upsertedCount;
  }

  private async reconcileCsvApiSameBusinessKey(
    entityManager: EntityManager,
  ): Promise<number> {
    const rows = await entityManager.query<{ codigo: string }[]>(
      `
        SELECT sa.codigo
        FROM mp.stg_api_v1_orden_compra sa
        WHERE sa.codigo IS NOT NULL
        INTERSECT
        SELECT sc.codigo
        FROM mp.stg_csv_orden_compra sc
        WHERE sc.codigo IS NOT NULL
      `,
    );

    if (rows.length === 0) {
      return 0;
    }

    const pairs: ReconciliationPair[] = rows.map((r) => ({
      entityASource: MERCADO_PUBLICO_RECONCILIATION_SOURCE_API_V1_OC,
      entityAType: 'orden_compra',
      entityAKey: r.codigo,
      entityBSource: MERCADO_PUBLICO_RECONCILIATION_SOURCE_CSV,
      entityBType: 'orden_compra',
      entityBKey: r.codigo,
      matchType: 'csv_api_same_business_key',
    }));

    return this.bulkUpsertPairs(entityManager, pairs);
  }

  private async reconcileExactCodigoLicitacion(
    entityManager: EntityManager,
  ): Promise<number> {
    const rows = await entityManager.query<
      { codigo_externo: string; codigo_oc: string }[]
    >(
      `
        SELECT
          lic.codigo_externo,
          oc.codigo AS codigo_oc
        FROM mp.licitacion lic
        INNER JOIN mp.orden_compra oc
          ON oc.codigo_licitacion = lic.codigo_externo
        WHERE oc.codigo_licitacion IS NOT NULL
          AND lic.codigo_externo IS NOT NULL
      `,
    );

    if (rows.length === 0) {
      return 0;
    }

    const seen = new Set<string>();
    const pairs: ReconciliationPair[] = [];

    for (const r of rows) {
      const dedupeKey = `${r.codigo_externo}|${r.codigo_oc}`;

      if (seen.has(dedupeKey)) {
        continue;
      }
      seen.add(dedupeKey);

      pairs.push({
        entityASource:
          MERCADO_PUBLICO_RECONCILIATION_SOURCE_API_V1_LICITACIONES,
        entityAType: 'licitacion',
        entityAKey: r.codigo_externo,
        entityBSource: MERCADO_PUBLICO_RECONCILIATION_SOURCE_API_V1_OC,
        entityBType: 'orden_compra',
        entityBKey: r.codigo_oc,
        matchType: 'exact_codigo_licitacion',
      });
    }

    return this.bulkUpsertPairs(entityManager, pairs);
  }

  private async reconcileExactCompraAgilIdOrdenCompra(
    entityManager: EntityManager,
  ): Promise<number> {
    const caRows = await entityManager.query<
      {
        codigo: string;
        id_orden_compra: string | null;
        id_oc: string | null;
      }[]
    >(
      `
        SELECT codigo, id_orden_compra, id_oc
        FROM mp.compra_agil
        WHERE id_orden_compra IS NOT NULL OR id_oc IS NOT NULL
      `,
    );

    if (caRows.length === 0) {
      return 0;
    }

    const candidateOcCodigos = new Set<string>();

    for (const ca of caRows) {
      if (ca.id_orden_compra) candidateOcCodigos.add(ca.id_orden_compra);
      if (ca.id_oc) candidateOcCodigos.add(ca.id_oc);
    }

    if (candidateOcCodigos.size === 0) {
      return 0;
    }

    const existing = await entityManager.query<{ codigo: string }[]>(
      `SELECT codigo FROM mp.orden_compra WHERE codigo = ANY($1::text[])`,
      [Array.from(candidateOcCodigos)],
    );
    const existingSet = new Set(existing.map((r) => r.codigo));

    const pairs: ReconciliationPair[] = [];

    for (const ca of caRows) {
      let ocCodigo: string | null = null;

      if (ca.id_orden_compra && existingSet.has(ca.id_orden_compra)) {
        ocCodigo = ca.id_orden_compra;
      } else if (ca.id_oc && existingSet.has(ca.id_oc)) {
        ocCodigo = ca.id_oc;
      }

      if (ocCodigo) {
        pairs.push({
          entityASource:
            MERCADO_PUBLICO_RECONCILIATION_SOURCE_API_V2_COMPRA_AGIL,
          entityAType: 'compra_agil',
          entityAKey: ca.codigo,
          entityBSource: MERCADO_PUBLICO_RECONCILIATION_SOURCE_API_V1_OC,
          entityBType: 'orden_compra',
          entityBKey: ocCodigo,
          matchType: 'exact_compra_agil_id_orden_compra',
        });
      }
    }

    if (pairs.length === 0) {
      return 0;
    }

    return this.bulkUpsertPairs(entityManager, pairs);
  }

  private async bulkUpsertPairs(
    entityManager: EntityManager,
    pairs: ReconciliationPair[],
    matchConfidence?: string,
    matchedBy?: string,
  ): Promise<number> {
    if (pairs.length === 0) {
      return 0;
    }

    const confidence =
      matchConfidence ?? MERCADO_PUBLICO_RECONCILIATION_MATCH_CONFIDENCE;
    const matchedByValue =
      matchedBy ?? MERCADO_PUBLICO_RECONCILIATION_MATCHED_BY;
    const maxRowsPerInsert = 5000;

    let inserted = 0;

    for (let index = 0; index < pairs.length; index += maxRowsPerInsert) {
      const chunk = pairs.slice(index, index + maxRowsPerInsert);
      const valuePlaceholders: string[] = [];
      const params: unknown[] = [];
      let paramIndex = 1;

      for (const pair of chunk) {
        valuePlaceholders.push(
          `($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4}, $${paramIndex + 5}, $${paramIndex + 6}, $${paramIndex + 7}, $${paramIndex + 8})`,
        );
        params.push(
          pair.entityASource,
          pair.entityAType,
          pair.entityAKey,
          pair.entityBSource,
          pair.entityBType,
          pair.entityBKey,
          pair.matchType,
          confidence,
          matchedByValue,
        );
        paramIndex += 9;
      }

      const result = await entityManager.query<{ upserted: number }[]>(
        `
          INSERT INTO mp.reconciliation_public_market_entities (
            entity_a_source,
            entity_a_type,
            entity_a_key,
            entity_b_source,
            entity_b_type,
            entity_b_key,
            match_type,
            match_confidence,
            matched_by
          )
          VALUES ${valuePlaceholders.join(', ')}
          ON CONFLICT (entity_a_source, entity_a_type, entity_a_key, entity_b_source, entity_b_type, entity_b_key, match_type) DO NOTHING
          RETURNING 1 AS upserted
        `,
        params,
      );

      inserted += result.length;
    }

    return inserted;
  }
}
