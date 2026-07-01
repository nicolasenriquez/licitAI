import { extractV1LicitacionDetailRecord } from 'src/engine/core-modules/mercado-publico/drivers/api/utils/extract-v1-licitacion-detail-record.util';

describe('extractV1LicitacionDetailRecord', () => {
  it('should extract direct detail record matching codigo_externo', () => {
    const payload = {
      CodigoExterno: 'LIC-123',
      Nombre: 'Licitacion de prueba',
      CodigoEstado: 5,
    };

    const record = extractV1LicitacionDetailRecord('LIC-123', payload);

    expect(record).not.toBeNull();
    expect(record?.CodigoExterno).toBe('LIC-123');
    expect(record?.Nombre).toBe('Licitacion de prueba');
  });

  it('should extract record from Listado array matching codigo_externo', () => {
    const payload = {
      Listado: [
        {
          CodigoExterno: 'LIC-456',
          Nombre: 'Licitacion envolvente',
        },
      ],
    };

    const record = extractV1LicitacionDetailRecord('LIC-456', payload);

    expect(record).not.toBeNull();
    expect(record?.CodigoExterno).toBe('LIC-456');
  });

  it('should return null when codigo_externo does not match any record', () => {
    const payload = {
      CodigoExterno: 'LIC-999',
      Nombre: 'Otra licitacion',
    };

    const record = extractV1LicitacionDetailRecord('LIC-000', payload);

    expect(record).toBeNull();
  });

  it('should return null for empty payload', () => {
    const record = extractV1LicitacionDetailRecord('LIC-123', {});

    expect(record).toBeNull();
  });

  it('should return null for null payload', () => {
    const record = extractV1LicitacionDetailRecord('LIC-123', null);

    expect(record).toBeNull();
  });

  it('should return null for empty codigo_externo', () => {
    const payload = {
      CodigoExterno: 'LIC-123',
    };

    const record = extractV1LicitacionDetailRecord('', payload);

    expect(record).toBeNull();
  });

  it('should return null when payload is an array without matching CodigoExterno', () => {
    const record = extractV1LicitacionDetailRecord('LIC-000', [1, 2, 3]);

    expect(record).toBeNull();
  });

  it('should extract record when Listado has multiple items and one matches', () => {
    const payload = {
      Listado: [
        { CodigoExterno: 'A', Nombre: 'Primera' },
        { CodigoExterno: 'B', Nombre: 'Segunda' },
      ],
    };

    const record = extractV1LicitacionDetailRecord('B', payload);

    expect(record).not.toBeNull();
    expect(record?.CodigoExterno).toBe('B');
  });
});
