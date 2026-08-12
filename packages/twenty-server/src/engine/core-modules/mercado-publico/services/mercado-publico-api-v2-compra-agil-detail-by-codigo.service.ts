import { BadRequestException, Injectable, Logger } from '@nestjs/common';

import { isNonEmptyString } from '@sniptt/guards';

import { MercadoPublicoV2DurableSyncService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-v2-durable-sync.service';

type MercadoPublicoApiV2CompraAgilDetailByCodigoPayload = {
  codigo: string;
};

@Injectable()
export class MercadoPublicoApiV2CompraAgilDetailByCodigoService {
  private readonly logger = new Logger(
    MercadoPublicoApiV2CompraAgilDetailByCodigoService.name,
  );

  constructor(
    private readonly mercadoPublicoV2DurableSyncService: MercadoPublicoV2DurableSyncService,
  ) {}

  async run(payload: Record<string, unknown>): Promise<void> {
    const parsedPayload = this.parsePayload(payload);
    await this.mercadoPublicoV2DurableSyncService.start(
      { id: parsedPayload.codigo },
      'manual',
      'api-v2-compra-agil-detail-by-codigo',
    );

    this.logger.log(
      `Synced V2 Compra Agil detail for codigo ${parsedPayload.codigo}`,
    );
  }

  private parsePayload(
    payload: Record<string, unknown>,
  ): MercadoPublicoApiV2CompraAgilDetailByCodigoPayload {
    const codigo = payload.codigo;

    if (!isNonEmptyString(codigo)) {
      throw new BadRequestException(
        'Mercado Publico V2 Compra Agil detail-by-codigo payload requires a non-empty "codigo" string',
      );
    }

    return {
      codigo,
    };
  }
}
