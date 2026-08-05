import { MercadoPublicoApiCallLogReadService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-api-call-log-read.service';
import { MercadoPublicoApiQuotaUsageReadService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-api-quota-usage-read.service';
import { MercadoPublicoCsvFileHealthReadService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-csv-file-health-read.service';
import { MercadoPublicoDetectedProcessReadService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-detected-process-read.service';
import { MercadoPublicoJobRunReadService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-job-run-read.service';
import { MercadoPublicoPipelineHealthReadService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-pipeline-health-read.service';
import { MercadoPublicoProcessDetailReadService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-process-detail-read.service';
import { type MercadoPublicoCompraAgilCallStage } from 'src/engine/core-modules/mercado-publico/constants/detected-process-read.constants';
import { MercadoPublicoQueryResolver } from 'src/engine/core-modules/mercado-publico/mercado-publico-query.resolver';

describe('MercadoPublicoQueryResolver', () => {
  const detectedProcessReadService = {
    listDetectedProcesses: jest.fn(),
    getCompraAgilAnalytics: jest.fn(),
  } as unknown as jest.Mocked<MercadoPublicoDetectedProcessReadService>;
  const processDetailReadService = {
    getDetectedProcessDetail: jest.fn(),
  } as unknown as jest.Mocked<MercadoPublicoProcessDetailReadService>;
  const jobRunReadService = {
    listJobRuns: jest.fn(),
  } as unknown as jest.Mocked<MercadoPublicoJobRunReadService>;
  const apiCallLogReadService = {
    listApiCallLogs: jest.fn(),
  } as unknown as jest.Mocked<MercadoPublicoApiCallLogReadService>;
  const pipelineHealthReadService = {
    getPipelineHealth: jest.fn(),
  } as unknown as jest.Mocked<MercadoPublicoPipelineHealthReadService>;
  const apiQuotaUsageReadService = {
    getApiQuotaUsage: jest.fn(),
  } as unknown as jest.Mocked<MercadoPublicoApiQuotaUsageReadService>;
  const csvFileHealthReadService = {
    getCsvFileHealth: jest.fn(),
  } as unknown as jest.Mocked<MercadoPublicoCsvFileHealthReadService>;

  const resolver = new MercadoPublicoQueryResolver(
    detectedProcessReadService,
    processDetailReadService,
    jobRunReadService,
    apiCallLogReadService,
    pipelineHealthReadService,
    apiQuotaUsageReadService,
    csvFileHealthReadService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('delegates the browse and detail queries without widening their inputs', async () => {
    const listResult = { items: [], total: 0, page: 1, limit: 50 };
    const detailResult = null;
    detectedProcessReadService.listDetectedProcesses.mockResolvedValue(
      listResult,
    );
    processDetailReadService.getDetectedProcessDetail.mockResolvedValue(
      detailResult,
    );

    await expect(
      resolver.mercadoPublicoDetectedProcesses({
        processTypes: ['compra_agil'],
        states: ['publicada'],
        buyerCode: ' B001 ',
        page: 2,
        limit: 10,
        sort: { key: 'closingAt', direction: 'asc' },
      }),
    ).resolves.toBe(listResult);
    await expect(
      resolver.mercadoPublicoProcessDetail({
        processType: 'compra_agil',
        processCode: 'CA-1',
      }),
    ).resolves.toBe(detailResult);

    expect(
      detectedProcessReadService.listDetectedProcesses,
    ).toHaveBeenCalledWith({
      processTypes: ['compra_agil'],
      states: ['publicada'],
      buyerCode: ' B001 ',
      publishedFrom: undefined,
      publishedTo: undefined,
      changedSince: undefined,
      page: 2,
      limit: 10,
      sort: { key: 'closingAt', direction: 'asc' },
    });
    expect(
      processDetailReadService.getDetectedProcessDetail,
    ).toHaveBeenCalledWith('compra_agil', 'CA-1');
  });

  it('delegates monitoring filters and wrapper reads', async () => {
    const jobRunsResult = { items: [], hasMore: false };
    const apiCallLogsResult = { items: [], hasMore: false };
    const pipelineResult = { jobs: [], generatedAt: new Date() };
    const quotaResult = { sources: [], generatedAt: new Date() };
    const csvResult = { files: [], generatedAt: new Date() };
    jobRunReadService.listJobRuns.mockResolvedValue(jobRunsResult);
    apiCallLogReadService.listApiCallLogs.mockResolvedValue(apiCallLogsResult);
    pipelineHealthReadService.getPipelineHealth.mockResolvedValue(
      pipelineResult,
    );
    apiQuotaUsageReadService.getApiQuotaUsage.mockResolvedValue(quotaResult);
    csvFileHealthReadService.getCsvFileHealth.mockResolvedValue(csvResult);

    await expect(
      resolver.mercadoPublicoJobRuns({
        statuses: ['skipped'],
        jobName: 'job',
        limit: 10,
        offset: 20,
      }),
    ).resolves.toBe(jobRunsResult);
    await expect(
      resolver.mercadoPublicoApiCallLog({
        source: 'source',
        endpoint: 'endpoint',
        httpStatus: 500,
        limit: 10,
        offset: 20,
      }),
    ).resolves.toEqual(apiCallLogsResult);
    await expect(resolver.mercadoPublicoPipelineHealth()).resolves.toBe(
      pipelineResult,
    );
    await expect(resolver.mercadoPublicoApiQuotaUsage()).resolves.toBe(
      quotaResult,
    );
    await expect(resolver.mercadoPublicoCsvFileHealth()).resolves.toBe(
      csvResult,
    );

    expect(jobRunReadService.listJobRuns).toHaveBeenCalledWith({
      statuses: ['skipped'],
      jobName: 'job',
      startedFrom: undefined,
      startedTo: undefined,
      limit: 10,
      offset: 20,
    });
    expect(apiCallLogReadService.listApiCallLogs).toHaveBeenCalledWith({
      source: 'source',
      endpoint: 'endpoint',
      httpStatus: 500,
      limit: 10,
      offset: 20,
    });
  });

  it('delegates Compra Agil analytics business filters', async () => {
    const analyticsResult = {
      summary: {
        totalFound: 1,
        closingNext24Hours: 0,
        knownAmountAvailableClp: 100_000,
        positiveDocumentCount: 1,
      },
    };
    detectedProcessReadService.getCompraAgilAnalytics.mockResolvedValue(
      analyticsResult as never,
    );

    const filters = {
      search: 'mantencion',
      regionName: 'Metropolitana',
      closingFrom: new Date('2026-06-01T00:00:00.000Z'),
      closingTo: new Date('2026-06-30T23:59:59.000Z'),
      hasDocuments: true,
      callStages: ['first_call'] as MercadoPublicoCompraAgilCallStage[],
      amountMin: 100_000,
      amountMax: 1_000_000,
      buyerRut: '60.000.000-0',
    };

    await expect(
      resolver.mercadoPublicoCompraAgilAnalytics(filters),
    ).resolves.toBe(analyticsResult);

    expect(
      detectedProcessReadService.getCompraAgilAnalytics,
    ).toHaveBeenCalledWith(filters);
  });

  it('redacts sensitive request parameters recursively before returning API logs', async () => {
    apiCallLogReadService.listApiCallLogs.mockResolvedValue({
      hasMore: false,
      items: [
        {
          id: 'call-1',
          source: 'source',
          endpoint: 'endpoint',
          requestParams: {
            Authorization: 'Bearer secret',
            nested: {
              PASSWORD: 'nested-secret',
              safe: 'visible',
            },
            params: [
              { key: 'ticket', val: 'ticket-secret' },
              { key: 'safe', val: 'visible' },
            ],
          },
          httpStatus: 200,
          fetchedAt: new Date(),
          recordsFetched: 1,
          errorSummary: null,
          ingestionJobId: null,
        },
      ],
    });

    const result = await resolver.mercadoPublicoApiCallLog({ limit: 10 });
    const requestParams = result.items[0].requestParams as {
      Authorization: string;
      nested: { PASSWORD: string; safe: string };
      params: Array<{ key: string; val: string }>;
    };

    expect(requestParams.Authorization).toBe('[REDACTED]');
    expect(requestParams.nested.PASSWORD).toBe('[REDACTED]');
    expect(requestParams.nested.safe).toBe('visible');
    expect(requestParams.params[0].val).toBe('[REDACTED]');
    expect(requestParams.params[1].val).toBe('visible');
  });
});
