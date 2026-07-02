import { NotImplementedException } from '@nestjs/common';

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

    return {
      stagingProjectionService,
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
      ),
    };
  };

  it('routes csv-staging-projection to the staging projection service', async () => {
    const { service, stagingProjectionService } = createService();

    await service.run('csv-staging-projection', payload);

    expect(stagingProjectionService.run).toHaveBeenCalledWith(payload);
  });

  it('keeps csv-canonical-refresh explicitly unimplemented', async () => {
    const { service, stagingProjectionService } = createService();

    await expect(
      service.run('csv-canonical-refresh', payload),
    ).rejects.toThrow(NotImplementedException);
    expect(stagingProjectionService.run).not.toHaveBeenCalled();
  });
});
