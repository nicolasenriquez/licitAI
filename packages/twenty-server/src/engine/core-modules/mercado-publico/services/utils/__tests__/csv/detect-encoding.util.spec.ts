import { detectEncoding } from 'src/engine/core-modules/mercado-publico/services/utils/csv/detect-encoding.util';

describe('detectEncoding', () => {
  it('should detect utf-8 when buffer is valid utf-8 without BOM', () => {
    const buffer = Buffer.from('Codigo;Fecha;Estado\n', 'utf-8');
    const result = detectEncoding(buffer);

    expect(result.encoding).toBe('utf-8');
    expect(result.fallbackUsed).toBe(false);
  });

  it('should detect utf-8-sig when buffer has BOM', () => {
    const bom = Buffer.from([0xef, 0xbb, 0xbf]);
    const content = Buffer.from('Codigo;Nombre\n', 'utf-8');
    const buffer = Buffer.concat([bom, content]);
    const result = detectEncoding(buffer);

    expect(result.encoding).toBe('utf-8-sig');
    expect(result.fallbackUsed).toBe(false);
  });

  it('should detect latin-1 when utf-8 decode fails', () => {
    const buffer = Buffer.from('Jos\u00e9 Mart\u00ednez\n', 'latin1');
    const result = detectEncoding(buffer);

    expect(result.encoding).toBe('latin-1');
    expect(result.fallbackUsed).toBe(true);
  });

  it('should detect latin-1 for observed accented text', () => {
    const buffer = Buffer.from(
      'Direcci\u00f3n;Mart\u00ednez;u\u00f1a\n',
      'latin1',
    );
    const result = detectEncoding(buffer);

    expect(result.encoding).toBe('latin-1');
    expect(result.fallbackUsed).toBe(true);
  });

  it('should detect utf-8 for valid accented utf-8 text', () => {
    const buffer = Buffer.from(
      'Jos\u00e9 Mart\u00ednez\n',
      'utf-8',
    );
    const result = detectEncoding(buffer);

    expect(result.encoding).toBe('utf-8');
    expect(result.fallbackUsed).toBe(false);
  });

  it('should prefer utf-8-sig over utf-8 when BOM present', () => {
    const bom = Buffer.from([0xef, 0xbb, 0xbf]);
    const content = Buffer.from('Codigo;Item\n', 'utf-8');
    const buffer = Buffer.concat([bom, content]);
    const result = detectEncoding(buffer);

    expect(result.encoding).toBe('utf-8-sig');
    expect(result.fallbackUsed).toBe(false);
  });

  it('should mark fallbackUsed false when utf-8 succeeds', () => {
    const buffer = Buffer.from('plain ascii text\n', 'ascii');
    const result = detectEncoding(buffer);

    expect(result.encoding).toBe('utf-8');
    expect(result.fallbackUsed).toBe(false);
  });

  it('should throw for empty buffer', () => {
    expect(() => detectEncoding(Buffer.alloc(0))).toThrow(
      'Cannot detect encoding from empty buffer',
    );
  });
});
