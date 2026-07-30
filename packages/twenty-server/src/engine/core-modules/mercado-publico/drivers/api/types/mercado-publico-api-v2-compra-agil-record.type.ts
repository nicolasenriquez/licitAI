export type MercadoPublicoApiV2CompraAgilEstado = {
  id_estado?: number | string;
  codigo?: string;
  glosa?: string;
};

export type MercadoPublicoApiV2CompraAgilFechas = {
  fecha_publicacion?: string;
  fecha_cierre?: string;
  fecha_ultimo_cambio?: string;
  fecha_cierre_primer_llamado?: string;
  fecha_cierre_segundo_llamado?: string;
};

export type MercadoPublicoApiV2CompraAgilInstitucion = {
  rut?: string;
  region?: number | string;
  nombre_region?: string;
  unidad_compra?: string;
  organismo_comprador?: string;
};

export type MercadoPublicoApiV2CompraAgilDocumento = {
  id?: number | string;
  nombre?: string;
};

export type MercadoPublicoApiV2CompraAgilRecord = {
  codigo: string;
  nombre?: string;
  estado?: string | MercadoPublicoApiV2CompraAgilEstado;
  region?: number;
  publicado_desde?: string;
  publicado_hasta?: string;
  cambio_desde?: string;
  cambio_hasta?: string;
  fecha_publicacion?: string;
  fecha_cierre?: string;
  fecha_ultimo_cambio?: string;
  fechas?: MercadoPublicoApiV2CompraAgilFechas;
  institucion?: MercadoPublicoApiV2CompraAgilInstitucion;
  links?: { detalle?: string };
  montos?: {
    moneda?: string;
    monto_disponible?: number;
    monto_disponible_clp?: number;
  };
  motivos?: {
    motivo_desierta?: string;
    motivo_seleccion?: string;
    motivo_cancelacion?: string;
  };
  resumen?: { total_ofertas_recibidas?: number };
  documentos?: MercadoPublicoApiV2CompraAgilDocumento[];
  convocatoria?: {
    descripcion?: string;
    estado_convocatoria?: string;
  };
  orden_compra?: {
    id_orden_compra?: string;
    id_oc?: string;
    codigo_orden_compra?: string;
  };
};

export type MercadoPublicoApiV2CompraAgilPagination = {
  page: number;
  pageSize: number;
  totalPages: number;
  totalResults: number;
};
