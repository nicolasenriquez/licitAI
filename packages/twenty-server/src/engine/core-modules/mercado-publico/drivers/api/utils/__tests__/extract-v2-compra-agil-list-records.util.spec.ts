import { extractV2CompraAgilListRecords } from 'src/engine/core-modules/mercado-publico/drivers/api/utils/extract-v2-compra-agil-list-records.util';
import detailEnvelope from 'src/engine/core-modules/mercado-publico/drivers/api/__tests__/fixtures/v2-compra-agil-detail-production-envelope.json';

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

  it('should extract a detail record from the production payload envelope', () => {
    const records = extractV2CompraAgilListRecords(detailEnvelope);

    expect(records).toEqual([
      expect.objectContaining({
        codigo: 'FIXTURE-CA-DETAIL',
        orden_compra: { id_orden_compra: 'FIXTURE-OC-DETAIL' },
      }),
    ]);
  });

  it('should extract an official detail record nested under payload', () => {
    const records = extractV2CompraAgilListRecords({
      success: 'OK',
      payload: { codigo: 'CA-1', estado: { codigo: 'publicada' } },
      errors: null,
    });

    expect(records).toHaveLength(1);
    expect(records[0].codigo).toBe('CA-1');
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
});
