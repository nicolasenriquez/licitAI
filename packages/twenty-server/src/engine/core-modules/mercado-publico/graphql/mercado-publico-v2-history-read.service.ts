import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';

import { DataSource } from 'typeorm';

export type MercadoPublicoV2HistoryRow = {
  id: string;
  codigo: string;
  previous_observation_id: string | null;
  new_observation_id: string | null;
  semantic_fingerprint_before: string | null;
  semantic_fingerprint_after: string | null;
  before_json: Record<string, unknown> | null;
  after_json: Record<string, unknown> | null;
  provider_changed_at_raw: string | null;
  provider_changed_at: Date | null;
  observed_at: Date | null;
  normalizer_version: string | null;
  provider_schema_fingerprint: string | null;
  created_at: Date;
  source: string | null;
  endpoint: string | null;
  snapshot_kind: string | null;
};

export type MercadoPublicoV2HistoryEvent = {
  id: string;
  codigo: string;
  cursor: string;
  changedFields: string[];
  previousObservationId: string | null;
  newObservationId: string | null;
  providerChangedAt: Date | null;
  observedAt: Date | null;
  normalizerVersion: string | null;
  providerSchemaFingerprint: string | null;
  source: string | null;
  endpoint: string | null;
  snapshotKind: string | null;
  createdAt: Date;
};

export type MercadoPublicoV2HistoryConnection = {
  rows: MercadoPublicoV2HistoryEvent[];
  hasNextPage: boolean;
  startCursor: string | null;
  endCursor: string | null;
};

type HistoryCursor = {
  createdAt: string;
  id: string;
};

export const encodeMercadoPublicoV2HistoryCursor = (
  row: MercadoPublicoV2HistoryRow,
): string =>
  Buffer.from(
    JSON.stringify({
      createdAt: row.created_at.toISOString(),
      id: row.id,
    } satisfies HistoryCursor),
  ).toString('base64url');

const decodeHistoryCursor = (value: string): HistoryCursor => {
  try {
    const parsed = JSON.parse(
      Buffer.from(value, 'base64url').toString('utf8'),
    ) as Partial<HistoryCursor>;

    const invalid =
      typeof parsed.createdAt !== 'string' ||
      Number.isNaN(new Date(parsed.createdAt).getTime()) ||
      typeof parsed.id !== 'string' ||
      parsed.id.length === 0;

    if (invalid) {
      throw new Error('invalid history cursor');
    }

    return {
      createdAt: parsed.createdAt as string,
      id: parsed.id as string,
    };
  } catch {
    throw new BadRequestException(
      'Mercado Publico V2 history cursor is invalid',
    );
  }
};

const deriveChangedFields = (
  before: Record<string, unknown> | null,
  after: Record<string, unknown> | null,
): string[] => {
  const beforeJson = before ?? {};
  const afterJson = after ?? {};
  const keys = new Set([...Object.keys(beforeJson), ...Object.keys(afterJson)]);

  return [...keys]
    .filter((key) => {
      const hasBeforeKey = Object.prototype.hasOwnProperty.call(
        beforeJson,
        key,
      );
      const hasAfterKey = Object.prototype.hasOwnProperty.call(afterJson, key);

      return (
        hasBeforeKey !== hasAfterKey ||
        JSON.stringify(beforeJson[key]) !== JSON.stringify(afterJson[key])
      );
    })
    .sort();
};

const toHistoryEvent = (
  row: MercadoPublicoV2HistoryRow,
): MercadoPublicoV2HistoryEvent => ({
  id: row.id,
  codigo: row.codigo,
  cursor: encodeMercadoPublicoV2HistoryCursor(row),
  changedFields: deriveChangedFields(row.before_json, row.after_json),
  previousObservationId: row.previous_observation_id,
  newObservationId: row.new_observation_id,
  providerChangedAt: row.provider_changed_at,
  observedAt: row.observed_at,
  normalizerVersion: row.normalizer_version,
  providerSchemaFingerprint: row.provider_schema_fingerprint,
  source: row.source,
  endpoint: row.endpoint,
  snapshotKind: row.snapshot_kind,
  createdAt: row.created_at,
});

@Injectable()
export class MercadoPublicoV2HistoryReadService {
  constructor(
    @InjectDataSource()
    private readonly coreDataSource: DataSource,
  ) {}

  async listHistory(
    codigo: string,
    after?: string | null,
    first?: number,
  ): Promise<MercadoPublicoV2HistoryConnection> {
    const normalizedCodigo = codigo.trim();

    if (!normalizedCodigo) {
      throw new BadRequestException(
        'Mercado Publico V2 history requires codigo',
      );
    }

    const requestedFirst = first ?? 50;
    const limit = Math.min(Math.max(Math.floor(requestedFirst), 1), 100);
    const params: unknown[] = [normalizedCodigo];
    let keysetSql = '';

    if (after) {
      const cursor = decodeHistoryCursor(after);

      params.push(cursor.createdAt, cursor.id);
      keysetSql =
        ' AND (history.created_at < $2 OR (history.created_at = $2 AND history.id < $3))';
    }

    const rows = await this.coreDataSource.query<MercadoPublicoV2HistoryRow[]>(
      `
        SELECT
          history.id,
          history.codigo,
          history.previous_observation_id,
          history.new_observation_id,
          history.semantic_fingerprint_before,
          history.semantic_fingerprint_after,
          history.before_json,
          history.after_json,
          history.provider_changed_at_raw,
          history.provider_changed_at,
          history.observed_at,
          history.normalizer_version,
          history.provider_schema_fingerprint,
          history.created_at,
          observation.source,
          observation.endpoint,
          observation.snapshot_kind
        FROM mp.v2_history history
        JOIN mp.v2_observation observation
          ON observation.id = history.new_observation_id
        WHERE history.codigo = $1${keysetSql}
        ORDER BY history.created_at DESC, history.id DESC
        LIMIT $${params.length + 1}
      `,
      [...params, limit + 1],
    );

    const pageRows = rows.slice(0, limit);
    const lastRow = pageRows[pageRows.length - 1];

    return {
      rows: pageRows.map(toHistoryEvent),
      hasNextPage: rows.length > limit,
      startCursor: pageRows[0]
        ? encodeMercadoPublicoV2HistoryCursor(pageRows[0])
        : null,
      endCursor: lastRow ? encodeMercadoPublicoV2HistoryCursor(lastRow) : null,
    };
  }
}
