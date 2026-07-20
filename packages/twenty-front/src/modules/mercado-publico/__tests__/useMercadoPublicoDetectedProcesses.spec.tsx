import { InMemoryCache } from '@apollo/client';
import { type MockedResponse } from '@apollo/client/testing';
import { MockedProvider } from '@apollo/client/testing/react';
import { i18n } from '@lingui/core';
import { I18nProvider } from '@lingui/react';
import { renderHook, waitFor } from '@testing-library/react';
import { type ReactNode } from 'react';

import {
  GetMercadoPublicoDetectedProcessesDocument,
  MercadoPublicoDetectedProcessType,
  MercadoPublicoDetectedProcessSortDirection,
  MercadoPublicoDetectedProcessSortKey,
} from '~/generated/graphql';

import { useMercadoPublicoDetectedProcesses } from '@/mercado-publico/hooks/useMercadoPublicoDetectedProcesses';

const createWrapper = (mocks: MockedResponse[], cache?: InMemoryCache) =>
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <MockedProvider mocks={mocks} cache={cache}>
        <I18nProvider i18n={i18n}>{children}</I18nProvider>
      </MockedProvider>
    );
  };

const sampleItem = {
  __typename: 'MercadoPublicoDetectedProcess',
  processType: 'compra_agil',
  processCode: 'CA-001',
  title: 'Insumos hospitalarios',
  canonicalState: 'publicada',
  rawStateCode: 'pub',
  rawStateLabel: 'Publicada',
  buyerCode: 'B001',
  buyerName: 'MINSAL',
  publishedAt: '2025-06-01T12:00:00.000Z',
  closingAt: '2025-07-15T17:00:00.000Z',
  sourcePriority: 'api-v2-compra-agil',
  reconciliationStatus: 'exact',
  lastSeenAt: '2025-06-20T03:00:00.000Z',
};

const listResult = (overrides?: Record<string, unknown>) => ({
  items: [sampleItem],
  total: 1,
  page: 1,
  limit: 25,
  __typename: 'MercadoPublicoDetectedProcesses',
  ...overrides,
});

describe('useMercadoPublicoDetectedProcesses', () => {
  it('should pass exact filter variables through to the last query called', async () => {
    const filters = {
      processTypes: [MercadoPublicoDetectedProcessType.compra_agil],
      states: ['publicada'],
      buyerCode: 'B001',
      publishedFrom: new Date('2025-01-01'),
      publishedTo: new Date('2025-06-30'),
      changedSince: new Date('2025-06-01'),
      sort: {
        key: MercadoPublicoDetectedProcessSortKey.closingAt,
        direction: MercadoPublicoDetectedProcessSortDirection.asc,
      },
      page: 1,
      limit: 25,
    };

    const resultFn = jest.fn().mockReturnValue({
      data: { mercadoPublicoDetectedProcesses: listResult() },
    });

    const mocks: MockedResponse[] = [
      {
        request: {
          query: GetMercadoPublicoDetectedProcessesDocument,
          variables: {
            processTypes: ['compra_agil'],
            states: ['publicada'],
            buyerCode: 'B001',
            publishedFrom: '2025-01-01T00:00:00.000Z',
            publishedTo: '2025-06-30T00:00:00.000Z',
            changedSince: '2025-06-01T00:00:00.000Z',
            sort: { key: 'closingAt', direction: 'asc' },
            page: 1,
            limit: 25,
          },
        },
        result: resultFn,
      },
    ];

    const { result } = renderHook(
      () => useMercadoPublicoDetectedProcesses(filters),
      { wrapper: createWrapper(mocks) },
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(resultFn).toHaveBeenCalled();
    expect(result.current.processes).toBeDefined();
    expect(result.current.processes!.items).toHaveLength(1);
    expect(result.current.processes!.total).toBe(1);
    expect(result.current.processes!.page).toBe(1);
    expect(result.current.processes!.limit).toBe(25);
  });

  it('should expose page / limit / total from result', async () => {
    const mocks: MockedResponse[] = [
      {
        request: {
          query: GetMercadoPublicoDetectedProcessesDocument,
          variables: {
            processTypes: ['compra_agil'],
            page: 2,
            limit: 5,
          },
        },
        result: {
          data: {
            mercadoPublicoDetectedProcesses: listResult({
              items: [sampleItem, { ...sampleItem, processCode: 'CA-002' }],
              total: 45,
              page: 2,
              limit: 5,
            }),
          },
        },
      },
    ];

    const { result } = renderHook(
      () =>
        useMercadoPublicoDetectedProcesses({
          processTypes: [MercadoPublicoDetectedProcessType.compra_agil],
          page: 2,
          limit: 5,
        }),
      { wrapper: createWrapper(mocks) },
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.processes!.total).toBe(45);
    expect(result.current.processes!.page).toBe(2);
    expect(result.current.processes!.limit).toBe(5);
    expect(result.current.processes!.items).toHaveLength(2);
  });

  it('should preserve empty filter arrays and omit undefined variables', async () => {
    const mocks: MockedResponse[] = [
      {
        request: {
          query: GetMercadoPublicoDetectedProcessesDocument,
          variables: {
            processTypes: [],
            states: [],
            page: 1,
            limit: 25,
          },
        },
        result: {
          data: {
            mercadoPublicoDetectedProcesses: listResult(),
          },
        },
      },
    ];

    const { result } = renderHook(
      () =>
        useMercadoPublicoDetectedProcesses({
          processTypes: [],
          states: [],
          page: 1,
          limit: 25,
        }),
      { wrapper: createWrapper(mocks) },
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.processes!.items).toHaveLength(1);
  });

  it('should keep previous data visible during refetch', async () => {
    const cache = new InMemoryCache();

    const mocks: MockedResponse[] = [
      {
        request: {
          query: GetMercadoPublicoDetectedProcessesDocument,
          variables: {
            processTypes: ['compra_agil'],
            page: 1,
            limit: 1,
          },
        },
        result: {
          data: {
            mercadoPublicoDetectedProcesses: listResult({
              items: [sampleItem],
              total: 3,
              page: 1,
            }),
          },
        },
      },
      {
        request: {
          query: GetMercadoPublicoDetectedProcessesDocument,
          variables: {
            processTypes: ['compra_agil'],
            page: 2,
            limit: 1,
          },
        },
        delay: 50,
        result: {
          data: {
            mercadoPublicoDetectedProcesses: listResult({ page: 2 }),
          },
        },
      },
    ];

    const { result, rerender } = renderHook(
      ({ page }: { page: number }) =>
        useMercadoPublicoDetectedProcesses({
          processTypes: [MercadoPublicoDetectedProcessType.compra_agil],
          page,
          limit: 1,
        }),
      {
        wrapper: createWrapper(mocks, cache),
        initialProps: { page: 1 },
      },
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.processes!.items).toHaveLength(1);
    expect(result.current.processes!.items[0].processCode).toBe('CA-001');

    rerender({ page: 2 });

    await waitFor(() => {
      expect(result.current.isRefetching).toBe(true);
    });

    expect(result.current.processes!.items).toHaveLength(1);
    expect(result.current.processes!.items[0].processCode).toBe('CA-001');
  });
});
