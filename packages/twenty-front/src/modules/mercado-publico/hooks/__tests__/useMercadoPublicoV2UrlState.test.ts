import { type PropsWithChildren, createElement } from 'react';
import { act, renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import {
  MERCADO_PUBLICO_CURSOR_HISTORY_KEY,
  getMercadoPublicoV2SectionSearch,
  parseMercadoPublicoV2UrlState,
  serializeMercadoPublicoV2Filters,
  useMercadoPublicoV2UrlState,
} from '@/mercado-publico/hooks/useMercadoPublicoV2UrlState';

describe('Mercado Público V2 URL state', () => {
  it('restores cohort, filters, order, cursor and selected process', () => {
    const state = parseMercadoPublicoV2UrlState(
      new URLSearchParams(
        'q=computadores&cohorte=terminal&estado=publicada,cerrada&buyer=69000100-1&region=13&desde=2026-07-01&hasta=2026-07-31&docsMin=2&docsMax=5&llamado=1&montoMin=100&montoMax=200&moneda=CLP,UF&orden=AMOUNT_ASC&after=cursor-2&proceso=CA-2',
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
      sort: 'AMOUNT_ASC',
      after: 'cursor-2',
      proceso: 'CA-2',
    });
  });

  it('falls back to default order for unknown URL order', () => {
    expect(
      parseMercadoPublicoV2UrlState(new URLSearchParams('orden=unknown')).sort,
    ).toBe('CLOSING_AT_DESC');
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

  it('preserves shared context between sections and drops local state', () => {
    expect(
      getMercadoPublicoV2SectionSearch(
        '?q=computadores&region=13&orden=AMOUNT_ASC&after=cursor-2&proceso=CA-2&codigo=CA-2&returnTo=%2Fmercado-publico',
      ),
    ).toBe('?q=computadores&region=13&orden=AMOUNT_ASC');
  });

  it('keeps sort and process while applying filters resets cursor', () => {
    const current = parseMercadoPublicoV2UrlState(
      new URLSearchParams('q=old&orden=AMOUNT_ASC&after=cursor-2&proceso=CA-2'),
    );

    const next = serializeMercadoPublicoV2Filters({
      ...current,
      search: 'new',
    });

    next.delete('after');
    next.set('orden', current.sort);
    next.set('proceso', current.proceso ?? '');

    expect(next.toString()).toBe('q=new&orden=AMOUNT_ASC&proceso=CA-2');
  });

  it('preserves cursor history when the process panel opens and closes', () => {
    const previousCursors = [null, 'cursor-1'];
    const wrapper = ({ children }: PropsWithChildren) =>
      createElement(
        MemoryRouter,
        {
          future: {
            v7_relativeSplatPath: true,
            v7_startTransition: true,
          },
          initialEntries: [
            {
              pathname: '/mercado-publico',
              search: '?after=cursor-2',
              state: {
                [MERCADO_PUBLICO_CURSOR_HISTORY_KEY]: previousCursors,
              },
            },
          ],
        },
        children,
      );
    const { result } = renderHook(() => useMercadoPublicoV2UrlState(), {
      wrapper,
    });

    act(() => result.current.setProceso('CA-2'));

    expect(result.current.state.proceso).toBe('CA-2');
    expect(result.current.previousCursors).toEqual(previousCursors);

    act(() => result.current.setProceso(null, true));

    expect(result.current.state.proceso).toBeNull();
    expect(result.current.previousCursors).toEqual(previousCursors);
  });
});
