import { type DataSource, type QueryRunner } from 'typeorm';

import { MpV2StagingIdempotencySlowInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-slow-1795000000000-mp-v2-staging-idempotency';

describe('MpV2StagingIdempotencySlowInstanceCommand', () => {
  it('locks writes while deduplicating and creating the unique index', async () => {
    const query = jest.fn().mockResolvedValue(undefined);
    const transaction = jest
      .fn()
      .mockImplementation(async (callback) => callback({ query }));

    await new MpV2StagingIdempotencySlowInstanceCommand().runDataMigration({
      transaction,
    } as unknown as DataSource);

    expect(query.mock.calls[0][0]).toContain('SHARE ROW EXCLUSIVE');
    expect(query.mock.calls[1][0]).toContain('ROW_NUMBER() OVER');
    expect(query.mock.calls[1][0]).toContain(
      '(observation_id IS NOT NULL) DESC',
    );
    expect(query.mock.calls[2][0]).toContain(
      'CREATE UNIQUE INDEX IF NOT EXISTS',
    );
    expect(transaction).toHaveBeenCalledTimes(1);
  });

  it('attaches and removes the unique constraint', async () => {
    const query = jest.fn().mockResolvedValue(undefined);
    const runner = { query } as unknown as QueryRunner;
    const command = new MpV2StagingIdempotencySlowInstanceCommand();

    await command.up(runner);
    await command.down(runner);

    expect(query.mock.calls[0][0]).toContain(
      'CREATE UNIQUE INDEX IF NOT EXISTS',
    );
    expect(query.mock.calls[1][0]).toContain('UNIQUE USING INDEX');
    expect(query.mock.calls[2][0]).toContain('DROP CONSTRAINT IF EXISTS');
  });
});
