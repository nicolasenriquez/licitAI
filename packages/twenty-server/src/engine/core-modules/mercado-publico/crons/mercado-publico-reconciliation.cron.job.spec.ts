import { MercadoPublicoReconciliationCronJob } from 'src/engine/core-modules/mercado-publico/crons/mercado-publico-reconciliation.cron.job';
import { MercadoPublicoJob } from 'src/engine/core-modules/mercado-publico/jobs/mercado-publico.job';
import { MercadoPublicoConfigService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-config.service';
import { MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';

describe('MercadoPublicoReconciliationCronJob', () => {
  it('delegates scheduled reconciliation to the Mercado Publico queue', async () => {
    const add = jest.fn();
    const configService = {
      getSettings: jest.fn().mockReturnValue({
        httpMaxRetries: 3,
        httpRetryBackoffMs: 5000,
      }),
    } as unknown as jest.Mocked<MercadoPublicoConfigService>;
    const job = new MercadoPublicoReconciliationCronJob(
      { add } as unknown as MessageQueueService,
      configService,
    );

    await job.handle();

    expect(add).toHaveBeenCalledWith(
      MercadoPublicoJob.name,
      {
        jobName: 'reconciliation-refresh',
        payload: {},
        requestedAt: expect.any(String),
        requestedBy: 'schedule',
      },
      {
        retryLimit: 3,
        backoff: { type: 'fixed', delay: 5000 },
      },
    );
  });
});
