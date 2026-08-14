import { type MercadoPublicoApiV2CompraAgilRecord } from 'src/engine/core-modules/mercado-publico/drivers/api/types/mercado-publico-api-v2-compra-agil-record.type';

type MercadoPublicoV2E2EFixturePayload = {
  items: MercadoPublicoApiV2CompraAgilRecord[];
};

const baseRecords: MercadoPublicoApiV2CompraAgilRecord[] = [
  {
    codigo: 'FIXTURE-CA-001',
    nombre: 'Servicio de mantencion preventiva',
    estado: { codigo: 'publicada', glosa: 'Publicada' },
    fechas: {
      fecha_publicacion: '2026-08-01T10:00:00Z',
      fecha_ultimo_cambio: '2026-08-05T10:00:00Z',
    },
    institucion: {
      rut: '60.000.000-0',
      organismo_comprador: 'Municipalidad de Ejemplo',
    },
    montos: { moneda: 'CLP', monto_disponible: 1500000 },
    documentos: [{ id: 77, nombre: 'Bases tecnicas.pdf' }],
  },
  {
    codigo: 'FIXTURE-CA-002',
    nombre: 'Servicio de soporte operativo',
    estado: { codigo: 'publicada', glosa: 'Publicada' },
    fechas: {
      fecha_publicacion: '2026-08-02T10:00:00Z',
      fecha_ultimo_cambio: '2026-08-05T10:00:00Z',
    },
    institucion: {
      rut: '60.000.000-0',
      organismo_comprador: 'Municipalidad de Ejemplo',
    },
  },
  {
    codigo: 'FIXTURE-CA-003',
    nombre: 'Servicio con comprador sin codigo',
    estado: { codigo: 'publicada', glosa: 'Publicada' },
    fechas: {
      fecha_publicacion: '2026-08-03T10:00:00Z',
      fecha_ultimo_cambio: '2026-08-05T10:00:00Z',
    },
    institucion: { organismo_comprador: 'Comprador sin codigo' },
    montos: { moneda: 'CLP', monto_disponible: 250000 },
  },
];

const changedRecords: MercadoPublicoApiV2CompraAgilRecord[] = baseRecords.map(
  (record) =>
    record.codigo === 'FIXTURE-CA-001'
      ? {
          ...record,
          nombre: 'Servicio de mantencion preventiva actualizado',
          fechas: {
            ...record.fechas,
            fecha_ultimo_cambio: '2026-08-06T10:00:00Z',
          },
        }
      : record,
);

export const mercadoPublicoV2E2EFixture: {
  initial: MercadoPublicoV2E2EFixturePayload;
  changed: MercadoPublicoV2E2EFixturePayload;
} = {
  initial: { items: baseRecords },
  changed: { items: changedRecords },
};
