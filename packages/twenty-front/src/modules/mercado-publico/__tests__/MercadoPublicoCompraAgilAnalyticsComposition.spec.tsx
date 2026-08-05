import { type MockedResponse } from '@apollo/client/testing';
import { MockedProvider } from '@apollo/client/testing/react';
import { i18n } from '@lingui/core';
import { I18nProvider } from '@lingui/react';
import { act, fireEvent, render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Provider as JotaiProvider } from 'jotai';

import { MercadoPublicoCommandCenterPage } from '~/pages/mercado-publico/MercadoPublicoCommandCenterPage';
import { sidePanelPageInfoState } from '@/side-panel/states/sidePanelPageInfoState';
import { sidePanelPageState } from '@/side-panel/states/sidePanelPageState';
import { jotaiStore } from '@/ui/utilities/state/jotai/jotaiStore';
import { SidePanelPages } from 'twenty-shared/types';
import {
  GetMercadoPublicoCompraAgilAnalyticsDocument,
  GetMercadoPublicoDetectedProcessesDocument,
} from '~/generated/graphql';

jest.mock(
  '@/page-layout/widgets/graph/graph-widget-line-chart/components/GraphWidgetLineChart',
  () => ({ GraphWidgetLineChart: () => <div /> }),
);
jest.mock(
  '@/page-layout/widgets/graph/graph-widget-bar-chart/components/GraphWidgetBarChart',
  () => ({ GraphWidgetBarChart: () => <div /> }),
);

const createWrapper = (mocks: MockedResponse[]) =>
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <MemoryRouter initialEntries={['/mercado-publico#compra-agil']}>
        <JotaiProvider store={jotaiStore}>
          <MockedProvider mocks={mocks}>
            <I18nProvider i18n={i18n}>{children}</I18nProvider>
          </MockedProvider>
        </JotaiProvider>
      </MemoryRouter>
    );
  };

const processItem = (code: string) => ({
  __typename: 'MercadoPublicoDetectedProcess',
  amountAvailableClp: 1250000,
  buyerCode: 'B001',
  buyerName: 'Organismo de prueba',
  buyerRut: '61.111.111-1',
  callStage: 'first_call',
  canonicalState: 'publicada',
  closingAt: '2025-08-01T00:00:00.000Z',
  documentCount: 2,
  lastSeenAt: '2025-06-20T00:00:00.000Z',
  offersReceivedCount: 3,
  processCode: code,
  processType: 'compra_agil',
  publishedAt: '2025-06-01T00:00:00.000Z',
  purchaseUnitName: 'Unidad de compras',
  rawStateCode: null,
  rawStateLabel: null,
  reconciliationStatus: null,
  regionName: 'Metropolitana de Santiago',
  sourcePriority: 'api-v2-compra-agil',
  title: `Proceso ${code}`,
});

const processesMock: MockedResponse = {
  request: {
    query: GetMercadoPublicoDetectedProcessesDocument,
    variables: {
      limit: 25,
      page: 1,
      processTypes: ['compra_agil'],
      sort: { direction: 'desc', key: 'lastSeenAt' },
      states: [],
    },
  },
  result: {
    data: {
      mercadoPublicoDetectedProcesses: {
        __typename: 'MercadoPublicoDetectedProcessesResult',
        items: [processItem('CA-001'), processItem('CA-002')],
        limit: 25,
        page: 1,
        total: 2,
      },
    },
  },
};

const analyticsMock: MockedResponse = {
  request: {
    query: GetMercadoPublicoCompraAgilAnalyticsDocument,
    variables: {},
  },
  result: {
    data: {
      mercadoPublicoCompraAgilAnalytics: {
        __typename: 'MercadoPublicoCompraAgilAnalytics',
        summary: {
          __typename: 'MercadoPublicoCompraAgilAnalyticsSummary',
          totalFound: 2,
          closingNext24Hours: 1,
          knownAmountAvailableClp: 2500000,
          positiveDocumentCount: 2,
        },
        closingByDay: [
          {
            __typename: 'MercadoPublicoCompraAgilClosingBucket',
            date: '2025-08-01',
            count: 1,
          },
          {
            __typename: 'MercadoPublicoCompraAgilClosingBucket',
            date: '2025-08-02',
            count: 0,
          },
          {
            __typename: 'MercadoPublicoCompraAgilClosingBucket',
            date: '2025-08-03',
            count: 0,
          },
          {
            __typename: 'MercadoPublicoCompraAgilClosingBucket',
            date: '2025-08-04',
            count: 1,
          },
          {
            __typename: 'MercadoPublicoCompraAgilClosingBucket',
            date: '2025-08-05',
            count: 0,
          },
          {
            __typename: 'MercadoPublicoCompraAgilClosingBucket',
            date: '2025-08-06',
            count: 0,
          },
          {
            __typename: 'MercadoPublicoCompraAgilClosingBucket',
            date: '2025-08-07',
            count: 0,
          },
        ],
        regions: [
          {
            __typename: 'MercadoPublicoCompraAgilRegionBucket',
            regionName: 'Metropolitana de Santiago',
            count: 2,
          },
        ],
        topBuyers: [
          {
            __typename: 'MercadoPublicoCompraAgilBuyerBucket',
            buyerKey: '61.111.111-1',
            buyerName: 'Organismo de prueba',
            count: 2,
          },
        ],
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
            callStage: 'first_call',
            count: 2,
          },
        ],
        documentAvailability: [
          {
            __typename: 'MercadoPublicoCompraAgilDocumentAvailabilityBucket',
            hasDocuments: true,
            count: 2,
          },
        ],
        metadata: {
          __typename: 'MercadoPublicoCompraAgilAnalyticsMetadata',
          filteredPopulation: 2,
          calculatedAt: '2025-08-01T00:00:00.000Z',
          timezone: 'America/Santiago',
          completePopulation: true,
          coverage: {
            __typename: 'MercadoPublicoCompraAgilCoverage',
            closingAt: 2,
            regionName: 2,
            buyerIdentity: 2,
            amountAvailableClp: 2,
            callStage: 2,
            documentCount: 2,
            offersReceivedCount: 2,
          },
        },
      },
    },
  },
};

