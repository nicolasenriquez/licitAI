type Translate = (descriptor: { message: string }) => string;

export const formatMercadoPublicoAvailability = (
  availability: string,
  translate: Translate,
): string => {
  if (availability === 'available') {
    return translate({ message: 'Disponible' });
  }

  if (availability === 'partial') {
    return translate({ message: 'Información parcial' });
  }

  if (availability === 'unavailable') {
    return translate({ message: 'Aún no disponible' });
  }

  if (availability === 'not_applicable') {
    return translate({ message: 'No aplica' });
  }

  return translate({ message: 'No informado por fuente' });
};

export const formatMercadoPublicoFreshness = (
  freshness: string,
  translate: Translate,
): string | null => {
  if (freshness === 'healthy' || freshness === 'fresh') {
    return translate({ message: 'Al día' });
  }

  if (freshness === 'stale') {
    return translate({ message: 'Desactualizada' });
  }

  if (freshness === 'degraded') {
    return translate({ message: 'Degradada' });
  }

  return null;
};
