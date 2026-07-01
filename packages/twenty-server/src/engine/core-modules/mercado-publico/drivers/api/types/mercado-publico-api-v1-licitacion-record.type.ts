export type MercadoPublicoApiV1LicitacionRecord = {
  CodigoExterno: string;
  Codigo?: string | number | null;
  CodigoEstado?: string | number | null;
  Estado?: string | null;
  CodigoTipo?: string | number | null;
  Nombre?: string | null;
  FechaPublicacion?: string | null;
  FechaCierre?: string | null;
  FechaAdjudicacion?: string | null;
  CodigoOrganismo?: string | number | null;
  NombreOrganismo?: string | null;
  [key: string]: unknown;
};
