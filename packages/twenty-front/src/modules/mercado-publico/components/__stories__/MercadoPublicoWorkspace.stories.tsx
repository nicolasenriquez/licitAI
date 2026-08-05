import { type Meta, type StoryObj } from '@storybook/react-vite';
import { styled } from '@linaria/react';
import { HttpResponse, delay, graphql } from 'msw';
import { type ReactNode } from 'react';
import { expect, userEvent, within } from 'storybook/test';

import { MercadoPublicoBrowseTab } from '@/mercado-publico/components/MercadoPublicoBrowseTab';
import { MercadoPublicoCompraAgilTab } from '@/mercado-publico/components/MercadoPublicoCompraAgilTab';
import { MercadoPublicoControlCenterTab } from '@/mercado-publico/components/MercadoPublicoControlCenterTab';
import { MercadoPublicoProcessDetailPanel } from '@/mercado-publico/components/MercadoPublicoProcessDetailPanel';
import {
  type GetMercadoPublicoCompraAgilAnalyticsQuery,
  MercadoPublicoCompraAgilCallStage,
  MercadoPublicoDetectedProcessType,
} from '~/generated/graphql';
import { ComponentDecorator } from 'twenty-ui/testing';
import { ThemeProvider, themeCssVariables } from 'twenty-ui/theme-constants';
import { SnackBarDecorator } from '~/testing/decorators/SnackBarDecorator';

type WorkspaceStoryProps = {
  colorScheme: 'dark' | 'light';
  surface: 'compra-agil' | 'control-center' | 'licitaciones' | 'source-pending';
};

type AnalyticsFixture =
  GetMercadoPublicoCompraAgilAnalyticsQuery['mercadoPublicoCompraAgilAnalytics'];

const StyledStorySurface = styled.div`
  background: ${themeCssVariables.background.primary};
  box-sizing: border-box;
  color: ${themeCssVariables.font.color.primary};
  max-width: 100%;
  min-height: 100vh;
  min-width: 0;
  overflow-x: hidden;
  width: 100%;
`;

const WorkspaceStory = ({ colorScheme, surface }: WorkspaceStoryProps) => {
  let content: ReactNode;

  if (surface === 'control-center') {
    content = <MercadoPublicoControlCenterTab />;
  } else if (surface === 'source-pending') {
    content = (
      <MercadoPublicoProcessDetailPanel
        processCode="CA-FIXTURE-001"
        processType={MercadoPublicoDetectedProcessType.compra_agil}
      />
    );
  } else if (surface === 'compra-agil') {
    content = <MercadoPublicoCompraAgilTab />;
  } else {
    content = (
      <MercadoPublicoBrowseTab
        processType={MercadoPublicoDetectedProcessType.licitacion}
      />
    );
  }

  return (
    <ThemeProvider colorScheme={colorScheme}>
      <StyledStorySurface>{content}</StyledStorySurface>
    </ThemeProvider>
  );
};

const processFixture = (processType: string) => ({
  __typename: 'MercadoPublicoDetectedProcess',
  amountAvailableClp: processType === 'compra_agil' ? 1250000 : null,
  buyerCode: 'ORG-FIXTURE-01',
  buyerName: 'Organismo de prueba con nombre extenso',
  buyerRut: processType === 'compra_agil' ? '61.111.111-1' : null,
  callStage: processType === 'compra_agil' ? 'first_call' : null,
  canonicalState: 'publicada',
  closingAt: '2026-08-04T15:00:00.000Z',
  documentCount: processType === 'compra_agil' ? 2 : null,
  lastSeenAt: '2026-07-31T12:00:00.000Z',
  offersReceivedCount: processType === 'compra_agil' ? 3 : null,
  processCode:
    processType === 'compra_agil' ? 'CA-FIXTURE-001' : 'LP-FIXTURE-001',
  processType,
  publishedAt: '2026-07-30T10:00:00.000Z',
  purchaseUnitName: processType === 'compra_agil' ? 'Unidad de compras' : null,
  rawStateCode: null,
  rawStateLabel: null,
  reconciliationStatus: null,
  regionName:
    processType === 'compra_agil' ? 'Metropolitana de Santiago' : null,
  sourcePriority: 'api-v2',
  title:
    'Proceso de prueba con descripción extensa para validar lectura y contención',
});

