import { Command, CommandRunner } from 'nest-commander';

import { InjectMessageQueue } from 'src/engine/core-modules/message-queue/decorators/message-queue.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';
import {
  MERCADO_PUBLICO_V2_SYNC_RECOVERY_CRON_PATTERN,
  MercadoPublicoV2SyncRecoveryCronJob,
} from 'src/engine/core-modules/mercado-publico/crons/jobs/mercado-publico-v2-sync-recovery.cron.job';

@Command({
  name: 'cron:mercado-publico:sync-recovery',
  description:
    'Starts the one-minute Mercado Publico V2 sync command recovery cron job',
})
export class MercadoPublicoV2SyncRecoveryCronCommand extends CommandRunner {
  constructor(
    @InjectMessageQueue(MessageQueue.cronQueue)
    private readonly messageQueueService: MessageQueueService,
  ) {
    super();
  }

  async run(): Promise<void> {
    await this.messageQueueService.addCron<undefined>({
      jobName: MercadoPublicoV2SyncRecoveryCronJob.name,
      data: undefined,
      options: {
        repeat: { pattern: MERCADO_PUBLICO_V2_SYNC_RECOVERY_CRON_PATTERN },
      },
    });
  }
}
