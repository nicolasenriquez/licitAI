import { useDateTimeFormat } from '@/localization/hooks/useDateTimeFormat';
import { useNumberFormat } from '@/localization/hooks/useNumberFormat';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useLingui } from '@lingui/react/macro';
import { formatDateISOStringToDateTime } from '@/localization/utils/formatDateISOStringToDateTime';
import { enUS, type Locale } from 'date-fns/locale';
import { useMemo } from 'react';
import { t } from '@lingui/core/macro';
import { type TagColor } from 'twenty-ui/data-display';
import { dateLocaleState } from '~/localization/states/dateLocaleState';
import { DateFormat } from '@/localization/constants/DateFormat';
import { TimeFormat } from '@/localization/constants/TimeFormat';

const statusLabels: Record<string, () => string> = {
  active: () => t`Activa`,
  adjudicada: () => t`Adjudicada`,
  cancelled: () => t`Cancelada`,
  cancelada: () => t`Cancelada`,
  closed: () => t`Cerrada`,
  cerrada: () => t`Cerrada`,
  completed: () => t`Completada`,
  desierta: () => t`Desierta`,
  failed: () => t`Fallida`,
  oc_emitida: () => t`OC emitida`,
  param_error: () => t`Parámetros inválidos`,
  partial: () => t`Parcial`,
  published: () => t`Publicada`,
  publicada: () => t`Publicada`,
  proveedor_seleccionado: () => t`Proveedor seleccionado`,
  retryable_failed: () => t`Reintentable`,
  revocada: () => t`Revocada`,
  skipped: () => t`Omitida`,
  soft_miss: () => t`Sin resultados`,
  success: () => t`Correcta`,
  suspendida: () => t`Suspendida`,
};

const statusColors: Record<string, TagColor> = {
  active: 'blue',
  adjudicada: 'blue',
  cancelled: 'red',
  cancelada: 'red',
  closed: 'gray',
  cerrada: 'gray',
  completed: 'green',
  desierta: 'red',
  failed: 'red',
  oc_emitida: 'purple',
  param_error: 'orange',
  partial: 'orange',
  published: 'blue',
  publicada: 'green',
  proveedor_seleccionado: 'blue',
  retryable_failed: 'orange',
  revocada: 'red',
  skipped: 'gray',
  soft_miss: 'orange',
  success: 'green',
  suspendida: 'orange',
};

const freshnessLabels: Record<string, () => string> = {
  degraded: () => t`Degradada`,
  fresh: () => t`Actualizada`,
  healthy: () => t`Saludable`,
  stale: () => t`Desactualizada`,
};

export const getMercadoPublicoStatusLabel = (status?: string | null) =>
  statusLabels[status?.toLowerCase() ?? '']?.() ?? t`No informado`;

export const getMercadoPublicoStatusColor = (
  status?: string | null,
): TagColor =>
  status ? (statusColors[status.toLowerCase()] ?? 'gray') : 'gray';

export const getMercadoPublicoFreshnessLabel = (freshness?: string | null) =>
  freshness === null || freshness === undefined
    ? t`No configurado`
    : (freshnessLabels[freshness.toLowerCase()]?.() ?? t`No informado`);

export const isMercadoPublicoStale = (freshness?: string | null) =>
  freshness?.toLowerCase() === 'stale';

type MercadoPublicoDateFormatOptions = {
  dateFormat: Parameters<typeof formatDateISOStringToDateTime>[0]['dateFormat'];
  localeCatalog: Locale;
  timeFormat: Parameters<typeof formatDateISOStringToDateTime>[0]['timeFormat'];
  timeZone: string;
};

type MercadoPublicoNumberFormatter = (
  value: number,
  options?: { decimals?: number },
) => string;

const defaultDateFormatOptions: MercadoPublicoDateFormatOptions = {
  dateFormat: DateFormat.DAY_FIRST,
  localeCatalog: enUS,
  timeFormat: TimeFormat.HOUR_24,
  timeZone: 'UTC',
};

const defaultNumberFormatter: MercadoPublicoNumberFormatter = (
  value,
  options,
) =>
  new Intl.NumberFormat(undefined, {
    maximumFractionDigits: options?.decimals ?? 0,
  }).format(value);

export const formatMercadoPublicoDate = (
  value: string | null | undefined,
  options: MercadoPublicoDateFormatOptions = defaultDateFormatOptions,
) => {
  if (!value || Number.isNaN(new Date(value).getTime())) {
    return t`No informado`;
  }

  return formatDateISOStringToDateTime({
    date: value,
    ...options,
  });
};

export const formatMercadoPublicoCount = (
  value: number | null | undefined,
  formatNumber: MercadoPublicoNumberFormatter = defaultNumberFormatter,
) =>
  value === null || value === undefined ? t`No informado` : formatNumber(value);

export const formatMercadoPublicoAmount = (
  value: number | null | undefined,
  locale: string,
) =>
  value === null || value === undefined
    ? t`No informado`
    : new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: 'CLP',
        maximumFractionDigits: 0,
      }).format(value);

export const formatMercadoPublicoPercent = (
  value: number | null | undefined,
  locale: string,
) =>
  value === null || value === undefined
    ? t`No informado`
    : new Intl.NumberFormat(locale, {
        maximumFractionDigits: 2,
        style: 'percent',
      }).format(value / 100);

export const formatMercadoPublicoDuration = (
  valueMs: number | null | undefined,
  formatNumber: MercadoPublicoNumberFormatter = defaultNumberFormatter,
) => {
  if (valueMs === null || valueMs === undefined) {
    return t`No informado`;
  }

  const totalMinutes = Math.max(0, Math.round(valueMs / 60000));

  if (totalMinutes >= 1440) {
    return t`${formatNumber(Math.round(totalMinutes / 1440))} días`;
  }

  if (totalMinutes >= 60) {
    return t`${formatNumber(Math.round(totalMinutes / 60))} horas`;
  }

  return t`${formatNumber(totalMinutes)} minutos`;
};

export const useMercadoPublicoDisplay = () => {
  const { i18n } = useLingui();
  const { dateFormat, timeFormat, timeZone } = useDateTimeFormat();
  const { formatNumber } = useNumberFormat();
  const { localeCatalog } = useAtomStateValue(dateLocaleState);

  return useMemo(
    () => ({
      formatAmount: (value: number | null | undefined) =>
        formatMercadoPublicoAmount(value, i18n.locale),
      formatCount: (value: number | null | undefined) =>
        formatMercadoPublicoCount(value, formatNumber),
      formatDate: (value: string | null | undefined) =>
        formatMercadoPublicoDate(value, {
          dateFormat,
          localeCatalog,
          timeFormat,
          timeZone,
        }),
      formatDuration: (valueMs: number | null | undefined) =>
        formatMercadoPublicoDuration(valueMs, formatNumber),
      formatPercent: (value: number | null | undefined) =>
        formatMercadoPublicoPercent(value, i18n.locale),
    }),
    [
      dateFormat,
      formatNumber,
      i18n.locale,
      localeCatalog,
      timeFormat,
      timeZone,
    ],
  );
};
