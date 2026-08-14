import { OptionMeta } from 'nest-commander/src/constants';

import { MERCADO_PUBLICO_SUPPORTED_JOB_NAMES_TEXT } from 'src/engine/core-modules/mercado-publico/mercado-publico.constants';
import { MercadoPublicoRunCommand } from 'src/engine/core-modules/mercado-publico/commands/mercado-publico-run.command';
import { MercadoPublicoConfigService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-config.service';
import { MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';

describe('MercadoPublicoRunCommand', () => {
  const mockAdd = jest.fn();

  const configService = {
    getSettings: jest.fn().mockReturnValue({
      httpMaxRetries: 3,
      httpRetryBackoffMs: 5000,
    }),
  } as unknown as jest.Mocked<MercadoPublicoConfigService>;

  const command = new MercadoPublicoRunCommand(
    { add: mockAdd } as unknown as MessageQueueService,
    configService,
  );

  it('accepts implemented job names', () => {
    expect(command.parseJobName('api-v1-licitaciones-by-date')).toBe(
      'api-v1-licitaciones-by-date',
    );
    expect(command.parseJobName('csv-staging-projection')).toBe(
      'csv-staging-projection',
    );
  });

  it('accepts reconciliation-refresh as implemented job name', () => {
    expect(command.parseJobName('reconciliation-refresh')).toBe(
      'reconciliation-refresh',
    );
  });

  it('advertises all supported job names in the option help text', () => {
    const optionMetadata = Reflect.getMetadata(
      OptionMeta,
      MercadoPublicoRunCommand.prototype.parseJobName,
    ) as { description: string };

    expect(optionMetadata.description).toContain(
      MERCADO_PUBLICO_SUPPORTED_JOB_NAMES_TEXT,
    );
    expect(optionMetadata.description).toContain('csv-staging-projection');
    expect(optionMetadata.description).toContain('csv-canonical-refresh');
    expect(optionMetadata.description).toContain('reconciliation-refresh');
  });

  it('enqueues job with bounded retry and fixed backoff from config', async () => {
    await command.run([], {
      jobName: 'api-v1-licitaciones-by-date',
      payload: { fecha: '01012026' },
    });

    expect(mockAdd).toHaveBeenCalledWith(
      'MercadoPublicoJob',
      expect.objectContaining({
        jobName: 'api-v1-licitaciones-by-date',
        payload: { fecha: '01012026' },
        executionKey: expect.stringMatching(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
        ),
      }),
      {
        retryLimit: 3,
        backoff: { type: 'fixed', delay: 5000 },
      },
    );
  });

  it('reuses an explicit execution key and validates its format', async () => {
    const executionKey = '4a88c929-8420-4a9e-8b78-c11a90ee0bd9';

    await command.run([], {
      jobName: 'api-v1-licitaciones-by-date',
      executionKey,
    });

    expect(mockAdd).toHaveBeenLastCalledWith(
      'MercadoPublicoJob',
      expect.objectContaining({ executionKey }),
      expect.anything(),
    );
    expect(command.parseExecutionKey(executionKey)).toBe(executionKey);
    expect(() => command.parseExecutionKey('not-a-uuid')).toThrow(/uuid/i);
  });
});
