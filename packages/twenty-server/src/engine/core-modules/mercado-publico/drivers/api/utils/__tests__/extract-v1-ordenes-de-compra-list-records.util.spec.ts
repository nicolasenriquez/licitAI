import { extractV1OrdenesDeCompraListRecords } from 'src/engine/core-modules/mercado-publico/drivers/api/utils/extract-v1-ordenes-de-compra-list-records.util';

describe('extractV1OrdenesDeCompraListRecords', () => {
  it('should extract OC records from Listado array', () => {
    const payload = {
      Listado: [
        { Codigo: 'OC-1', Estado: 'Aceptada' },
        { Codigo: 'OC-2', Estado: 'Cancelada' },
      ],
    };

    const records = extractV1OrdenesDeCompraListRecords(payload);

    expect(records).toHaveLength(2);
    expect(records[0].Codigo).toBe('OC-1');
    expect(records[1].Codigo).toBe('OC-2');
  });

  it('should extract OC records from Items array', () => {
    const payload = {
      Items: [{ Codigo: 'OC-3' }],
    };

    const records = extractV1OrdenesDeCompraListRecords(payload);

    expect(records).toHaveLength(1);
    expect(records[0].Codigo).toBe('OC-3');
  });

  it('should return empty array for payload without Codigo', () => {
    const payload = {
      Listado: [{ Nombre: 'Sin codigo' }],
    };

    const records = extractV1OrdenesDeCompraListRecords(payload);

    expect(records).toHaveLength(0);
  });

  it('should return empty array for null payload', () => {
    const records = extractV1OrdenesDeCompraListRecords(null);

    expect(records).toHaveLength(0);
  });

  it('should return empty array for empty object', () => {
    const records = extractV1OrdenesDeCompraListRecords({});

    expect(records).toHaveLength(0);
  });

  it('should recursively find OC records in nested objects', () => {
    const payload = {
      data: {
        body: {
          Listado: [{ Codigo: 'OC-NESTED' }],
        },
      },
    };

    const records = extractV1OrdenesDeCompraListRecords(payload);

    expect(records).toHaveLength(1);
    expect(records[0].Codigo).toBe('OC-NESTED');
  });

  it('should filter out non-OC records from mixed arrays', () => {
    const payload = {
      Listado: [
        { Codigo: 'OC-VALID' },
        { Nombre: 'Not an OC' },
        { Codigo: 'OC-ALSO-VALID' },
      ],
    };

    const records = extractV1OrdenesDeCompraListRecords(payload);

    expect(records).toHaveLength(2);
    expect(records[0].Codigo).toBe('OC-VALID');
    expect(records[1].Codigo).toBe('OC-ALSO-VALID');
  });
});
