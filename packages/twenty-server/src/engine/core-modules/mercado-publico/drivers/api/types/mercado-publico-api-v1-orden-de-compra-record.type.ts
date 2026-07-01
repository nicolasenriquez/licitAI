export type MercadoPublicoApiV1OrdenDeCompraRecord = {
  Codigo: string;
  CodigoEstado?: string | number | null;
  Estado?: string | null;
  EstadoProveedor?: string | null;
  CodigoLicitacion?: string | number | null;
  FechaEnvio?: string | null;
  TipoMonedaOC?: string | null;
  MontoTotalOC?: string | number | null;
  ImpuestosOC?: string | number | null;
  NombreProveedor?: string | null;
  [key: string]: unknown;
};
