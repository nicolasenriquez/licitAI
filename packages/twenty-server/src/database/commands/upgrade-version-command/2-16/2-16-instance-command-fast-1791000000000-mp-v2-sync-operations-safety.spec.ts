import { type QueryRunner } from 'typeorm';

import { MpV2SyncOperationsPreflightFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1790999999999-mp-v2-sync-operations-preflight';
import { MpV2SyncOperationsAttemptTimestampFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1791000000001-mp-v2-sync-operations-attempt-timestamp';

describe('MpV2SyncOperations safety commands', () => {
  it('rejects duplicate active runs before the one-active-run index command', async () => {
    const query = jest.fn().mockResolvedValue([
      { source: 'api-v2-compra-agil', scope: 'global', run_count: '2' },
    ]);

    await expect(
      new MpV2SyncOperationsPreflightFastInstanceCommand().up(
        { query } as unknown as QueryRunner,
      ),
    ).rejects.toThrow('duplicate active runs exist');
  });

  it('adds the attempt timestamp required by worker updates', async () => {
    const query = jest.fn().mockResolvedValue([]);

    await new MpV2SyncOperationsAttemptTimestampFastInstanceCommand().up(
      { query } as unknown as QueryRunner,
    );

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('ADD COLUMN IF NOT EXISTS updated_at'),
    );
  });
});
