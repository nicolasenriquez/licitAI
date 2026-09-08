import {
  normalizeMercadoPublicoV2SyncInput,
} from 'src/engine/core-modules/mercado-publico/services/utils/normalize-mercado-publico-v2-sync-input.util';

describe('normalizeMercadoPublicoV2SyncInput', () => {
  it('normalizes Santiago publication boundaries and creates a stable scope', () => {
    expect(
      normalizeMercadoPublicoV2SyncInput({
        mode: 'backfill',
        publishedFrom: '2026-09-07',
        publishedTo: '2026-09-07',
        status: 'publicada',
      }),
    ).toEqual(
      expect.objectContaining({
        mode: 'backfill',
        scope: 'published:2026-09-07:2026-09-07:publicada',
        requestPayload: expect.objectContaining({
          publicado_desde: expect.stringMatching(/T0[34]:00:00\.000Z$/),
          publicado_hasta: expect.stringMatching(/T0[23]:59:59\.999Z$/),
          estado: 'publicada',
        }),
      }),
    );
  });

  it('rejects incomplete and oversized backfill windows', () => {
    expect(() =>
      normalizeMercadoPublicoV2SyncInput({ mode: 'backfill' }),
    ).toThrow('Backfill requires publishedFrom and publishedTo');

    expect(() =>
      normalizeMercadoPublicoV2SyncInput({
        mode: 'backfill',
        publishedFrom: '2026-01-01',
        publishedTo: '2026-02-01',
      }),
    ).toThrow('cannot exceed 31 days');
  });
});
