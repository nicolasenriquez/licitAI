import { Logger } from '@nestjs/common';

import { Process } from 'src/engine/core-modules/message-queue/decorators/process.decorator';
import { Processor } from 'src/engine/core-modules/message-queue/decorators/processor.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MERCADO_PUBLICO_V2_SYNC_COMMAND_JOB_NAME } from 'src/engine/core-modules/mercado-publico/mercado-publico.constants';
import { MercadoPublicoV2DurableSyncService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-v2-durable-sync.service';
import { MercadoPublicoV2SyncControlService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-v2-sync-control.service';

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

    await this.mercadoPublicoV2DurableSyncService.executeExistingRun(
      claim.syncRunId,
    );
  }
}
