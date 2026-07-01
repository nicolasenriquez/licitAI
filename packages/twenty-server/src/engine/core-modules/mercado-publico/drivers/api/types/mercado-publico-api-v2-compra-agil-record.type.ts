export type MercadoPublicoApiV2CompraAgilRecord = {
  codigo: string;
  estado?: string;
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
