import { BadRequestException, Injectable, Logger } from '@nestjs/common';

import { isNonEmptyString } from '@sniptt/guards';

import { type MercadoPublicoApiV2CompraAgilRecord } from 'src/engine/core-modules/mercado-publico/drivers/api/types/mercado-publico-api-v2-compra-agil-record.type';
import {
  createJsonShapeSha256,
  createJsonSha256,
} from 'src/engine/core-modules/mercado-publico/drivers/api/utils/create-json-sha256.util';
import {
  decodeV2CompraAgilDetailPayload,
  decodeV2CompraAgilListPayload,
} from 'src/engine/core-modules/mercado-publico/drivers/api/utils/extract-v2-compra-agil-list-records.util';
import {
  extractV2CompraAgilPagination,
  type MercadoPublicoApiV2CompraAgilPagination,
} from 'src/engine/core-modules/mercado-publico/drivers/api/utils/extract-v2-compra-agil-pagination.util';
import {
  CompraAgilListParams,
  validateCompraAgilListParams,
} from 'src/engine/core-modules/mercado-publico/drivers/api/utils/validate-compra-agil-params.util';
import { classifyMercadoPublicoHttpStatus } from 'src/engine/core-modules/mercado-publico/drivers/api/utils/classify-mercado-publico-http-status.util';
import { parseMercadoPublicoBodyError } from 'src/engine/core-modules/mercado-publico/drivers/api/utils/parse-mercado-publico-body-error.util';
import { parseRetryAfterSeconds } from 'src/engine/core-modules/mercado-publico/drivers/api/utils/parse-retry-after-seconds.util';
import {
  MERCADO_PUBLICO_API_V2_COMPRA_AGIL_DETAIL_BY_CODIGO_ENDPOINT,
  MERCADO_PUBLICO_API_V2_COMPRA_AGIL_LIST_ENDPOINT,
  MERCADO_PUBLICO_API_V2_COMPRA_AGIL_PATH,
  MERCADO_PUBLICO_API_V2_COMPRA_AGIL_SOURCE,
  type MercadoPublicoErrorSummary,
} from 'src/engine/core-modules/mercado-publico/mercado-publico.constants';
import { MercadoPublicoConfigService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-config.service';
import { MercadoPublicoQuotaTrackerService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-quota-tracker.service';
import { SecureHttpClientService } from 'src/engine/core-modules/secure-http-client/secure-http-client.service';

export type MercadoPublicoApiV2CompraAgilListResponse = {
  endpoint: string;
  source: typeof MERCADO_PUBLICO_API_V2_COMPRA_AGIL_SOURCE;
  requestParams: Record<string, string | number>;
  requestFingerprint: string;
  payloadChecksum: string;
  schemaFingerprint: string;
  httpStatus: number;
  fetchedAt: Date;
  rawPayload: unknown;
  compraAgil: MercadoPublicoApiV2CompraAgilRecord[];
  pagination?: MercadoPublicoApiV2CompraAgilPagination;
  errorSummary?: MercadoPublicoErrorSummary;
  errorMessage?: string;
  errorCode?: string;
  retryAfterSeconds?: number;
};

const ensureTrailingSlash = (value: string): string => {
  return value.endsWith('/') ? value : `${value}/`;
};

const sanitizeParams = (
  params: CompraAgilListParams,
): Record<string, string | number> => {
  const entries: Record<string, string | number> = {};

  if (params.tamano_pagina !== undefined) {
    entries.tamano_pagina = params.tamano_pagina;
  }
  if (params.numero_pagina !== undefined) {
    entries.numero_pagina = params.numero_pagina;
  }
  if (params.id !== undefined && params.id !== '') {
    entries.id = params.id;
  }
  if (params.q !== undefined && params.q !== '') {
    entries.q = params.q;
  }
  if (params.ttl_cambio_ms !== undefined) {
    entries.ttl_cambio_ms = params.ttl_cambio_ms;
  }
  if (isNonEmptyString(params.cambio_desde)) {
    entries.cambio_desde = params.cambio_desde as string;
  }
  if (isNonEmptyString(params.cambio_hasta)) {
    entries.cambio_hasta = params.cambio_hasta as string;
  }
  if (isNonEmptyString(params.publicado_desde)) {
    entries.publicado_desde = params.publicado_desde as string;
  }
  if (isNonEmptyString(params.publicado_hasta)) {
    entries.publicado_hasta = params.publicado_hasta as string;
  }
  if (isNonEmptyString(params.estado)) {
    entries.estado = params.estado as string;
  }
  if (params.region !== undefined) {
    entries.region = params.region;
  }
  if (isNonEmptyString(params.ordenar_por)) {
    entries.ordenar_por = params.ordenar_por as string;
  }

  return entries;
};

@Injectable()
export class MercadoPublicoApiV2CompraAgilClientService {
  private readonly logger = new Logger(
    MercadoPublicoApiV2CompraAgilClientService.name,
  );

  constructor(
    private readonly mercadoPublicoConfigService: MercadoPublicoConfigService,
    private readonly secureHttpClientService: SecureHttpClientService,
    private readonly quotaTracker: MercadoPublicoQuotaTrackerService,
  ) {}

  async getList(
    params: CompraAgilListParams,
  ): Promise<MercadoPublicoApiV2CompraAgilListResponse> {
    const settings = this.mercadoPublicoConfigService.getSettings();

    if (!isNonEmptyString(settings.compraAgilApiTicket)) {
      throw new Error('COMPRA_AGIL_API_TICKET is not configured');
    }

    if (!isNonEmptyString(settings.compraAgilApiBaseUrl)) {
      throw new Error('COMPRA_AGIL_API_BASE_URL is not configured');
    }

    const validationErrors = validateCompraAgilListParams(params);

    if (validationErrors.length > 0) {
      throw new BadRequestException(
        `Compra Agil V2 list params invalid: ${JSON.stringify(validationErrors)}`,
      );
    }

    const appliedParams = { tamano_pagina: 15, numero_pagina: 1, ...params };
    const sanitizedParams = sanitizeParams(appliedParams);
    const endpointUrl = new URL(
      MERCADO_PUBLICO_API_V2_COMPRA_AGIL_PATH,
      ensureTrailingSlash(settings.compraAgilApiBaseUrl),
    ).toString();
    const fetchedAt = new Date();

    this.logger.log(
      `Fetching V2 Compra Agil list with params ${JSON.stringify(Object.keys(sanitizedParams))}`,
    );

    const httpClient = this.secureHttpClientService.getHttpClient({
      timeout: settings.httpTimeoutMs,
      validateStatus: () => true,
    });

    const response = await httpClient.get<unknown>(endpointUrl, {
      headers: {
        ticket: settings.compraAgilApiTicket,
      },
      params: sanitizedParams,
    });

    const rawPayload = response.data;
    const decoded = decodeV2CompraAgilListPayload(rawPayload);
    const compraAgil = decoded.records;
    const pagination = extractV2CompraAgilPagination(
      rawPayload,
      appliedParams.numero_pagina ?? 1,
      appliedParams.tamano_pagina ?? 15,
      compraAgil.length,
    );
    const bodyError = parseMercadoPublicoBodyError(rawPayload);
    const httpStatusErrorSummary = classifyMercadoPublicoHttpStatus(
      response.status,
    );
    const retryAfterSeconds = parseRetryAfterSeconds(
      response.headers?.['retry-after'],
    );
    this.tryRecord429(response.status);

    const providerErrorSummary =
      bodyError?.errorSummary ?? httpStatusErrorSummary;

    return {
      endpoint: MERCADO_PUBLICO_API_V2_COMPRA_AGIL_LIST_ENDPOINT,
      source: MERCADO_PUBLICO_API_V2_COMPRA_AGIL_SOURCE,
      requestParams: sanitizedParams,
      requestFingerprint: createJsonSha256(sanitizedParams),
      payloadChecksum: createJsonSha256(rawPayload),
      schemaFingerprint: createJsonShapeSha256(rawPayload),
      httpStatus: response.status,
      fetchedAt,
      rawPayload,
      compraAgil,
      pagination,
      errorSummary:
        providerErrorSummary ??
        (decoded.errorCode === undefined ? undefined : 'hard_fail'),
      errorMessage:
        bodyError?.message ??
        (providerErrorSummary === undefined ? decoded.errorMessage : undefined),
      errorCode:
        bodyError?.code ??
        (providerErrorSummary === undefined ? decoded.errorCode : undefined),
      retryAfterSeconds: retryAfterSeconds ?? undefined,
    };
  }

  async getByCodigo(
    codigo: string,
  ): Promise<MercadoPublicoApiV2CompraAgilListResponse> {
    const settings = this.mercadoPublicoConfigService.getSettings();

    if (!isNonEmptyString(settings.compraAgilApiTicket)) {
      throw new Error('COMPRA_AGIL_API_TICKET is not configured');
    }

    if (!isNonEmptyString(settings.compraAgilApiBaseUrl)) {
      throw new Error('COMPRA_AGIL_API_BASE_URL is not configured');
    }

    if (!isNonEmptyString(codigo)) {
      throw new Error('codigo must be a non-empty string');
    }

    const requestParams: Record<string, string> = { codigo };
    const endpointUrl = new URL(
      `${MERCADO_PUBLICO_API_V2_COMPRA_AGIL_PATH}/${encodeURIComponent(codigo)}`,
      ensureTrailingSlash(settings.compraAgilApiBaseUrl),
    ).toString();
    const fetchedAt = new Date();

    this.logger.log(`Fetching V2 Compra Agil detail by codigo ${codigo}`);

    const httpClient = this.secureHttpClientService.getHttpClient({
      timeout: settings.httpTimeoutMs,
      validateStatus: () => true,
    });

    const response = await httpClient.get<unknown>(endpointUrl, {
      headers: {
        ticket: settings.compraAgilApiTicket,
      },
    });

    const rawPayload = response.data;
    const decoded = decodeV2CompraAgilDetailPayload(rawPayload);
    const compraAgil = decoded.records;
    const bodyError = parseMercadoPublicoBodyError(rawPayload);
    const httpStatusErrorSummary = classifyMercadoPublicoHttpStatus(
      response.status,
    );
    const retryAfterSeconds = parseRetryAfterSeconds(
      response.headers?.['retry-after'],
    );
    this.tryRecord429(response.status);

    const providerErrorSummary =
      bodyError?.errorSummary ?? httpStatusErrorSummary;

    return {
      endpoint: MERCADO_PUBLICO_API_V2_COMPRA_AGIL_DETAIL_BY_CODIGO_ENDPOINT,
      source: MERCADO_PUBLICO_API_V2_COMPRA_AGIL_SOURCE,
      requestParams,
      requestFingerprint: createJsonSha256(requestParams),
      payloadChecksum: createJsonSha256(rawPayload),
      schemaFingerprint: createJsonShapeSha256(rawPayload),
      httpStatus: response.status,
      fetchedAt,
      rawPayload,
      compraAgil,
      errorSummary:
        providerErrorSummary ??
        (decoded.errorCode === undefined ? undefined : 'hard_fail'),
      errorMessage:
        bodyError?.message ??
        (providerErrorSummary === undefined ? decoded.errorMessage : undefined),
      errorCode:
        bodyError?.code ??
        (providerErrorSummary === undefined ? decoded.errorCode : undefined),
      retryAfterSeconds: retryAfterSeconds ?? undefined,
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
          MERCADO_PUBLICO_API_V2_COMPRA_AGIL_SOURCE,
          settings.quotaTimezone,
        );
      } catch {
        return;
      }
    })();
  }
}
