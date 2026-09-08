const SANTIAGO_TIME_ZONE = 'America/Santiago';

const getMercadoPublicoChileCalendarDate = (value: Date): string => {
  const dateParts = new Intl.DateTimeFormat('en-CA', {
    timeZone: SANTIAGO_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(value);
  const getPart = (type: Intl.DateTimeFormatPartTypes): string =>
    dateParts.find((part) => part.type === type)?.value ?? '';

  return `${getPart('year')}-${getPart('month')}-${getPart('day')}`;
};

export const MERCADO_PUBLICO_REGION_NAMES: Record<number, string> = {
  1: 'Tarapacá',
  2: 'Antofagasta',
  3: 'Atacama',
  4: 'Coquimbo',
  5: 'Valparaíso',
  6: 'O’Higgins',
  7: 'Maule',
  8: 'Biobío',
  9: 'La Araucanía',
  10: 'Los Lagos',
  11: 'Aysén',
  12: 'Magallanes',
  13: 'Metropolitana',
  14: 'Los Ríos',
  15: 'Arica y Parinacota',
  16: 'Ñuble',
};

const numberFormatter = new Intl.NumberFormat('es-CL', {
  maximumFractionDigits: 2,
});

const clpNumberFormatter = new Intl.NumberFormat('es-CL', {
  maximumFractionDigits: 0,
});

export const formatMercadoPublicoRegion = (
  region: number | null | undefined,
): string =>
  region === null || region === undefined
    ? 'Región no disponible'
    : (MERCADO_PUBLICO_REGION_NAMES[region] ?? `Región ${region}`);

export const formatMercadoPublicoAmount = (
  amount: string | number | null | undefined,
  currency: string | null | undefined,
  amountClp?: string | number | null,
): string => {
  if (amount === null || amount === undefined || amount === '') {
    return 'Monto no disponible';
  }

  const numericAmount = Number(amount);
  const formattedAmount = Number.isFinite(numericAmount)
    ? numberFormatter.format(numericAmount)
    : String(amount);
  const normalizedCurrency = currency?.trim().toUpperCase() || 'CLP';

  if (normalizedCurrency === 'CLP') {
    return `$${formattedAmount} CLP`;
  }

  if (amountClp !== null && amountClp !== undefined && amountClp !== '') {
    const numericClp = Number(amountClp);
    const formattedClp = Number.isFinite(numericClp)
      ? clpNumberFormatter.format(numericClp)
      : String(amountClp);

    return `${formattedAmount} ${normalizedCurrency} · ≈ $${formattedClp} CLP`;
  }

  return `${formattedAmount} ${normalizedCurrency} · CLP no disponible`;
};

export const formatMercadoPublicoDate = (
  value: string | Date | null | undefined,
): string => {
  if (value === null || value === undefined || value === '') {
    return 'Fecha no disponible';
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Fecha no disponible';
  }

  const dateParts = new Intl.DateTimeFormat('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: SANTIAGO_TIME_ZONE,
  }).formatToParts(date);

  const getPart = (type: Intl.DateTimeFormatPartTypes): string =>
    dateParts.find((part) => part.type === type)?.value ?? '';

  return `${getPart('day')}/${getPart('month')}/${getPart('year')} · ${getPart('hour')}:${getPart('minute')}`;
};

export const formatMercadoPublicoDateInput = (
  value: string | null | undefined,
): string => {
  if (!value) {
    return 'sin fecha';
  }

  const [year, month, day] = value.split('-');

  return year && month && day ? `${day}/${month}/${year}` : value;
};

export const getMercadoPublicoChileDate = (offsetDays = 0): string => {
  const [year, month, day] = getMercadoPublicoChileCalendarDate(new Date())
    .split('-')
    .map(Number);
  const chileDate = new Date(Date.UTC(year, month - 1, day + offsetDays));

  return chileDate.toISOString().slice(0, 10);
};

export const formatMercadoPublicoRelativeDate = (
  value: string | Date | null | undefined,
  now = Date.now(),
): string => {
  if (value === null || value === undefined || value === '') {
    return 'Cierre no disponible';
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Cierre no disponible';
  }

  const differenceInDays = Math.round(
    (Date.parse(`${getMercadoPublicoChileCalendarDate(date)}T00:00:00.000Z`) -
      Date.parse(
        `${getMercadoPublicoChileCalendarDate(new Date(now))}T00:00:00.000Z`,
      )) /
      (24 * 60 * 60 * 1000),
  );

  if (differenceInDays < 0) {
    return 'Cierre vencido';
  }

  if (differenceInDays === 0) {
    return 'Cierra hoy';
  }

  if (differenceInDays === 1) {
    return 'Cierra mañana';
  }

  return `Cierra en ${differenceInDays} días`;
};
