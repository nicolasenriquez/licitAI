export type MercadoPublicoApiV2CompraAgilEstado = {
  codigo?: string;
  glosa?: string;
};

export type MercadoPublicoApiV2CompraAgilFechas = {
  fecha_publicacion?: string;
  fecha_cierre?: string;
  fecha_ultimo_cambio?: string;
};

export type MercadoPublicoApiV2CompraAgilInstitucion = {
  region?: number | string;
};

export type MercadoPublicoApiV2CompraAgilRecord = {
  codigo: string;
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
  orden_compra?: {
    id_orden_compra?: string;
    id_oc?: string;
    codigo_orden_compra?: string;
  };
};
