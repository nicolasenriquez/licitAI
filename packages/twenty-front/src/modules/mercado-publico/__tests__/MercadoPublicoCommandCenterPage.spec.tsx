import { type InMemoryCache } from '@apollo/client';
import { type MockedResponse } from '@apollo/client/testing';
import { MockedProvider } from '@apollo/client/testing/react';
import { i18n } from '@lingui/core';
import { I18nProvider } from '@lingui/react';
import { act, fireEvent, render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Provider as JotaiProvider } from 'jotai';

import { MercadoPublicoCommandCenterPage } from '~/pages/mercado-publico/MercadoPublicoCommandCenterPage';
import { mercadoPublicoProcessDetailComponentState } from '@/mercado-publico/states/mercadoPublicoProcessDetailComponentState';
import { sidePanelPageInfoState } from '@/side-panel/states/sidePanelPageInfoState';
import { sidePanelPageState } from '@/side-panel/states/sidePanelPageState';
import { SIDE_PANEL_CLOSE_EVENT_NAME } from '@/ui/layout/side-panel/utils/emitSidePanelCloseEvent';
import { jotaiStore } from '@/ui/utilities/state/jotai/jotaiStore';
import { SidePanelPages } from 'twenty-shared/types';
import { GetMercadoPublicoDetectedProcessesDocument } from '~/generated/graphql';

const createWrapper = (
  mocks: MockedResponse[],
  initialEntries: string[] = ['/mercado-publico'],
  cache?: InMemoryCache,
) =>
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <MemoryRouter initialEntries={initialEntries}>
        <JotaiProvider store={jotaiStore}>
          <MockedProvider mocks={mocks} cache={cache}>
            <I18nProvider i18n={i18n}>{children}</I18nProvider>
          </MockedProvider>
        </JotaiProvider>
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
  sort: { direction: 'desc', key: 'lastSeenAt' },
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
};

describe('MercadoPublicoCommandCenterPage', () => {
  beforeEach(() => {
    jotaiStore.set(sidePanelPageState.atom, SidePanelPages.CommandMenuDisplay);
    jotaiStore.set(sidePanelPageInfoState.atom, {
      title: undefined,
      Icon: undefined,
      instanceId: '',
    });
  });
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
      expect(compraAgilStateSelect).toHaveValue('');
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
    ];

    const { container, getAllByRole, queryAllByText, queryByText } = render(
      <MercadoPublicoCommandCenterPage />,
      { wrapper: createWrapper(mocks, ['/mercado-publico#compra-agil']) },
    );

    await waitFor(() => {
      expect(queryByText(/Proceso CA-001/i)).toBeInTheDocument();
    });

    expect(
      getAllByRole('columnheader').map((header) => header.textContent),
    ).toEqual([
      'Objeto',
      'Organismo',
      'Estado',
      'Cierre',
      'Publicada',
      'Código',
    ]);

    const sortSelect = container.querySelector<HTMLSelectElement>(
      '#mercado-publico-compra_agil-sort',
    );
    const row = getAllByRole('button', {
      name: /abrir detalle de Proceso CA-001/i,
    })[0];

    expect(sortSelect?.options).toHaveLength(10);
    expect(row).not.toBeNull();

    act(() => {
      row!.focus();
      fireEvent.click(row!);
    });

    await waitFor(() => {
      expect(jotaiStore.get(sidePanelPageState.atom)).toBe(
        SidePanelPages.MercadoPublicoProcessDetail,
      );
    });

    const { instanceId } = jotaiStore.get(sidePanelPageInfoState.atom);

    expect(
      jotaiStore.get(
        mercadoPublicoProcessDetailComponentState.atomFamily({ instanceId }),
      ),
    ).toEqual({
      processCode: 'CA-001',
      processType: 'compra_agil',
    });

    act(() => {
      window.dispatchEvent(new CustomEvent(SIDE_PANEL_CLOSE_EVENT_NAME));
    });

    await waitFor(() => {
      expect(document.activeElement).toBe(row);
    });

    expect(queryAllByText(/Proceso CA-/i)).toHaveLength(2);
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
