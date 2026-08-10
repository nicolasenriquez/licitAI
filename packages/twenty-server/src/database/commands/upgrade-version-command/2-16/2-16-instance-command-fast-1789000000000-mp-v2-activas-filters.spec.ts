import { type QueryRunner } from 'typeorm';

import { MpV2ActivasFiltersFastInstanceCommand } from './2-16-instance-command-fast-1789000000000-mp-v2-activas-filters';

describe('MpV2ActivasFiltersFastInstanceCommand', () => {
  it('adds the llamado column to the gold read surface on up', async () => {
    const query = jest.fn().mockResolvedValue(undefined);
    const queryRunner = { query } as unknown as QueryRunner;

    await new MpV2ActivasFiltersFastInstanceCommand().up(queryRunner);

    const executedSql = query.mock.calls
      .map(([sql]: [string]) => sql)
      .join('\n');

    expect(executedSql).toContain('ALTER TABLE mp.gold_detected_process');
    expect(executedSql).toContain('ADD COLUMN IF NOT EXISTS llamado integer NULL');
  });

  it('drops the llamado column on down', async () => {
    const query = jest.fn().mockResolvedValue(undefined);
    const queryRunner = { query } as unknown as QueryRunner;

    await new MpV2ActivasFiltersFastInstanceCommand().down(queryRunner);

    const executedSql = query.mock.calls
      .map(([sql]: [string]) => sql)
      .join('\n');

    expect(executedSql).toContain('DROP COLUMN IF EXISTS llamado');
  });
});
