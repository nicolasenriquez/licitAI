import { type QueryRunner } from 'typeorm';

import { MpCanonicalLicitacionFastInstanceCommand } from './2-16-instance-command-fast-1782340007860-mp-canonical-licitacion';

describe('MpCanonicalLicitacionFastInstanceCommand', () => {
  it('should enforce oferta and adjudicacion natural keys with NULLS NOT DISTINCT', async () => {
    const query = jest.fn().mockResolvedValue(undefined);
    const queryRunner = {
      query,
    } as unknown as QueryRunner;

    const command = new MpCanonicalLicitacionFastInstanceCommand();

    await command.up(queryRunner);

    const executedSql = query.mock.calls
      .map(([sql]: [string]) => sql)
      .join('\n');

    expect(executedSql).toContain(
      'UNIQUE NULLS NOT DISTINCT (\n            codigo_externo,\n            codigoitem,\n            codigo_proveedor,\n            nombre_de_la_oferta',
    );
    expect(executedSql).toContain(
      'UNIQUE NULLS NOT DISTINCT (codigo_externo, codigoitem, rut_proveedor)',
    );
  });
});
