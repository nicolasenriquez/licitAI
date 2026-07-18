import { MpCompraAgilV2DatesBackfillSlowInstanceCommand } from 'src/database/commands/upgrade-version-command/2-16/2-16-instance-command-slow-1784100000010-mp-compra-agil-v2-dates-backfill';

describe('MpCompraAgilV2DatesBackfillSlowInstanceCommand', () => {
  it('reprojects raw V2 payloads without contacting the upstream API', async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce([
        {
          id: 'raw-payload-id',
          raw_payload: {
            payload: {
              items: [
                {
                  codigo: 'CA-1',
                  institucion: { region: 13 },
                  fechas: {
                    fecha_publicacion: '2026-06-01T09:30:00',
                    fecha_cierre: 'invalid',
                  },
                },
              ],
            },
          },
        },
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    const dataSource = {
      query,
      transaction: jest.fn(
        async (callback: (entityManager: { query: jest.Mock }) => unknown) =>
          callback({ query }),
      ),
    };
    const command = new MpCompraAgilV2DatesBackfillSlowInstanceCommand();

    await command.runDataMigration(dataSource as never);

    const updateCall = query.mock.calls.find(
      ([sql]) => typeof sql === 'string' && sql.includes('UPDATE mp.stg_api_v2'),
    );

    expect(updateCall?.[1]).toEqual([
      'raw-payload-id',
      'CA-1',
      '2026-06-01T09:30:00',
      'invalid',
      null,
      new Date('2026-06-01T13:30:00.000Z'),
      null,
      null,
      13,
    ]);
    expect(dataSource.transaction).toHaveBeenCalledTimes(1);
  });
});
