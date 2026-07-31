import { MockedProvider } from '@apollo/client/testing/react';
import { type MockedResponse } from '@apollo/client/testing';
import { renderHook, waitFor } from '@testing-library/react';
import { type ReactNode } from 'react';

import {
  GetMercadoPublicoApiQuotaUsageDocument,
  GetMercadoPublicoCsvFileHealthDocument,
  GetMercadoPublicoPipelineHealthDocument,
  MercadoPublicoDetectedProcessType,
} from '~/generated/graphql';

import { useMercadoPublicoApiQuotaUsage } from '@/mercado-publico/hooks/useMercadoPublicoApiQuotaUsage';
import { useMercadoPublicoCsvFileHealth } from '@/mercado-publico/hooks/useMercadoPublicoCsvFileHealth';
import { useMercadoPublicoPipelineHealth } from '@/mercado-publico/hooks/useMercadoPublicoPipelineHealth';
import {
  GET_MERCADO_PUBLICO_PROCESS_DETAIL_V2,
  useMercadoPublicoProcessDetail,
} from '@/mercado-publico/hooks/useMercadoPublicoProcessDetail';

const createWrapper = (mocks: MockedResponse[]) =>
  function Wrapper({ children }: { children: ReactNode }) {
    return <MockedProvider mocks={mocks}>{children}</MockedProvider>;
  };

describe('Mercado Público read-model hooks', () => {
  it('should pass exact variables to the process detail query', async () => {
    const mocks: MockedResponse[] = [
      {
        request: {
          query: GET_MERCADO_PUBLICO_PROCESS_DETAIL_V2,
          variables: {
            processType: 'licitacion',
            processCode: 'LP-001',
          },
        },
        result: {
          data: {
            mercadoPublicoProcessDetail: {
              __typename: 'MercadoPublicoProcessDetail',
              processType: 'licitacion',
              processCode: 'LP-001',
              title: 'Servicio de soporte',
              canonicalState: 'publicada',
              sourcePriority: 'api-v1',
              lastSeenAt: '2025-06-20T03:00:00.000Z',
              rawState: { code: '5', label: 'Publicada' },
              buyer: { code: 'B001', name: 'MINSAL' },
              dates: {
                publishedAt: '2025-06-01T12:00:00.000Z',
                closingAt: '2025-07-15T17:00:00.000Z',
              },
              items: [],
              adjudications: null,
              relatedOcs: [],
              sourceLineage: [],
              reconciliationSummary: {
                exact: 1,
                candidate: 0,
                unmatched: 0,
                manualReviewRequired: 0,
              },
            },
          },
        },
      },
    ];

    const { result } = renderHook(
      () =>
        useMercadoPublicoProcessDetail({
          processType: MercadoPublicoDetectedProcessType.licitacion,
          processCode: 'LP-001',
        }),
      { wrapper: createWrapper(mocks) },
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.processDetail?.processCode).toBe('LP-001');
    expect(result.current.processDetail?.reconciliationSummary.exact).toBe(1);
  });

  it('should expose pipeline health, quota usage, and CSV file health', async () => {
    const healthMocks: MockedResponse[] = [
      {
        request: { query: GetMercadoPublicoPipelineHealthDocument },
        result: {
          data: {
            mercadoPublicoPipelineHealth: {
              __typename: 'MercadoPublicoPipelineHealth',
              generatedAt: '2025-06-20T03:00:00.000Z',
              jobs: [
                {
                  __typename: 'MercadoPublicoPipelineHealthJob',
                  jobName: 'api-v1',
                  latestStatus: 'success',
                  lastSuccessAt: '2025-06-20T03:00:00.000Z',
                  lastFailureAt: null,
                  lagSinceLastSuccessMs: 1000,
                  failureCount: 0,
                  freshness: 'fresh',
                  expectedCadenceMs: 60000,
                },
              ],
            },
          },
        },
      },
    ];
    const { result: healthResult } = renderHook(
      () => useMercadoPublicoPipelineHealth(),
      { wrapper: createWrapper(healthMocks) },
    );

    await waitFor(() => {
      expect(healthResult.current.loading).toBe(false);
    });

    expect(healthResult.current.pipelineHealth?.jobs[0].latestStatus).toBe(
      'success',
    );

    const quotaMocks: MockedResponse[] = [
      {
        request: { query: GetMercadoPublicoApiQuotaUsageDocument },
        result: {
          data: {
            mercadoPublicoApiQuotaUsage: {
              __typename: 'MercadoPublicoApiQuotaUsage',
              generatedAt: '2025-06-20T03:00:00.000Z',
              sources: [
                {
                  __typename: 'MercadoPublicoApiQuotaUsageSource',
                  source: 'api-v1',
                  dailyLimit: 1000,
                  used: 100,
                  remaining: 900,
                  resetAt: null,
                  last429At: null,
                },
              ],
            },
          },
        },
      },
    ];
    const { result: quotaResult } = renderHook(
      () => useMercadoPublicoApiQuotaUsage(),
      { wrapper: createWrapper(quotaMocks) },
    );

    await waitFor(() => {
      expect(quotaResult.current.loading).toBe(false);
    });

    expect(quotaResult.current.apiQuotaUsage?.sources[0].remaining).toBe(900);

    const csvMocks: MockedResponse[] = [
      {
        request: { query: GetMercadoPublicoCsvFileHealthDocument },
        result: {
          data: {
            mercadoPublicoCsvFileHealth: {
              __typename: 'MercadoPublicoCsvFileHealth',
              generatedAt: '2025-06-20T03:00:00.000Z',
              files: [
                {
                  __typename: 'MercadoPublicoCsvFileHealthEntry',
                  sourceDataset: 'licitaciones',
                  sourceModality: 'csv',
                  sourcePeriod: '2025-06',
                  sourceFileName: 'licitaciones.csv',
                  fileChecksum: 'sha256:abc',
                  detectedEncoding: 'UTF-8',
                  detectedDelimiter: ';',
                  schemaFingerprint: 'schema-1',
                  rowCount: 10,
                  parseStatus: 'success',
                  parseErrorCount: 0,
                  parseSuccessCount: 10,
                  lastLoadedAt: '2025-06-20T03:00:00.000Z',
                  freshness: 'fresh',
                },
              ],
            },
          },
        },
      },
    ];
    const { result: csvResult } = renderHook(
      () => useMercadoPublicoCsvFileHealth(),
      { wrapper: createWrapper(csvMocks) },
    );

    await waitFor(() => {
      expect(csvResult.current.loading).toBe(false);
    });

    expect(csvResult.current.csvFileHealth?.files[0].parseStatus).toBe(
      'success',
    );
  });
});
