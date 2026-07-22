import { MercadoPublicoReconciliationCronCommand } from 'src/engine/core-modules/mercado-publico/crons/commands/mercado-publico-reconciliation.cron.command';
import {
  MercadoPublicoReconciliationCronJob,
  MERCADO_PUBLICO_RECONCILIATION_CRON_INTERVAL_MS,
  MERCADO_PUBLICO_RECONCILIATION_CRON_JOB_ID,
} from 'src/engine/core-modules/mercado-publico/crons/mercado-publico-reconciliation.cron.job';
import { MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';

describe('MercadoPublicoReconciliationCronCommand', () => {
  it('registers one stable daily scheduler without running reconciliation', async () => {
    const addCron = jest.fn();
    const command = new MercadoPublicoReconciliationCronCommand({
      addCron,
    } as unknown as MessageQueueService);

    await command.run();
    await command.run();

    expect(addCron).toHaveBeenCalledTimes(2);
    expect(addCron).toHaveBeenNthCalledWith(1, {
      jobName: MercadoPublicoReconciliationCronJob.name,
      jobId: MERCADO_PUBLICO_RECONCILIATION_CRON_JOB_ID,
      data: undefined,
      options: {
        repeat: {
          every: MERCADO_PUBLICO_RECONCILIATION_CRON_INTERVAL_MS,
        },
      },
    });
    expect(addCron).toHaveBeenNthCalledWith(2, {
      jobName: MercadoPublicoReconciliationCronJob.name,
      jobId: MERCADO_PUBLICO_RECONCILIATION_CRON_JOB_ID,
      data: undefined,
      options: {
        repeat: {
          every: MERCADO_PUBLICO_RECONCILIATION_CRON_INTERVAL_MS,
        },
      },
    });
  });
});
