import { DataSource } from 'typeorm';

import { MercadoPublicoV2E2EReadModelSeedCommand } from 'src/engine/core-modules/mercado-publico/commands/mercado-publico-v2-e2e-read-model-seed.command';

const enabledEnvironment = {
  MERCADO_PUBLICO_V2_E2E_READ_MODEL_SEED_ENABLED: 'true',
  MERCADO_PUBLICO_V2_E2E_READ_MODEL_SEED_SCOPE: 'isolated',
};

describe('MercadoPublicoV2E2EReadModelSeedCommand', () => {
  const originalEnvironment = process.env;

  afterEach(() => {
    process.env = originalEnvironment;
  });

  it('rejects use outside an explicitly isolated deployment', async () => {
    process.env = { ...originalEnvironment };
    const transaction = jest.fn();
    const command = new MercadoPublicoV2E2EReadModelSeedCommand({
      transaction,
    } as unknown as DataSource);

    await expect(command.run()).rejects.toThrow(
      'MERCADO_PUBLICO_V2_E2E_READ_MODEL_SEED_ENABLED=true and MERCADO_PUBLICO_V2_E2E_READ_MODEL_SEED_SCOPE=isolated are required',
    );
    expect(transaction).not.toHaveBeenCalled();
  });

  it('seeds and verifies fixture-owned read models in one transaction', async () => {
    process.env = { ...originalEnvironment, ...enabledEnvironment };
    const query = jest
      .fn()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          goldCount: 4,
          codedBuyerCount: 3,
          uncodedBuyerCount: 1,
          historyCount: 2,
          operatorCount: 1,
          utmAmountMatches: true,
        },
      ]);
    const transaction = jest.fn(async (runInTransaction) =>
      runInTransaction({ query }),
    );
    const command = new MercadoPublicoV2E2EReadModelSeedCommand({
      transaction,
    } as unknown as DataSource);

    await command.run();

    expect(transaction).toHaveBeenCalledTimes(1);
    expect(query).toHaveBeenCalledTimes(3);
    expect(query.mock.calls[0][0]).toContain('DELETE FROM mp.v2_history');
    expect(query.mock.calls[0][0]).not.toContain('TRUNCATE');
    expect(query.mock.calls[0][0]).toContain(
      'INSERT INTO mp.gold_detected_process',
    );
    expect(query.mock.calls[1][0]).toContain('INSERT INTO mp.sync_operator');
  });
});
