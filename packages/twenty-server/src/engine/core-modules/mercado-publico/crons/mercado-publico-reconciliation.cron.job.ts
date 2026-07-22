import { Injectable, Logger } from '@nestjs/common';

import { Process } from 'src/engine/core-modules/message-queue/decorators/process.decorator';
import { Processor } from 'src/engine/core-modules/message-queue/decorators/processor.decorator';
import { InjectMessageQueue } from 'src/engine/core-modules/message-queue/decorators/message-queue.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';
import {
  MercadoPublicoJob,
  type MercadoPublicoJobData,
} from 'src/engine/core-modules/mercado-publico/jobs/mercado-publico.job';
import { MercadoPublicoConfigService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-config.service';

export const MERCADO_PUBLICO_RECONCILIATION_CRON_JOB_ID =
  'mercado-publico-reconciliation-refresh';
export const MERCADO_PUBLICO_RECONCILIATION_CRON_INTERVAL_MS = 86_400_000;

@Injectable()
@Processor(MessageQueue.cronQueue)
export class MercadoPublicoReconciliationCronJob {
  private readonly logger = new Logger(
    MercadoPublicoReconciliationCronJob.name,
  );

  constructor(
    @InjectMessageQueue(MessageQueue.mercadoPublicoQueue)
    private readonly mercadoPublicoQueue: MessageQueueService,
    private readonly mercadoPublicoConfigService: MercadoPublicoConfigService,
  ) {}

  @Process(MercadoPublicoReconciliationCronJob.name)
  async handle(): Promise<void> {
    const settings = this.mercadoPublicoConfigService.getSettings();

    await this.mercadoPublicoQueue.add<MercadoPublicoJobData>(
      MercadoPublicoJob.name,
      {
        jobName: 'reconciliation-refresh',
        payload: {},
        requestedAt: new Date().toISOString(),
        requestedBy: 'schedule',
      },
      {
        retryLimit: settings.httpMaxRetries,
        backoff: {
          type: 'fixed',
          delay: settings.httpRetryBackoffMs,
        },
      },
    );

    this.logger.log(
      'Enqueued scheduled Mercado Publico reconciliation refresh',
    );
  }
}
