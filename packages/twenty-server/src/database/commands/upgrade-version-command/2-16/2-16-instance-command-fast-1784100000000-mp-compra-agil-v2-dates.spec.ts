import { MpCompraAgilV2DatesFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-fast-1784100000000-mp-compra-agil-v2-dates';

describe('MpCompraAgilV2DatesFastInstanceCommand', () => {
  it('adds and removes only the V2 imported date attributes', async () => {
    const query = jest.fn();
    const command = new MpCompraAgilV2DatesFastInstanceCommand();

    await command.up({ query } as never);
    await command.down({ query } as never);

    expect(query.mock.calls[0]?.[0]).toContain('raw_fecha_publicacion');
    expect(query.mock.calls[0]?.[0]).toContain('region integer NULL');
    expect(query.mock.calls[1]?.[0]).toContain('mp.compra_agil');
    expect(query.mock.calls[2]?.[0]).toContain('DROP COLUMN IF EXISTS');
    expect(query.mock.calls[3]?.[0]).toContain('raw_fecha_ultimo_cambio');
  });
});
