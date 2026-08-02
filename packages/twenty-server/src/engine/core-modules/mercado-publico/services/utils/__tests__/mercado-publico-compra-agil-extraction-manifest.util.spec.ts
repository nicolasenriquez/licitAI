import {
  createMercadoPublicoCompraAgilExtractionManifest,
  mapMercadoPublicoErrorSummaryToManifestStatus,
  recordMercadoPublicoCompraAgilManifestPage,
} from 'src/engine/core-modules/mercado-publico/services/utils/mercado-publico-compra-agil-extraction-manifest.util';

describe('mercado-publico-compra-agil-extraction-manifest.util', () => {
  it('creates a safe manifest with explicit UTC and fallback metadata', () => {
    const manifest = createMercadoPublicoCompraAgilExtractionManifest({
      jobName: 'api-v2-compra-agil-by-publication-window',
      requestParams: {
        publicado_desde: '2026-08-02T00:00:00Z',
        publicado_hasta: '2026-08-02T23:59:59Z',
        ticket: 'must-not-be-stored',
      },
      requestedLocalWindow: {
        from: '2026-08-02T00:00:00',
        to: '2026-08-02T23:59:59',
        timezone: 'America/Santiago',
      },
      fallbackUsed: true,
      fallbackReason: 'requested_day_without_sufficient_data',
      effectiveDate: '2026-07-31',
    });

    expect(manifest).toMatchObject({
      requestParams: {
        publicado_desde: '2026-08-02T00:00:00Z',
        publicado_hasta: '2026-08-02T23:59:59Z',
      },
      sentUtcWindow: {
        from: '2026-08-02T00:00:00Z',
        to: '2026-08-02T23:59:59Z',
      },
      fallbackUsed: true,
      effectiveDate: '2026-07-31',
      status: 'running',
    });
    expect(manifest.requestParams).not.toHaveProperty('ticket');
  });

  it('tracks pages, raw items, unique codes, provider totals, and Retry-After', () => {
    const manifest = createMercadoPublicoCompraAgilExtractionManifest({
      jobName: 'api-v2-compra-agil-incremental',
      requestParams: { ttl_cambio_ms: 5000 },
    });
    const uniqueCodes = new Set<string>();

    recordMercadoPublicoCompraAgilManifestPage(
      manifest,
      {
        compraAgil: [{ codigo: 'CA-1' }, { codigo: 'CA-1' }],
        pagination: {
          page: 1,
          pageSize: 2,
          totalPages: 3,
          totalResults: 5,
        },
        retryAfterSeconds: undefined,
      },
      uniqueCodes,
      true,
    );

    recordMercadoPublicoCompraAgilManifestPage(
      manifest,
      {
        compraAgil: [],
        pagination: null,
        retryAfterSeconds: 120,
      },
      uniqueCodes,
      false,
    );

    expect(manifest).toMatchObject({
      pagesCompleted: 1,
      providerTotalPages: 3,
      providerTotalResults: 5,
      rawItemsReceived: 2,
      uniqueCodes: 1,
      retryAfterSeconds: 120,
    });
  });

  it('normalizes explicit request offsets into the UTC window', () => {
    const manifest = createMercadoPublicoCompraAgilExtractionManifest({
      jobName: 'api-v2-compra-agil-by-publication-window',
      requestParams: {
        publicado_desde: '2026-08-02T00:00:00-04:00',
        publicado_hasta: '2026-08-02T01:00:00-04:00',
      },
    });

    expect(manifest.sentUtcWindow).toEqual({
      from: '2026-08-02T04:00:00Z',
      to: '2026-08-02T05:00:00Z',
    });
  });

  it('maps soft misses to an empty manifest without changing job status semantics', () => {
    expect(mapMercadoPublicoErrorSummaryToManifestStatus('soft_miss')).toBe(
      'empty',
    );
    expect(
      mapMercadoPublicoErrorSummaryToManifestStatus('retryable_failed'),
    ).toBe('retryable_failed');
  });
});
