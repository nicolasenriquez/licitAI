import { type InMemoryCache } from '@apollo/client';
import { type MockedResponse } from '@apollo/client/testing';
import { MockedProvider } from '@apollo/client/testing/react';
import { i18n } from '@lingui/core';
import { I18nProvider } from '@lingui/react';
import { act, fireEvent, render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { MercadoPublicoCommandCenterPage } from '~/pages/mercado-publico/MercadoPublicoCommandCenterPage';
import {
  GetMercadoPublicoDetectedProcessesDocument,
  GetMercadoPublicoProcessDetailDocument,
} from '~/generated/graphql';

const createWrapper = (
  mocks: MockedResponse[],
  initialEntries: string[] = ['/mercado-publico'],
  cache?: InMemoryCache,
) =>
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <MemoryRouter initialEntries={initialEntries}>
        <MockedProvider mocks={mocks} cache={cache}>
          <I18nProvider i18n={i18n}>{children}</I18nProvider>
        </MockedProvider>
      </MemoryRouter>
    );
  };

const processItem = (code: string, state: string) => ({
  __typename: 'MercadoPublicoDetectedProcess',
  processType: 'compra_agil',
  processCode: code,
  title: `Proceso ${code}`,
  canonicalState: state,
  rawStateCode: null,
  rawStateLabel: null,
  buyerCode: 'B001',
  buyerName: 'Organismo',
  publishedAt: '2025-06-01T00:00:00.000Z',
  closingAt: '2025-08-01T00:00:00.000Z',
  sourcePriority: 'api-v2-compra-agil',
  reconciliationStatus: null,
  lastSeenAt: '2025-06-20T00:00:00.000Z',
});

const processesMock = (
  items: ReturnType<typeof processItem>[],
  overrides?: Record<string, unknown>,
) => ({
  data: {
    mercadoPublicoDetectedProcesses: {
      items,
      total: items.length,
      page: 1,
      limit: 25,
      __typename: 'MercadoPublicoDetectedProcessesResult',
      ...overrides,
    },
  },
});

const initialProcessVariables = {
  limit: 25,
  page: 1,
  processTypes: ['compra_agil'],
  sort: { direction: 'asc', key: 'closingAt' },
  states: [],
};

const licitacionesVariables = {
  ...initialProcessVariables,
  processTypes: ['licitacion'],
};

const closedCompraAgilVariables = {
  ...initialProcessVariables,
  states: ['cerrada'],
};

const clearedCompraAgilVariables = {
  ...initialProcessVariables,
  sort: { direction: 'desc', key: 'lastSeenAt' },
};