const fullAnalyticsFixture: AnalyticsFixture = {
  __typename: 'MercadoPublicoCompraAgilAnalytics',
  amountBands: [
    {
      __typename: 'MercadoPublicoCompraAgilAmountBand',
      band: 'under_100k',
      count: 0,
    },
    {
      __typename: 'MercadoPublicoCompraAgilAmountBand',
      band: '100k_to_500k',
      count: 0,
    },
    {
      __typename: 'MercadoPublicoCompraAgilAmountBand',
      band: '500k_to_1m',
      count: 0,
    },
    {
      __typename: 'MercadoPublicoCompraAgilAmountBand',
      band: '1m_to_3m',
      count: 2,
    },
    {
      __typename: 'MercadoPublicoCompraAgilAmountBand',
      band: 'over_3m',
      count: 0,
    },
  ],
  callStages: [
    {
      __typename: 'MercadoPublicoCompraAgilCallStageBucket',
      callStage: MercadoPublicoCompraAgilCallStage.first_call,
      count: 2,
    },
  ],
  closingByDay: [
    {
      __typename: 'MercadoPublicoCompraAgilClosingBucket',
      date: '2026-08-03',
      count: 0,
    },
    {
      __typename: 'MercadoPublicoCompraAgilClosingBucket',
      date: '2026-08-04',
      count: 1,
    },
    {
      __typename: 'MercadoPublicoCompraAgilClosingBucket',
      date: '2026-08-05',
      count: 1,
    },
    {
      __typename: 'MercadoPublicoCompraAgilClosingBucket',
      date: '2026-08-06',
      count: 0,
    },
    {
      __typename: 'MercadoPublicoCompraAgilClosingBucket',
      date: '2026-08-07',
      count: 0,
    },
    {
      __typename: 'MercadoPublicoCompraAgilClosingBucket',
      date: '2026-08-08',
      count: 0,
    },
    {
      __typename: 'MercadoPublicoCompraAgilClosingBucket',
      date: '2026-08-09',
      count: 0,
    },
  ],
  documentAvailability: [
    {
      __typename: 'MercadoPublicoCompraAgilDocumentAvailabilityBucket',
      count: 2,
      hasDocuments: true,
    },
  ],
  metadata: {
    __typename: 'MercadoPublicoCompraAgilAnalyticsMetadata',
    calculatedAt: '2026-08-03T12:00:00.000Z',
    completePopulation: true,
    coverage: {
      __typename: 'MercadoPublicoCompraAgilCoverage',
      amountAvailableClp: 2,
      buyerIdentity: 2,
      callStage: 2,
      closingAt: 2,
      documentCount: 2,
      offersReceivedCount: 2,
      regionName: 2,
    },
    filteredPopulation: 2,
    timezone: 'America/Santiago',
  },
  regions: [
    {
      __typename: 'MercadoPublicoCompraAgilRegionBucket',
      count: 2,
      regionName: 'Metropolitana de Santiago',
    },
  ],
  summary: {
    __typename: 'MercadoPublicoCompraAgilAnalyticsSummary',
    closingNext24Hours: 1,
    knownAmountAvailableClp: 2500000,
    positiveDocumentCount: 2,
    totalFound: 2,
  },
  topBuyers: [
    {
      __typename: 'MercadoPublicoCompraAgilBuyerBucket',
      buyerKey: '61.111.111-1',
      buyerName: 'Organismo de prueba con nombre extenso',
      count: 2,
    },
  ],
};

