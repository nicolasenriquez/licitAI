import { useMutation, useQuery } from '@apollo/client/react';
import { i18n } from '@lingui/core';
import { I18nProvider } from '@lingui/react';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createStore, Provider } from 'jotai';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from 'twenty-ui/theme-constants';

import { MercadoPublicoV2RefreshControl } from '@/mercado-publico/components/MercadoPublicoV2RefreshControl';

jest.mock('@apollo/client/react', () => ({
  useMutation: jest.fn(),
  useQuery: jest.fn(),
}));

jest.mock('@/object-metadata/hooks/useApolloCoreClient', () => ({
  useApolloCoreClient: jest.fn(() => ({})),
}));

const mockRefetch = jest.fn().mockResolvedValue({});
const mockStartPolling = jest.fn();
const mockStopPolling = jest.fn();
const mockStartSync = jest.fn().mockResolvedValue({});
const mockedUseMutation = useMutation as unknown as jest.Mock;
const mockedUseQuery = useQuery as unknown as jest.Mock;

const makeRun = (
  overrides: Partial<{
    safeStatus: string;
    safeSummary: string | null;
    recordsDiscovered: number;
    recordsHydrated: number;
    recordsDeferred: number;
    recordsFailed: number;
    recordsProjected: number;
    startedAt: string;
    updatedAt: string;
    completionReason: string | null;
  }> = {},
) => ({
  safeStatus: 'hydrating',
  safeSummary: null,
  recordsDiscovered: 842,
  recordsHydrated: 537,
  recordsDeferred: 3,
  recordsFailed: 0,
  recordsProjected: 421,
  startedAt: '2026-08-28T18:42:00.000Z',
  updatedAt: '2026-08-28T18:44:00.000Z',
  completionReason: null,
  ...overrides,
});

const makeData = (latestRun: ReturnType<typeof makeRun> | null) => ({
  mercadoPublicoV2SyncControl: { latestRun },
});

type QueryResult = {
  data?: ReturnType<typeof makeData>;
  previousData?: ReturnType<typeof makeData>;
  loading: boolean;
  error?: Error;
  refetch: typeof mockRefetch;
  startPolling: typeof mockStartPolling;
  stopPolling: typeof mockStopPolling;
};

let queryResult: QueryResult = {
  data: makeData(null),
  previousData: undefined,
  loading: false,
  error: undefined,
  refetch: mockRefetch,
  startPolling: mockStartPolling,
  stopPolling: mockStopPolling,
};

const renderControl = () => {
  const store = createStore();
  const getControl = () => (
    <Provider store={store}>
      <MemoryRouter
        future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
      >
        <ThemeProvider colorScheme="light">
          <I18nProvider i18n={i18n}>
            <MercadoPublicoV2RefreshControl />
          </I18nProvider>
        </ThemeProvider>
      </MemoryRouter>
    </Provider>
  );
  const rendered = render(getControl());

  return {
    ...rendered,
    rerenderControl: () => rendered.rerender(getControl()),
  };
};

describe('MercadoPublicoV2RefreshControl', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    queryResult = {
      data: makeData(null),
      previousData: undefined,
      loading: false,
      error: undefined,
      refetch: mockRefetch,
      startPolling: mockStartPolling,
      stopPolling: mockStopPolling,
    };
    mockedUseQuery.mockImplementation(() => queryResult);
    mockedUseMutation.mockReturnValue([mockStartSync, { loading: false }]);
  });

  it('starts a full refresh without maxPages', async () => {
    const user = userEvent.setup();
    jest
      .spyOn(crypto, 'randomUUID')
      .mockReturnValue('00000000-0000-4000-8000-000000000001');

    renderControl();

    await user.click(screen.getByRole('button', { name: /Actualizar datos/ }));
    await user.click(screen.getByTestId('mercado-publico-v2-refresh-start'));

    const input = mockStartSync.mock.calls[0][0].variables.input;

    expect(input).toEqual({
      idempotencyKey: expect.any(String),
      confirmed: true,
    });
    expect(input).not.toHaveProperty('maxPages');
  });

  it('maps hydrating to completed, current, and pending stages', async () => {
    const user = userEvent.setup();
    queryResult = { ...queryResult, data: makeData(makeRun()) };

    renderControl();
    await user.click(screen.getByRole('button', { name: /Actualizando/ }));

    await waitFor(() =>
      expect(
        screen.getByTestId('mercado-publico-v2-refresh-close'),
      ).toHaveFocus(),
    );
    const rail = screen.getByRole('list', {
      name: 'Progreso de actualización',
    });
    const stages = within(rail).getAllByRole('listitem');

    expect(stages[0]).toHaveTextContent('Buscar cambios — Completado');
    expect(stages[1]).toHaveTextContent('Descargar detalles — En curso');
    expect(stages[1]).toHaveAttribute('aria-current', 'step');
    expect(stages[2]).toHaveTextContent('Actualizar datos — Pendiente');
    expect(stages[3]).toHaveTextContent('Verificar — Pendiente');
    expect(screen.getByText('Monitoreando')).toBeVisible();
    expect(screen.getByText(/Iniciada/)).toHaveTextContent('Último cambio');
  });

  it('restores current backend state after close and reopen', async () => {
    const user = userEvent.setup();
    queryResult = { ...queryResult, data: makeData(makeRun()) };
    const { rerenderControl } = renderControl();

    await user.click(screen.getByRole('button', { name: /Actualizando/ }));
    expect(screen.getByRole('status')).toHaveTextContent(
      'Descargando detalles',
    );
    expect(screen.getByText('537')).toBeVisible();

    fireEvent.click(screen.getByTestId('mercado-publico-v2-refresh-close'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Actualizando/ })).toHaveFocus();
    queryResult = {
      ...queryResult,
      data: makeData(
        makeRun({
          safeStatus: 'projecting',
          recordsDiscovered: 900,
          recordsHydrated: 842,
          recordsProjected: 700,
        }),
      ),
    };
    rerenderControl();

    await user.click(screen.getByRole('button', { name: /Actualizando/ }));
    expect(screen.getByRole('status')).toHaveTextContent('Actualizando datos');
    expect(screen.getByText('842')).toBeVisible();
  });

  it('freezes monitoring when a poll fails after known active data', async () => {
    const user = userEvent.setup();
    const knownData = makeData(makeRun());
    queryResult = { ...queryResult, data: knownData };
    const { rerenderControl } = renderControl();

    await user.click(screen.getByRole('button', { name: /Actualizando/ }));
    expect(screen.getByText('Monitoreando')).toBeVisible();

    queryResult = {
      ...queryResult,
      data: undefined,
      previousData: knownData,
      error: new Error('network unavailable'),
    };
    rerenderControl();

    expect(
      screen.getAllByText('Estado temporalmente no disponible')[0],
    ).toBeVisible();
    expect(screen.queryByText('Monitoreando')).not.toBeInTheDocument();
    expect(screen.getByText(/Último cambio conocido/)).toBeVisible();
  });

  it('hides the operator-only control when access is denied', () => {
    queryResult = {
      ...queryResult,
      data: undefined,
      error: Object.assign(new Error('permission denied'), {
        extensions: {
          userFriendlyMessage:
            'You are not an explicit Mercado Publico V2 sync operator',
        },
      }),
    };

    renderControl();

    expect(
      screen.queryByRole('button', { name: /Actualizar datos/ }),
    ).not.toBeInTheDocument();
  });
});
