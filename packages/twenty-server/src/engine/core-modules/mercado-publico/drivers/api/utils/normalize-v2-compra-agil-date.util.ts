import { DateTime } from 'luxon';

import { coerceToNullableString } from 'src/engine/core-modules/mercado-publico/drivers/api/utils/coerce-to-nullable-string.util';

const SOURCE_TIME_ZONE = 'America/Santiago';
const ISO_OFFSET_SUFFIX = /(?:Z|[+-]\d{2}:?\d{2})$/i;

export type NormalizedV2CompraAgilDate = {
  raw: string | null;
  value: Date | null;
};

export const normalizeV2CompraAgilDate = (
  input: unknown,
): NormalizedV2CompraAgilDate => {
  const raw = coerceToNullableString(input);

  if (raw === null) {
    return { raw: null, value: null };
  }

  const parsed = ISO_OFFSET_SUFFIX.test(raw)
    ? DateTime.fromISO(raw, { setZone: true })
    : DateTime.fromISO(raw, { zone: SOURCE_TIME_ZONE });

  return {
    raw,
    value: parsed.isValid ? parsed.toJSDate() : null,
  };
};
