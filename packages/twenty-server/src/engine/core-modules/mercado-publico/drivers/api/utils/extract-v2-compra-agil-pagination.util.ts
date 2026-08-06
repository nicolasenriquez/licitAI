export type MercadoPublicoApiV2CompraAgilPagination = {
  pageNumber: number | null;
  pageSize: number | null;
  totalPages: number | null;
  totalResults: number | null;
  hasNextPage: boolean;
};

const isObjectRecord = (value: unknown): value is Record<string, unknown> => {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
};

const toPositiveInteger = (value: unknown): number | null => {
  const numberValue =
    typeof value === 'number'
      ? value
      : typeof value === 'string' && value.trim() !== ''
        ? Number(value)
        : Number.NaN;

  return Number.isInteger(numberValue) && numberValue > 0 ? numberValue : null;
};

const findPaginationObject = (
  value: unknown,
): Record<string, unknown> | null => {
  if (!isObjectRecord(value)) {
    return null;
  }

  for (const [key, nestedValue] of Object.entries(value)) {
    if (
      key.toLowerCase() === 'paginacion' ||
      key.toLowerCase() === 'pagination'
    ) {
      if (isObjectRecord(nestedValue)) {
        return nestedValue;
      }
    }
  }

  for (const nestedValue of Object.values(value)) {
    const paginationObject = findPaginationObject(nestedValue);

    if (paginationObject !== null) {
      return paginationObject;
    }
  }

  return null;
};

const readValue = (
  object: Record<string, unknown> | null,
  keys: string[],
): unknown => {
  if (object === null) {
    return undefined;
  }

  const entries = Object.entries(object);

  for (const key of keys) {
    const entry = entries.find(([entryKey]) => entryKey.toLowerCase() === key);

    if (entry !== undefined) {
      return entry[1];
    }
  }

  return undefined;
};

export const extractV2CompraAgilPagination = (
  payload: unknown,
  requestPageNumber: number,
  requestPageSize: number,
  recordsFetched: number,
): MercadoPublicoApiV2CompraAgilPagination => {
  const paginationObject = findPaginationObject(payload);
  const pageNumber =
    toPositiveInteger(
      readValue(paginationObject, [
        'numero_pagina',
        'pagenumber',
        'page',
        'currentpage',
      ]),
    ) ?? requestPageNumber;
  const pageSize =
    toPositiveInteger(
      readValue(paginationObject, [
        'tamano_pagina',
        'pagesize',
        'page_size',
        'limit',
      ]),
    ) ?? requestPageSize;
  const totalPages = toPositiveInteger(
    readValue(paginationObject, ['total_paginas', 'totalpages', 'pages']),
  );
  const totalResults = toPositiveInteger(
    readValue(paginationObject, [
      'total_resultados',
      'totalresults',
      'total_results',
      'total',
    ]),
  );
  const explicitHasNext = readValue(paginationObject, [
    'hasnextpage',
    'has_next_page',
    'hasnext',
  ]);
  const hasNextPage =
    typeof explicitHasNext === 'boolean'
      ? explicitHasNext
      : totalPages !== null
        ? pageNumber < totalPages
        : recordsFetched >= pageSize;

  return {
    pageNumber,
    pageSize,
    totalPages,
    totalResults,
    hasNextPage,
  };
};
