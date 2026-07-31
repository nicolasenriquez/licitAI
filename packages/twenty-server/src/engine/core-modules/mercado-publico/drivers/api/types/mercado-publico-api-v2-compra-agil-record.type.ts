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

export type MercadoPublicoApiV2CompraAgilProducto = {
  codigo_producto?: number | string;
  nombre?: string;
  descripcion?: string | null;
  cantidad?: number | string;
  unidad_medida?: string | null;
};

export type MercadoPublicoApiV2CompraAgilProductoCotizado = {
  codigo_producto?: number | string;
  nombre_producto?: string;
  descripcion?: string | null;
  cantidad?: number | string;
  precio_unitario?: number | null;
  monto_total_producto?: number | null;
};

export type MercadoPublicoApiV2CompraAgilProveedor = {
  rut_proveedor?: string;
  razon_social?: string;
  es_emt?: boolean;
  id_cotizacion?: number | string;
  codigo_empresa?: string;
  codigo_sucursal_empresa?: string;
  activo?: boolean;
  estado_por_comprador?: string | null;
  fecha_creacion?: string;
  fecha_vigencia?: string | null;
  valor_neto?: number | null;
  total_impuesto?: number | null;
  monto_despacho?: number | null;
  monto_total?: number | null;
  nombre_impuesto?: string | null;
  porcentaje_impuesto?: number | null;
  descripcion_cotizacion?: string | null;
  descripcion?: string | null;
  justificacion_inadmisibilidad?: string | null;
  productos_cotizados?: MercadoPublicoApiV2CompraAgilProductoCotizado[];
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
  presupuesto?: {
    tipo_presupuesto?: string;
    moneda?: string;
    presupuesto_estimado?: number | null;
    monto_disponible?: number | null;
    monto_disponible_clp?: number | null;
    valor_cambio_moneda?: number | null;
    fecha_cambio_moneda?: string | null;
  };
  entrega?: {
    direccion_entrega?: string;
    plazo_entrega_dias?: number | null;
  };
  motivos?: {
    motivo_desierta?: string;
    motivo_seleccion?: string;
    motivo_cancelacion?: string;
  };
  resumen?: { total_ofertas_recibidas?: number };
  documentos?: MercadoPublicoApiV2CompraAgilDocumento[];
  productos_solicitados?: MercadoPublicoApiV2CompraAgilProducto[];
  proveedores_cotizando?: MercadoPublicoApiV2CompraAgilProveedor[];
  descripcion?: string;
  flags?: {
    considera_requisitos_medioambientales?: boolean;
    considera_requisitos_impacto_social_economico?: boolean;
  };
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
