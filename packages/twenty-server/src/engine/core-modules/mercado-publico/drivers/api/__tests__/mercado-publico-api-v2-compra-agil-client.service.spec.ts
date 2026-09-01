import { AxiosError } from 'axios';

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

    it('should throw when id and q are both provided', async () => {
      await expect(service.getList({ id: 'X', q: 'Y' })).rejects.toThrow(
        'Compra Agil V2 list params invalid',
      );
    });

    it('should fetch list and return formatted response', async () => {
      mockHttpClient.get.mockResolvedValue({
        status: 200,
        data: {
          payload: {
            items: [
              {
                codigo: 'CA-1',
                estado: 'publicada',
                region: 13,
              },
            ],
          },
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
      expect(result).toMatchObject({
        recordsFetched: 1,
        recordsAccepted: 1,
        recordsRejected: 0,
        contractIssues: [],
      });
    });

    it('returns all 50 records from a valid LIST envelope', async () => {
      mockHttpClient.get.mockResolvedValue({
        status: 200,
        data: {
          payload: {
            items: Array.from({ length: 50 }, (_, index) => ({
              codigo: `CA-${index + 1}`,
            })),
          },
        },
      });

      const result = await service.getList({ tamano_pagina: 50 });

      expect(result.compraAgil).toHaveLength(50);
      expect(result.errorSummary).toBeUndefined();
    });

    it('fails the complete LIST contract and retains raw when one item is invalid', async () => {
      const rawPayload = {
        payload: {
          items: [{ codigo: 'CA-1' }, { invalid: true }, { codigo: 'CA-3' }],
        },
      };

      mockHttpClient.get.mockResolvedValue({ status: 200, data: rawPayload });

      const result = await service.getList({});

      expect(result.compraAgil).toEqual([]);
      expect(result.errorSummary).toBe('hard_fail');
      expect(result.errorCode).toBe('invalid_list_items');
      expect(result.errorMessage).toContain('invalidIndices=[1]');
      expect(result.rawPayload).toBe(rawPayload);
      expect(result).toMatchObject({
        recordsFetched: 3,
        recordsAccepted: 0,
        recordsRejected: 3,
        contractIssues: [
          { code: 'invalid_field', indices: [1], paths: ['[1].codigo'] },
        ],
      });
    });

    it.each(['NOK', 'ERROR'])(
      'classifies a %s envelope as a provider error instead of contract drift',
      async (success) => {
        mockHttpClient.get.mockResolvedValue({
          status: 200,
          data: {
            success,
            payload: null,
            errors: [
              { codigo: 'PROVIDER-1', mensaje: 'Provider rejected request' },
            ],
          },
        });

        const result = await service.getList({});

        expect(result).toMatchObject({
          compraAgil: [],
          errorSummary: 'hard_fail',
          errorCode: 'PROVIDER-1',
          errorMessage: 'Provider rejected request',
        });
      },
    );

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

    it('should classify 504 as retryable_failed', async () => {
      mockHttpClient.get.mockResolvedValue({
        status: 504,
        data: {},
      });

      const result = await service.getList({});

      expect(result.errorSummary).toBe('retryable_failed');
    });

    it('removes request headers from thrown transport errors', async () => {
      const transportError = new AxiosError('request failed', 'ERR_NETWORK', {
        headers: { ticket: 'sentinel-secret-ticket' },
      } as never);

      mockHttpClient.get.mockRejectedValue(transportError);

      const error = await service.getList({}).catch((caught) => caught);

      expect(error).toBeInstanceOf(Error);
      expect(JSON.stringify(error)).not.toContain('sentinel-secret-ticket');
      expect(error).toMatchObject({ code: 'ERR_NETWORK', httpStatus: null });
    });

    it('should resolve normally when quota settings lookup throws during 429 tracking', async () => {
      mockHttpClient.get.mockResolvedValue({
        status: 429,
        data: {},
        headers: { 'retry-after': '120' },
      });

      mockConfigService.getSettings
        .mockReturnValueOnce(validSettings)
        .mockImplementationOnce(() => {
          throw new Error('settings unavailable');
        });

      await expect(service.getList({})).resolves.toMatchObject({
        httpStatus: 429,
        errorSummary: 'retryable_failed',
        retryAfterSeconds: 120,
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
          payload: {
            codigo: 'CA-1',
            estado: 'cerrada',
            orden_compra: {
              id_orden_compra: 'OC-123',
            },
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

    it('rejects an undocumented DETAIL envelope', async () => {
      mockHttpClient.get.mockResolvedValue({
        status: 200,
        data: { data: { codigo: 'CA-1' } },
      });

      const result = await service.getByCodigo('CA-1');

      expect(result.compraAgil).toEqual([]);
      expect(result.errorSummary).toBe('hard_fail');
      expect(result.errorCode).toBe('invalid_detail_envelope');
    });

    it('classifies a DETAIL error envelope as a provider error', async () => {
      mockHttpClient.get.mockResolvedValue({
        status: 200,
        data: {
          success: 'NOK',
          payload: null,
          errors: [{ code: 'NOT-FOUND', message: 'Process unavailable' }],
        },
      });

      const result = await service.getByCodigo('CA-1');

      expect(result).toMatchObject({
        compraAgil: [],
        errorSummary: 'hard_fail',
        errorCode: 'NOT-FOUND',
        errorMessage: 'Process unavailable',
      });
    });
  });
});
