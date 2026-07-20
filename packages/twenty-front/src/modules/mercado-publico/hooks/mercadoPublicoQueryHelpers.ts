export type MercadoPublicoDateInput = Date | string | null;

export const serializeMercadoPublicoDate = (
  value: MercadoPublicoDateInput | undefined,
) => (value instanceof Date ? value.toISOString() : value);

export const omitUndefinedMercadoPublicoVariables = <TVariables extends object>(
  variables: TVariables,
): TVariables =>
  Object.fromEntries(
    Object.entries(variables).filter(([, value]) => value !== undefined),
  ) as TVariables;
