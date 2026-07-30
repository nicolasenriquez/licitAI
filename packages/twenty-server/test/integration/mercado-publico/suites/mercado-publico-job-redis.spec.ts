import { randomUUID } from 'node:crypto';

import { Queue, Worker } from 'bullmq';

import {
  MercadoPublicoJob,
  type MercadoPublicoJobData,
} from 'src/engine/core-modules/mercado-publico/jobs/mercado-publico.job';
import { MercadoPublicoJobOrchestratorService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-job-orchestrator.service';
import { MercadoPublicoRecordedJobFailureError } from 'src/engine/core-modules/mercado-publico/services/utils/mercado-publico-recorded-job-failure.error';

const redisUrl = process.env.REDIS_URL;
const describeWithRedis = redisUrl ? describe : describe.skip;

const getConnection = () => {
  const url = new URL(redisUrl as string);

  return {
    host: url.hostname,
    port: Number(url.port || '6379'),
    ...(url.password ? { password: decodeURIComponent(url.password) } : {}),
  };
};

describeWithRedis('MercadoPublicoJob Redis queue semantics', () => {
  it('marks hard authentication failures as failed without consuming retry attempts', async () => {
    const queueName = `mercado-publico-hard-fail-${randomUUID()}`;
    const connection = getConnection();
    const queue = new Queue(queueName, { connection });
    const mercadoPublicoJob = new MercadoPublicoJob({
      run: jest.fn().mockRejectedValue(
        new MercadoPublicoRecordedJobFailureError(
          'hard_fail: unauthorized',
          false,
          'hard_fail',
        ),
      ),
    } as unknown as MercadoPublicoJobOrchestratorService);
    const worker = new Worker(
      queueName,
      async () =>
        mercadoPublicoJob.handle({
          jobName: 'api-v1-licitaciones-by-state',
          payload: { estado: 'publicada' },
          requestedAt: new Date().toISOString(),
          requestedBy: 'command',
        } satisfies MercadoPublicoJobData),
      { connection },
    );

    try {
      await Promise.all([queue.waitUntilReady(), worker.waitUntilReady()]);

      const failed = new Promise<void>((resolve, reject) => {
        worker.once('failed', (job, error) => {
          if (!job || error.message !== 'hard_fail: unauthorized') {
            reject(error);

            return;
          }

          resolve();
        });
      });
      const queuedJob = await queue.add('mercado-publico', {}, { attempts: 3 });

      await failed;

      const failedJob = await queue.getJob(queuedJob.id as string);

      expect(await failedJob?.getState()).toBe('failed');
      expect(failedJob?.attemptsMade).toBe(1);
    } finally {
      await worker.close();
      await queue.obliterate({ force: true });
      await queue.close();
    }
  });
});
