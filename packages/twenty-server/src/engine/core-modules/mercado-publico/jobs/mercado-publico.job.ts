import { BadRequestException, Logger } from '@nestjs/common';
import { UnrecoverableError } from 'bullmq';

import { Process } from 'src/engine/core-modules/message-queue/decorators/process.decorator';
import { Processor } from 'src/engine/core-modules/message-queue/decorators/processor.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { type MercadoPublicoJobName } from 'src/engine/core-modules/mercado-publico/mercado-publico.constants';
import { MercadoPublicoJobOrchestratorService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-job-orchestrator.service';
import { MercadoPublicoRecordedJobFailureError } from 'src/engine/core-modules/mercado-publico/services/utils/mercado-publico-recorded-job-failure.error';

export type MercadoPublicoJobData = {
  jobName: MercadoPublicoJobName;
  payload: Record<string, unknown>;
  requestedAt: string;
  requestedBy: 'command' | 'schedule';
};

@Processor(MessageQueue.mercadoPublicoQueue)
export class MercadoPublicoJob {
  private readonly logger = new Logger(MercadoPublicoJob.name);

  constructor(
    private readonly mercadoPublicoJobOrchestratorService: MercadoPublicoJobOrchestratorService,
  ) {}

  @Process(MercadoPublicoJob.name)
  async handle(data: MercadoPublicoJobData): Promise<void> {
    this.logger.log(
      `Dequeued Mercado Publico job "${data.jobName}" requested by ${data.requestedBy} at ${data.requestedAt}`,
    );

    try {
      await this.mercadoPublicoJobOrchestratorService.run(
        data.jobName,
        data.payload,
      );
    } catch (error) {
      if (error instanceof MercadoPublicoRecordedJobFailureError) {
        if (error.disposition === 'fail') {
          throw new UnrecoverableError(error.message);
        }

        if (error.disposition === 'retry') {
          throw error;
        }

        this.logger.warn(
          `Mercado Publico job "${data.jobName}" completed without retry: ${error.message}`,
        );

        return;
      }

      if (error instanceof BadRequestException) {
        this.logger.warn(
          `Mercado Publico job "${data.jobName}" completed without retry: ${error.message}`,
        );

        return;
      }

      throw error;
    }
  }
}
