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
    const incrementalService = { run: jest.fn() };
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
        goldStatusesUpdated: 1,
        total: 4,
      }),
    };

    return {
      stagingProjectionService,
      canonicalRefreshService,
      reconciliationService,
      service: new MercadoPublicoJobOrchestratorService(
        configService as never,
        noopService as never,
        noopService as never,
        noopService as never,
        noopService as never,
        noopService as never,
        noopService as never,
        incrementalService as never,
        noopService as never,
        noopService as never,
        noopService as never,
        noopService as never,
        noopService as never,
        noopService as never,
        stagingProjectionService as never,
        canonicalRefreshService as never,
        reconciliationService as never,
      ),
      incrementalService,
    };
  };

  it('routes csv-staging-projection to the staging projection service', async () => {
    const { service, stagingProjectionService } = createService();

    await service.run('csv-staging-projection', payload);

    expect(stagingProjectionService.run).toHaveBeenCalledWith(payload);
  });

  it('keeps production V2 incremental jobs on durable incremental ingestion', async () => {
    const { service, incrementalService } = createService();
    const incrementalPayload = {
      ttl_cambio_ms: 1,
      cambio_desde: '2026-06-01T00:00:00.000Z',
    };

    await service.run('api-v2-compra-agil-incremental', incrementalPayload);

    expect(incrementalService.run).toHaveBeenCalledWith(incrementalPayload);
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
    const { service, reconciliationService } = createService();

    await service.run('reconciliation-refresh', payload);

    expect(
      reconciliationService.refreshAllExactReconciliation,
    ).toHaveBeenCalled();
    expect(
      reconciliationService.refreshAllHeuristicReconciliation,
    ).toHaveBeenCalled();
  });
});
