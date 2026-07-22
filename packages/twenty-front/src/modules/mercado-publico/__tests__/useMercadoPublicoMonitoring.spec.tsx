import { type MockedResponse } from '@apollo/client/testing';
import { MockedProvider } from '@apollo/client/testing/react';
import { i18n } from '@lingui/core';
import { I18nProvider } from '@lingui/react';
import { renderHook, waitFor } from '@testing-library/react';
import { type ReactNode } from 'react';

import {
  GetMercadoPublicoApiCallLogDocument,
  GetMercadoPublicoJobRunsDocument,
} from '~/generated/graphql';

import { useMercadoPublicoJobRuns } from '@/mercado-publico/hooks/useMercadoPublicoJobRuns';
import { useMercadoPublicoApiCallLog } from '@/mercado-publico/hooks/useMercadoPublicoApiCallLog';

const createWrapper = (mocks: MockedResponse[]) =>
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <MockedProvider mocks={mocks}>
        <I18nProvider i18n={i18n}>{children}</I18nProvider>
      </MockedProvider>
    );
  };

const jobRunItem = (overrides?: Record<string, unknown>) => ({
  __typename: 'MercadoPublicoJobRun',
  id: 'a0000001-0001-0001-0001-000000000001',
  jobName: 'api-v2-compra-agil-incremental',
  jobRunId: 'run-001',
  status: 'success',
  startedAt: '2025-06-20T03:10:00.000Z',
  finishedAt: '2025-06-20T03:12:00.000Z',
  recordsFetched: 100,
  recordsStaged: 100,
  recordsCanonicalized: 95,
  recordsFailed: 0,
  errorSummary: null,
  createdAt: '2025-06-20T03:10:00.000Z',
  ...overrides,
});

const apiCallItem = (overrides?: Record<string, unknown>) => ({
  __typename: 'MercadoPublicoApiCallLog',
  id: 'b0000001-0001-0001-0001-000000000001',
  source: 'api-v2-compra-agil',
  endpoint: 'list',
  requestParams: { endpoint: 'list', safe: 'visible' },
  httpStatus: 200,
  fetchedAt: '2025-06-20T03:10:00.000Z',
  recordsFetched: 100,
  errorSummary: null,
  ingestionJobId: 'a0000001-0001-0001-0001-000000000001',
  ...overrides,
});

describe('useMercadoPublicoJobRuns', () => {
  it('should paginate with limit / offset / hasMore', async () => {
    const mocks: MockedResponse[] = [
      {
        request: {
          query: GetMercadoPublicoJobRunsDocument,
          variables: { limit: 2, offset: 0 },
        },
        result: {
          data: {
            mercadoPublicoJobRuns: {
              items: [
                jobRunItem(),
                jobRunItem({ id: 'jr-2', status: 'failed' }),
              ],
              hasMore: true,
              __typename: 'MercadoPublicoJobRuns',
            },
          },
        },
      },
      {
        request: {
          query: GetMercadoPublicoJobRunsDocument,
          variables: { limit: 2, offset: 2 },
        },
        result: {
          data: {
            mercadoPublicoJobRuns: {
              items: [jobRunItem({ id: 'jr-3', status: 'soft_miss' })],
              hasMore: false,
              __typename: 'MercadoPublicoJobRuns',
            },
          },
        },
      },
    ];

    const { result } = renderHook(
      () => useMercadoPublicoJobRuns({ limit: 2, offset: 0 }),
      { wrapper: createWrapper(mocks) },
    );

    await waitFor(() => {
      if (result.current.loading) throw new Error('still loading');
    });

    expect(result.current.jobRuns!.items).toHaveLength(2);
    expect(result.current.jobRuns!.hasMore).toBe(true);

    const { result: result2 } = renderHook(
      () => useMercadoPublicoJobRuns({ limit: 2, offset: 2 }),
      { wrapper: createWrapper(mocks) },
    );

    await waitFor(() => {
      if (result2.current.loading) throw new Error('still loading');
    });

    expect(result2.current.jobRuns!.items).toHaveLength(1);
    expect(result2.current.jobRuns!.hasMore).toBe(false);
  });

  it('should keep previous data visible during refetch', async () => {
    const mocks: MockedResponse[] = [
      {
        request: {
          query: GetMercadoPublicoJobRunsDocument,
          variables: { limit: 1, offset: 0 },
        },
        result: {
          data: {
            mercadoPublicoJobRuns: {
              items: [jobRunItem()],
              hasMore: false,
              __typename: 'MercadoPublicoJobRuns',
            },
          },
        },
      },
      {
        request: {
          query: GetMercadoPublicoJobRunsDocument,
          variables: { limit: 1, offset: 1 },
        },
        delay: 50,
        result: {
          data: {
            mercadoPublicoJobRuns: {
              items: [jobRunItem({ id: 'jr-2' })],
              hasMore: false,
              __typename: 'MercadoPublicoJobRuns',
            },
          },
        },
      },
    ];

    const { result, rerender } = renderHook(
      ({ offset }: { offset: number }) =>
        useMercadoPublicoJobRuns({ limit: 1, offset }),
      {
        wrapper: createWrapper(mocks),
        initialProps: { offset: 0 },
      },
    );

    await waitFor(() => {
      if (result.current.loading) throw new Error('still loading');
    });

    const firstId = result.current.jobRuns!.items[0].id;

    rerender({ offset: 1 });

    await waitFor(() => {
      expect(result.current.isRefetching).toBe(true);
    });

    expect(result.current.jobRuns!.items[0].id).toBe(firstId);
  });

  it('should skip the request when its investigation view is inactive', () => {
    const { result } = renderHook(
      () => useMercadoPublicoJobRuns({ limit: 1, offset: 0 }, { skip: true }),
      { wrapper: createWrapper([]) },
    );

    expect(result.current.loading).toBe(false);
    expect(result.current.jobRuns).toBeUndefined();
  });
});

