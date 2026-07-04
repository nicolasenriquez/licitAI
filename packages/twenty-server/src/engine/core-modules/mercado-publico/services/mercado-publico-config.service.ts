import { Injectable } from '@nestjs/common';

import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';

export type MercadoPublicoRuntimeConfig = {
  apiTicket?: string;
  compraAgilApiTicket?: string;
  apiV1BaseUrl?: string;
  compraAgilApiBaseUrl?: string;
  httpTimeoutMs: number;
  httpMaxRetries: number;
  httpRetryBackoffMs: number;
  quotaTimezone: string;
  apiDailyLimit: number;
  csvStorageRoot?: string;
  csvOrdenesDeCompraSourceUrl?: string;
  csvLicitacionesSourceUrl?: string;
  csvDownloadEnabled: boolean;
};

@Injectable()
export class MercadoPublicoConfigService {
  constructor(private readonly twentyConfigService: TwentyConfigService) {}

  getSettings(): MercadoPublicoRuntimeConfig {
    return {
      apiTicket: this.twentyConfigService.get('MERCADO_PUBLICO_API_TICKET'),
      compraAgilApiTicket: this.twentyConfigService.get(
        'COMPRA_AGIL_API_TICKET',
      ),
      apiV1BaseUrl: this.twentyConfigService.get(
        'MERCADO_PUBLICO_API_V1_BASE_URL',
      ),
      compraAgilApiBaseUrl: this.twentyConfigService.get(
        'COMPRA_AGIL_API_BASE_URL',
      ),
      httpTimeoutMs: this.twentyConfigService.get(
        'MERCADO_PUBLICO_HTTP_TIMEOUT_MS',
      ),
      httpMaxRetries: this.twentyConfigService.get(
        'MERCADO_PUBLICO_HTTP_MAX_RETRIES',
      ),
      httpRetryBackoffMs: this.twentyConfigService.get(
        'MERCADO_PUBLICO_HTTP_RETRY_BACKOFF_MS',
      ),
      quotaTimezone: this.twentyConfigService.get(
        'MERCADO_PUBLICO_QUOTA_TIMEZONE',
      ),
      apiDailyLimit: this.twentyConfigService.get(
        'MERCADO_PUBLICO_API_DAILY_LIMIT',
      ),
      csvStorageRoot: this.twentyConfigService.get(
        'MERCADO_PUBLICO_CSV_STORAGE_ROOT',
      ),
      csvOrdenesDeCompraSourceUrl: this.twentyConfigService.get(
        'MERCADO_PUBLICO_CSV_OC_SOURCE_URL',
      ),
      csvLicitacionesSourceUrl: this.twentyConfigService.get(
        'MERCADO_PUBLICO_CSV_LICITACIONES_SOURCE_URL',
      ),
      csvDownloadEnabled: this.twentyConfigService.get(
        'MERCADO_PUBLICO_CSV_DOWNLOAD_ENABLED',
      ),
    };
  }
}
