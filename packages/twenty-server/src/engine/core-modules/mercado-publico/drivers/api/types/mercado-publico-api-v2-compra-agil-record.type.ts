export type MercadoPublicoApiV2CompraAgilEstado = {
  codigo?: string;
  glosa?: string;
};

export type MercadoPublicoApiV2CompraAgilRecord = {
  codigo: string;
  estado?: string | MercadoPublicoApiV2CompraAgilEstado;
  region?: number;
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
