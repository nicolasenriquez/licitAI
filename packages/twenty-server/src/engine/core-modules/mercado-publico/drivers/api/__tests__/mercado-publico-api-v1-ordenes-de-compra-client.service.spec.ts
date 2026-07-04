import { MercadoPublicoApiV1OrdenesDeCompraClientService } from 'src/engine/core-modules/mercado-publico/drivers/api/mercado-publico-api-v1-ordenes-de-compra-client.service';

describe('MercadoPublicoApiV1OrdenesDeCompraClientService', () => {
  let service: MercadoPublicoApiV1OrdenesDeCompraClientService;
  let mockConfigService: {
    getSettings: jest.Mock;
  };
  let mockSecureHttpClientService: {
    getHttpClient: jest.Mock;
  };
  let mockQuotaTracker: {
    record429: jest.Mock;
  };

  const validSettings = {
    apiTicket: 'test-ticket',
    apiV1BaseUrl: 'https://api.mercadopublico.cl/',
    httpTimeoutMs: 30000,
    httpMaxRetries: 3,
    httpRetryBackoffMs: 1000,
    quotaTimezone: 'America/Santiago',
    csvDownloadEnabled: false,
  };

  const mockHttpClient = {
    get: jest.fn(),
  };

  beforeEach(() => {
    mockConfigService = {
      getSettings: jest.fn().mockReturnValue(validSettings),
    };

    mockSecureHttpClientService = {
      getHttpClient: jest.fn().mockReturnValue(mockHttpClient),
    };

    mockQuotaTracker = {
      record429: jest.fn(),
    };

    service = new MercadoPublicoApiV1OrdenesDeCompraClientService(
      mockConfigService as never,
      mockSecureHttpClientService as never,
      mockQuotaTracker as never,
    );

    jest.clearAllMocks();
  });

  describe('getByDate', () => {
    it('should throw when API ticket is not configured', async () => {
      mockConfigService.getSettings.mockReturnValue({
        ...validSettings,
        apiTicket: '',
      });

      await expect(service.getByDate(new Date('2026-06-15'))).rejects.toThrow(
        'MERCADO_PUBLICO_API_TICKET is not configured',
      );
    });

    it('should throw when base URL is not configured', async () => {
      mockConfigService.getSettings.mockReturnValue({
        ...validSettings,
        apiV1BaseUrl: '',
      });

      await expect(service.getByDate(new Date('2026-06-15'))).rejects.toThrow(
        'MERCADO_PUBLICO_API_V1_BASE_URL is not configured',
      );
    });

    it('should fetch OC by date and return formatted response', async () => {
      mockHttpClient.get.mockResolvedValue({
        status: 200,
        data: {
          Listado: [
            { Codigo: 'OC-1', Estado: 'Aceptada' },
            { Codigo: 'OC-2' },
          ],
        },
      });

      const result = await service.getByDate(new Date('2026-06-15'));

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        'https://api.mercadopublico.cl/servicios/v1/publico/ordenesdecompra.json',
        {
          params: expect.objectContaining({
            fecha: '15062026',
            ticket: 'test-ticket',
          }),
        },
      );

      expect(result.endpoint).toBe('by-date');
      expect(result.source).toBe('api-v1-oc');
      expect(result.requestParams).toEqual({ fecha: '15062026' });
      expect(result.ordenesDeCompra).toHaveLength(2);
      expect(result.ordenesDeCompra[0].Codigo).toBe('OC-1');
      expect(result.httpStatus).toBe(200);
      expect(result.errorSummary).toBeUndefined();
    });

    it('should classify 404 as soft_miss error', async () => {
      mockHttpClient.get.mockResolvedValue({
        status: 404,
        data: {},
      });

      const result = await service.getByDate(new Date('2026-06-15'));

      expect(result.errorSummary).toBe('soft_miss');
      expect(result.ordenesDeCompra).toHaveLength(0);
    });

    it('should classify 500/503 as retryable_failed', async () => {
      mockHttpClient.get.mockResolvedValue({
        status: 500,
        data: {},
      });

      const result = await service.getByDate(new Date('2026-06-15'));

      expect(result.errorSummary).toBe('retryable_failed');
    });

    it('should resolve normally when quota settings lookup throws during 429 tracking', async () => {
      mockHttpClient.get.mockResolvedValue({
        status: 429,
        data: {},
      });

      mockConfigService.getSettings
        .mockReturnValueOnce(validSettings)
        .mockImplementationOnce(() => {
          throw new Error('settings unavailable');
        });

      await expect(service.getByDate(new Date('2026-06-15'))).resolves.toMatchObject({
        httpStatus: 429,
        errorSummary: 'retryable_failed',
      });
      expect(mockQuotaTracker.record429).not.toHaveBeenCalled();
    });
  });

  describe('getByEstado', () => {
    it('should request V1 OC by estado', async () => {
      mockHttpClient.get.mockResolvedValue({
        status: 200,
        data: {
          Listado: [
            { Codigo: 'OC-1', CodigoEstado: 6, Estado: 'Aceptada' },
          ],
        },
      });

      const result = await service.getByEstado('6');

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        'https://api.mercadopublico.cl/servicios/v1/publico/ordenesdecompra.json',
        {
          params: {
            estado: '6',
            ticket: 'test-ticket',
          },
        },
      );
      expect(result.requestParams.estado).toBe('6');
      expect(result.endpoint).toBe('by-state');
      expect(result.ordenesDeCompra).toHaveLength(1);
      expect(result.errorSummary).toBeUndefined();
    });
  });
});
