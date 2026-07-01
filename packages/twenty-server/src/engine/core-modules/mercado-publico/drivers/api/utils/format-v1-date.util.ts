const V1_DATE_PART_LENGTH = 2;

export const formatV1Date = (date: Date): string => {
  if (Number.isNaN(date.getTime())) {
    throw new RangeError('Mercado Publico V1 date is invalid');
  }

  const day = date.getUTCDate().toString().padStart(V1_DATE_PART_LENGTH, '0');
  const month = (date.getUTCMonth() + 1)
    .toString()
    .padStart(V1_DATE_PART_LENGTH, '0');
  const year = date.getUTCFullYear().toString();

  return `${day}${month}${year}`;
};
