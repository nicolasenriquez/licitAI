import { normalizeOcState } from 'src/engine/core-modules/mercado-publico/drivers/api/utils/normalize-oc-state.util';

describe('normalizeOcState', () => {
  it('should map code 4 to enviada_a_proveedor', () => {
    const result = normalizeOcState('4', null);
    expect(result.canonicalState).toBe('enviada_a_proveedor');
    expect(result.rawStateCode).toBe('4');
    expect(result.rawStateLabel).toBe('');
  });

  it('should map code 5 to en_proceso', () => {
    expect(normalizeOcState('5', null).canonicalState).toBe('en_proceso');
  });

  it('should map code 6 to aceptada', () => {
    expect(normalizeOcState('6', null).canonicalState).toBe('aceptada');
  });

  it('should map code 9 to cancelada', () => {
    expect(normalizeOcState('9', null).canonicalState).toBe('cancelada');
  });

  it('should map code 12 to recepcion_conforme', () => {
    expect(normalizeOcState('12', null).canonicalState).toBe(
      'recepcion_conforme',
    );
  });

  it('should map code 13 to pendiente_de_recepcionar', () => {
    expect(normalizeOcState('13', null).canonicalState).toBe(
      'pendiente_de_recepcionar',
    );
  });

  it('should map code 14 to recepcionada_parcialmente', () => {
    expect(normalizeOcState('14', null).canonicalState).toBe(
      'recepcionada_parcialmente',
    );
  });

  it('should map code 15 to recepcion_conforme_incompleta', () => {
    expect(normalizeOcState('15', null).canonicalState).toBe(
      'recepcion_conforme_incompleta',
    );
  });

  it('should preserve unknown raw OC code as unknown', () => {
    const result = normalizeOcState('999', 'Desconocido');
    expect(result.canonicalState).toBe('unknown_raw_state');
    expect(result.rawStateCode).toBe('999');
    expect(result.rawStateLabel).toBe('Desconocido');
  });

  it('should return unknown_raw_state for null inputs', () => {
    const result = normalizeOcState(null, null);
    expect(result.canonicalState).toBe('unknown_raw_state');
    expect(result.rawStateCode).toBe('');
    expect(result.rawStateLabel).toBe('');
  });

  it('should preserve raw state label', () => {
    const result = normalizeOcState('6', 'Aceptada');
    expect(result.canonicalState).toBe('aceptada');
    expect(result.rawStateCode).toBe('6');
    expect(result.rawStateLabel).toBe('Aceptada');
  });
});
