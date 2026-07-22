import { Command, CommandRunner } from 'nest-commander';

import { InjectMessageQueue } from 'src/engine/core-modules/message-queue/decorators/message-queue.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';
import {
  MercadoPublicoReconciliationCronJob,
  MERCADO_PUBLICO_RECONCILIATION_CRON_INTERVAL_MS,
  MERCADO_PUBLICO_RECONCILIATION_CRON_JOB_ID,
} from 'src/engine/core-modules/mercado-publico/crons/mercado-publico-reconciliation.cron.job';

@Command({
  name: 'cron:mercado-publico-reconciliation-refresh',
  description:
    'Starts the daily Mercado Publico reconciliation refresh cron job',
})
export class MercadoPublicoReconciliationCronCommand extends CommandRunner {
  constructor(
    @InjectMessageQueue(MessageQueue.cronQueue)
    private readonly cronQueue: MessageQueueService,
  ) {
    super();
  }

  async run(): Promise<void> {
    await this.cronQueue.addCron<undefined>({
      jobName: MercadoPublicoReconciliationCronJob.name,
      jobId: MERCADO_PUBLICO_RECONCILIATION_CRON_JOB_ID,
      data: undefined,
      options: {
        repeat: {
          every: MERCADO_PUBLICO_RECONCILIATION_CRON_INTERVAL_MS,
        },
      },
    });
  }
}