const emptyAnalyticsFixture: AnalyticsFixture = {
  ...fullAnalyticsFixture,
  amountBands: fullAnalyticsFixture.amountBands.map((bucket) => ({
    ...bucket,
    count: 0,
  })),
  callStages: [],
  closingByDay: fullAnalyticsFixture.closingByDay.map((bucket) => ({
    ...bucket,
    count: 0,
  })),
  documentAvailability: [],
  metadata: {
    ...fullAnalyticsFixture.metadata,
    coverage: {
      ...fullAnalyticsFixture.metadata.coverage,
      amountAvailableClp: 0,
      buyerIdentity: 0,
      callStage: 0,
      closingAt: 0,
      documentCount: 0,
      offersReceivedCount: 0,
      regionName: 0,
    },
    filteredPopulation: 0,
  },
  regions: [],
  summary: {
    ...fullAnalyticsFixture.summary,
    closingNext24Hours: 0,
    knownAmountAvailableClp: null,
    positiveDocumentCount: 0,
    totalFound: 0,
  },
  topBuyers: [],
};

const partialAnalyticsFixture: AnalyticsFixture = {
  ...fullAnalyticsFixture,
  metadata: {
    ...fullAnalyticsFixture.metadata,
    coverage: {
      ...fullAnalyticsFixture.metadata.coverage,
      amountAvailableClp: 2,
      buyerIdentity: 2,
      callStage: 2,
      closingAt: 2,
      documentCount: 2,
      offersReceivedCount: 2,
      regionName: 2,
    },
    filteredPopulation: 4,
  },
};

const analyticsHandler = (fixture = fullAnalyticsFixture) =>
  graphql.query('GetMercadoPublicoCompraAgilAnalytics', () =>
    HttpResponse.json({
      data: { mercadoPublicoCompraAgilAnalytics: fixture },
    }),
  );

const detectedProcessesHandler = graphql.query(
  'GetMercadoPublicoDetectedProcesses',
  ({ variables }) => {
    const processType =
      (variables.processTypes as string[] | undefined)?.[0] ?? 'compra_agil';

    return HttpResponse.json({
      data: {
        mercadoPublicoDetectedProcesses: {
          __typename: 'MercadoPublicoDetectedProcesses',
          items: [
            processFixture(processType),
            {
              ...processFixture(processType),
              buyerCode: null,
              buyerName: null,
              canonicalState: 'cerrada',
              closingAt: '2026-08-05T15:00:00.000Z',
              processCode:
                processType === 'compra_agil'
                  ? 'CA-FIXTURE-002'
                  : 'LP-FIXTURE-002',
              publishedAt: null,
              title: null,
            },
          ],
          limit: 25,
          page: 1,
          total: 2,
        },
      },
    });
  },
);

