import { Injectable, Logger } from '@nestjs/common';

import { isNonEmptyString } from '@sniptt/guards';

import { type MercadoPublicoApiV1LicitacionRecord } from 'src/engine/core-modules/mercado-publico/drivers/api/types/mercado-publico-api-v1-licitacion-record.type';
import {
  createJsonShapeSha256,
  createJsonSha256,
} from 'src/engine/core-modules/mercado-publico/drivers/api/utils/create-json-sha256.util';
import { extractV1LicitacionesListRecords } from 'src/engine/core-modules/mercado-publico/drivers/api/utils/extract-v1-licitaciones-list-records.util';
import { extractV1LicitacionDetailRecord } from 'src/engine/core-modules/mercado-publico/drivers/api/utils/extract-v1-licitacion-detail-record.util';
import { formatV1Date } from 'src/engine/core-modules/mercado-publico/drivers/api/utils/format-v1-date.util';
import { classifyMercadoPublicoHttpStatus } from 'src/engine/core-modules/mercado-publico/drivers/api/utils/classify-mercado-publico-http-status.util';
import {
  parseMercadoPublicoBodyError,
} from 'src/engine/core-modules/mercado-publico/drivers/api/utils/parse-mercado-publico-body-error.util';
import {
  MERCADO_PUBLICO_API_V1_LICITACIONES_BY_DATE_ENDPOINT,
  MERCADO_PUBLICO_API_V1_LICITACIONES_BY_STATE_ENDPOINT,
  MERCADO_PUBLICO_API_V1_LICITACIONES_DETAIL_BY_CODIGO_ENDPOINT,
  MERCADO_PUBLICO_API_V1_LICITACIONES_PATH,
  MERCADO_PUBLICO_API_V1_LICITACIONES_SOURCE,
  type MercadoPublicoErrorSummary,
} from 'src/engine/core-modules/mercado-publico/mercado-publico.constants';
import { MercadoPublicoConfigService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-config.service';
import { SecureHttpClientService } from 'src/engine/core-modules/secure-http-client/secure-http-client.service';

export type MercadoPublicoApiV1LicitacionesByDateResponse = {
  endpoint: string;
  source: typeof MERCADO_PUBLICO_API_V1_LICITACIONES_SOURCE;
  requestParams: Record<string, string>;
  requestFingerprint: string;
  payloadChecksum: string;
  schemaFingerprint: string;
  httpStatus: number;
  fetchedAt: Date;
  rawPayload: unknown;
  licitaciones: MercadoPublicoApiV1LicitacionRecord[];
  errorSummary?: MercadoPublicoErrorSummary;
  errorMessage?: string;
  errorCode?: string;
};

const ensureTrailingSlash = (value: string): string => {
  return value.endsWith('/') ? value : `${value}/`;
};

@Injectable()
export class MercadoPublicoApiV1LicitacionesClientService {
  private readonly logger = new Logger(
    MercadoPublicoApiV1LicitacionesClientService.name,
  );

  constructor(
    private readonly mercadoPublicoConfigService: MercadoPublicoConfigService,
    private readonly secureHttpClientService: SecureHttpClientService,
  ) {}

  async getByDate(
    requestedDate: Date,
  ): Promise<MercadoPublicoApiV1LicitacionesByDateResponse> {
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
      MERCADO_PUBLICO_API_V1_LICITACIONES_PATH,
      ensureTrailingSlash(settings.apiV1BaseUrl),
    ).toString();
    const fetchedAt = new Date();

    this.logger.log(`Fetching V1 licitaciones by date ${formattedDate}`);

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
    const licitaciones = extractV1LicitacionesListRecords(rawPayload);
    const bodyError = parseMercadoPublicoBodyError(rawPayload);
    const httpStatusErrorSummary = classifyMercadoPublicoHttpStatus(response.status);

    return {
      endpoint: MERCADO_PUBLICO_API_V1_LICITACIONES_BY_DATE_ENDPOINT,
      source: MERCADO_PUBLICO_API_V1_LICITACIONES_SOURCE,
      requestParams,
      requestFingerprint: createJsonSha256(requestParams),
      payloadChecksum: createJsonSha256(rawPayload),
      schemaFingerprint: createJsonShapeSha256(rawPayload),
      httpStatus: response.status,
      fetchedAt,
      rawPayload,
      licitaciones,
      errorSummary: bodyError?.errorSummary ?? httpStatusErrorSummary,
      errorMessage: bodyError?.message,
      errorCode: bodyError?.code ?? undefined,
    };
  }

  async getByCodigoExterno(
    codigoExterno: string,
  ): Promise<MercadoPublicoApiV1LicitacionesByDateResponse> {
    const settings = this.mercadoPublicoConfigService.getSettings();

    if (!isNonEmptyString(settings.apiTicket)) {
      throw new Error('MERCADO_PUBLICO_API_TICKET is not configured');
    }

    if (!isNonEmptyString(settings.apiV1BaseUrl)) {
      throw new Error('MERCADO_PUBLICO_API_V1_BASE_URL is not configured');
    }

    const requestParams = { codigo: codigoExterno };
    const endpointUrl = new URL(
      MERCADO_PUBLICO_API_V1_LICITACIONES_PATH,
      ensureTrailingSlash(settings.apiV1BaseUrl),
    ).toString();
    const fetchedAt = new Date();

    this.logger.log(
      `Fetching V1 licitacion detail by codigo ${codigoExterno}`,
    );

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
    const detailRecord = extractV1LicitacionDetailRecord(
      codigoExterno,
      rawPayload,
    );
    const licitaciones = detailRecord ? [detailRecord] : [];
    const bodyError = parseMercadoPublicoBodyError(rawPayload);
    const httpStatusErrorSummary = classifyMercadoPublicoHttpStatus(response.status);

    return {
      endpoint: MERCADO_PUBLICO_API_V1_LICITACIONES_DETAIL_BY_CODIGO_ENDPOINT,
      source: MERCADO_PUBLICO_API_V1_LICITACIONES_SOURCE,
      requestParams,
      requestFingerprint: createJsonSha256(requestParams),
      payloadChecksum: createJsonSha256(rawPayload),
      schemaFingerprint: createJsonShapeSha256(rawPayload),
      httpStatus: response.status,
      fetchedAt,
      rawPayload,
      licitaciones,
      errorSummary: bodyError?.errorSummary ?? httpStatusErrorSummary,
      errorMessage: bodyError?.message,
      errorCode: bodyError?.code ?? undefined,
    };
  }

  async getByEstado(
    estado: string,
  ): Promise<MercadoPublicoApiV1LicitacionesByDateResponse> {
    const settings = this.mercadoPublicoConfigService.getSettings();

    if (!isNonEmptyString(settings.apiTicket)) {
      throw new Error('MERCADO_PUBLICO_API_TICKET is not configured');
    }

    if (!isNonEmptyString(settings.apiV1BaseUrl)) {
      throw new Error('MERCADO_PUBLICO_API_V1_BASE_URL is not configured');
    }

    const requestParams = { estado };
    const endpointUrl = new URL(
      MERCADO_PUBLICO_API_V1_LICITACIONES_PATH,
      ensureTrailingSlash(settings.apiV1BaseUrl),
    ).toString();
    const fetchedAt = new Date();

    this.logger.log(`Fetching V1 licitaciones by estado ${estado}`);

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
    const licitaciones = extractV1LicitacionesListRecords(rawPayload);
    const bodyError = parseMercadoPublicoBodyError(rawPayload);
    const httpStatusErrorSummary = classifyMercadoPublicoHttpStatus(
      response.status,
    );

    return {
      endpoint: MERCADO_PUBLICO_API_V1_LICITACIONES_BY_STATE_ENDPOINT,
      source: MERCADO_PUBLICO_API_V1_LICITACIONES_SOURCE,
      requestParams,
      requestFingerprint: createJsonSha256(requestParams),
      payloadChecksum: createJsonSha256(rawPayload),
      schemaFingerprint: createJsonShapeSha256(rawPayload),
      httpStatus: response.status,
      fetchedAt,
      rawPayload,
      licitaciones,
      errorSummary: bodyError?.errorSummary ?? httpStatusErrorSummary,
      errorMessage: bodyError?.message,
      errorCode: bodyError?.code ?? undefined,
    };
  }
}
