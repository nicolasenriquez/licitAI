import { Logger } from '@nestjs/common';

import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { Process } from 'src/engine/core-modules/message-queue/decorators/process.decorator';
import { Processor } from 'src/engine/core-modules/message-queue/decorators/processor.decorator';
import { MercadoPublicoV2SyncControlService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-v2-sync-control.service';

export const MERCADO_PUBLICO_V2_DEBT_RECOVERY_CRON_PATTERN = '* * * * *';

@Processor(MessageQueue.cronQueue)
export class MercadoPublicoV2DebtRecoveryCronJob {
  private readonly logger = new Logger(
    MercadoPublicoV2DebtRecoveryCronJob.name,
  );

  constructor(
    private readonly mercadoPublicoV2SyncControlService: MercadoPublicoV2SyncControlService,
  ) {}

  @Process(MercadoPublicoV2DebtRecoveryCronJob.name)
  async handle(): Promise<void> {
    const dispatched =
      await this.mercadoPublicoV2SyncControlService.recoverDeferredHydrations();

    if (dispatched > 0) {
      this.logger.log(
        `Dispatched ${dispatched} Mercado Publico V2 debt recovery runs`,
      );
    }
  }
}
