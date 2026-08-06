import { BadRequestException, Injectable } from '@nestjs/common';

import { isNonEmptyString } from '@sniptt/guards';

import { MercadoPublicoV2DurableSyncService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-v2-durable-sync.service';

type MercadoPublicoApiV2CompraAgilIncrementalPayload = {
  ttl_cambio_ms?: number;
  cambio_desde?: string;
  cambio_hasta?: string;
  tamano_pagina?: number;
  id?: string;
  q?: string;
  estado?: string;
  region?: number;
  ordenar_por?: string;
  orden?: string;
};

@Injectable()
export class MercadoPublicoApiV2CompraAgilIncrementalService {
  constructor(
    private readonly mercadoPublicoV2DurableSyncService: MercadoPublicoV2DurableSyncService,
  ) {}

  async run(payload: Record<string, unknown>): Promise<void> {
    const parsedPayload = this.parsePayload(payload);

    await this.mercadoPublicoV2DurableSyncService.start(
      parsedPayload,
      'scheduled',
    );
  }

  private parsePayload(
    payload: Record<string, unknown>,
  ): MercadoPublicoApiV2CompraAgilIncrementalPayload {
    const ttlCambioMs = payload.ttl_cambio_ms;
    const cambioDesde = payload.cambio_desde;

    if (ttlCambioMs === undefined && !isNonEmptyString(cambioDesde)) {
      throw new BadRequestException(
        'Mercado Publico V2 Compra Agil incremental payload requires a non-empty "ttl_cambio_ms" or "cambio_desde" string',
      );
    }

    if (typeof ttlCambioMs === 'number' && ttlCambioMs <= 0) {
      throw new BadRequestException(
        'Mercado Publico V2 Compra Agil incremental payload "ttl_cambio_ms" must be greater than 0',
      );
    }

    return {
      ttl_cambio_ms: typeof ttlCambioMs === 'number' ? ttlCambioMs : undefined,
      cambio_desde: isNonEmptyString(cambioDesde)
        ? (cambioDesde as string)
        : undefined,
      cambio_hasta: isNonEmptyString(payload.cambio_hasta)
        ? (payload.cambio_hasta as string)
        : undefined,
      tamano_pagina:
        typeof payload.tamano_pagina === 'number'
          ? payload.tamano_pagina
          : undefined,
      id: isNonEmptyString(payload.id) ? (payload.id as string) : undefined,
      q: isNonEmptyString(payload.q) ? (payload.q as string) : undefined,
      estado: isNonEmptyString(payload.estado)
        ? (payload.estado as string)
        : undefined,
      region: typeof payload.region === 'number' ? payload.region : undefined,
      ordenar_por: isNonEmptyString(payload.ordenar_por)
        ? (payload.ordenar_por as string)
        : undefined,
      orden: isNonEmptyString(payload.orden)
        ? (payload.orden as string)
        : undefined,
    };
  }
}
