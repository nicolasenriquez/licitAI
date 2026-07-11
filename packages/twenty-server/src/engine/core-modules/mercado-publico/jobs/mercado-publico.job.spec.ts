import { BadRequestException } from '@nestjs/common';

import {
  MercadoPublicoJob,
  type MercadoPublicoJobData,
} from 'src/engine/core-modules/mercado-publico/jobs/mercado-publico.job';
import { MercadoPublicoJobOrchestratorService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-job-orchestrator.service';
import { MercadoPublicoRecordedJobFailureError } from 'src/engine/core-modules/mercado-publico/services/utils/mercado-publico-recorded-job-failure.error';

describe('MercadoPublicoJob', () => {
  const jobData: MercadoPublicoJobData = {
    jobName: 'api-v1-licitaciones-by-state',
    payload: { estado: 'publicada' },
    requestedAt: '2026-07-11T00:00:00.000Z',
    requestedBy: 'command',
  };

  it('should acknowledge recorded non-retryable failures', async () => {
    const orchestratorService = {
      run: jest
        .fn()
        .mockRejectedValue(
          new MercadoPublicoRecordedJobFailureError('param_error', false),
        ),
    } as unknown as MercadoPublicoJobOrchestratorService;
    const job = new MercadoPublicoJob(orchestratorService);

    await expect(job.handle(jobData)).resolves.toBeUndefined();
  });

  it('should acknowledge deterministic bad-request failures', async () => {
    const orchestratorService = {
      run: jest
        .fn()
        .mockRejectedValue(new BadRequestException('invalid payload')),
    } as unknown as MercadoPublicoJobOrchestratorService;
    const job = new MercadoPublicoJob(orchestratorService);

    await expect(job.handle(jobData)).resolves.toBeUndefined();
  });

  it('should rethrow recorded retryable failures', async () => {
    const failure = new MercadoPublicoRecordedJobFailureError(
      'retryable_failed: upstream unavailable',
      true,
    );
    const orchestratorService = {
      run: jest.fn().mockRejectedValue(failure),
    } as unknown as MercadoPublicoJobOrchestratorService;
    const job = new MercadoPublicoJob(orchestratorService);

    await expect(job.handle(jobData)).rejects.toBe(failure);
  });
});
