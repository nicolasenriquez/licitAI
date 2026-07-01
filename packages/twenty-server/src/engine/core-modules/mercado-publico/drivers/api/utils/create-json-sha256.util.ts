import crypto from 'crypto';

const toStableJsonValue = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map((arrayValue) => toStableJsonValue(arrayValue));
  }

  if (value !== null && typeof value === 'object') {
    return Object.keys(value)
      .sort()
      .reduce<Record<string, unknown>>((accumulator, key) => {
        accumulator[key] = toStableJsonValue(
          (value as Record<string, unknown>)[key],
        );

        return accumulator;
      }, {});
  }

  return value;
};

const toJsonShape = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return [];
    }

    return [toJsonShape(value[0])];
  }

  if (value !== null && typeof value === 'object') {
    return Object.keys(value)
      .sort()
      .reduce<Record<string, unknown>>((accumulator, key) => {
        accumulator[key] = toJsonShape((value as Record<string, unknown>)[key]);

        return accumulator;
      }, {});
  }

  return typeof value;
};

export const createJsonSha256 = (value: unknown): string => {
  return crypto
    .createHash('sha256')
    .update(JSON.stringify(toStableJsonValue(value)))
    .digest('hex');
};

export const createJsonShapeSha256 = (value: unknown): string => {
  return createJsonSha256(toJsonShape(value));
};