const queryState = {
  handlers: {
    analytics: analyticsHandler(),
    detectedProcesses: detectedProcessesHandler,
    processDetail: graphql.query('GetMercadoPublicoProcessDetailV2', () =>
      HttpResponse.json({
        data: {
          mercadoPublicoProcessDetail: {
            __typename: 'MercadoPublicoProcessDetail',
            adjudications: null,
            buyer: { code: null, name: null },
            canonicalState: 'publicada',
            compraAgilSource: null,
            dates: { closingAt: null, publishedAt: null },
            items: [],
            lastSeenAt: '2026-07-31T12:00:00.000Z',
            processCode: 'CA-FIXTURE-001',
            processType: 'compra_agil',
            rawState: null,
            reconciliationSummary: {
              candidate: 0,
              exact: 0,
              manualReviewRequired: 0,
              unmatched: 0,
            },
            relatedOcs: [],
            sourceLineage: [],
            sourcePriority: 'api-v2',
            title: 'Compra Ágil con detalle fuente pendiente',
          },
        },
      }),
    ),
    pipelineHealth: graphql.query('GetMercadoPublicoPipelineHealth', () =>
      HttpResponse.json({
        data: {
          mercadoPublicoPipelineHealth: {
            __typename: 'MercadoPublicoPipelineHealth',
            generatedAt: '2026-07-31T12:00:00.000Z',
            jobs: [
              {
                __typename: 'MercadoPublicoPipelineHealthJob',
                expectedCadenceMs: null,
                failureCount: null,
                freshness: null,
                jobName: 'compra-agil',
                lagSinceLastSuccessMs: null,
                lastFailureAt: null,
                lastSuccessAt: null,
                latestStatus: 'partial',
              },
            ],
          },
        },
      }),
    ),
    apiQuotaUsage: graphql.query('GetMercadoPublicoApiQuotaUsage', () =>
      HttpResponse.json({
        data: {
          mercadoPublicoApiQuotaUsage: {
            __typename: 'MercadoPublicoApiQuotaUsage',
            generatedAt: '2026-07-31T12:00:00.000Z',
            sources: [
              {
                __typename: 'MercadoPublicoApiQuotaUsageSource',
                dailyLimit: 1000,
                last429At: null,
                remaining: null,
                resetAt: null,
                source: 'api-v2',
                used: 240,
              },
            ],
          },
        },
      }),
    ),
    jobRuns: graphql.query('GetMercadoPublicoJobRuns', () =>
      HttpResponse.json({
        data: {
          mercadoPublicoJobRuns: {
            __typename: 'MercadoPublicoJobRuns',
            hasMore: true,
            items: [
              {
                __typename: 'MercadoPublicoJobRun',
                createdAt: '2026-07-31T12:00:00.000Z',
                errorSummary: null,
                finishedAt: null,
                id: 'job-fixture-01',
                jobName: 'compra-agil',
                jobRunId: 'run-fixture-01',
                rawCsvFileId: null,
                recordsCanonicalized: null,
                recordsFailed: null,
                recordsFetched: null,
                recordsStaged: null,
                startedAt: '2026-07-31T12:00:00.000Z',
                status: 'partial',
              },
            ],
          },
        },
      }),
    ),
    apiCallLog: graphql.query('GetMercadoPublicoApiCallLog', () =>
      HttpResponse.json({
        data: {
          mercadoPublicoApiCallLog: {
            __typename: 'MercadoPublicoApiCallLogs',
            hasMore: false,
            items: [
              {
                __typename: 'MercadoPublicoApiCallLog',
                endpoint: '/v2/licitaciones',
                errorSummary: null,
                fetchedAt: '2026-07-31T12:00:00.000Z',
                httpStatus: 200,
                id: 'api-call-fixture-01',
                ingestionJobId: null,
                recordsFetched: null,
                requestParams: { codigo: 'LP-FIXTURE-001' },
                source: 'api-v2',
              },
            ],
          },
        },
      }),
    ),
    csvFileHealth: graphql.query('GetMercadoPublicoCsvFileHealth', () =>
      HttpResponse.json({
        data: {
          mercadoPublicoCsvFileHealth: {
            __typename: 'MercadoPublicoCsvFileHealth',
            files: [
              {
                __typename: 'MercadoPublicoCsvFileHealthEntry',
                detectedDelimiter: null,
                detectedEncoding: null,
                fileChecksum: null,
                freshness: null,
                lastLoadedAt: null,
                parseErrorCount: null,
                parseStatus: null,
                parseSuccessCount: null,
                rowCount: null,
                schemaFingerprint: null,
                sourceDataset: 'compras-agiles',
                sourceFileName: 'fuente.csv',
                sourceModality: null,
                sourcePeriod: null,
              },
            ],
            generatedAt: '2026-07-31T12:00:00.000Z',
          },
        },
      }),
    ),
  },
};

const meta: Meta<typeof WorkspaceStory> = {
  component: WorkspaceStory,
  decorators: [ComponentDecorator, SnackBarDecorator],
  parameters: {
    layout: 'fullscreen',
    msw: queryState,
  },
  title: 'Modules/MercadoPublico/Workspace',
};

export default meta;
type Story = StoryObj<typeof WorkspaceStory>;