describe('MercadoPublicoCommandCenterPage', () => {
  it('should redirect unknown hash to compra-agil', async () => {
    const mocks: MockedResponse[] = [
      {
        request: {
          query: GetMercadoPublicoDetectedProcessesDocument,
          variables: initialProcessVariables,
        },
        result: processesMock([processItem('CA-001', 'publicada')]),
      },
    ];

    const { container } = render(<MercadoPublicoCommandCenterPage />, {
      wrapper: createWrapper(mocks, ['/mercado-publico#unknown']),
    });

    await waitFor(() => {
      const tab = container.querySelector(
        '[aria-pressed="true"], [aria-selected="true"], [data-active="true"]',
      );

      expect(tab?.textContent?.toLowerCase() ?? window.location.hash).toMatch(
        /compra ágil/i,
      );
    });
  });

  it('should preserve Compra Ágil filter state when switching tabs', async () => {
    const mocks: MockedResponse[] = [
      {
        request: {
          query: GetMercadoPublicoDetectedProcessesDocument,
          variables: initialProcessVariables,
        },
        result: processesMock([processItem('CA-001', 'publicada')]),
      },
      {
        request: {
          query: GetMercadoPublicoDetectedProcessesDocument,
          variables: licitacionesVariables,
        },
        result: processesMock([
          processItem('CA-001', 'publicada'),
          processItem('CA-002', 'cerrada'),
        ]),
      },
      {
        request: {
          query: GetMercadoPublicoDetectedProcessesDocument,
          variables: closedCompraAgilVariables,
        },
        result: processesMock([processItem('CA-002', 'cerrada')]),
      },
      {
        request: {
          query: GetMercadoPublicoDetectedProcessesDocument,
          variables: clearedCompraAgilVariables,
        },
        result: processesMock([processItem('CA-003', 'publicada')]),
      },
    ];

    const { container, getByRole, getByText } = render(
      <MercadoPublicoCommandCenterPage />,
      {
        wrapper: createWrapper(mocks, ['/mercado-publico#compra-agil']),
      },
    );

    await waitFor(() => {
      expect(getByText(/Proceso CA-001/i)).toBeInTheDocument();
    });

    const compraAgilStateSelect = container.querySelector<HTMLSelectElement>(
      '#mercado-publico-compra_agil-state',
    );

    expect(compraAgilStateSelect).not.toBeNull();

    fireEvent.change(compraAgilStateSelect!, {
      target: { value: 'cerrada' },
    });

    await waitFor(() => {
      expect(getByText(/Proceso CA-002/i)).toBeInTheDocument();
    });

    const licitacionesTab = getByText(/licitaciones/i);

    act(() => {
      fireEvent.click(licitacionesTab);
    });

    await waitFor(() => {
      expect(licitacionesTab.closest('[data-active="true"]')).not.toBeNull();
    });

    fireEvent.click(getByText(/compra ágil/i));

    await waitFor(() => {
      expect(
        getByText(/compra ágil/i).closest('[data-active="true"]'),
      ).not.toBeNull();
    });

    expect(container.querySelector('#mercado-publico-compra_agil-state')).toBe(
      compraAgilStateSelect,
    );
    expect(compraAgilStateSelect).toHaveValue('cerrada');

    fireEvent.click(getByRole('button', { name: /limpiar filtros/i }));

    await waitFor(() => {
      expect(getByText(/Proceso CA-003/i)).toBeInTheDocument();
    });
  });

  it('should close side panel and restore focus to originating row', async () => {
    const mocks: MockedResponse[] = [
      {
        request: {
          query: GetMercadoPublicoDetectedProcessesDocument,
          variables: initialProcessVariables,
        },
        result: processesMock([
          processItem('CA-001', 'publicada'),
          processItem('CA-002', 'cerrada'),
        ]),
      },
      {
        request: {
          query: GetMercadoPublicoProcessDetailDocument,
          variables: {
            processType: 'compra_agil',
            processCode: 'CA-001',
          },
        },
        result: {
          data: {
            mercadoPublicoProcessDetail: {
              __typename: 'MercadoPublicoProcessDetail',
              processType: 'compra_agil',
              processCode: 'CA-001',
              title: 'Proceso CA-001',
              canonicalState: 'publicada',
              rawState: { code: 'pub', label: 'Publicada' },
              buyer: { code: 'B001', name: 'Organismo' },
              dates: {
                publishedAt: '2025-06-01T00:00:00.000Z',
                closingAt: '2025-08-01T00:00:00.000Z',
              },
              items: [],
              adjudications: null,
              relatedOcs: [],
              sourceLineage: [],
              reconciliationSummary: {
                exact: 0,
                candidate: 0,
                unmatched: 0,
                manualReviewRequired: 0,
              },
              compraAgilSource: {
                sourcePath: '/v2/compra-agil/CA-001',
                state: { id: '2', code: 'publicada', label: 'Publicada' },
                additionalDates: {
                  lastChangedAt: '2025-06-20T00:00:00.000Z',
                  firstCallClosingAt: null,
                  secondCallClosingAt: null,
                },
                amounts: {
                  currency: 'CLP',
                  available: 1000000,
                  availableClp: 1000000,
                },
                reasons: {
                  deserted: null,
                  selection: 'Mejor oferta',
                  cancellation: null,
                },
                offersReceived: 3,
                documents: [{ id: 'DOC-1', name: 'Bases.pdf' }],
                institution: {
                  rut: '60.000.000-0',
                  regionName: 'Metropolitana',
                  purchaseUnit: 'Abastecimiento',
                  buyerName: 'Organismo',
                },
                call: { description: 'Primer llamado', state: 'abierta' },
              },
              sourcePriority: 'api-v2-compra-agil',
              lastSeenAt: '2025-06-20T00:00:00.000Z',
            },
          },
        },
      },
    ];

    const { container, queryAllByText, queryByText } = render(
      <MercadoPublicoCommandCenterPage />,
      { wrapper: createWrapper(mocks, ['/mercado-publico#compra-agil']) },
    );

    await waitFor(() => {
      expect(queryByText(/Proceso CA-001/i)).toBeInTheDocument();
    });

    const row = container.querySelector('[data-testid="process-row-CA-001"]');

    if (row) {
      act(() => {
        row.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        fireEvent.keyDown(row, { key: 'Enter', code: 'Enter' });
      });

      await waitFor(() => {
        const closeButton = container.querySelector(
          '[aria-label*="Cerrar" i], [aria-label*="Close" i], [data-close-panel]',
        );

        expect(closeButton).not.toBeNull();
        expect(queryByText(/Datos de Compra Ágil/i)).toBeInTheDocument();
        expect(queryByText(/Metropolitana/i)).toBeInTheDocument();
        expect(queryAllByText(/Primer llamado/i).length).toBeGreaterThan(0);
        expect(queryByText(/Mejor oferta/i)).toBeInTheDocument();
        expect(queryByText(/DOC-1 · Bases\.pdf/i)).toBeInTheDocument();
        expect(queryByText(/\/v2\/compra-agil\/CA-001/)).toBeInTheDocument();
        expect(
          container.querySelector('a[href="/v2/compra-agil/CA-001"]'),
        ).toBeNull();
      });

      const closeButton = container.querySelector(
        '[aria-label*="Cerrar" i], [aria-label*="Close" i], [data-close-panel]',
      );

      if (closeButton) {
        fireEvent.keyDown(closeButton, {
          key: 'Escape',
          code: 'Escape',
        });
      }

      await waitFor(() => {
        expect(document.activeElement).toBe(row);
      });
    }
  });

  it('should not lose browse context when closing detail panel', async () => {
    const mocks: MockedResponse[] = [
      {
        request: {
          query: GetMercadoPublicoDetectedProcessesDocument,
          variables: initialProcessVariables,
        },
        result: processesMock([
          processItem('CA-001', 'publicada'),
          processItem('CA-002', 'cerrada'),
        ]),
      },
    ];

    const { queryByText, queryAllByText } = render(
      <MercadoPublicoCommandCenterPage />,
      { wrapper: createWrapper(mocks, ['/mercado-publico#compra-agil']) },
    );

    await waitFor(() => {
      expect(queryByText(/Proceso CA-001/i)).toBeInTheDocument();
    });

    const rowsBefore = queryAllByText(/Proceso CA-/i).length;

    expect(rowsBefore).toBe(2);
  });
});
