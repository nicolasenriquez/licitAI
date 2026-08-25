import { useMemo } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

import { MercadoPublicoV2OpportunitySort } from '~/generated/graphql';

export type MercadoPublicoV2Sort = MercadoPublicoV2OpportunitySort;

export type MercadoPublicoV2CohortStatus = 'active' | 'terminal';

const MERCADO_PUBLICO_V2_SORT_VALUES: MercadoPublicoV2Sort[] = [
  MercadoPublicoV2OpportunitySort.CLOSING_AT_DESC,
  MercadoPublicoV2OpportunitySort.CLOSING_AT_ASC,
  MercadoPublicoV2OpportunitySort.PUBLISHED_AT_DESC,
  MercadoPublicoV2OpportunitySort.PUBLISHED_AT_ASC,
  MercadoPublicoV2OpportunitySort.AMOUNT_DESC,
  MercadoPublicoV2OpportunitySort.AMOUNT_ASC,
];

export type MercadoPublicoV2Filters = {
  search: string;
  cohortStatus: MercadoPublicoV2CohortStatus | null;
  states: string[];
  buyer: string;
  region: number | null;
  closingAtFrom: string | null;
  closingAtTo: string | null;
  documentCountMin: number | null;
  documentCountMax: number | null;
  llamado: number | null;
  amountMin: string | null;
  amountMax: string | null;
  currencies: string[];
};

export type MercadoPublicoV2UrlState = MercadoPublicoV2Filters & {
  sort: MercadoPublicoV2Sort;
  after: string | null;
  proceso: string | null;
};

const EMPTY_FILTERS: MercadoPublicoV2Filters = {
  search: '',
  cohortStatus: null,
  states: [],
  buyer: '',
  region: null,
  closingAtFrom: null,
  closingAtTo: null,
  documentCountMin: null,
  documentCountMax: null,
  llamado: null,
  amountMin: null,
  amountMax: null,
  currencies: [],
};

