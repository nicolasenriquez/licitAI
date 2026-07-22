import { type QueryRunner } from 'typeorm';

import { INSTANCE_COMMANDS } from '../instance-commands.constant';
import { MpMonitoringReadIndexesFastInstanceCommand } from './2-16-instance-command-fast-1784200000000-mp-monitoring-read-indexes';

describe('MpMonitoringReadIndexesFastInstanceCommand', () => {
  it('creates indexes for bounded monitoring reads', async () => {
    const query = jest.fn().mockResolvedValue(undefined);
    const queryRunner = { query } as unknown as QueryRunner;

    await new MpMonitoringReadIndexesFastInstanceCommand().up(queryRunner);

    const executedSql = query.mock.calls
      .map(([sql]: [string]) => sql)
      .join('\n');

    expect(query).toHaveBeenCalledTimes(3);
    expect(executedSql).toContain('idx_mp_stg_job_run_started_at');
    expect(executedSql).toContain('idx_mp_raw_api_payload_fetched_at');
    expect(executedSql).toContain(
      'idx_mp_raw_api_payload_ingestion_job_id_fetched_at',
    );
  });

  it('registers the command for instance upgrades', () => {
    expect(INSTANCE_COMMANDS).toContain(MpMonitoringReadIndexesFastInstanceCommand);
  });
});
