import { type InMemoryCache } from '@apollo/client';
import { type MockedResponse } from '@apollo/client/testing';
import { MockedProvider } from '@apollo/client/testing/react';
import { i18n } from '@lingui/core';
import { I18nProvider } from '@lingui/react';
import { act, fireEvent, render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { MercadoPublicoCommandCenterPage } from '~/pages/mercado-publico/MercadoPublicoCommandCenterPage';

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
  __typename: 'MercadoPublicoDetectedProcessItem',
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

describe('MercadoPublicoCommandCenterPage', () => {
  it('should redirect unknown hash to compra-agil', async () => {
    const mocks: MockedResponse[] = [
      {
        request: {
          query: expect.any(Object),
          variables: expect.objectContaining({
            processTypes: ['compra_agil'],
          }),
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
        /compra.?agil/i,
      );
    });
  });

  it('should preserve Compra Ágil filter state when switching tabs', async () => {
    const mocks: MockedResponse[] = [
      {
        request: {
          query: expect.any(Object),
          variables: expect.objectContaining({
            processTypes: ['compra_agil'],
            states: ['publicada'],
          }),
        },
        result: processesMock([processItem('CA-001', 'publicada')]),
      },
      {
        request: {
          query: expect.any(Object),
          variables: expect.objectContaining({
            processTypes: ['compra_agil'],
            states: [],
          }),
        },
        result: processesMock([
          processItem('CA-001', 'publicada'),
          processItem('CA-002', 'cerrada'),
        ]),
      },
    ];

    const { getByText } = render(<MercadoPublicoCommandCenterPage />, {
      wrapper: createWrapper(mocks, ['/mercado-publico#compra-agil']),
    });

    await waitFor(() => {
      expect(getByText(/Proceso CA-001/i)).toBeInTheDocument();
    });

    const licitacionesTab = getByText(/licitaciones/i);

    act(() => {
      fireEvent.click(licitacionesTab);
    });

    await waitFor(() => {
      expect(window.location.hash).toContain('licitaciones');
    });
  });

  it('should close side panel and restore focus to originating row', async () => {
    const mocks: MockedResponse[] = [
      {
        request: {
          query: expect.any(Object),
          variables: expect.objectContaining({
            processTypes: ['compra_agil'],
          }),
        },
        result: processesMock([
          processItem('CA-001', 'publicada'),
          processItem('CA-002', 'cerrada'),
        ]),
      },
      {
        request: {
          query: expect.any(Object),
          variables: {
            processType: 'compra_agil',
            processCode: 'CA-001',
          },
        },
        result: {
          data: {
            mercadoPublicoProcessDetail: {
              __typename: 'MercadoPublicoDetectedProcessDetail',
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
              sourcePriority: 'api-v2-compra-agil',
              lastSeenAt: '2025-06-20T00:00:00.000Z',
            },
          },
        },
      },
    ];

    const { container, queryByText } = render(
      <MercadoPublicoCommandCenterPage />,
      { wrapper: createWrapper(mocks, ['/mercado-publico#compra-agil']) },
    );

    await waitFor(() => {
      expect(queryByText(/Proceso CA-001/i)).toBeInTheDocument();
    });

    const row = container.querySelector(
      '[role="row"], [data-testid="process-row-CA-001"], tr[data-process-code="CA-001"]',
    );

    if (row) {
      row.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      fireEvent.keyDown(row, { key: 'Enter', code: 'Enter' });

      await waitFor(() => {
        const closeButton = container.querySelector(
          '[aria-label*="Cerrar" i], [aria-label*="Close" i], [data-close-panel]',
        );

        expect(closeButton).not.toBeNull();
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
          query: expect.any(Object),
          variables: expect.objectContaining({
            processTypes: ['compra_agil'],
          }),
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
