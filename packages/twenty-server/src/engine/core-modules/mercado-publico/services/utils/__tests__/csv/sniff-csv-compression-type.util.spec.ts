import { sniffCsvCompressionType } from 'src/engine/core-modules/mercado-publico/services/utils/csv/sniff-csv-compression-type.util';

describe('sniffCsvCompressionType', () => {
  it('should detect gz from URL extension', () => {
    expect(sniffCsvCompressionType('https://example.com/data.csv.gz')).toBe(
      'gz',
    );
  });

  it('should detect zip from URL extension', () => {
    expect(
      sniffCsvCompressionType('https://example.com/data.CSV.zip'),
    ).toBe('zip');
  });

  it('should detect gz from Content-Type', () => {
    expect(
      sniffCsvCompressionType(
        'https://example.com/data',
        'application/gzip',
      ),
    ).toBe('gz');
  });

  it('should detect zip from Content-Type', () => {
    expect(
      sniffCsvCompressionType('https://example.com/data', 'application/zip'),
    ).toBe('zip');
  });

  it('should return null for plain csv', () => {
    expect(
      sniffCsvCompressionType('https://example.com/2026-6.csv'),
    ).toBeNull();
  });

  it('should return null for unrecognized extension', () => {
    expect(
      sniffCsvCompressionType('https://example.com/data.xz'),
    ).toBeNull();
  });

  it('should return null for no extension and no content-type', () => {
    expect(sniffCsvCompressionType('https://example.com/data')).toBeNull();
  });

  it('should prefer Content-Type over extension when both present', () => {
    expect(
      sniffCsvCompressionType(
        'https://example.com/data.csv.gz',
        'application/zip',
      ),
    ).toBe('zip');
  });
});
