import {
  classifyV2CompraAgilLifecycle,
  getV2CompraAgilStateLabel,
  isHistoricalV2CompraAgilSyncIntent,
} from 'src/engine/core-modules/mercado-publico/drivers/api/utils/classify-v2-compra-agil-lifecycle.util';

describe('classifyV2CompraAgilLifecycle', () => {
  it('only discovers a new published record', () => {
    expect(
      classifyV2CompraAgilLifecycle(
        { codigo: 'CA-1', estado: 'cerrada' },
        false,
      ),
    ).toMatchObject({ includeInCohort: false, terminal: false });
    expect(
      classifyV2CompraAgilLifecycle(
        { codigo: 'CA-2', estado: 'publicada' },
        false,
      ),
    ).toMatchObject({ includeInCohort: true, reason: 'new_published' });
  });

  it('keeps known records through non-terminal lifecycle states', () => {
    expect(
      classifyV2CompraAgilLifecycle(
        { codigo: 'CA-1', estado: 'cerrada' },
        true,
      ),
    ).toMatchObject({ includeInCohort: true, terminal: false });
    expect(
      classifyV2CompraAgilLifecycle(
        { codigo: 'CA-1', estado: 'desierta' },
        true,
      ),
    ).toMatchObject({ includeInCohort: true, terminal: false });
  });

  it('terminalizes only verified source conditions', () => {
    expect(
      classifyV2CompraAgilLifecycle(
        {
          codigo: 'CA-1',
          estado: 'proveedor_seleccionado',
        },
        true,
      ).terminal,
    ).toBe(false);
    expect(
      classifyV2CompraAgilLifecycle(
        {
          codigo: 'CA-1',
          estado: 'proveedor_seleccionado',
          orden_compra: { id_orden_compra: 'OC-1' },
        },
        true,
      ).terminal,
    ).toBe(true);
    expect(
      classifyV2CompraAgilLifecycle(
        {
          codigo: 'CA-1',
          estado: 'desierta',
          convocatoria: { numero: 2 },
        },
        true,
      ).terminal,
    ).toBe(true);
  });

  it('accepts the observed root and provider order references', () => {
    expect(
      classifyV2CompraAgilLifecycle(
        {
          codigo: 'CA-1',
          estado: 'proveedor_seleccionado',
          id_orden_compra: 123,
        },
        true,
      ).terminal,
    ).toBe(true);
    expect(
      classifyV2CompraAgilLifecycle(
        {
          codigo: 'CA-2',
          estado: 'oc_emitida',
          proveedores_cotizando: [{ id_oc: 'OC-2' }],
        },
        true,
      ).terminal,
    ).toBe(true);
  });

  it('keeps explicit null states observable without crashing', () => {
    expect(
      getV2CompraAgilStateLabel({ codigo: 'CA-1', estado: null }),
    ).toBeNull();
    expect(
      getV2CompraAgilStateLabel({
        codigo: 'CA-2',
        estado: { codigo: null, glosa: null },
      }),
    ).toBeNull();
    expect(
      classifyV2CompraAgilLifecycle({ codigo: 'CA-3', estado: null }, false),
    ).toMatchObject({ includeInCohort: false, terminal: false });
    expect(
      classifyV2CompraAgilLifecycle({ codigo: 'CA-3', estado: null }, true)
        .includeInCohort,
    ).toBe(true);
  });

  it('keeps unknown and discordant states observable without discovery', () => {
    expect(
      classifyV2CompraAgilLifecycle(
        {
          codigo: 'CA-1',
          estado: { id_estado: 99, codigo: 'nuevo', glosa: 'Publicada' },
        },
        false,
      ),
    ).toEqual({
      includeInCohort: false,
      includeInRun: false,
      terminal: false,
      reason: 'unknown_first_seen',
    });
    expect(
      classifyV2CompraAgilLifecycle(
        {
          codigo: 'CA-1',
          estado: { codigo: 'nuevo', glosa: 'Publicada' },
        },
        true,
      ).includeInCohort,
    ).toBe(true);
  });

  it('admits historical terminals to backfill and replay runs without the cohort', () => {
    expect(
      classifyV2CompraAgilLifecycle(
        { codigo: 'CA-1', estado: 'cancelada' },
        false,
        { includeHistoricalTerminal: true },
      ),
    ).toMatchObject({
      includeInCohort: false,
      includeInRun: true,
      terminal: true,
      reason: 'terminal_cancelled',
    });
    expect(
      classifyV2CompraAgilLifecycle(
        { codigo: 'CA-2', estado: 'cerrada' },
        false,
        { includeHistoricalTerminal: true },
      ),
    ).toMatchObject({
      includeInCohort: false,
      includeInRun: true,
      terminal: false,
      reason: 'unknown_first_seen',
    });
  });

  it('keeps unknown historical records out of scheduled runs', () => {
    expect(
      classifyV2CompraAgilLifecycle(
        { codigo: 'CA-1', estado: 'cerrada' },
        false,
      ),
    ).toMatchObject({ includeInRun: false, terminal: false });
  });

  it('recognizes historical sync intents', () => {
    expect(isHistoricalV2CompraAgilSyncIntent('backfill')).toBe(true);
    expect(isHistoricalV2CompraAgilSyncIntent('replay')).toBe(true);
    expect(isHistoricalV2CompraAgilSyncIntent('scheduled')).toBe(false);
  });
});