describe('MercadoPublicoCompraAgilAnalyticsComposition', () => {
  beforeEach(() => {
    jotaiStore.set(sidePanelPageState.atom, SidePanelPages.CommandMenuDisplay);
    jotaiStore.set(sidePanelPageInfoState.atom, {
      title: undefined,
      Icon: undefined,
      instanceId: '',
    });
  });

  it('should render four KPI in the productive Compra Ágil surface', async () => {
    const { container } = render(<MercadoPublicoCommandCenterPage />, {
      wrapper: createWrapper([processesMock, analyticsMock]),
    });

    await waitFor(() => {
      expect(
        container.querySelectorAll('[data-testid^="compra-agil-kpi-"]'),
      ).toHaveLength(4);
    });
  });

  it('should render two primary charts and keep four secondary charts inside a closed disclosure', async () => {
    const { container } = render(<MercadoPublicoCommandCenterPage />, {
      wrapper: createWrapper([processesMock, analyticsMock]),
    });

    await waitFor(() => {
      expect(
        container.querySelector('[data-testid="compra-agil-chart-closing"]'),
      ).not.toBeNull();
    });

    expect(
      container.querySelector('[data-testid="compra-agil-chart-regions"]'),
    ).not.toBeNull();

    const disclosureButton = container.querySelector<HTMLButtonElement>(
      '[data-testid="compra-agil-disclosure"]',
    );

    expect(disclosureButton).not.toBeNull();
    expect(disclosureButton).toHaveAttribute('aria-expanded', 'false');
    expect(
      container.querySelector(
        '[data-testid="compra-agil-chart-top-buyers"], [data-testid="compra-agil-chart-amount-bands"], [data-testid="compra-agil-chart-call-stages"], [data-testid="compra-agil-chart-document-availability"]',
      ),
    ).toBeNull();

    fireEvent.click(disclosureButton!);

    await waitFor(() => {
      expect(
        container.querySelectorAll('[data-testid^="compra-agil-chart-"]'),
      ).toHaveLength(6);
    });
  });

  it('should render the five-column opportunity table and open the SidePanel from a row', async () => {
    const { getAllByRole, getByRole, queryByText } = render(
      <MercadoPublicoCommandCenterPage />,
      { wrapper: createWrapper([processesMock, analyticsMock]) },
    );

    await waitFor(() => {
      expect(queryByText(/Proceso CA-001/i)).toBeInTheDocument();
    });

    expect(
      getAllByRole('columnheader').map((header) => header.textContent),
    ).toEqual([
      'Oportunidad',
      'Institución/región',
      'Monto',
      'Cierre',
      'Antecedentes',
    ]);

    const row = getByRole('button', {
      name: /abrir detalle de Proceso CA-001/i,
    });

    act(() => {
      row.focus();
      fireEvent.click(row);
    });

    await waitFor(() => {
      expect(jotaiStore.get(sidePanelPageState.atom)).toBe(
        SidePanelPages.MercadoPublicoProcessDetail,
      );
    });
  });

  it('should report partial coverage with business language', async () => {
    const partialAnalyticsMock: MockedResponse = {
      request: {
        query: GetMercadoPublicoCompraAgilAnalyticsDocument,
        variables: {},
      },
      result: {
        data: {
          mercadoPublicoCompraAgilAnalytics: {
            __typename: 'MercadoPublicoCompraAgilAnalytics',
            summary: {
              __typename: 'MercadoPublicoCompraAgilAnalyticsSummary',
              totalFound: 4,
              closingNext24Hours: 1,
              knownAmountAvailableClp: 2500000,
              positiveDocumentCount: 1,
            },
            closingByDay: [],
            regions: [],
            topBuyers: [],
            amountBands: [],
            callStages: [],
            documentAvailability: [],
            metadata: {
              __typename: 'MercadoPublicoCompraAgilAnalyticsMetadata',
              filteredPopulation: 4,
              calculatedAt: '2025-08-01T00:00:00.000Z',
              timezone: 'America/Santiago',
              completePopulation: true,
              coverage: {
                __typename: 'MercadoPublicoCompraAgilCoverage',
                closingAt: 3,
                regionName: 1,
                buyerIdentity: 4,
                amountAvailableClp: 2,
                callStage: 2,
                documentCount: 1,
                offersReceivedCount: 0,
              },
            },
          },
        },
      },
    };

    const { queryByText } = render(<MercadoPublicoCommandCenterPage />, {
      wrapper: createWrapper([processesMock, partialAnalyticsMock]),
    });

    await waitFor(() => {
      expect(queryByText(/informado/i)).toBeInTheDocument();
      expect(queryByText(/2 de 4/i)).toBeInTheDocument();
    });
  });
});
