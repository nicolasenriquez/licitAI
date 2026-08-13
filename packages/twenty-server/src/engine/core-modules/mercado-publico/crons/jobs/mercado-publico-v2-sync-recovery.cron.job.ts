import { Logger } from '@nestjs/common';

import { InjectMessageQueue } from 'src/engine/core-modules/message-queue/decorators/message-queue.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';
import { Process } from 'src/engine/core-modules/message-queue/decorators/process.decorator';
import { Processor } from 'src/engine/core-modules/message-queue/decorators/processor.decorator';
import { MERCADO_PUBLICO_V2_SYNC_COMMAND_JOB_NAME } from 'src/engine/core-modules/mercado-publico/mercado-publico.constants';
import { MercadoPublicoConfigService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-config.service';
import { MercadoPublicoV2SyncControlService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-v2-sync-control.service';

export const MERCADO_PUBLICO_V2_SYNC_RECOVERY_CRON_PATTERN = '* * * * *';

const RECOVERY_SAFETY_MARGIN_MS = 60_000;

@Processor(MessageQueue.cronQueue)
export class MercadoPublicoV2SyncRecoveryCronJob {
  private readonly logger = new Logger(
    MercadoPublicoV2SyncRecoveryCronJob.name,
  );

  constructor(
    private readonly mercadoPublicoV2SyncControlService: MercadoPublicoV2SyncControlService,
    private readonly mercadoPublicoConfigService: MercadoPublicoConfigService,
    @InjectMessageQueue(MessageQueue.mercadoPublicoQueue)
    private readonly messageQueueService: MessageQueueService,
  ) {}

  @Process(MercadoPublicoV2SyncRecoveryCronJob.name)
  async handle(): Promise<void> {
    const settings = this.mercadoPublicoConfigService.getSettings();
    const staleHeartbeatMarginMs =
      (settings.httpTimeoutMs + settings.httpRetryBackoffMs) *
        (settings.httpMaxRetries + 1) +
      RECOVERY_SAFETY_MARGIN_MS;
    const commandIds =
      await this.mercadoPublicoV2SyncControlService.recoverDispatches(
        Math.ceil(staleHeartbeatMarginMs / 1000),
      );

    for (const commandId of commandIds) {
      await this.messageQueueService.add(
        MERCADO_PUBLICO_V2_SYNC_COMMAND_JOB_NAME,
        { commandId },
      );
    }

    if (commandIds.length > 0) {
      this.logger.log(
        `Re-dispatched ${commandIds.length} Mercado Publico V2 sync commands`,
      );
    }
  }
}
