import { MpCompraAgilV2BrowseBackfillSlowInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-slow-1785354861318-mp-compra-agil-v2-browse-backfill';

describe('MpCompraAgilV2BrowseBackfillSlowInstanceCommand', () => {
  it('reprojects retained raw evidence and preserves known canonical values', async () => {
    const query = jest.fn().mockResolvedValue([]);
    const dataSource = {
      transaction: jest.fn(
        async (callback: (entityManager: { query: jest.Mock }) => unknown) =>
          callback({ query }),
      ),
    };
    const command = new MpCompraAgilV2BrowseBackfillSlowInstanceCommand();

    await command.runDataMigration(dataSource as never);

    expect(query).toHaveBeenCalledTimes(3);
    expect(query.mock.calls[0]?.[0]).toContain("raw.source = 'api-v2-compra-agil'");
    expect(query.mock.calls[0]?.[0]).toContain("retained.record->>'nombre'");
    expect(query.mock.calls[1]?.[0]).toContain(
      'fecha_ultimo_cambio DESC NULLS LAST',
    );
    expect(query.mock.calls[1]?.[0]).toContain(
      'COALESCE(EXCLUDED.title, mp.compra_agil.title)',
    );
    expect(query.mock.calls[2]?.[0]).toContain('mp.gold_detected_process');
    expect(dataSource.transaction).toHaveBeenCalledTimes(1);
  });
});
