import { type Meta, type StoryObj } from '@storybook/react-vite';
import { styled } from '@linaria/react';
import { HttpResponse, graphql } from 'msw';
import { type ReactNode } from 'react';

import { MercadoPublicoBrowseTab } from '@/mercado-publico/components/MercadoPublicoBrowseTab';
import { MercadoPublicoControlCenterTab } from '@/mercado-publico/components/MercadoPublicoControlCenterTab';
import { MercadoPublicoProcessDetailPanel } from '@/mercado-publico/components/MercadoPublicoProcessDetailPanel';
import { MercadoPublicoDetectedProcessType } from '~/generated/graphql';
import { ComponentDecorator } from 'twenty-ui/testing';
import { ThemeProvider, themeCssVariables } from 'twenty-ui/theme-constants';
import { SnackBarDecorator } from '~/testing/decorators/SnackBarDecorator';

type WorkspaceStoryProps = {
  colorScheme: 'dark' | 'light';
  surface: 'compra-agil' | 'control-center' | 'licitaciones' | 'source-pending';
};

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
  } else {
    content = (
      <MercadoPublicoBrowseTab
        processType={
          surface === 'compra-agil'
            ? MercadoPublicoDetectedProcessType.compra_agil
            : MercadoPublicoDetectedProcessType.licitacion
        }
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
  buyerCode: 'ORG-FIXTURE-01',
  buyerName: 'Organismo de prueba con nombre extenso',
  canonicalState: 'publicada',
  closingAt: '2026-08-04T15:00:00.000Z',
  lastSeenAt: '2026-07-31T12:00:00.000Z',
  processCode:
    processType === 'compra_agil' ? 'CA-FIXTURE-001' : 'LP-FIXTURE-001',
  processType,
  publishedAt: '2026-07-30T10:00:00.000Z',
  rawStateCode: null,
  rawStateLabel: null,
  reconciliationStatus: null,
  sourcePriority: 'api-v2',
  title:
    'Proceso de prueba con descripción extensa para validar lectura y contención',
});

const queryState = {
  handlers: [
    graphql.query('GetMercadoPublicoDetectedProcesses', ({ variables }) => {
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
                closingAt: null,
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
    }),
    graphql.query('GetMercadoPublicoProcessDetailV2', () =>
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
    graphql.query('GetMercadoPublicoPipelineHealth', () =>
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
    graphql.query('GetMercadoPublicoApiQuotaUsage', () =>
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
    graphql.query('GetMercadoPublicoJobRuns', () =>
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
    graphql.query('GetMercadoPublicoApiCallLog', () =>
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
    graphql.query('GetMercadoPublicoCsvFileHealth', () =>
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
  ],
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
