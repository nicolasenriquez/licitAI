import { i18n } from '@lingui/core';
import { I18nProvider } from '@lingui/react';
import { fireEvent, render } from '@testing-library/react';

import { MercadoPublicoControlCenterTab } from '@/mercado-publico/components/MercadoPublicoControlCenterTab';

const mockUseMercadoPublicoPipelineHealth = jest.fn();
const mockUseMercadoPublicoApiQuotaUsage = jest.fn();
const mockUseMercadoPublicoCsvFileHealth = jest.fn();
const mockUseMercadoPublicoJobRuns = jest.fn();
const mockUseMercadoPublicoApiCallLog = jest.fn();

jest.mock('@/auth/states/tokenPairState', () => ({
  tokenPairState: {},
}));
jest.mock('@/ui/utilities/state/jotai/hooks/useAtomStateValue', () => ({
  useAtomStateValue: () => null,
}));
jest.mock('@/ui/feedback/snack-bar-manager/hooks/useSnackBar', () => ({
  useSnackBar: () => ({ enqueueErrorSnackBar: jest.fn() }),
}));
jest.mock('@/mercado-publico/hooks/useMercadoPublicoPipelineHealth', () => ({
  useMercadoPublicoPipelineHealth: () => mockUseMercadoPublicoPipelineHealth(),
}));
jest.mock('@/mercado-publico/hooks/useMercadoPublicoApiQuotaUsage', () => ({
  useMercadoPublicoApiQuotaUsage: () => mockUseMercadoPublicoApiQuotaUsage(),
}));
jest.mock('@/mercado-publico/hooks/useMercadoPublicoCsvFileHealth', () => ({
  useMercadoPublicoCsvFileHealth: () => mockUseMercadoPublicoCsvFileHealth(),
}));
jest.mock('@/mercado-publico/hooks/useMercadoPublicoJobRuns', () => ({
  useMercadoPublicoJobRuns: () => mockUseMercadoPublicoJobRuns(),
}));
jest.mock('@/mercado-publico/hooks/useMercadoPublicoApiCallLog', () => ({
  useMercadoPublicoApiCallLog: () => mockUseMercadoPublicoApiCallLog(),
}));
jest.mock('@/mercado-publico/utils/mercadoPublicoDisplay', () => ({
  getMercadoPublicoStatusColor: () => 'gray',
  getMercadoPublicoStatusLabel: (value: string | null) =>
    value ?? 'No informado',
  useMercadoPublicoDisplay: () => ({
    formatCount: (value: number | null) =>
      value === null ? 'No informado' : String(value),
    formatDate: (value: string | null) => value ?? 'No informado',
    formatDuration: (value: number | null) =>
      value === null ? 'No informado' : String(value),
  }),
}));

const stableQueryState = {
  data: undefined,
  error: undefined,
  isInitialLoading: false,
  isRefetching: false,
  loading: false,
  refetch: jest.fn(),
};

describe('MercadoPublicoControlCenterTab', () => {
  beforeEach(() => {
    mockUseMercadoPublicoPipelineHealth.mockReturnValue({
      ...stableQueryState,
      pipelineHealth: {
        generatedAt: '2026-07-31T12:00:00.000Z',
        jobs: [
          {
            failureCount: null,
            freshness: null,
            jobName: 'compra-agil',
            lagSinceLastSuccessMs: null,
            lastFailureAt: null,
            lastSuccessAt: null,
            latestStatus: null,
          },
        ],
      },
    });
    mockUseMercadoPublicoApiQuotaUsage.mockReturnValue({
      ...stableQueryState,
      apiQuotaUsage: {
        sources: [
          {
            dailyLimit: 10,
            last429At: null,
            remaining: null,
            resetAt: null,
            source: 'api-v2',
            used: 12,
          },
        ],
      },
    });
    mockUseMercadoPublicoCsvFileHealth.mockReturnValue({
      ...stableQueryState,
      csvFileHealth: {
        files: [
          {
            lastLoadedAt: null,
            parseErrorCount: null,
            parseSuccessCount: null,
            rowCount: null,
            sourceDataset: 'compras-agiles',
            sourceFileName: 'fuente.csv',
          },
        ],
      },
    });
    mockUseMercadoPublicoJobRuns.mockReturnValue({
      ...stableQueryState,
      jobRuns: {
        hasMore: true,
        items: [
          {
            errorSummary: null,
            finishedAt: null,
            id: 'job-1',
            jobName: 'compra-agil',
            jobRunId: 'run-1',
            rawCsvFileId: null,
            recordsCanonicalized: null,
            recordsFailed: null,
            recordsFetched: null,
            startedAt: '2026-07-31T12:00:00.000Z',
            status: 'partial',
          },
        ],
      },
    });
    mockUseMercadoPublicoApiCallLog.mockReturnValue({
      ...stableQueryState,
      callLog: {
        hasMore: false,
        items: [
          {
            endpoint: '/v2/licitaciones',
            errorSummary: null,
            fetchedAt: '2026-07-31T12:00:00.000Z',
            httpStatus: 200,
            id: 'call-1',
            recordsFetched: null,
            requestParams: null,
            source: 'api-v2',
          },
        ],
      },
    });
  });

  it('mounts one investigation table and shows factual partial-state math', () => {
    const { getAllByText, getByRole, getByText, queryByRole } = render(
      <I18nProvider i18n={i18n}>
        <MercadoPublicoControlCenterTab />
      </I18nProvider>,
    );

    expect(getByRole('region', { name: 'Ejecuciones' })).toBeInTheDocument();
    expect(
      queryByRole('region', { name: 'Llamadas API' }),
    ).not.toBeInTheDocument();
    expect(getByText(/Restante:\s*0/)).toBeInTheDocument();
    expect(
      getByText(/máximo entre 0 y límite diario menos uso/i),
    ).toBeInTheDocument();
    expect(getByText(/Sin total global/i)).toBeInTheDocument();
    expect(getAllByText('No informado').length).toBeGreaterThan(0);

    fireEvent.click(getByRole('button', { name: 'Llamadas API' }));

    expect(getByRole('region', { name: 'Llamadas API' })).toBeInTheDocument();
    expect(
      queryByRole('region', { name: 'Ejecuciones' }),
    ).not.toBeInTheDocument();
  });
});
