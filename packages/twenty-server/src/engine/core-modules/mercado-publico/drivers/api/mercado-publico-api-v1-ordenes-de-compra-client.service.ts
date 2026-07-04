import { Injectable, Logger } from '@nestjs/common';

import { isNonEmptyString } from '@sniptt/guards';

import { type MercadoPublicoApiV1OrdenDeCompraRecord } from 'src/engine/core-modules/mercado-publico/drivers/api/types/mercado-publico-api-v1-orden-de-compra-record.type';
import {
  createJsonShapeSha256,
  createJsonSha256,
} from 'src/engine/core-modules/mercado-publico/drivers/api/utils/create-json-sha256.util';
import { extractV1OrdenesDeCompraListRecords } from 'src/engine/core-modules/mercado-publico/drivers/api/utils/extract-v1-ordenes-de-compra-list-records.util';
import { formatV1Date } from 'src/engine/core-modules/mercado-publico/drivers/api/utils/format-v1-date.util';
import { classifyMercadoPublicoHttpStatus } from 'src/engine/core-modules/mercado-publico/drivers/api/utils/classify-mercado-publico-http-status.util';
import { parseMercadoPublicoBodyError } from 'src/engine/core-modules/mercado-publico/drivers/api/utils/parse-mercado-publico-body-error.util';
import {
  MERCADO_PUBLICO_API_V1_OC_BY_DATE_ENDPOINT,
  MERCADO_PUBLICO_API_V1_OC_BY_STATE_ENDPOINT,
  MERCADO_PUBLICO_API_V1_OC_DETAIL_BY_CODIGO_ENDPOINT,
  MERCADO_PUBLICO_API_V1_OC_PATH,
  MERCADO_PUBLICO_API_V1_OC_SOURCE,
  type MercadoPublicoErrorSummary,
} from 'src/engine/core-modules/mercado-publico/mercado-publico.constants';
import { MercadoPublicoConfigService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-config.service';
import { MercadoPublicoQuotaTrackerService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-quota-tracker.service';
import { SecureHttpClientService } from 'src/engine/core-modules/secure-http-client/secure-http-client.service';

export type MercadoPublicoApiV1OcByDateResponse = {
  endpoint: string;
  source: typeof MERCADO_PUBLICO_API_V1_OC_SOURCE;
  requestParams: Record<string, string>;
  requestFingerprint: string;
  payloadChecksum: string;
  schemaFingerprint: string;
  httpStatus: number;
  fetchedAt: Date;
  rawPayload: unknown;
  ordenesDeCompra: MercadoPublicoApiV1OrdenDeCompraRecord[];
  errorSummary?: MercadoPublicoErrorSummary;
  errorMessage?: string;
  errorCode?: string;
};

const ensureTrailingSlash = (value: string): string => {
  return value.endsWith('/') ? value : `${value}/`;
};

@Injectable()
export class MercadoPublicoApiV1OrdenesDeCompraClientService {
  private readonly logger = new Logger(
    MercadoPublicoApiV1OrdenesDeCompraClientService.name,
  );

  constructor(
    private readonly mercadoPublicoConfigService: MercadoPublicoConfigService,
    private readonly secureHttpClientService: SecureHttpClientService,
    private readonly quotaTracker: MercadoPublicoQuotaTrackerService,
  ) {}

  async getByDate(
    requestedDate: Date,
  ): Promise<MercadoPublicoApiV1OcByDateResponse> {
    const settings = this.mercadoPublicoConfigService.getSettings();

    if (!isNonEmptyString(settings.apiTicket)) {
      throw new Error('MERCADO_PUBLICO_API_TICKET is not configured');
    }

    if (!isNonEmptyString(settings.apiV1BaseUrl)) {
      throw new Error('MERCADO_PUBLICO_API_V1_BASE_URL is not configured');
    }

    const formattedDate = formatV1Date(requestedDate);
    const requestParams = { fecha: formattedDate };
    const endpointUrl = new URL(
      MERCADO_PUBLICO_API_V1_OC_PATH,
      ensureTrailingSlash(settings.apiV1BaseUrl),
    ).toString();
    const fetchedAt = new Date();

    this.logger.log(`Fetching V1 ordenes de compra by date ${formattedDate}`);

    const httpClient = this.secureHttpClientService.getHttpClient({
      timeout: settings.httpTimeoutMs,
      validateStatus: () => true,
    });

    const response = await httpClient.get<unknown>(endpointUrl, {
      params: {
        ...requestParams,
        ticket: settings.apiTicket,
      },
    });

    const rawPayload = response.data;
    const ordenesDeCompra = extractV1OrdenesDeCompraListRecords(rawPayload);
    const bodyError = parseMercadoPublicoBodyError(rawPayload);
    const httpStatusErrorSummary = classifyMercadoPublicoHttpStatus(
      response.status,
    );
    this.tryRecord429(response.status);

    return {
      endpoint: MERCADO_PUBLICO_API_V1_OC_BY_DATE_ENDPOINT,
      source: MERCADO_PUBLICO_API_V1_OC_SOURCE,
      requestParams,
      requestFingerprint: createJsonSha256(requestParams),
      payloadChecksum: createJsonSha256(rawPayload),
      schemaFingerprint: createJsonShapeSha256(rawPayload),
      httpStatus: response.status,
      fetchedAt,
      rawPayload,
      ordenesDeCompra,
      errorSummary: bodyError?.errorSummary ?? httpStatusErrorSummary,
      errorMessage: bodyError?.message,
      errorCode: bodyError?.code ?? undefined,
    };
  }

  async getByEstado(
    estado: string,
  ): Promise<MercadoPublicoApiV1OcByDateResponse> {
    const settings = this.mercadoPublicoConfigService.getSettings();

    if (!isNonEmptyString(settings.apiTicket)) {
      throw new Error('MERCADO_PUBLICO_API_TICKET is not configured');
    }

    if (!isNonEmptyString(settings.apiV1BaseUrl)) {
      throw new Error('MERCADO_PUBLICO_API_V1_BASE_URL is not configured');
    }

    const requestParams = { estado };
    const endpointUrl = new URL(
      MERCADO_PUBLICO_API_V1_OC_PATH,
      ensureTrailingSlash(settings.apiV1BaseUrl),
    ).toString();
    const fetchedAt = new Date();

    this.logger.log(`Fetching V1 ordenes de compra by estado ${estado}`);

    const httpClient = this.secureHttpClientService.getHttpClient({
      timeout: settings.httpTimeoutMs,
      validateStatus: () => true,
    });

    const response = await httpClient.get<unknown>(endpointUrl, {
      params: {
        ...requestParams,
        ticket: settings.apiTicket,
      },
    });

    const rawPayload = response.data;
    const ordenesDeCompra = extractV1OrdenesDeCompraListRecords(rawPayload);
    const bodyError = parseMercadoPublicoBodyError(rawPayload);
    const httpStatusErrorSummary = classifyMercadoPublicoHttpStatus(
      response.status,
    );
    this.tryRecord429(response.status);

    return {
      endpoint: MERCADO_PUBLICO_API_V1_OC_BY_STATE_ENDPOINT,
      source: MERCADO_PUBLICO_API_V1_OC_SOURCE,
      requestParams,
      requestFingerprint: createJsonSha256(requestParams),
      payloadChecksum: createJsonSha256(rawPayload),
      schemaFingerprint: createJsonShapeSha256(rawPayload),
      httpStatus: response.status,
      fetchedAt,
      rawPayload,
      ordenesDeCompra,
      errorSummary: bodyError?.errorSummary ?? httpStatusErrorSummary,
      errorMessage: bodyError?.message,
      errorCode: bodyError?.code ?? undefined,
    };
  }

  async getByCodigo(
    codigo: string,
  ): Promise<MercadoPublicoApiV1OcByDateResponse> {
    const settings = this.mercadoPublicoConfigService.getSettings();

    if (!isNonEmptyString(settings.apiTicket)) {
      throw new Error('MERCADO_PUBLICO_API_TICKET is not configured');
    }

    if (!isNonEmptyString(settings.apiV1BaseUrl)) {
      throw new Error('MERCADO_PUBLICO_API_V1_BASE_URL is not configured');
    }

    const requestParams = { codigo };
    const endpointUrl = new URL(
      MERCADO_PUBLICO_API_V1_OC_PATH,
      ensureTrailingSlash(settings.apiV1BaseUrl),
    ).toString();
    const fetchedAt = new Date();

    this.logger.log(`Fetching V1 orden de compra detail by codigo ${codigo}`);

    const httpClient = this.secureHttpClientService.getHttpClient({
      timeout: settings.httpTimeoutMs,
      validateStatus: () => true,
    });

    const response = await httpClient.get<unknown>(endpointUrl, {
      params: {
        ...requestParams,
        ticket: settings.apiTicket,
      },
    });

    const rawPayload = response.data;
    const ordenesDeCompra = extractV1OrdenesDeCompraListRecords(rawPayload);
    const bodyError = parseMercadoPublicoBodyError(rawPayload);
    const httpStatusErrorSummary = classifyMercadoPublicoHttpStatus(
      response.status,
    );
    this.tryRecord429(response.status);

    return {
      endpoint: MERCADO_PUBLICO_API_V1_OC_DETAIL_BY_CODIGO_ENDPOINT,
      source: MERCADO_PUBLICO_API_V1_OC_SOURCE,
      requestParams,
      requestFingerprint: createJsonSha256(requestParams),
      payloadChecksum: createJsonSha256(rawPayload),
      schemaFingerprint: createJsonShapeSha256(rawPayload),
      httpStatus: response.status,
      fetchedAt,
      rawPayload,
      ordenesDeCompra,
      errorSummary: bodyError?.errorSummary ?? httpStatusErrorSummary,
      errorMessage: bodyError?.message,
      errorCode: bodyError?.code ?? undefined,
    };
  }

  // ponytail: tryRecord429 duplicated 3×, extract to util when 4th client appears
  private tryRecord429(status: number): void {
    if (status !== 429) {
      return;
    }

    void (async () => {
      try {
        const settings = this.mercadoPublicoConfigService.getSettings();

        await this.quotaTracker.record429(
          MERCADO_PUBLICO_API_V1_OC_SOURCE,
          settings.quotaTimezone,
        );
      } catch {
        return;
      }
    })();
  }
}
