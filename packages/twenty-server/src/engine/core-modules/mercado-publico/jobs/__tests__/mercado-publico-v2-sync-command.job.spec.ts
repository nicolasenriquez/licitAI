import { MercadoPublicoV2SyncCommandJob } from 'src/engine/core-modules/mercado-publico/jobs/mercado-publico-v2-sync-command.job';
import { type MercadoPublicoV2SyncControlService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-v2-sync-control.service';
import { type MercadoPublicoV2DurableSyncService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-v2-durable-sync.service';

describe('MercadoPublicoV2SyncCommandJob', () => {
  const buildControlService = (claimResult: unknown) =>
    ({
      claimCommand: jest.fn().mockResolvedValue(claimResult),
    }) as unknown as jest.Mocked<MercadoPublicoV2SyncControlService>;

  const buildDurableService = () =>
    ({
      executeExistingRun: jest.fn().mockResolvedValue({ status: 'succeeded' }),
      start: jest.fn(),
    }) as unknown as jest.Mocked<MercadoPublicoV2DurableSyncService>;

  it('executes a claimed command only through existing-run entry points', async () => {
    const controlService = buildControlService({
      kind: 'claimed',
      syncRunId: 'run-1',
      attemptId: 'attempt-1',
    });
    const durableService = buildDurableService();
    const job = new MercadoPublicoV2SyncCommandJob(
      controlService,
      durableService,
    );

    await job.handle({ commandId: 'command-1' });

    expect(controlService.claimCommand).toHaveBeenCalledWith(
      'command-1',
      expect.any(String),
    );
    expect(durableService.executeExistingRun).toHaveBeenCalledWith('run-1');
    expect(durableService.start).not.toHaveBeenCalled();
  });

  it('is a no-op for a terminal or duplicate command', async () => {
    const controlService = buildControlService({
      kind: 'noop',
      reason: 'already_terminal',
    });
    const durableService = buildDurableService();
    const job = new MercadoPublicoV2SyncCommandJob(
      controlService,
      durableService,
    );

    await job.handle({ commandId: 'command-terminal' });

    expect(durableService.executeExistingRun).not.toHaveBeenCalled();
    expect(durableService.start).not.toHaveBeenCalled();
  });

  it('is a no-op for a queued cancellation', async () => {
    const controlService = buildControlService({
      kind: 'noop',
      reason: 'cancelled',
    });
    const durableService = buildDurableService();
    const job = new MercadoPublicoV2SyncCommandJob(
      controlService,
      durableService,
    );

    await job.handle({ commandId: 'command-cancelled' });

    expect(durableService.executeExistingRun).not.toHaveBeenCalled();
  });

  it('continues a stale-heartbeat command from its durable checkpoints', async () => {
    const controlService = buildControlService({
      kind: 'claimed',
      syncRunId: 'run-stale',
      attemptId: 'attempt-2',
    });
    const durableService = buildDurableService();
    const job = new MercadoPublicoV2SyncCommandJob(
      controlService,
      durableService,
    );

    await job.handle({ commandId: 'command-stale' });

    expect(controlService.claimCommand).toHaveBeenCalledWith(
      'command-stale',
      expect.any(String),
    );
    expect(durableService.executeExistingRun).toHaveBeenCalledWith(
      'run-stale',
    );
  });

  it('does not perform provider work itself', async () => {
    const controlService = buildControlService({
      kind: 'noop',
      reason: 'already_terminal',
    });
    const durableService = buildDurableService();
    const job = new MercadoPublicoV2SyncCommandJob(
      controlService,
      durableService,
    );

    expect(
      (job as unknown as Record<string, unknown>).mercadoPublicoApiV2CompraAgilClientService,
    ).toBeUndefined();

    await job.handle({ commandId: 'command-1' });
  });
});
