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

export const formatMercadoPublicoFreshnessSummary = (
  freshness: string,
  asOf: string | null | undefined,
  translate: Translate,
  now = Date.now(),
): string => {
  if (freshness !== 'healthy' && freshness !== 'fresh') {
    return translate({ message: 'Datos desactualizados · Revisar' });
  }

  if (!asOf) {
    return translate({ message: 'Actualizado recientemente' });
  }

  const timestamp = new Date(asOf).getTime();

  if (!Number.isFinite(timestamp)) {
    return translate({ message: 'Actualizado recientemente' });
  }

  const ageMinutes = Math.max(0, Math.floor((now - timestamp) / 60000));

  if (ageMinutes < 1) {
    return translate({ message: 'Actualizado ahora' });
  }

  if (ageMinutes < 60) {
    return translate({ message: `Actualizado hace ${ageMinutes} min` });
  }

  const ageHours = Math.floor(ageMinutes / 60);

  if (ageHours < 24) {
    return translate({ message: `Actualizado hace ${ageHours} h` });
  }

  return translate({ message: `Actualizado ${asOf}` });
};
