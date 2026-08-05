import { readFileSync } from 'fs';
import { join } from 'path';

import {
  extractV2CompraAgilCanonicalFields,
  extractV2CompraAgilListRecords,
  extractV2CompraAgilPagination,
  findV2CompraAgilRawRecord,
} from 'src/engine/core-modules/mercado-publico/drivers/api/utils/extract-v2-compra-agil-list-records.util';

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

  it('should normalize the production-shaped payload.items envelope', () => {
    const payload = readFixture('v2-compra-agil-list.json');
    const records = extractV2CompraAgilListRecords(payload);

    expect(records).toEqual([
      expect.objectContaining({
        codigo: 'FIXTURE-CA-001',
        estado: 'publicada',
        region: 13,
        fecha_publicacion: '2026-06-01T09:30:00',
        fecha_cierre: '2026-06-30T12:00:00-04:00',
        fecha_ultimo_cambio: 'not-a-date',
        nombre: 'Servicio de mantención preventiva',
      }),
    ]);
    expect(extractV2CompraAgilPagination(payload)).toEqual({
      page: 1,
      pageSize: 50,
      totalPages: 2,
      totalResults: 51,
    });
    expect(findV2CompraAgilRawRecord(payload, 'FIXTURE-CA-001')).toMatchObject({
      estado: { id_estado: 2, codigo: 'publicada', glosa: 'Publicada' },
      institucion: {
        rut: '60.000.000-0',
        organismo_comprador: 'Municipalidad de Ejemplo',
      },
      documentos: [{ id: 77, nombre: 'Bases técnicas.pdf' }],
    });
  });

  it('should preserve known zero values and leave unsupported evidence unknown', () => {
    const records = extractV2CompraAgilListRecords([
      {
        codigo: 'CA-KNOWN',
        institucion: {
          rut: ' 60.000.000-0 ',
          nombre_region: ' Metropolitana ',
          unidad_compra: ' Abastecimiento ',
        },
        montos: { monto_disponible_clp: 0 },
        convocatoria: { descripcion: 'Primer llamado' },
        documentos: [],
        resumen: { total_ofertas_recibidas: 0 },
      },
      {
        codigo: 'CA-UNKNOWN',
        montos: { monto_disponible_clp: Number.NaN },
        convocatoria: { descripcion: 'Etapa no reconocida' },
        documentos: 'not-an-array',
        resumen: { total_ofertas_recibidas: -1 },
      },
    ]);

    expect(extractV2CompraAgilCanonicalFields(records[0]!)).toEqual({
      buyerRut: '60.000.000-0',
      purchaseUnitName: 'Abastecimiento',
      regionName: 'Metropolitana',
      amountAvailableClp: 0,
      callStage: 'first_call',
      documentCount: 0,
      offersReceivedCount: 0,
    });
    expect(extractV2CompraAgilCanonicalFields(records[1]!)).toEqual({
      buyerRut: null,
      purchaseUnitName: null,
      regionName: null,
      amountAvailableClp: null,
      callStage: null,
      documentCount: null,
      offersReceivedCount: null,
    });
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

  it('should fall back to the top-level region when nested region is blank', () => {
    const records = extractV2CompraAgilListRecords([
      {
        codigo: 'CA-REGION-FALLBACK',
        institucion: { region: '' },
        region: 13,
      },
    ]);

    expect(records[0]?.region).toBe(13);
  });

  it('should fall back to the top-level region when nested region is non-scalar', () => {
    const records = extractV2CompraAgilListRecords([
      {
        codigo: 'CA-REGION-FALLBACK',
        institucion: { region: { value: 13 } },
        region: 13,
      },
    ]);

    expect(records[0]?.region).toBe(13);
  });

  it('should return no record for a detail envelope without a usable record', () => {
    const records = extractV2CompraAgilListRecords(
      readFixture('v2-compra-agil-detail-envelope-no-record.json'),
    );

    expect(records).toEqual([]);
  });
});
