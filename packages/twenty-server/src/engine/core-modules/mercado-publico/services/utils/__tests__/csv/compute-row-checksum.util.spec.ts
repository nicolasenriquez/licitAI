import { computeRowChecksum } from 'src/engine/core-modules/mercado-publico/services/utils/csv/compute-row-checksum.util';

describe('computeRowChecksum', () => {
  it('should compute deterministic sha256 for same text', () => {
    const a = computeRowChecksum('OC-1;2026-06-15;Aceptada');
    const b = computeRowChecksum('OC-1;2026-06-15;Aceptada');

    expect(a).toBe(b);
    expect(a).toHaveLength(64);
  });

  it('should compute different checksums for different texts', () => {
    const a = computeRowChecksum('OC-1;2026-06-15;Aceptada');
    const b = computeRowChecksum('OC-2;2026-06-16;Pendiente');

    expect(a).not.toBe(b);
  });

  it('should be case-sensitive', () => {
    const a = computeRowChecksum('OC-1;Aceptada');
    const b = computeRowChecksum('oc-1;Aceptada');

    expect(a).not.toBe(b);
  });
});