export const CompraAgil: Story = {
  args: { colorScheme: 'light', surface: 'compra-agil' },
  name: 'Compra Agil / Full',
  play: async ({ canvasElement }) => {
    const disclosure = await within(canvasElement).findByTestId(
      'compra-agil-disclosure',
    );

    disclosure.focus();
    expect(disclosure).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    expect(disclosure).toHaveAttribute('aria-expanded', 'true');
  },
};

export const CompraAgilLoading: Story = {
  args: { colorScheme: 'light', surface: 'compra-agil' },
  parameters: {
    msw: {
      handlers: {
        ...queryState.handlers,
        detectedProcesses: graphql.query(
          'GetMercadoPublicoDetectedProcesses',
          async () => {
            await delay('infinite');
            return HttpResponse.json({ data: null });
          },
        ),
        analytics: graphql.query(
          'GetMercadoPublicoCompraAgilAnalytics',
          async () => {
            await delay('infinite');
            return HttpResponse.json({ data: null });
          },
        ),
      },
    },
  },
};

export const CompraAgilEmpty: Story = {
  args: { colorScheme: 'light', surface: 'compra-agil' },
  parameters: {
    msw: {
      handlers: {
        ...queryState.handlers,
        detectedProcesses: graphql.query(
          'GetMercadoPublicoDetectedProcesses',
          () =>
            HttpResponse.json({
              data: {
                mercadoPublicoDetectedProcesses: {
                  __typename: 'MercadoPublicoDetectedProcesses',
                  items: [],
                  limit: 25,
                  page: 1,
                  total: 0,
                },
              },
            }),
        ),
        analytics: analyticsHandler(emptyAnalyticsFixture),
      },
    },
  },
};

export const CompraAgilError: Story = {
  args: { colorScheme: 'light', surface: 'compra-agil' },
  parameters: {
    msw: {
      handlers: {
        ...queryState.handlers,
        detectedProcesses: graphql.query(
          'GetMercadoPublicoDetectedProcesses',
          () =>
            HttpResponse.json({ errors: [{ message: 'Fixture list error' }] }),
        ),
        analytics: graphql.query('GetMercadoPublicoCompraAgilAnalytics', () =>
          HttpResponse.json({
            errors: [{ message: 'Fixture analytics error' }],
          }),
        ),
      },
    },
  },
};

export const CompraAgilPartialCoverage: Story = {
  args: { colorScheme: 'light', surface: 'compra-agil' },
  parameters: {
    msw: {
      handlers: {
        ...queryState.handlers,
        analytics: analyticsHandler(partialAnalyticsFixture),
        detectedProcesses: detectedProcessesHandler,
      },
    },
  },
};

export const CompraAgil390: Story = {
  args: { colorScheme: 'light', surface: 'compra-agil' },
  globals: {
    viewport: { isRotated: false, value: 'compraAgil390' },
  },
  parameters: {
    viewport: {
      options: {
        compraAgil390: {
          name: 'Compra Agil 390 px',
          styles: { height: '844px', width: '390px' },
          type: 'mobile',
        },
      },
    },
  },
  play: async ({ canvasElement }) => {
    const documentElement = canvasElement.ownerDocument.documentElement;

    expect(documentElement.scrollWidth).toBeLessThanOrEqual(
      documentElement.clientWidth,
    );
  },
};

export const Licitaciones: Story = {
  args: { colorScheme: 'light', surface: 'licitaciones' },
};

export const SourcePending: Story = {
  args: { colorScheme: 'light', surface: 'source-pending' },
};

export const ControlCenter: Story = {
  args: { colorScheme: 'light', surface: 'control-center' },
};

export const CompraAgilDark: Story = {
  args: { colorScheme: 'dark', surface: 'compra-agil' },
};

export const LicitacionesDark: Story = {
  args: { colorScheme: 'dark', surface: 'licitaciones' },
};

export const ControlCenterDark: Story = {
  args: { colorScheme: 'dark', surface: 'control-center' },
};
