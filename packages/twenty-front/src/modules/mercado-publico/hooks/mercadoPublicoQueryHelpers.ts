import { Temporal } from 'temporal-polyfill';

export type MercadoPublicoDateInput = Date | string | null;

export const serializeMercadoPublicoDate = (
  value: MercadoPublicoDateInput | undefined,
) => (value instanceof Date ? value.toISOString() : value);

export const serializeMercadoPublicoDateEndOfDay = (
  value: MercadoPublicoDateInput | undefined,
  timeZone: string,
) => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return serializeMercadoPublicoDate(value);
  }

  return Temporal.PlainDate.from(value)
    .add({ days: 1 })
    .toZonedDateTime({
      timeZone,
      plainTime: Temporal.PlainTime.from('00:00'),
    })
    .subtract({ milliseconds: 1 })
    .toInstant()
    .toString();
};

export const omitUndefinedMercadoPublicoVariables = <TVariables extends object>(
  variables: TVariables,
): TVariables =>
  Object.fromEntries(
    Object.entries(variables).filter(([, value]) => value !== undefined),
  ) as TVariables;
