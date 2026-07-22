import { MercadoPublicoJobOrchestratorService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-job-orchestrator.service';

describe('MercadoPublicoJobOrchestratorService', () => {
  const payload = { raw_csv_file_id: 'csv-file-id' };

  const createService = () => {
    const configService = {
      getSettings: jest.fn().mockReturnValue({
        csvDownloadEnabled: true,
        quotaTimezone: 'America/Santiago',
      }),
    };
    const noopService = { run: jest.fn() };
    const stagingProjectionService = { run: jest.fn() };
    const canonicalRefreshService = {
      refreshCanonicalFromCsvSnapshot: jest.fn().mockResolvedValue({
        licitacionItems: 1,
        licitacionOfertas: 1,
        licitacionAdjudicaciones: 1,
        ordenCompraItems: 1,
        total: 4,
      }),
    };
    const reconciliationService = {
      refreshAllExactReconciliation: jest.fn().mockResolvedValue({
        exactCodigoExterno: 2,
        csvApiSameBusinessKey: 1,
        exactCodigoLicitacion: 1,
        exactCompraAgilIdOrdenCompra: 1,
        total: 5,
      }),
      refreshAllHeuristicReconciliation: jest.fn().mockResolvedValue({
        candidates: 1,
        unmatched: 1,
        events: 2,
        goldProcessesMaterialized: 2,
        total: 4,
      }),
    };
    const persistenceService = {
      createJobRun: jest.fn().mockResolvedValue({
        id: 'job-run-record-id',
      }),
      finalizeJobRun: jest.fn().mockResolvedValue(undefined),
    };

    return {
      stagingProjectionService,
      canonicalRefreshService,
      reconciliationService,
      persistenceService,
      service: new MercadoPublicoJobOrchestratorService(
        configService as never,
        noopService as never,
        noopService as never,
        noopService as never,
        noopService as never,
        noopService as never,
        noopService as never,
        noopService as never,
        noopService as never,
        noopService as never,
        noopService as never,
        noopService as never,
        noopService as never,
        noopService as never,
        stagingProjectionService as never,
        canonicalRefreshService as never,
        reconciliationService as never,
        persistenceService as never,
      ),
    };
  };

  it('routes csv-staging-projection to the staging projection service', async () => {
    const { service, stagingProjectionService } = createService();

    await service.run('csv-staging-projection', payload);

    expect(stagingProjectionService.run).toHaveBeenCalledWith(payload);
  });

  it('routes csv-canonical-refresh to canonical rerun and logs counts', async () => {
    const { service, canonicalRefreshService } = createService();

    await service.run('csv-canonical-refresh', payload);

    expect(
      canonicalRefreshService.refreshCanonicalFromCsvSnapshot,
    ).toHaveBeenCalledWith('csv-file-id');
  });

  it('rejects csv-canonical-refresh without raw_csv_file_id', async () => {
    const { service, canonicalRefreshService } = createService();

    await expect(service.run('csv-canonical-refresh', {})).rejects.toThrow(
      'Mercado Publico csv-canonical-refresh payload requires a non-empty "raw_csv_file_id" string',
    );

    expect(
      canonicalRefreshService.refreshCanonicalFromCsvSnapshot,
    ).not.toHaveBeenCalled();
  });

  it('routes reconciliation-refresh to exact reconciliation and logs counts', async () => {
    const { service, reconciliationService, persistenceService } =
      createService();

    await service.run('reconciliation-refresh', payload);

    expect(
      reconciliationService.refreshAllExactReconciliation,
    ).toHaveBeenCalled();
    expect(
      reconciliationService.refreshAllHeuristicReconciliation,
    ).toHaveBeenCalled();
    expect(persistenceService.createJobRun).toHaveBeenCalledWith(
      'reconciliation-refresh',
    );
    expect(persistenceService.finalizeJobRun).toHaveBeenCalledWith({
      jobRunRecordId: 'job-run-record-id',
      status: 'success',
      finishedAt: expect.any(Date),
    });
  });

  it('finalizes a failed reconciliation refresh and rethrows the error', async () => {
    const { service, reconciliationService, persistenceService } =
      createService();
    const error = new Error('reconciliation failed');
    reconciliationService.refreshAllExactReconciliation.mockRejectedValueOnce(
      error,
    );

    await expect(service.run('reconciliation-refresh', payload)).rejects.toBe(
      error,
    );

    expect(persistenceService.finalizeJobRun).toHaveBeenCalledWith({
      jobRunRecordId: 'job-run-record-id',
      status: 'failed',
      finishedAt: expect.any(Date),
      errorSummary: 'hard_fail: reconciliation failed',
    });
  });
});
