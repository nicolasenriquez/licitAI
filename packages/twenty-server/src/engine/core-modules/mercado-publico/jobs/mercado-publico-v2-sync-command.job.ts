import { Logger } from '@nestjs/common';

import { Process } from 'src/engine/core-modules/message-queue/decorators/process.decorator';
import { Processor } from 'src/engine/core-modules/message-queue/decorators/processor.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MERCADO_PUBLICO_V2_SYNC_COMMAND_JOB_NAME } from 'src/engine/core-modules/mercado-publico/mercado-publico.constants';
import {
  MercadoPublicoV2DurableSyncService,
  MercadoPublicoV2InactiveSyncAttemptError,
} from 'src/engine/core-modules/mercado-publico/services/mercado-publico-v2-durable-sync.service';
import { MercadoPublicoV2SyncControlService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-v2-sync-control.service';
import { classifyFailure } from 'src/engine/core-modules/mercado-publico/drivers/api/utils/classify-http-failure.util';
import { MercadoPublicoRecordedJobFailureError } from 'src/engine/core-modules/mercado-publico/services/utils/mercado-publico-recorded-job-failure.error';

export type MercadoPublicoV2SyncCommandJobData = {
  commandId: string;
};

@Processor(MessageQueue.mercadoPublicoQueue)
export class MercadoPublicoV2SyncCommandJob {
  private readonly logger = new Logger(MercadoPublicoV2SyncCommandJob.name);

  constructor(
    private readonly mercadoPublicoV2SyncControlService: MercadoPublicoV2SyncControlService,
    private readonly mercadoPublicoV2DurableSyncService: MercadoPublicoV2DurableSyncService,
  ) {}

  @Process(MERCADO_PUBLICO_V2_SYNC_COMMAND_JOB_NAME)
  async handle(data: MercadoPublicoV2SyncCommandJobData): Promise<void> {
    const claim = await this.mercadoPublicoV2SyncControlService.claimCommand(
      data.commandId,
      String(process.pid),
    );

    if (claim.kind === 'noop') {
      this.logger.log(
        `Mercado Publico V2 sync command ${data.commandId} is a no-op: ${claim.reason}`,
      );

      return;
    }

    try {
      const result =
        await this.mercadoPublicoV2DurableSyncService.executeExistingRun(
          claim.syncRunId,
          claim.attemptId,
        );

      await this.mercadoPublicoV2SyncControlService.finalizeCommand({
        commandId: data.commandId,
        attemptId: claim.attemptId,
        attemptNumber: claim.attemptNumber,
        status: result.status,
      });
    } catch (error) {
      if (error instanceof MercadoPublicoV2InactiveSyncAttemptError) {
        this.logger.warn(
          `Mercado Publico V2 sync command ${data.commandId} stopped because attempt ${claim.attemptId} is no longer active`,
        );

        return;
      }

      if (
        error instanceof MercadoPublicoRecordedJobFailureError &&
        error.retryable &&
        error.retryAt !== null
      ) {
        await this.mercadoPublicoV2SyncControlService.deferCommand({
          commandId: data.commandId,
          attemptId: claim.attemptId,
          retryAt: error.retryAt,
        });

        return;
      }

      const retryable =
        error instanceof MercadoPublicoRecordedJobFailureError
          ? error.retryable
          : classifyFailure(error) === 'retryable_failed';
      await this.mercadoPublicoV2SyncControlService.finalizeCommand({
        commandId: data.commandId,
        attemptId: claim.attemptId,
        attemptNumber: claim.attemptNumber,
        status: retryable ? 'retryable_failed' : 'failed',
        errorSummary:
          error instanceof Error
            ? error.message
            : 'Mercado Publico V2 sync command failed',
      });

      throw error;
    }
  }
}
