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

import { MercadoPublicoV2Nav } from '@/mercado-publico/components/MercadoPublicoV2Nav';
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
const mockResumeSync = jest.fn().mockResolvedValue({});
const mockCancelSync = jest.fn().mockResolvedValue({});
const mockedUseMutation = useMutation as unknown as jest.Mock;
const mockedUseQuery = useQuery as unknown as jest.Mock;

const makeRun = (
  overrides: Partial<{
    runId: string;
    safeStatus: string;
    safeSummary: string | null;
    canResume: boolean;
    recordsDiscovered: number;
    recordsHydrated: number;
    recordsDeferred: number;
    recordsFailed: number;
    recordsProjected: number;
    discoveryComplete: boolean;
    startedAt: string;
    updatedAt: string;
    completionReason: string | null;
    timeline: Array<{
      eventType: string;
      at: string;
      operatorName: string | null;
    }>;
    httpAttempts: Array<{
      at: string;
      endpoint: string;
      httpStatus: number | null;
      latencyMs: number;
      attemptNumber: number;
      retryable: boolean;
      failureClass: string | null;
    }>;
  }> = {},
) => ({
  runId: '8f2b91aa-0000-4000-8000-000000000000',
  safeStatus: 'hydrating',
  safeSummary: null,
  canResume: false,
  recordsDiscovered: 842,
  recordsHydrated: 537,
  recordsDeferred: 3,
  recordsFailed: 0,
  recordsProjected: 421,
  discoveryComplete: true,
  startedAt: '2026-08-28T18:42:00.000Z',
  updatedAt: '2026-08-28T18:44:00.000Z',
  completionReason: null,
  timeline: [
    {
      eventType: 'run_created',
      at: '2026-08-28T18:42:00.000Z',
      operatorName: 'Operador de prueba',
    },
  ],
  httpAttempts: [],
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

const renderNav = () =>
  render(
    <MemoryRouter>
      <I18nProvider i18n={i18n}>
        <MercadoPublicoV2Nav />
      </I18nProvider>
    </MemoryRouter>,
  );

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
    expect(mockStartSync).not.toHaveBeenCalled();
    expect(screen.getByText('Confirma esta actualización')).toBeVisible();
    await user.click(
      screen.getByTestId('mercado-publico-v2-refresh-confirm-start'),
    );

    const input = mockStartSync.mock.calls[0][0].variables.input;

    expect(input).toEqual({
      idempotencyKey: expect.any(String),
      confirmed: true,
    });
    expect(input).not.toHaveProperty('maxPages');
  });

  it('starts a refresh with the selected page limit', async () => {
    const user = userEvent.setup();

    renderControl();

    await user.click(screen.getByRole('button', { name: /Actualizar datos/ }));
    await user.selectOptions(
      screen.getByLabelText('Páginas de fuente por ejecución'),
      '10',
    );
    await user.click(screen.getByTestId('mercado-publico-v2-refresh-start'));
    await user.click(
      screen.getByTestId('mercado-publico-v2-refresh-confirm-start'),
    );

    expect(mockStartSync.mock.calls[0][0].variables.input).toEqual({
      idempotencyKey: expect.any(String),
      confirmed: true,
      maxPages: 10,
    });
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

    expect(stages[0]).toHaveTextContent('Buscar cambiosCompletado');
    expect(stages[1]).toHaveTextContent('Descargar detallesProcesando…');
    expect(stages[1]).toHaveAttribute('aria-current', 'step');
    expect(stages[2]).toHaveTextContent('Actualizar datosPendiente');
    expect(stages[3]).toHaveTextContent('VerificarPendiente');
    expect(
      screen.getByTestId('mercado-publico-v2-refresh-status'),
    ).toHaveAttribute('aria-live', 'polite');
    expect(
      screen.getByRole('heading', { name: 'Actividad' }).closest('section'),
    ).toHaveTextContent('Ejecución preparada');
    expect(screen.getByText(/Última actualización/)).toBeVisible();
    expect(
      screen.queryByLabelText('Páginas de fuente por ejecución'),
    ).not.toBeInTheDocument();
  });

  it('keeps keyboard focus inside the refresh modal', async () => {
    const user = userEvent.setup();

    renderControl();
    await user.click(screen.getByRole('button', { name: /Actualizar datos/ }));

    const dialog = screen.getByRole('dialog', {
      name: 'Actualizar Mercado Público',
    });

    await waitFor(() =>
      expect(
        screen.getByTestId('mercado-publico-v2-refresh-close'),
      ).toHaveFocus(),
    );
    expect(dialog).toHaveAttribute('data-base-ui-focusable');
    expect(
      document.querySelector('[data-base-ui-focus-guard][data-type="inside"]'),
    ).toBeInTheDocument();
  });

  it('keeps workspace mounted during background polling', async () => {
    const user = userEvent.setup();
    const knownData = makeData(makeRun());
    queryResult = { ...queryResult, data: knownData };
    const { rerenderControl } = renderControl();

    await user.click(screen.getByRole('button', { name: /Actualizando/ }));

    queryResult = {
      ...queryResult,
      data: undefined,
      previousData: knownData,
      loading: true,
    };
    rerenderControl();

    expect(screen.getByRole('heading', { name: 'Actividad' })).toBeVisible();
    expect(
      screen.getByRole('button', { name: /Abrir centro de control/ }),
    ).toBeVisible();
    expect(screen.getByText(/La actualización continúa/)).toBeVisible();
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
    expect(
      screen.getByTestId('mercado-publico-v2-refresh-status'),
    ).toBeVisible();

    queryResult = {
      ...queryResult,
      data: undefined,
      previousData: knownData,
      error: new Error('network unavailable'),
    };
    rerenderControl();

    expect(
      screen.getByText(
        'No se pudo actualizar el monitoreo. Mostrando el último estado conocido.',
      ),
    ).toBeVisible();
    expect(screen.getByText('Descargando detalles')).toBeVisible();
    expect(screen.getByText(/Última actualización/)).toBeVisible();
  });

  it('renders only known completed stages for an incomplete run', async () => {
    const user = userEvent.setup();
    queryResult = {
      ...queryResult,
      data: makeData(
        makeRun({
          safeStatus: 'partial_failed',
          recordsFailed: 2,
        }),
      ),
    };

    renderControl();
    await user.click(screen.getByRole('button', { name: /Actualizar datos/ }));

    const stages = within(
      screen.getByRole('list', { name: 'Progreso de actualización' }),
    ).getAllByRole('listitem');
    expect(stages[0]).toHaveTextContent('Buscar cambiosCompletado');
    expect(stages[1]).toHaveTextContent('Descargar detallesNo verificado');
    expect(stages[2]).toHaveTextContent('Actualizar datosNo verificado');
    expect(stages[3]).toHaveTextContent('VerificarNo verificado');
    expect(
      screen.getByRole('button', { name: /Abrir centro de control/ }),
    ).toBeVisible();
  });

  it('shows next-run configuration after success', async () => {
    const user = userEvent.setup();
    queryResult = {
      ...queryResult,
      data: makeData(makeRun({ safeStatus: 'succeeded' })),
    };

    renderControl();
    await user.click(screen.getByRole('button', { name: /Actualizar datos/ }));

    expect(
      screen.getByLabelText('Páginas de fuente por ejecución'),
    ).toBeVisible();
    expect(
      screen.getByRole('option', { name: 'Sin límite de páginas' }),
    ).toBeVisible();
  });

  it('shows four recent events and expands persisted activity', async () => {
    const user = userEvent.setup();
    queryResult = {
      ...queryResult,
      data: makeData(
        makeRun({
          timeline: [
            'command_created',
            'run_created',
            'dispatched',
            'claimed',
            'unknown_event',
          ].map((eventType, index) => ({
            eventType,
            at: `2026-08-28T18:4${index}:00.000Z`,
            operatorName: index === 4 ? null : 'Sistema de prueba',
          })),
        }),
      ),
    };

    renderControl();
    await user.click(screen.getByRole('button', { name: /Actualizando/ }));

    const activity = screen
      .getByRole('heading', {
        name: 'Actividad',
      })
      .closest('section');

    expect(within(activity!).getAllByRole('listitem')).toHaveLength(4);
    expect(activity).toHaveTextContent('Actividad registrada');
    expect(activity).not.toHaveTextContent('unknown_event');
    await user.click(
      within(activity!).getByRole('button', {
        name: 'Mostrar toda',
      }),
    );
    expect(within(activity!).getAllByRole('listitem')).toHaveLength(5);
    expect(
      within(activity!).getByRole('button', { name: 'Mostrar menos' }),
    ).toHaveAttribute('aria-expanded', 'true');
  });

  it('does not report a successful start as failed when status refresh fails', async () => {
    const user = userEvent.setup();

    mockRefetch
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(new Error('offline'));

    renderControl();
    await user.click(screen.getByRole('button', { name: /Actualizar datos/ }));
    await user.click(screen.getByTestId('mercado-publico-v2-refresh-start'));
    await user.click(
      screen.getByTestId('mercado-publico-v2-refresh-confirm-start'),
    );

    await waitFor(() => expect(mockStartSync).toHaveBeenCalledTimes(1));
    expect(
      screen.queryByText(/No se pudo iniciar la actualización/),
    ).not.toBeInTheDocument();
  });

  it('shows the queued stage while a start request is pending', async () => {
    const user = userEvent.setup();

    mockedUseMutation.mockReturnValue([mockStartSync, { loading: true }]);

    renderControl();
    await user.click(screen.getByRole('button', { name: /Actualizar datos/ }));

    expect(screen.getByRole('status')).toHaveTextContent(
      'Preparando actualización',
    );
    expect(
      within(
        screen.getByRole('list', { name: 'Progreso de actualización' }),
      ).getAllByRole('listitem')[0],
    ).toHaveAttribute('aria-current', 'step');
  });

  it('offers direct resume when the backend allows it', async () => {
    const user = userEvent.setup();
    mockedUseMutation.mockImplementation(
      (operation: {
        definitions: readonly {
          name?: { value?: string };
        }[];
      }) =>
        operation.definitions[0]?.name?.value === 'MercadoPublicoV2ResumeSync'
          ? [mockResumeSync, { loading: false }]
          : [mockStartSync, { loading: false }],
    );
    queryResult = {
      ...queryResult,
      data: makeData(
        makeRun({
          safeStatus: 'partial_failed',
          canResume: true,
          discoveryComplete: false,
        }),
      ),
    };

    renderControl();
    await user.click(screen.getByRole('button', { name: /Actualizar datos/ }));
    await user.click(screen.getByTestId('mercado-publico-v2-refresh-resume'));

    expect(mockResumeSync).toHaveBeenCalledWith({
      variables: { input: { idempotencyKey: expect.any(String) } },
    });
  });

  it('shows observability attempts and confirms cancellation', async () => {
    const user = userEvent.setup();

    mockedUseMutation.mockImplementation(
      (operation: {
        definitions: readonly { name?: { value?: string } }[];
      }) => {
        const operationName = operation.definitions[0]?.name?.value;

        if (operationName === 'MercadoPublicoV2CancelSync') {
          return [mockCancelSync, { loading: false }];
        }

        return [mockStartSync, { loading: false }];
      },
    );
    queryResult = {
      ...queryResult,
      data: makeData(
        makeRun({
          httpAttempts: [
            {
              at: '2026-08-28T18:44:00.000Z',
              endpoint: '/compra-agil',
              httpStatus: 429,
              latencyMs: 212,
              attemptNumber: 1,
              retryable: true,
              failureClass: 'rate_limit',
            },
          ],
        }),
      ),
    };

    renderControl();
    await user.click(screen.getByRole('button', { name: /Actualizando/ }));
    await user.click(screen.getByRole('tab', { name: 'Observabilidad' }));

    expect(screen.getByRole('columnheader', { name: 'HTTP' })).toBeVisible();
    expect(screen.getByText('/compra-agil')).toBeVisible();
    expect(screen.getByText('Reintento')).toBeVisible();

    await user.click(screen.getByTestId('mercado-publico-v2-refresh-cancel'));
    expect(screen.getByText('Confirma la cancelación')).toBeVisible();
    await user.click(
      screen.getByTestId('mercado-publico-v2-refresh-confirm-cancel'),
    );

    expect(mockCancelSync).toHaveBeenCalledWith({
      variables: {
        input: { confirmed: true, idempotencyKey: expect.any(String) },
      },
    });
  });

  it('keeps synchronization out of Mercado Publico navigation', () => {
    renderNav();

    expect(screen.queryByText('Sincronización')).not.toBeInTheDocument();
    expect(screen.getByText('Procesos')).toBeVisible();
    expect(screen.getByText('Compradores')).toBeVisible();
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
