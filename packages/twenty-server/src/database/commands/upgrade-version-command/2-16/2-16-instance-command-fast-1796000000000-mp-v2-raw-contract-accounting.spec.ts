import { type QueryRunner } from 'typeorm';

import { MpV2RawContractAccountingFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1796000000000-mp-v2-raw-contract-accounting';
import { INSTANCE_COMMANDS } from 'src/database/commands/upgrade-version-command/instance-commands.constant';

describe('MpV2RawContractAccountingFastInstanceCommand', () => {
  it('is registered as an instance command provider', () => {
    expect(INSTANCE_COMMANDS).toContain(
      MpV2RawContractAccountingFastInstanceCommand,
    );
  });

  it('adds additive raw contract accounting columns', async () => {
    const query = jest.fn().mockResolvedValue(undefined);
    const queryRunner = { query } as unknown as QueryRunner;

    await new MpV2RawContractAccountingFastInstanceCommand().up(queryRunner);

    const sql = query.mock.calls.map(([statement]) => statement).join('\n');

    expect(sql).toContain('ADD COLUMN IF NOT EXISTS records_accepted integer NULL');
    expect(sql).toContain('ADD COLUMN IF NOT EXISTS records_rejected integer NULL');
    expect(sql).toContain('ADD COLUMN IF NOT EXISTS contract_issues jsonb NULL');
  });

  it('removes only raw contract accounting columns', async () => {
    const query = jest.fn().mockResolvedValue(undefined);
    const queryRunner = { query } as unknown as QueryRunner;

    await new MpV2RawContractAccountingFastInstanceCommand().down(queryRunner);

    const sql = query.mock.calls.map(([statement]) => statement).join('\n');

    expect(sql).toContain('DROP COLUMN IF EXISTS contract_issues');
    expect(sql).toContain('DROP COLUMN IF EXISTS records_rejected');
    expect(sql).toContain('DROP COLUMN IF EXISTS records_accepted');
  });
});
