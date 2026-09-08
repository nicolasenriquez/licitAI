import { UserInputError } from 'src/engine/core-modules/graphql/utils/graphql-errors.util';

export const MERCADO_PUBLICO_V2_MODES = ['incremental', 'backfill'] as const;
export const MERCADO_PUBLICO_V2_STATUSES = [
  'publicada',
  'cerrada',
  'desierta',
  'cancelada',
  'proveedor_seleccionado',
  'oc_emitida',
] as const;

export type MercadoPublicoV2SyncMode = (typeof MERCADO_PUBLICO_V2_MODES)[number];
export type MercadoPublicoV2SyncStatus =
  (typeof MERCADO_PUBLICO_V2_STATUSES)[number];

type SyncInput = {
  mode?: string;
  publishedFrom?: string;
  publishedTo?: string;
  status?: string;
};

export type NormalizedMercadoPublicoV2SyncInput = {
  mode: MercadoPublicoV2SyncMode;
  publishedFrom?: string;
  publishedTo?: string;
  status?: MercadoPublicoV2SyncStatus;
  scope: string;
  requestPayload: Record<string, unknown>;
};

const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const SANTIAGO_TIME_ZONE = 'America/Santiago';
const MAX_BACKFILL_DAYS = 31;

const assertDateOnly = (value: string, fieldName: string): void => {
  const match = DATE_ONLY_PATTERN.exec(value);

  if (match === null) {
    throw new UserInputError(`${fieldName} must use YYYY-MM-DD format`);
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  ) {
    throw new UserInputError(`${fieldName} is not a valid calendar date`);
  }
};

const getTimeZoneOffsetMilliseconds = (date: Date): number => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: SANTIAGO_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const values = Object.fromEntries(
    parts
      .filter(({ type }) => type !== 'literal')
      .map(({ type, value }) => [type, Number(value)]),
  );

  return (
    Date.UTC(
      values.year,
      values.month - 1,
      values.day,
      values.hour,
      values.minute,
      values.second,
    ) +
    date.getUTCMilliseconds() -
    date.getTime()
  );
};

const toSantiagoBoundary = (value: string, endOfDay: boolean): string => {
  const date = new Date(`${value}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}Z`);
  const normalized = new Date(
    date.getTime() - getTimeZoneOffsetMilliseconds(date),
  );

  return normalized.toISOString();
};

const getDayDistance = (from: string, to: string): number => {
  const start = Date.parse(`${from}T00:00:00.000Z`);
  const end = Date.parse(`${to}T00:00:00.000Z`);

  return Math.floor((end - start) / 86_400_000) + 1;
};

export const normalizeMercadoPublicoV2SyncInput = (
  input: SyncInput,
): NormalizedMercadoPublicoV2SyncInput => {
  const mode = input.mode ?? 'incremental';

  if (!MERCADO_PUBLICO_V2_MODES.includes(mode as MercadoPublicoV2SyncMode)) {
    throw new UserInputError('Mercado Publico V2 mode is invalid');
  }

  const publishedFrom = input.publishedFrom?.trim() || undefined;
  const publishedTo = input.publishedTo?.trim() || undefined;
  const status = input.status?.trim() || undefined;

  if ((publishedFrom === undefined) !== (publishedTo === undefined)) {
    throw new UserInputError(
      'publishedFrom and publishedTo must be provided together',
    );
  }

  if (publishedFrom !== undefined && publishedTo !== undefined) {
    assertDateOnly(publishedFrom, 'publishedFrom');
    assertDateOnly(publishedTo, 'publishedTo');

    if (publishedFrom > publishedTo) {
      throw new UserInputError('publishedFrom must be before publishedTo');
    }

    if (
      mode === 'backfill' &&
      getDayDistance(publishedFrom, publishedTo) > MAX_BACKFILL_DAYS
    ) {
      throw new UserInputError(
        `Backfill date range cannot exceed ${MAX_BACKFILL_DAYS} days`,
      );
    }
  } else if (mode === 'backfill') {
    throw new UserInputError(
      'Backfill requires publishedFrom and publishedTo',
    );
  }

  if (
    status !== undefined &&
    !MERCADO_PUBLICO_V2_STATUSES.includes(status as MercadoPublicoV2SyncStatus)
  ) {
    throw new UserInputError('Mercado Publico V2 status is invalid');
  }

  const normalizedStatus = status as MercadoPublicoV2SyncStatus | undefined;
  const scope =
    mode === 'backfill'
      ? `published:${publishedFrom}:${publishedTo}:${normalizedStatus ?? 'all'}`
      : 'global';

  return {
    mode: mode as MercadoPublicoV2SyncMode,
    publishedFrom,
    publishedTo,
    status: normalizedStatus,
    scope,
    requestPayload: {
      mode,
      scope,
      ...(publishedFrom === undefined
        ? {}
        : {
            publicado_desde: toSantiagoBoundary(publishedFrom, false),
            publicado_hasta: toSantiagoBoundary(publishedTo as string, true),
          }),
      ...(normalizedStatus === undefined ? {} : { estado: normalizedStatus }),
    },
  };
};
