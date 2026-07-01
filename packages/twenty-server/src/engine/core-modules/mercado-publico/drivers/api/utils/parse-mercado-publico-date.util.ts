import { isNonEmptyString } from '@sniptt/guards';

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DOT_NET_DATE_PATTERN = /^\/Date\((\d+)([+-]\d{4})?\)\/$/;

export type ParsedMercadoPublicoDate = {
  value: string | null;
  isSentinel1900: boolean;
};

export const parseMercadoPublicoDate = (
  rawDateValue: unknown,
): ParsedMercadoPublicoDate => {
  if (!isNonEmptyString(rawDateValue)) {
    return {
      value: null,
      isSentinel1900: false,
    };
  }

  const trimmedRawDateValue = rawDateValue.trim();

  if (trimmedRawDateValue === '1900-01-01') {
    return {
      value: null,
      isSentinel1900: true,
    };
  }

  if (ISO_DATE_PATTERN.test(trimmedRawDateValue)) {
    return {
      value: trimmedRawDateValue,
      isSentinel1900: false,
    };
  }

  const dotNetDateMatch = trimmedRawDateValue.match(DOT_NET_DATE_PATTERN);

  if (dotNetDateMatch !== null) {
    const parsedDate = new Date(Number(dotNetDateMatch[1]));

    if (!Number.isNaN(parsedDate.getTime())) {
      return {
        value: parsedDate.toISOString().slice(0, 10),
        isSentinel1900: false,
      };
    }
  }

  const parsedDate = new Date(trimmedRawDateValue);

  if (Number.isNaN(parsedDate.getTime())) {
    return {
      value: null,
      isSentinel1900: false,
    };
  }

  return {
    value: parsedDate.toISOString().slice(0, 10),
    isSentinel1900: false,
  };
};
