import { BadRequestException, Injectable } from '@nestjs/common';

import { isNonEmptyString } from '@sniptt/guards';

import { MercadoPublicoV2DurableSyncService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-v2-durable-sync.service';

type MercadoPublicoApiV2CompraAgilPublicationWindowPayload = {
  publicado_desde?: string;
  publicado_hasta?: string;
  tamano_pagina?: number;
  id?: string;
  q?: string;
  estado?: string;
  region?: number;
};

@Injectable()
export class MercadoPublicoApiV2CompraAgilPublicationWindowService {
  constructor(
    private readonly mercadoPublicoV2DurableSyncService: MercadoPublicoV2DurableSyncService,
  ) {}

  async run(payload: Record<string, unknown>): Promise<void> {
    const parsedPayload = this.parsePayload(payload);

    await this.mercadoPublicoV2DurableSyncService.start(
      parsedPayload,
      'manual',
    );
  }

  private parsePayload(
    payload: Record<string, unknown>,
  ): MercadoPublicoApiV2CompraAgilPublicationWindowPayload {
    const publicadoDesde = payload.publicado_desde;
    const publicadoHasta = payload.publicado_hasta;

    if (
      !isNonEmptyString(publicadoDesde) &&
      !isNonEmptyString(publicadoHasta)
    ) {
      throw new BadRequestException(
        'Mercado Publico V2 Compra Agil publication-window payload requires a non-empty "publicado_desde" or "publicado_hasta" string',
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
      id: isNonEmptyString(payload.id) ? (payload.id as string) : undefined,
      q: isNonEmptyString(payload.q) ? (payload.q as string) : undefined,
      estado: isNonEmptyString(payload.estado)
        ? (payload.estado as string)
        : undefined,
      region: typeof payload.region === 'number' ? payload.region : undefined,
    };
  }
}