const parseNumber = (value: string | null): number | null => {
  if (value === null || value === '') {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
};

const parseList = (value: string | null): string[] => {
  if (value === null || value === '') {
    return [];
  }

  return value.split(',');
};

const parseCohortStatus = (
  value: string | null,
): MercadoPublicoV2CohortStatus | null =>
  value === 'active' || value === 'terminal' ? value : null;

const parseSort = (value: string | null): MercadoPublicoV2Sort =>
  value !== null &&
  MERCADO_PUBLICO_V2_SORT_VALUES.includes(value as MercadoPublicoV2Sort)
    ? (value as MercadoPublicoV2Sort)
    : MercadoPublicoV2OpportunitySort.CLOSING_AT_DESC;

const toSearchParams = (params: URLSearchParams): URLSearchParams =>
  new URLSearchParams(params);

export const parseMercadoPublicoV2UrlState = (
  searchParams: URLSearchParams,
): MercadoPublicoV2UrlState => ({
  search: searchParams.get('q') ?? '',
  cohortStatus: parseCohortStatus(searchParams.get('cohorte')),
  states: parseList(searchParams.get('estado')),
  buyer: searchParams.get('buyer') ?? '',
  region: parseNumber(searchParams.get('region')),
  closingAtFrom: searchParams.get('desde'),
  closingAtTo: searchParams.get('hasta'),
  documentCountMin: parseNumber(searchParams.get('docsMin')),
  documentCountMax: parseNumber(searchParams.get('docsMax')),
  llamado: parseNumber(searchParams.get('llamado')),
  amountMin: searchParams.get('montoMin'),
  amountMax: searchParams.get('montoMax'),
  currencies: parseList(searchParams.get('moneda')),
  sort: parseSort(searchParams.get('orden')),
  after: searchParams.get('after'),
  proceso: searchParams.get('proceso'),
});

const FILTER_PARAM_KEYS = [
  'q',
  'cohorte',
  'estado',
  'buyer',
  'region',
  'desde',
  'hasta',
  'docsMin',
  'docsMax',
  'llamado',
  'montoMin',
  'montoMax',
  'moneda',
] as const;

export const MERCADO_PUBLICO_CURSOR_HISTORY_KEY =
  'mercadoPublicoPreviousCursors';

export type MercadoPublicoNavigationState = Record<string, unknown> & {
  [MERCADO_PUBLICO_CURSOR_HISTORY_KEY]?: Array<string | null>;
};

export const serializeMercadoPublicoV2Filters = (
  filters: Partial<MercadoPublicoV2Filters>,
): URLSearchParams => {
  const params = new URLSearchParams();

  const setIfPresent = (
    key: string,
    value: string | number | null | undefined,
  ): void => {
    if (value === null || value === '' || value === undefined) {
      return;
    }

    params.set(key, String(value));
  };

  setIfPresent('q', filters.search ?? '');
  setIfPresent('cohorte', filters.cohortStatus);
  setIfPresent('estado', filters.states?.join(',') ?? '');
  setIfPresent('buyer', filters.buyer ?? '');
  setIfPresent('region', filters.region);
  setIfPresent('desde', filters.closingAtFrom);
  setIfPresent('hasta', filters.closingAtTo);
  setIfPresent('docsMin', filters.documentCountMin);
  setIfPresent('docsMax', filters.documentCountMax);
  setIfPresent('llamado', filters.llamado);
  setIfPresent('montoMin', filters.amountMin);
  setIfPresent('montoMax', filters.amountMax);
  setIfPresent('moneda', filters.currencies?.join(',') ?? '');

  return params;
};

export const useMercadoPublicoV2UrlState = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const state = useMemo(
    () => parseMercadoPublicoV2UrlState(searchParams),
    [searchParams],
  );

  const applyFilters = (filters: Partial<MercadoPublicoV2Filters>): void => {
    const merged = { ...EMPTY_FILTERS, ...state, ...filters };
    const next = serializeMercadoPublicoV2Filters(merged);

    next.delete('after');

    const proceso = searchParams.get('proceso');

    if (proceso !== null) {
      next.set('proceso', proceso);
    }

    const sort = searchParams.get('orden');

    if (sort !== null) {
      next.set('orden', state.sort);
    }

    navigate(
      { search: next.toString() },
      { state: withoutCursorHistory(location.state) },
    );
  };

  const clearFilters = (): void => {
    const next = toSearchParams(searchParams);

    for (const key of FILTER_PARAM_KEYS) {
      next.delete(key);
    }

    next.delete('after');
    navigate(
      { search: next.toString() },
      { state: withoutCursorHistory(location.state) },
    );
  };

  const setSort = (sort: MercadoPublicoV2Sort): void => {
    const next = toSearchParams(searchParams);

    next.set('orden', sort);
    next.delete('after');
    navigate(
      { search: next.toString() },
      { state: withoutCursorHistory(location.state) },
    );
  };

  const setAfter = (
    after: string | null,
    previousCursors?: Array<string | null>,
  ): void => {
    const next = toSearchParams(searchParams);

    if (after === null) {
      next.delete('after');
    } else {
      next.set('after', after);
    }

    navigate(
      { search: next.toString() },
      {
        state: {
          ...(location.state ?? {}),
          [MERCADO_PUBLICO_CURSOR_HISTORY_KEY]: previousCursors ?? [],
        },
      },
    );
  };

  const previousCursors = Array.isArray(
    (location.state as MercadoPublicoNavigationState | null)?.[
      MERCADO_PUBLICO_CURSOR_HISTORY_KEY
    ],
  )
    ? ((location.state as MercadoPublicoNavigationState)[
        MERCADO_PUBLICO_CURSOR_HISTORY_KEY
      ] ?? [])
    : [];

  return {
    state,
    applyFilters,
    clearFilters,
    setSort,
    setAfter,
    previousCursors,
  };
};

const withoutCursorHistory = (
  state: unknown,
): MercadoPublicoNavigationState => {
  const next = { ...((state as Record<string, unknown> | null) ?? {}) };
  delete next[MERCADO_PUBLICO_CURSOR_HISTORY_KEY];
  return next;
};
