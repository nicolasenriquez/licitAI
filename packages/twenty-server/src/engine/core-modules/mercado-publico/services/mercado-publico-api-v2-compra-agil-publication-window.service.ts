import { BadRequestException, Injectable } from '@nestjs/common';

import { isNonEmptyString } from '@sniptt/guards';

import { MercadoPublicoV2DurableSyncService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-v2-durable-sync.service';

type MercadoPublicoApiV2CompraAgilPublicationWindowPayload = {
  publicado_desde?: string;
  publicado_hasta?: string;
  tamano_pagina?: number;
  max_pages?: number;
  bounded_window?: boolean;
  id?: string;
  q?: string;
  estado?: string;
  region?: number;
  ordenar_por?: string;
};

@Injectable()
export class MercadoPublicoApiV2CompraAgilPublicationWindowService {
  constructor(
    private readonly mercadoPublicoV2DurableSyncService: MercadoPublicoV2DurableSyncService,
  ) {}

  async run(
    payload: Record<string, unknown>,
    executionKey?: string,
  ): Promise<void> {
    if (isNonEmptyString(payload.sync_run_id)) {
      await this.mercadoPublicoV2DurableSyncService.resume(payload.sync_run_id);

      return;
    }

    const parsedPayload = this.parsePayload(payload);

    if (executionKey === undefined) {
      await this.mercadoPublicoV2DurableSyncService.start(
        parsedPayload,
        'manual',
        'api-v2-compra-agil-by-publication-window',
      );

      return;
    }

    await this.mercadoPublicoV2DurableSyncService.startOrResume(
      parsedPayload,
      'manual',
      'api-v2-compra-agil-by-publication-window',
      executionKey,
    );
  }

  private parsePayload(
    payload: Record<string, unknown>,
  ): MercadoPublicoApiV2CompraAgilPublicationWindowPayload {
    const publicadoDesde = payload.publicado_desde;
    const publicadoHasta = payload.publicado_hasta;

    if (payload.orden !== undefined) {
      throw new BadRequestException(
        'Mercado Publico V2 Compra Agil publication-window payload does not support "orden"',
      );
    }

    if (
      !isNonEmptyString(publicadoDesde) ||
      !isNonEmptyString(publicadoHasta)
    ) {
      throw new BadRequestException(
        'Mercado Publico V2 Compra Agil publication-window payload requires both "publicado_desde" and "publicado_hasta" strings',
      );
    }

    return {
      publicado_desde: isNonEmptyString(publicadoDesde)
        ? (publicadoDesde as string)
        : undefined,
      publicado_hasta: isNonEmptyString(publicadoHasta)
        ? (publicadoHasta as string)
        : undefined,
      tamano_pagina:
        typeof payload.tamano_pagina === 'number'
          ? payload.tamano_pagina
          : undefined,
      max_pages:
        typeof payload.max_pages === 'number' ? payload.max_pages : undefined,
      bounded_window:
        typeof payload.bounded_window === 'boolean'
          ? payload.bounded_window
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
    };
  }
}
