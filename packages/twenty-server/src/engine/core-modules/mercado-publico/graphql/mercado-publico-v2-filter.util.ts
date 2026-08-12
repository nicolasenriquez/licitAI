import { BadRequestException } from '@nestjs/common';

export type MercadoPublicoV2OpportunityFilter = {
  search?: string;
  states?: string[];
  region?: number;
  buyer?: string;
  closingAtFrom?: Date;
  closingAtTo?: Date;
  documentCountMin?: number;
  documentCountMax?: number;
  llamado?: number;
  amountMin?: string;
  amountMax?: string;
  currencies?: string[];
  cohortStatus?: 'active' | 'terminal';
};

export const validateMercadoPublicoV2FilterRanges = (
  filter: MercadoPublicoV2OpportunityFilter,
): void => {
  for (const field of ['closingAtFrom', 'closingAtTo'] as const) {
    const value = filter[field];

    if (value !== undefined && Number.isNaN(value.getTime())) {
      throw new BadRequestException(
        `Mercado Publico V2 filter: ${field} must be a valid date`,
      );
    }
  }

  if (
    filter.closingAtFrom !== undefined &&
    filter.closingAtTo !== undefined &&
    filter.closingAtFrom > filter.closingAtTo
  ) {
    throw new BadRequestException(
      'Mercado Publico V2 filter: closingAtFrom must not be after closingAtTo',
    );
  }

  for (const field of ['documentCountMin', 'documentCountMax'] as const) {
    const value = filter[field];

    if (value !== undefined && value < 0) {
      throw new BadRequestException(
        `Mercado Publico V2 filter: ${field} must not be negative`,
      );
    }
  }

  if (
    filter.documentCountMin !== undefined &&
    filter.documentCountMax !== undefined &&
    filter.documentCountMin > filter.documentCountMax
  ) {
    throw new BadRequestException(
      'Mercado Publico V2 filter: documentCountMin must not exceed documentCountMax',
    );
  }

  for (const field of ['amountMin', 'amountMax'] as const) {
    const value = filter[field];

    if (
      value !== undefined &&
      (!Number.isFinite(Number(value)) || Number(value) < 0)
    ) {
      throw new BadRequestException(
        `Mercado Publico V2 filter: ${field} must be a decimal string`,
      );
    }
  }

  if (
    filter.amountMin !== undefined &&
    filter.amountMax !== undefined &&
    Number(filter.amountMin) > Number(filter.amountMax)
  ) {
    throw new BadRequestException(
      'Mercado Publico V2 filter: amountMin must not exceed amountMax',
    );
  }

  if (filter.llamado !== undefined && filter.llamado < 0) {
    throw new BadRequestException(
      'Mercado Publico V2 filter: llamado must not be negative',
    );
  }

  if (
    filter.cohortStatus !== undefined &&
    filter.cohortStatus !== 'active' &&
    filter.cohortStatus !== 'terminal'
  ) {
    throw new BadRequestException(
      'Mercado Publico V2 filter: cohortStatus must be "active" or "terminal"',
    );
  }
};

export const buildMercadoPublicoV2PopulationWhere = (
  filter: MercadoPublicoV2OpportunityFilter,
): { whereSql: string; params: unknown[] } => {
  validateMercadoPublicoV2FilterRanges(filter);

  const cohortClause =
    filter.cohortStatus !== undefined
      ? `process_code IN (
          SELECT codigo
          FROM mp.v2_cohort
          WHERE source = 'api-v2-compra-agil'
            AND scope = 'global'
            AND status = $1
        )`
      : `process_code IN (
          SELECT codigo
          FROM mp.v2_cohort
          WHERE source = 'api-v2-compra-agil'
            AND scope = 'global'
            AND status = 'active'
        )`;
  const clauses = ["process_type = 'compra_agil'", cohortClause];
  const params: unknown[] = [];

  if (filter.cohortStatus !== undefined) {
    params.push(filter.cohortStatus);
  }

  if (filter.search?.trim()) {
    params.push(`%${filter.search.trim()}%`);
    clauses.push(
      `(process_code ILIKE $${params.length} OR title ILIKE $${params.length} OR buyer_name ILIKE $${params.length})`,
    );
  }

  if (filter.states && filter.states.length > 0) {
    params.push(filter.states);
    clauses.push(`canonical_state = ANY($${params.length}::text[])`);
  }

  if (filter.region !== undefined) {
    params.push(filter.region);
    clauses.push(`region = $${params.length}`);
  }

  if (filter.buyer?.trim()) {
    params.push(`%${filter.buyer.trim()}%`);
    clauses.push(
      `(buyer_name ILIKE $${params.length} OR buyer_code ILIKE $${params.length})`,
    );
  }

  if (filter.closingAtFrom !== undefined) {
    params.push(filter.closingAtFrom);
    clauses.push(`closing_at >= $${params.length}`);
  }

  if (filter.closingAtTo !== undefined) {
    params.push(filter.closingAtTo);
    clauses.push(`closing_at <= $${params.length}`);
  }

  if (filter.documentCountMin !== undefined) {
    params.push(filter.documentCountMin);
    clauses.push(`document_count >= $${params.length}`);
  }

  if (filter.documentCountMax !== undefined) {
    params.push(filter.documentCountMax);
    clauses.push(`document_count <= $${params.length}`);
  }

  if (filter.llamado !== undefined) {
    params.push(filter.llamado);
    clauses.push(`llamado = $${params.length}`);
  }

  if (filter.amountMin !== undefined) {
    params.push(filter.amountMin);
    clauses.push(`amount >= $${params.length}::numeric`);
  }

  if (filter.amountMax !== undefined) {
    params.push(filter.amountMax);
    clauses.push(`amount <= $${params.length}::numeric`);
  }

  if (filter.currencies && filter.currencies.length > 0) {
    params.push(filter.currencies);
    clauses.push(`currency_source = ANY($${params.length}::text[])`);
  }

  return {
    whereSql: ` WHERE ${clauses.join(' AND ')}`,
    params,
  };
};
