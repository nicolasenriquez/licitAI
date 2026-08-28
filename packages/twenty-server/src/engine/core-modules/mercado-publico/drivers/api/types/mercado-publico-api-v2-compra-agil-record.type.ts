export type MercadoPublicoApiV2CompraAgilRecord = {
  codigo: string;
  nombre?: string;
  descripcion?: string;
  estado?:
    | string
    | {
        id_estado?: number | string | null;
        codigo?: string | null;
        glosa?: string | null;
      }
    | null;
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
    fecha_cierre_primer_llamado?: string | null;
    fecha_cierre_segundo_llamado?: string | null;
    fecha_ultimo_cambio?: string;
    fecha_cancelacion?: string | null;
  };
  convocatoria?: {
    numero?: number | string;
    estado_convocatoria?: number | string;
    descripcion?: string;
    fecha_cierre_primer_llamado?: string | null;
    fecha_cierre_segundo_llamado?: string | null;
  };
  numero_convocatoria?: number | string;
  llamado?: number | string;
  montos?: {
    moneda?: string;
    monto_disponible?: number | string;
    monto_disponible_clp?: number | string;
  };
  presupuesto?: {
    tipo_presupuesto?: string;
    moneda?: string;
    presupuesto_estimado?: number | string | null;
    monto_disponible?: number | string | null;
    monto_disponible_clp?: number | string | null;
    valor_cambio_moneda?: number | string | null;
    fecha_cambio_moneda?: string | null;
  };
  documentos?: Array<{ id?: number | string; nombre?: string }>;
  entrega?: {
    direccion_entrega?: string;
    plazo_entrega_dias?: number | string | null;
  };
  productos_solicitados?: Array<{
    codigo_producto?: number | string;
    nombre?: string;
    descripcion?: string;
    cantidad?: number | string | null;
    unidad_medida?: string;
  }>;
  proveedores_cotizando?: Array<{
    id_cotizacion?: number | string;
    codigo_sucursal_empresa?: string;
    codigo_empresa?: string;
    es_emt?: number | boolean | null;
    razon_social?: string;
    rut_proveedor?: string;
    descripcion?: string;
    fecha_vigencia?: string | null;
    fecha_creacion?: string | null;
    valor_neto?: number | string | null;
    total_impuesto?: number | string | null;
    monto_despacho?: number | string | null;
    monto_total?: number | string | null;
    proveedor_seleccionado?: number | boolean | null;
    descripcion_cotizacion?: string;
    productos_cotizados?: Array<{
      codigo_producto?: number | string;
      nombre_producto?: string;
      descripcion?: string;
      cantidad?: number | string | null;
      precio_unitario?: number | string | null;
      monto_total_producto?: number | string | null;
    }>;
    estado?: number | string | null;
    justificacion_inadmisibilidad?: string | null;
    estado_por_comprador?: number | string | null;
    activo?: number | boolean | null;
    id_oc?: number | string | null;
    nombre_impuesto?: string;
    porcentaje_impuesto?: number | string | null;
  }>;
  resumen?: {
    multa_sancion?: number | string | null;
    total_ofertas_recibidas?: number | string | null;
    total_demandas?: number | string | null;
  };
  motivos?: {
    motivo_cancelacion?: string | null;
    motivo_desierta?: string | null;
    motivo_seleccion?: string | null;
  };
  flags?: {
    considera_requisitos_medioambientales?: boolean;
    considera_requisitos_impacto_social_economico?: boolean;
  };
  id_orden_compra?: number | string | null;
  publicado_desde?: string;
  publicado_hasta?: string;
  cambio_desde?: string;
  cambio_hasta?: string;
  orden_compra?: {
    id_orden_compra?: number | string | null;
    id_oc?: number | string | null;
    codigo_orden_compra?: string;
  };
  fecha_publicacion?: string;
  fecha_cierre?: string;
  fecha_ultimo_cambio?: string;
};
