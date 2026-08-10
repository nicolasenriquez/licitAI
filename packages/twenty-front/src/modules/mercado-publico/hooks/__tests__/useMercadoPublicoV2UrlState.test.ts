import {
  parseMercadoPublicoV2UrlState,
  serializeMercadoPublicoV2Filters,
} from '@/mercado-publico/hooks/useMercadoPublicoV2UrlState';

describe('Mercado Público V2 URL state', () => {
  it('restores cohort, filters, order, cursor and selected process', () => {
    const state = parseMercadoPublicoV2UrlState(
      new URLSearchParams(
        'q=computadores&cohorte=terminal&estado=publicada,cerrada&buyer=69000100-1&region=13&desde=2026-07-01&hasta=2026-07-31&docsMin=2&docsMax=5&llamado=1&montoMin=100&montoMax=200&moneda=CLP,UF&orden=amount_asc&after=cursor-2&proceso=CA-2',
      ),
    );

    expect(state).toEqual({
      search: 'computadores',
      cohortStatus: 'terminal',
      states: ['publicada', 'cerrada'],
      buyer: '69000100-1',
      region: 13,
      closingAtFrom: '2026-07-01',
      closingAtTo: '2026-07-31',
      documentCountMin: 2,
      documentCountMax: 5,
      llamado: 1,
      amountMin: '100',
      amountMax: '200',
      currencies: ['CLP', 'UF'],
      sort: 'amount_asc',
      after: 'cursor-2',
      proceso: 'CA-2',
    });
  });

  it('falls back to default order for unknown URL order', () => {
    expect(
      parseMercadoPublicoV2UrlState(new URLSearchParams('orden=unknown')).sort,
    ).toBe('closing_at_desc');
  });

  it('serializes filters without empty values', () => {
    const params = serializeMercadoPublicoV2Filters({
      search: ' computadores ',
      cohortStatus: 'active',
      states: ['publicada', 'cerrada'],
      buyer: '69000100-1',
      region: 13,
      closingAtFrom: '2026-07-01',
      closingAtTo: '2026-07-31',
      documentCountMin: 0,
      documentCountMax: null,
      llamado: null,
      amountMin: '100',
      amountMax: null,
      currencies: ['CLP', 'UF'],
    });

    expect(params.toString()).toBe(
      'q=+computadores+&cohorte=active&estado=publicada%2Ccerrada&buyer=69000100-1&region=13&desde=2026-07-01&hasta=2026-07-31&docsMin=0&montoMin=100&moneda=CLP%2CUF',
    );
  });
});
