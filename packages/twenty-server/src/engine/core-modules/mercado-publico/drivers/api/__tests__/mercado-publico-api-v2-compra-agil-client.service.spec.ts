import { MercadoPublicoApiV2CompraAgilClientService } from 'src/engine/core-modules/mercado-publico/drivers/api/mercado-publico-api-v2-compra-agil-client.service';

describe('MercadoPublicoApiV2CompraAgilClientService', () => {
  let service: MercadoPublicoApiV2CompraAgilClientService;
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
    compraAgilApiTicket: 'test-v2-ticket',
    compraAgilApiBaseUrl: 'https://api2.mercadopublico.cl/',
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

    service = new MercadoPublicoApiV2CompraAgilClientService(
      mockConfigService as never,
      mockSecureHttpClientService as never,
      mockQuotaTracker as never,
    );

    jest.clearAllMocks();
  });

  describe('getList', () => {
    it('should throw when COMPRA_AGIL_API_TICKET is not configured', async () => {
      mockConfigService.getSettings.mockReturnValue({
        ...validSettings,
        compraAgilApiTicket: '',
      });

      await expect(service.getList({})).rejects.toThrow(
        'COMPRA_AGIL_API_TICKET is not configured',
      );
    });

    it('should throw when COMPRA_AGIL_API_BASE_URL is not configured', async () => {
      mockConfigService.getSettings.mockReturnValue({
        ...validSettings,
        compraAgilApiBaseUrl: '',
      });

      await expect(service.getList({})).rejects.toThrow(
        'COMPRA_AGIL_API_BASE_URL is not configured',
      );
    });

    it('should throw when tamano_pagina exceeds 50', async () => {
      await expect(service.getList({ tamano_pagina: 51 })).rejects.toThrow(
        'Compra Agil V2 list params invalid',
      );
    });

    it.each([1, 9])(
      'should reject tamano_pagina=%s before making an upstream request',
      async (tamanoPagina) => {
        await expect(
          service.getList({ tamano_pagina: tamanoPagina }),
        ).rejects.toThrow('Compra Agil V2 list params invalid');

        expect(mockHttpClient.get).not.toHaveBeenCalled();
      },
    );

    it('should throw when id and q are both provided', async () => {
      await expect(service.getList({ id: 'X', q: 'Y' })).rejects.toThrow(
        'Compra Agil V2 list params invalid',
      );
    });

    it('should reject mutually exclusive change filters before the upstream request', async () => {
      await expect(
        service.getList({
          ttl_cambio_ms: 5000,
          cambio_desde: '2026-06-01T00:00:00Z',
          cambio_hasta: '2026-06-30T23:59:59Z',
        }),
      ).rejects.toThrow('Compra Agil V2 list params invalid');

      expect(mockHttpClient.get).not.toHaveBeenCalled();
    });

    it('should reject incomplete date ranges before the upstream request', async () => {
      await expect(
        service.getList({ publicado_desde: '2026-06-01T00:00:00Z' }),
      ).rejects.toThrow('Compra Agil V2 list params invalid');

      expect(mockHttpClient.get).not.toHaveBeenCalled();
    });

    it('should reject non-official ordering values before the upstream request', async () => {
      await expect(
        service.getList({ ordenar_por: 'created_at' }),
      ).rejects.toThrow('Compra Agil V2 list params invalid');

      expect(mockHttpClient.get).not.toHaveBeenCalled();
    });

    it('should fetch list and return formatted response', async () => {
      mockHttpClient.get.mockResolvedValue({
        status: 200,
        data: {
          Items: [
            {
              codigo: 'CA-1',
              estado: 'publicada',
              region: 13,
            },
          ],
        },
      });

      const result = await service.getList({});

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        'https://api2.mercadopublico.cl/v2/compra-agil',
        {
          headers: { ticket: 'test-v2-ticket' },
          params: { tamano_pagina: 15, numero_pagina: 1 },
        },
      );

      expect(result.endpoint).toBe('list');
      expect(result.source).toBe('api-v2-compra-agil');
      expect(result.compraAgil).toHaveLength(1);
      expect(result.compraAgil[0].codigo).toBe('CA-1');
      expect(result.httpStatus).toBe(200);
      expect(result.errorSummary).toBeUndefined();
    });

    it('should classify 404 as soft_miss error', async () => {
      mockHttpClient.get.mockResolvedValue({
        status: 404,
        data: {},
      });

      const result = await service.getList({});

      expect(result.errorSummary).toBe('soft_miss');
      expect(result.compraAgil).toHaveLength(0);
    });

    it('should classify 500 as retryable_failed', async () => {
      mockHttpClient.get.mockResolvedValue({
        status: 500,
        data: {},
      });

      const result = await service.getList({});

      expect(result.errorSummary).toBe('retryable_failed');
    });

    it('should retain Retry-After seconds without retaining response headers', async () => {
      mockHttpClient.get.mockResolvedValue({
        status: 429,
        headers: { 'retry-after': '120' },
        data: {},
      });

      const result = await service.getList({});

      expect(result).toMatchObject({
        httpStatus: 429,
        retryAfterSeconds: 120,
      });
      expect(result).not.toHaveProperty('headers');
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

      await expect(service.getList({})).resolves.toMatchObject({
        httpStatus: 429,
        errorSummary: 'retryable_failed',
      });
      expect(mockQuotaTracker.record429).not.toHaveBeenCalled();
    });
  });

  describe('getByCodigo', () => {
    it('should throw when ticket is not configured', async () => {
      mockConfigService.getSettings.mockReturnValue({
        ...validSettings,
        compraAgilApiTicket: '',
      });

      await expect(service.getByCodigo('CA-1')).rejects.toThrow(
        'COMPRA_AGIL_API_TICKET is not configured',
      );
    });

    it('should throw when codigo is empty', async () => {
      await expect(service.getByCodigo('')).rejects.toThrow(
        'codigo must be a non-empty string',
      );
    });

    it('should fetch detail by codigo with path segment URL', async () => {
      mockHttpClient.get.mockResolvedValue({
        status: 200,
        data: {
          codigo: 'CA-1',
          estado: 'cerrada',
          orden_compra: {
            id_orden_compra: 'OC-123',
          },
        },
      });

      const result = await service.getByCodigo('CA-1');

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        'https://api2.mercadopublico.cl/v2/compra-agil/CA-1',
        {
          headers: { ticket: 'test-v2-ticket' },
        },
      );

      expect(result.endpoint).toBe('detail-by-codigo');
      expect(result.source).toBe('api-v2-compra-agil');
      expect(result.requestParams).toEqual({ codigo: 'CA-1' });
      expect(result.compraAgil).toHaveLength(1);
      expect(result.compraAgil[0].codigo).toBe('CA-1');
      expect(result.compraAgil[0].orden_compra?.id_orden_compra).toBe('OC-123');
      expect(result.errorSummary).toBeUndefined();
    });
  });
});
