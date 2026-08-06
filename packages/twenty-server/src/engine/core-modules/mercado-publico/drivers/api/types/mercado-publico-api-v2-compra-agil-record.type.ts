export type MercadoPublicoApiV2CompraAgilRecord = {
  codigo: string;
  nombre?: string;
  estado?:
    | string
    | {
        id_estado?: number | string;
        codigo?: string;
        glosa?: string;
      };
  region?: number;
  institucion?: {
    rut?: string;
    region?: number;
    nombre_region?: string;
    unidad_compra?: string;
    organismo_comprador?: string;
  };
  fechas?: {
    fecha_publicacion?: string;
    fecha_cierre?: string;
    fecha_ultimo_cambio?: string;
  };
  convocatoria?: {
    numero?: number | string;
    estado_convocatoria?: number | string;
  };
  numero_convocatoria?: number | string;
  llamado?: number | string;
  montos?: {
    moneda?: string;
    monto_disponible?: number | string;
    monto_disponible_clp?: number | string;
  };
  documentos?: Array<{ id?: number | string; nombre?: string }>;
  publicado_desde?: string;
  publicado_hasta?: string;
  cambio_desde?: string;
  cambio_hasta?: string;
  orden_compra?: {
    id_orden_compra?: string;
    id_oc?: string;
    codigo_orden_compra?: string;
  };
};
