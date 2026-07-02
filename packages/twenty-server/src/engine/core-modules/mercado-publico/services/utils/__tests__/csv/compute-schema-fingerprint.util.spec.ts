import { computeSchemaFingerprint } from 'src/engine/core-modules/mercado-publico/services/utils/csv/compute-schema-fingerprint.util';

describe('computeSchemaFingerprint', () => {
  it('should compute deterministic sha256 for same header', () => {
    const header = 'Codigo;FechaEnvio;Estado';

    const a = computeSchemaFingerprint(header);
    const b = computeSchemaFingerprint(header);

    expect(a).toBe(b);
    expect(a).toHaveLength(64);
  });

  it('should compute different fingerprints for different headers', () => {
    const a = computeSchemaFingerprint('Codigo;Fecha;Estado');
    const b = computeSchemaFingerprint('Codigo;Monto;Estado');

    expect(a).not.toBe(b);
  });

  it('should be case-sensitive for column names', () => {
    const a = computeSchemaFingerprint('Codigo;Fecha;Estado');
    const b = computeSchemaFingerprint('codigo;fecha;estado');

    expect(a).not.toBe(b);
  });

  it('should produce different fingerprints for different column order', () => {
    const a = computeSchemaFingerprint('Codigo;Estado;Fecha');
    const b = computeSchemaFingerprint('Estado;Codigo;Fecha');

    expect(a).not.toBe(b);
  });
});
