import { Injectable } from '@nestjs/common';

import { MercadoPublicoV2DurableSyncService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-v2-durable-sync.service';

export type MercadoPublicoV2SyncRunResult = {
  syncRunId: string;
  observationIds: string[];
  recordsProjected: number;
};

@Injectable()
export class MercadoPublicoV2GoldenPathService {
  constructor(
    private readonly mercadoPublicoV2DurableSyncService: MercadoPublicoV2DurableSyncService,
  ) {}

  async runProduction(
    payload: Record<string, unknown>,
  ): Promise<MercadoPublicoV2SyncRunResult> {
    const result = await this.mercadoPublicoV2DurableSyncService.start(
      payload,
      'manual',
    );

    return this.toGoldenPathResult(result);
  }

  async runFixture(payload: unknown): Promise<MercadoPublicoV2SyncRunResult> {
    const result =
      await this.mercadoPublicoV2DurableSyncService.runFixture(payload);

    return this.toGoldenPathResult(result);
  }

  private toGoldenPathResult(result: {
    syncRunId: string;
    observationIds: string[];
    recordsProjected: number;
  }): MercadoPublicoV2SyncRunResult {
    return {
      syncRunId: result.syncRunId,
      observationIds: result.observationIds,
      recordsProjected: result.recordsProjected,
    };
  }
}
