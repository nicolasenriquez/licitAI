import { MpCompraAgilV2AnalyticsBackfillSlowInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-slow-1785354861323-mp-compra-agil-v2-analytics-backfill';

describe('MpCompraAgilV2AnalyticsBackfillSlowInstanceCommand', () => {
  it('backfills staging, canonical, and gold with retained evidence', async () => {
    const query = jest.fn().mockResolvedValue([]);
    const dataSource = {
      transaction: jest.fn(
        async (callback: (entityManager: { query: jest.Mock }) => unknown) =>
          callback({ query }),
      ),
    };
    const command = new MpCompraAgilV2AnalyticsBackfillSlowInstanceCommand();

    await command.runDataMigration(dataSource as never);

    expect(query).toHaveBeenCalledTimes(3);
    expect(query.mock.calls[0]?.[0]).toContain('document_count');
    expect(query.mock.calls[0]?.[0]).toContain('jsonb_array_length');
    expect(query.mock.calls[0]?.[0]).toContain('total_ofertas_recibidas');
    expect(query.mock.calls[1]?.[0]).toContain('buyer_rut');
    expect(query.mock.calls[1]?.[0]).toMatch(
      /document_count = COALESCE\(\s*EXCLUDED\.document_count,\s*mp\.compra_agil\.document_count\s*\)/,
    );
    expect(query.mock.calls[2]?.[0]).toContain('mp.gold_detected_process');
    expect(query.mock.calls[2]?.[0]).toContain('gold.document_count');
    expect(dataSource.transaction).toHaveBeenCalledTimes(1);
  });

  it('keeps instance command schema hooks explicit', async () => {
    const command = new MpCompraAgilV2AnalyticsBackfillSlowInstanceCommand();
    const query = jest.fn();

    await command.up({ query } as never);
    await command.down({ query } as never);

    expect(query).not.toHaveBeenCalled();
  });
});
