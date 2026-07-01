import { OptionMeta } from 'nest-commander/src/constants';

import { MERCADO_PUBLICO_SUPPORTED_JOB_NAMES_TEXT } from 'src/engine/core-modules/mercado-publico/mercado-publico.constants';
import { MercadoPublicoRunCommand } from 'src/engine/core-modules/mercado-publico/commands/mercado-publico-run.command';
import { MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';

describe('MercadoPublicoRunCommand', () => {
  const command = new MercadoPublicoRunCommand({
    add: jest.fn(),
  } as unknown as MessageQueueService);

  it('accepts implemented job names', () => {
    expect(command.parseJobName('api-v1-licitaciones-by-date')).toBe(
      'api-v1-licitaciones-by-date',
    );
  });

  it('rejects unimplemented csv and reconciliation job names', () => {
    expect(() => command.parseJobName('csv-raw-load')).toThrow(
      'Unsupported Mercado Publico job "csv-raw-load"',
    );
    expect(() => command.parseJobName('reconciliation-refresh')).toThrow(
      'Unsupported Mercado Publico job "reconciliation-refresh"',
    );
  });

  it('does not advertise unimplemented job names in the option help text', () => {
    const optionMetadata = Reflect.getMetadata(
      OptionMeta,
      MercadoPublicoRunCommand.prototype.parseJobName,
    ) as { description: string };

    expect(optionMetadata.description).toContain(
      MERCADO_PUBLICO_SUPPORTED_JOB_NAMES_TEXT,
    );
    expect(optionMetadata.description).not.toContain('csv-raw-load');
    expect(optionMetadata.description).not.toContain('reconciliation-refresh');
  });
});
