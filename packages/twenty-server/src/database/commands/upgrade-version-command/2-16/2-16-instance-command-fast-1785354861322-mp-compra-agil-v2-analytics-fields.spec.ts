import { type QueryRunner } from 'typeorm';

import { INSTANCE_COMMANDS } from '../instance-commands.constant';
import { MpCompraAgilV2AnalyticsFieldsFastInstanceCommand } from './2-16-instance-command-fast-1785354861322-mp-compra-agil-v2-analytics-fields';

describe('MpCompraAgilV2AnalyticsFieldsFastInstanceCommand', () => {
  it('adds and removes nullable analytics fields from all read shapes', async () => {
    const query = jest.fn().mockResolvedValue(undefined);
    const command = new MpCompraAgilV2AnalyticsFieldsFastInstanceCommand();

    await command.up({ query } as unknown as QueryRunner);
    await command.down({ query } as unknown as QueryRunner);

    expect(query).toHaveBeenCalledTimes(6);
    expect(query.mock.calls[0]?.[0]).toContain(
      'ALTER TABLE IF EXISTS mp.stg_api_v2_compra_agil',
    );
    expect(query.mock.calls[0]?.[0]).toContain('document_count integer NULL');
    expect(query.mock.calls[1]?.[0]).toContain(
      'ALTER TABLE IF EXISTS mp.compra_agil',
    );
    expect(query.mock.calls[2]?.[0]).toContain(
      'ALTER TABLE IF EXISTS mp.gold_detected_process',
    );
    expect(query.mock.calls[3]?.[0]).toContain(
      'DROP COLUMN IF EXISTS offers_received_count',
    );
    expect(query.mock.calls[5]?.[0]).toContain(
      'DROP COLUMN IF EXISTS buyer_rut',
    );
  });

  it('registers command for instance upgrades', () => {
    expect(INSTANCE_COMMANDS).toContain(
      MpCompraAgilV2AnalyticsFieldsFastInstanceCommand,
    );
  });
});
