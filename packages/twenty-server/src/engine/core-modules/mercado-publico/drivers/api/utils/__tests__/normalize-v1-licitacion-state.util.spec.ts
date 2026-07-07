import { normalizeV1LicitacionState } from 'src/engine/core-modules/mercado-publico/drivers/api/utils/normalize-v1-licitacion-state.util';

describe('normalizeV1LicitacionState', () => {
  it('should map code 5 to publicada', () => {
    expect(normalizeV1LicitacionState('5', null)).toBe('publicada');
  });

  it('should map code 6 to cerrada', () => {
    expect(normalizeV1LicitacionState('6', null)).toBe('cerrada');
  });

  it('should map code 7 to desierta', () => {
    expect(normalizeV1LicitacionState('7', null)).toBe('desierta');
  });

  it('should map code 8 to adjudicada', () => {
    expect(normalizeV1LicitacionState('8', null)).toBe('adjudicada');
  });

  it('should map code 18 to revocada', () => {
    expect(normalizeV1LicitacionState('18', null)).toBe('revocada');
  });

  it('should map code 19 to suspendida', () => {
    expect(normalizeV1LicitacionState('19', null)).toBe('suspendida');
  });

  it('should map via label when code is unknown', () => {
    expect(normalizeV1LicitacionState('999', 'Publicada')).toBe('publicada');
  });

  it('should map via label case-insensitively', () => {
    expect(normalizeV1LicitacionState(null, 'PUBLICADA')).toBe('publicada');
  });

  it('should return unknown_raw_state for unmatched code with unmatched label', () => {
    expect(normalizeV1LicitacionState('999', 'SomeLabel')).toBe(
      'unknown_raw_state',
    );
  });

  it('should return null when both inputs are null', () => {
    expect(normalizeV1LicitacionState(null, null)).toBeNull();
  });

  it('should return unknown_raw_state when code is empty string with null label', () => {
    expect(normalizeV1LicitacionState('', null)).toBe('unknown_raw_state');
  });

  it('should return unknown_raw_state for null code with empty label', () => {
    expect(normalizeV1LicitacionState(null, '')).toBe('unknown_raw_state');
  });
});
