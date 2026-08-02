import { type QueryRunner } from 'typeorm';

import { INSTANCE_COMMANDS } from '../instance-commands.constant';
import { MpStgJobRunManifestFastInstanceCommand } from './2-16-instance-command-fast-1785354861321-mp-stg-job-run-manifest';

describe('MpStgJobRunManifestFastInstanceCommand', () => {
  it('adds and removes the nullable manifest column', async () => {
    const query = jest.fn().mockResolvedValue(undefined);
    const queryRunner = { query } as unknown as QueryRunner;
    const command = new MpStgJobRunManifestFastInstanceCommand();

    await command.up(queryRunner);
    await command.down(queryRunner);

    expect(query).toHaveBeenCalledTimes(2);
    expect(query.mock.calls[0]?.[0]).toContain('manifest_json jsonb NULL');
    expect(query.mock.calls[1]?.[0]).toContain('DROP COLUMN IF EXISTS manifest_json');
  });

  it('registers the command for instance upgrades', () => {
    expect(INSTANCE_COMMANDS).toContain(MpStgJobRunManifestFastInstanceCommand);
  });
});
