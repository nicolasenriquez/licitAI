import { readFileSync } from 'fs';
import { join } from 'path';

import { extractV2CompraAgilListRecords } from 'src/engine/core-modules/mercado-publico/drivers/api/utils/extract-v2-compra-agil-list-records.util';

const FIXTURES_DIR = join(__dirname, '..', '..', '__tests__', 'fixtures');

const readFixture = (filename: string): unknown =>
  JSON.parse(readFileSync(join(FIXTURES_DIR, filename), 'utf8'));

describe('extractV2CompraAgilListRecords', () => {
  it('should extract records from top-level array', () => {
    const payload = [{ codigo: 'CA-1', estado: 'publicada' }];

    const records = extractV2CompraAgilListRecords(payload);

    expect(records).toHaveLength(1);
    expect(records[0].codigo).toBe('CA-1');
  });

  it('should extract records from Items key', () => {
    const payload = {
      Items: [
        { codigo: 'CA-1', estado: 'publicada' },
        { codigo: 'CA-2', estado: 'cerrada' },
      ],
    };

    const records = extractV2CompraAgilListRecords(payload);

    expect(records).toHaveLength(2);
  });

  it('should extract records from Data key', () => {
    const payload = {
      Data: [{ codigo: 'CA-1' }],
    };

    const records = extractV2CompraAgilListRecords(payload);

    expect(records).toHaveLength(1);
  });

  it('should return empty array for null payload', () => {
    const records = extractV2CompraAgilListRecords(null);

    expect(records).toEqual([]);
  });

  it('should return empty array for empty object', () => {
    const records = extractV2CompraAgilListRecords({});

    expect(records).toEqual([]);
  });

  it('should extract single detail record with codigo', () => {
    const payload = {
      codigo: 'CA-1',
      estado: 'publicada',
      region: 13,
      orden_compra: {
        id_orden_compra: 'OC-123',
      },
    };

    const records = extractV2CompraAgilListRecords(payload);

    expect(records).toHaveLength(1);
    expect(records[0].codigo).toBe('CA-1');
    expect(records[0].orden_compra?.id_orden_compra).toBe('OC-123');
  });

  it('should filter out non-record items', () => {
    const payload = [
      { codigo: 'CA-1' },
      { not_a_record: true },
      42,
      'string',
      null,
      { codigo: 'CA-2' },
    ];

    const records = extractV2CompraAgilListRecords(payload);

    expect(records).toHaveLength(2);
    expect(records[0].codigo).toBe('CA-1');
    expect(records[1].codigo).toBe('CA-2');
  });

  it('should normalize object-shaped estado.codigo and preserve scalar estado', () => {
    const records = extractV2CompraAgilListRecords(
      readFixture('v2-compra-agil-list-object-estado.json'),
    );

    expect(records).toEqual([
      { codigo: 'FIXTURE-CA-CODE', estado: 'cerrada' },
      { codigo: 'FIXTURE-CA-SCALAR', estado: 'publicada' },
    ]);
  });

  it('should fall back to estado.glosa when codigo is absent', () => {
    const records = extractV2CompraAgilListRecords(
      readFixture('v2-compra-agil-list-object-estado-glosa-fallback.json'),
    );

    expect(records[0]?.estado).toBe('Estado Reservado');
  });

  it('should not pass an empty estado object to scalar persistence', () => {
    const records = extractV2CompraAgilListRecords(
      readFixture('v2-compra-agil-list-object-estado-empty.json'),
    );

    expect(records[0]?.estado).toBeUndefined();
    expect(typeof records[0]?.estado).not.toBe('object');
  });

  it('should extract a record from the production detail envelope', () => {
    const records = extractV2CompraAgilListRecords(
      readFixture('v2-compra-agil-detail-production-envelope.json'),
    );

    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({
      codigo: 'FIXTURE-CA-DETAIL',
      estado: 'publicada',
    });
  });

  it('should return no record for a detail envelope without a usable record', () => {
    const records = extractV2CompraAgilListRecords(
      readFixture('v2-compra-agil-detail-envelope-no-record.json'),
    );

    expect(records).toEqual([]);
  });
});