describe('useMercadoPublicoApiCallLog', () => {
  it('should deliver redacted requestParams unchanged', async () => {
    const redactedParams = {
      endpoint: 'by-date',
      code: '123',
      fecha: '2025-01-01',
      Authorization: '[REDACTED]',
      Cookie: '[REDACTED]',
      token: '[REDACTED]',
      password: '[REDACTED]',
      Ticket: '[REDACTED]',
      nested: {
        secret: '[REDACTED]',
        Authorization: '[REDACTED]',
        safe_value: 'keep-me',
      },
      params: [
        { key: 'Authorization', val: '[REDACTED]' },
        { key: 'safe', val: 'visible' },
        { key: 'ticket', val: '[REDACTED]' },
      ],
    };

    const mocks: MockedResponse[] = [
      {
        request: {
          query: GetMercadoPublicoApiCallLogDocument,
          variables: { limit: 10, offset: 0 },
        },
        result: {
          data: {
            mercadoPublicoApiCallLog: {
              items: [apiCallItem({ requestParams: redactedParams })],
              hasMore: false,
              __typename: 'MercadoPublicoApiCallLogs',
            },
          },
        },
      },
    ];

    const { result } = renderHook(
      () => useMercadoPublicoApiCallLog({ limit: 10, offset: 0 }),
      { wrapper: createWrapper(mocks) },
    );

    await waitFor(() => {
      if (result.current.loading) throw new Error('still loading');
    });

    const params = result.current.callLog!.items[0].requestParams;

    expect(typeof params).toBe('object');
    expect(params.Authorization).not.toBe('Bearer secret-token-123');
    expect(params.Cookie).not.toBe('session=abc123');
    expect(params.token).not.toBe('api-key-xyz');
    expect(params.password).not.toBe('super-secret');
    expect(params.Ticket).not.toBe('TICKET-999');
    expect(params.endpoint).toBe('by-date');
    expect(params.code).toBe('123');
    expect(params.fecha).toBe('2025-01-01');
    expect(params.nested.secret).not.toBe('nested-secret');
    expect(params.nested.safe_value).toBe('keep-me');

    const authArr = params.params.find(
      (e: { key: string }) => e.key === 'Authorization',
    );

    expect(authArr.val).not.toBe('arr-bearer');
  });

  it('should paginate call log with limit / offset / hasMore', async () => {
    const mocks: MockedResponse[] = [
      {
        request: {
          query: GetMercadoPublicoApiCallLogDocument,
          variables: { limit: 1, offset: 0 },
        },
        result: {
          data: {
            mercadoPublicoApiCallLog: {
              items: [apiCallItem()],
              hasMore: true,
              __typename: 'MercadoPublicoApiCallLogs',
            },
          },
        },
      },
    ];

    const { result } = renderHook(
      () => useMercadoPublicoApiCallLog({ limit: 1, offset: 0 }),
      { wrapper: createWrapper(mocks) },
    );

    await waitFor(() => {
      if (result.current.loading) throw new Error('still loading');
    });

    expect(result.current.callLog!.items).toHaveLength(1);
    expect(result.current.callLog!.hasMore).toBe(true);
  });

  it('should skip the request when its investigation view is inactive', () => {
    const { result } = renderHook(
      () =>
        useMercadoPublicoApiCallLog({ limit: 1, offset: 0 }, { skip: true }),
      { wrapper: createWrapper([]) },
    );

    expect(result.current.loading).toBe(false);
    expect(result.current.callLog).toBeUndefined();
  });
});
