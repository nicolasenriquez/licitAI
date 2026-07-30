import { MpCompraAgilV2BrowseFieldsFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1785354861317-mp-compra-agil-v2-browse-fields';

describe('MpCompraAgilV2BrowseFieldsFastInstanceCommand', () => {
  it('adds and removes title and buyer name on staging and canonical tables', async () => {
    const query = jest.fn();
    const command = new MpCompraAgilV2BrowseFieldsFastInstanceCommand();

    await command.up({ query } as never);
    await command.down({ query } as never);

    expect(query).toHaveBeenCalledTimes(4);
    expect(query.mock.calls[0]?.[0]).toContain('mp.stg_api_v2_compra_agil');
    expect(query.mock.calls[0]?.[0]).toContain('ADD COLUMN title text');
    expect(query.mock.calls[1]?.[0]).toContain('mp.compra_agil');
    expect(query.mock.calls[2]?.[0]).toContain('DROP COLUMN buyer_name');
    expect(query.mock.calls[3]?.[0]).toContain('DROP COLUMN title');
  });
});
