import { type AxiosInstance } from 'axios';

import { MercadoPublicoApiV1LicitacionesClientService } from 'src/engine/core-modules/mercado-publico/drivers/api/mercado-publico-api-v1-licitaciones-client.service';
import { MercadoPublicoConfigService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-config.service';
import { MercadoPublicoQuotaTrackerService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-quota-tracker.service';
import { SecureHttpClientService } from 'src/engine/core-modules/secure-http-client/secure-http-client.service';

describe('MercadoPublicoApiV1LicitacionesClientService', () => {
  const mockHttpClient = {
    get: jest.fn(),
  } as unknown as jest.Mocked<AxiosInstance>;

  const mockMercadoPublicoConfigService = {
    getSettings: jest.fn().mockReturnValue({
      apiTicket: 'fake-ticket',
      apiV1BaseUrl: 'https://api.mercadopublico.cl',
      httpTimeoutMs: 30_000,
      httpMaxRetries: 3,
      httpRetryBackoffMs: 1_000,
      quotaTimezone: 'America/Santiago',
      csvDownloadEnabled: false,
    }),
  } as unknown as jest.Mocked<MercadoPublicoConfigService>;

  const mockSecureHttpClientService = {
    getHttpClient: jest.fn().mockReturnValue(mockHttpClient),
  } as unknown as jest.Mocked<SecureHttpClientService>;

  const mockQuotaTracker = {
    record429: jest.fn(),
  } as unknown as jest.Mocked<MercadoPublicoQuotaTrackerService>;

  const service = new MercadoPublicoApiV1LicitacionesClientService(
    mockMercadoPublicoConfigService,
    mockSecureHttpClientService,
    mockQuotaTracker,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should request V1 licitaciones by date using ddmmaaaa params', async () => {
    mockHttpClient.get.mockResolvedValue({
      status: 200,
      data: {
        Listado: [
          {
            CodigoExterno: 'L1',
            CodigoEstado: 5,
            Estado: 'Publicada',
          },
        ],
      },
    });

    const response = await service.getByDate(new Date(Date.UTC(2026, 5, 15)));

    expect(mockSecureHttpClientService.getHttpClient).toHaveBeenCalledWith({
      timeout: 30_000,
      validateStatus: expect.any(Function),
    });
    expect(mockHttpClient.get).toHaveBeenCalledWith(
      'https://api.mercadopublico.cl/servicios/v1/publico/licitaciones.json',
      {
        params: {
          fecha: '15062026',
          ticket: 'fake-ticket',
        },
      },
    );
    expect(response.requestParams.fecha).toBe('15062026');
    expect(response.licitaciones).toHaveLength(1);
    expect(response.errorSummary).toBeUndefined();
  });

  it('should flag body error when API returns invalid ticket payload', async () => {
    mockHttpClient.get.mockResolvedValue({
      status: 200,
      data: {
        Codigo: 203,
        Mensaje: 'Ticket no válido.',
      },
    });

    const response = await service.getByDate(new Date(Date.UTC(2026, 5, 15)));

    expect(response.licitaciones).toHaveLength(0);
    expect(response.errorSummary).toBe('hard_fail');
    expect(response.errorCode).toBe('203');
    expect(response.errorMessage).toBe('Ticket no válido.');
  });

  it('should request V1 licitaciones by estado', async () => {
    mockHttpClient.get.mockResolvedValue({
      status: 200,
      data: {
        Listado: [
          { CodigoExterno: 'L1', CodigoEstado: 5, Estado: 'Publicada' },
        ],
      },
    });

    const response = await service.getByEstado('5');

    expect(mockHttpClient.get).toHaveBeenCalledWith(
      'https://api.mercadopublico.cl/servicios/v1/publico/licitaciones.json',
      {
        params: {
          estado: '5',
          ticket: 'fake-ticket',
        },
      },
    );
    expect(response.requestParams.estado).toBe('5');
    expect(response.endpoint).toBe('by-state');
    expect(response.licitaciones).toHaveLength(1);
    expect(response.errorSummary).toBeUndefined();
  });

  it('should classify 404 as soft_miss for estado endpoint', async () => {
    mockHttpClient.get.mockResolvedValue({
      status: 404,
      data: {},
    });

    const response = await service.getByEstado('999');

    expect(response.errorSummary).toBe('soft_miss');
    expect(response.licitaciones).toHaveLength(0);
  });

  it('should record 429 on quota tracker when rate-limited', async () => {
    mockHttpClient.get.mockResolvedValue({
      status: 429,
      data: {},
    });

    mockMercadoPublicoConfigService.getSettings.mockReturnValue({
      apiTicket: 'fake-ticket',
      apiV1BaseUrl: 'https://api.mercadopublico.cl',
      httpTimeoutMs: 30_000,
      httpMaxRetries: 3,
      httpRetryBackoffMs: 1_000,
      quotaTimezone: 'America/Santiago',
      csvDownloadEnabled: false,
    });

    await service.getByDate(new Date(Date.UTC(2026, 5, 15)));

    expect(mockQuotaTracker.record429).toHaveBeenCalledWith(
      'api-v1-licitaciones',
      'America/Santiago',
    );
  });

  it('should resolve normally when quota settings lookup throws during 429 tracking', async () => {
    mockHttpClient.get.mockResolvedValue({
      status: 429,
      data: {},
    });

    mockMercadoPublicoConfigService.getSettings
      .mockReturnValueOnce({
        apiTicket: 'fake-ticket',
        apiV1BaseUrl: 'https://api.mercadopublico.cl',
        httpTimeoutMs: 30_000,
        httpMaxRetries: 3,
        httpRetryBackoffMs: 1_000,
        quotaTimezone: 'America/Santiago',
        csvDownloadEnabled: false,
      })
      .mockImplementationOnce(() => {
        throw new Error('settings unavailable');
      });

    await expect(
      service.getByDate(new Date(Date.UTC(2026, 5, 15))),
    ).resolves.toMatchObject({
      httpStatus: 429,
      errorSummary: 'retryable_failed',
    });
  });

  it('should not record 429 when status is 200', async () => {
    mockHttpClient.get.mockResolvedValue({
      status: 200,
      data: {
        Listado: [{ CodigoExterno: 'L1' }],
      },
    });

    await service.getByDate(new Date(Date.UTC(2026, 5, 15)));

    expect(mockQuotaTracker.record429).not.toHaveBeenCalled();
  });
});
