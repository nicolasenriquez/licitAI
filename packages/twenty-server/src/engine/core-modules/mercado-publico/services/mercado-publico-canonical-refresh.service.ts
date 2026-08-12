import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';

import { DataSource, type EntityManager } from 'typeorm';

import { parseMercadoPublicoDate } from 'src/engine/core-modules/mercado-publico/drivers/api/utils/parse-mercado-publico-date.util';
import { normalizeLicitacionType } from 'src/engine/core-modules/mercado-publico/drivers/api/utils/normalize-licitacion-type.util';
import { normalizeV1LicitacionState } from 'src/engine/core-modules/mercado-publico/drivers/api/utils/normalize-v1-licitacion-state.util';
import { normalizeOcState } from 'src/engine/core-modules/mercado-publico/drivers/api/utils/normalize-oc-state.util';

type MercadoPublicoApiV1LicitacionStagingRow = {
  id: string;
  source: string;
  codigo_externo: string;
  codigo: string | null;
  codigo_estado: string | null;
  estado: string | null;
  codigo_tipo: string | null;
  nombre: string | null;
  fecha_publicacion: string | null;
  fecha_cierre: string | null;
  fecha_adjudicacion: string | null;
  codigo_organismo: string | null;
  nombre_organismo: string | null;
  fetched_at: Date;
  created_at: Date;
};

type MercadoPublicoApiV1OrdenDeCompraStagingRow = {
  id: string;
  source: string;
  codigo: string;
  codigo_estado: string | null;
  estado: string | null;
  estado_proveedor: string | null;
  codigo_licitacion: string | null;
  fecha_envio: string | null;
  monto_total_oc: string | null;
  tipo_moneda_oc: string | null;
  nombre_proveedor: string | null;
  fetched_at: Date;
  created_at: Date;
};

type MercadoPublicoApiV1LicitacionItemStagingRow = {
  id: string;
  codigo_externo: string;
  codigoitem: string;
  nombre_producto_generico: string | null;
  cantidad: string | null;
};

type MercadoPublicoApiV1LicitacionOfertaStagingRow = {
  id: string;
  codigo_externo: string;
  codigoitem: string;
  codigo_proveedor: string | null;
  rut_proveedor: string | null;
  nombre_de_la_oferta: string;
  estado_oferta: string | null;
  cantidad_ofertada: string | null;
  valor_total_ofertado: string | null;
  oferta_seleccionada: string | null;
};

type MercadoPublicoApiV1LicitacionAdjudicacionStagingRow = {
  id: string;
  codigo_externo: string;
  codigoitem: string | null;
  rut_proveedor: string;
  cantidad_adjudicada: string | null;
  monto_estimado_adjudicado: string | null;
};

type MercadoPublicoApiV1OrdenCompraItemStagingRow = {
  id: string;
  iditem: string;
  codigo: string;
  total_linea_neto: string | null;
  codigo_producto_onu: string | null;
  forma_de_pago: string | null;
};

@Injectable()
export class MercadoPublicoCanonicalRefreshService {
  constructor(
    @InjectDataSource()
    private readonly coreDataSource: DataSource,
  ) {}

  async refreshV1LicitacionesFromApiSnapshot(
    rawApiPayloadId: string,
  ): Promise<number> {
    return this.coreDataSource.transaction(async (entityManager) => {
      const stagingRows = await this.selectLatestV1LicitacionesStagingRows(
        entityManager,
        rawApiPayloadId,
      );

      for (const stagingRow of stagingRows) {
        await this.upsertCanonicalLicitacion(entityManager, stagingRow);
      }

      return stagingRows.length;
    });
  }

  private async selectLatestV1LicitacionesStagingRows(
    entityManager: EntityManager,
    rawApiPayloadId: string,
  ): Promise<MercadoPublicoApiV1LicitacionStagingRow[]> {
    return entityManager.query<MercadoPublicoApiV1LicitacionStagingRow[]>(
      `
        SELECT DISTINCT ON (codigo_externo)
          id,
          source,
          codigo_externo,
          codigo,
          codigo_estado,
          estado,
          codigo_tipo,
          nombre,
          fecha_publicacion,
          fecha_cierre,
          fecha_adjudicacion,
          codigo_organismo,
          nombre_organismo,
          fetched_at,
          created_at
        FROM mp.stg_api_v1_licitacion
        WHERE
          raw_api_payload_id = $1
          AND snapshot_kind IN ('list', 'detail')
        ORDER BY codigo_externo, fetched_at DESC, created_at DESC, id DESC
      `,
      [rawApiPayloadId],
    );
  }

  private async upsertCanonicalLicitacion(
    entityManager: EntityManager,
    stagingRow: MercadoPublicoApiV1LicitacionStagingRow,
  ): Promise<void> {
    const parsedFechaPublicacion = parseMercadoPublicoDate(
      stagingRow.fecha_publicacion,
    );
    const parsedFechaCierre = parseMercadoPublicoDate(stagingRow.fecha_cierre);
    const parsedFechaAdjudicacion = parseMercadoPublicoDate(
      stagingRow.fecha_adjudicacion,
    );
    const normalizedCanonicalState = normalizeV1LicitacionState(
      stagingRow.codigo_estado,
      stagingRow.estado,
    );
    const normalizedCanonicalType = normalizeLicitacionType(
      stagingRow.codigo_tipo,
    );

    await entityManager.query(
      `
        INSERT INTO mp.licitacion (
          codigo_externo,
          codigo,
          title,
          canonical_state,
          raw_state_code,
          raw_state_label,
          codigo_tipo,
          canonical_type,
          buyer_code,
          buyer_name,
          fecha_publicacion,
          fecha_cierre,
          fecha_adjudicacion,
          is_sentinel_1900_publicacion,
          is_sentinel_1900_cierre,
          source_priority,
          last_seen_at,
          updated_at
        )
        VALUES (
          $1,
          $2,
          $3,
          COALESCE($4, 'unknown_raw_state'),
          $5,
          $6,
          $7,
          $8,
          $9,
          $10,
          $11,
          $12,
          $13,
          $14,
          $15,
          $16,
          $17,
          now()
        )
        ON CONFLICT (codigo_externo) DO UPDATE
        SET
          codigo = COALESCE($2, mp.licitacion.codigo),
          title = COALESCE($3, mp.licitacion.title),
          canonical_state = CASE
            WHEN $18 THEN COALESCE($4, 'unknown_raw_state')
            ELSE mp.licitacion.canonical_state
          END,
          raw_state_code = COALESCE($5, mp.licitacion.raw_state_code),
          raw_state_label = COALESCE($6, mp.licitacion.raw_state_label),
          codigo_tipo = COALESCE($7, mp.licitacion.codigo_tipo),
          canonical_type = CASE
            WHEN $19 THEN $8
            ELSE mp.licitacion.canonical_type
          END,
          buyer_code = COALESCE($9, mp.licitacion.buyer_code),
          buyer_name = COALESCE($10, mp.licitacion.buyer_name),
          fecha_publicacion = CASE
            WHEN $20 THEN $11
            ELSE mp.licitacion.fecha_publicacion
          END,
          fecha_cierre = CASE
            WHEN $21 THEN $12
            ELSE mp.licitacion.fecha_cierre
          END,
          fecha_adjudicacion = CASE
            WHEN $22 THEN $13
            ELSE mp.licitacion.fecha_adjudicacion
          END,
          is_sentinel_1900_publicacion = CASE
            WHEN $20 THEN $14
            ELSE mp.licitacion.is_sentinel_1900_publicacion
          END,
          is_sentinel_1900_cierre = CASE
            WHEN $21 THEN $15
            ELSE mp.licitacion.is_sentinel_1900_cierre
          END,
          source_priority = COALESCE($16, mp.licitacion.source_priority),
          last_seen_at = GREATEST(mp.licitacion.last_seen_at, $17),
          updated_at = now()
      `,
      [
        stagingRow.codigo_externo,
        stagingRow.codigo,
        stagingRow.nombre,
        normalizedCanonicalState,
        stagingRow.codigo_estado,
        stagingRow.estado,
        stagingRow.codigo_tipo,
        normalizedCanonicalType,
        stagingRow.codigo_organismo,
        stagingRow.nombre_organismo,
        parsedFechaPublicacion.value,
        parsedFechaCierre.value,
        parsedFechaAdjudicacion.value,
        parsedFechaPublicacion.isSentinel1900,
        parsedFechaCierre.isSentinel1900,
        stagingRow.source,
        stagingRow.fetched_at,
        stagingRow.codigo_estado !== null || stagingRow.estado !== null,
        stagingRow.codigo_tipo !== null,
        stagingRow.fecha_publicacion !== null,
        stagingRow.fecha_cierre !== null,
        stagingRow.fecha_adjudicacion !== null,
      ],
    );
  }

  async refreshV1OrdenesDeCompraFromApiSnapshot(
    rawApiPayloadId: string,
  ): Promise<number> {
    return this.coreDataSource.transaction(async (entityManager) => {
      const stagingRows = await this.selectLatestV1OrdenesDeCompraStagingRows(
        entityManager,
        rawApiPayloadId,
      );

      for (const stagingRow of stagingRows) {
        await this.upsertCanonicalOrdenDeCompra(entityManager, stagingRow);
      }

      return stagingRows.length;
    });
  }

  private async selectLatestV1OrdenesDeCompraStagingRows(
    entityManager: EntityManager,
    rawApiPayloadId: string,
  ): Promise<MercadoPublicoApiV1OrdenDeCompraStagingRow[]> {
    return entityManager.query<MercadoPublicoApiV1OrdenDeCompraStagingRow[]>(
      `
        SELECT DISTINCT ON (codigo)
          id,
          source,
          codigo,
          codigo_estado,
          estado,
          estado_proveedor,
          codigo_licitacion,
          fecha_envio,
          monto_total_oc,
          tipo_moneda_oc,
          nombre_proveedor,
          fetched_at,
          created_at
        FROM mp.stg_api_v1_orden_compra
        WHERE
          raw_api_payload_id = $1
          AND snapshot_kind IN ('list', 'detail')
        ORDER BY codigo, fetched_at DESC, created_at DESC, id DESC
      `,
      [rawApiPayloadId],
    );
  }

  private async upsertCanonicalOrdenDeCompra(
    entityManager: EntityManager,
    stagingRow: MercadoPublicoApiV1OrdenDeCompraStagingRow,
  ): Promise<void> {
    const parsedFechaEnvio = parseMercadoPublicoDate(stagingRow.fecha_envio);
    const normalizedOcState = normalizeOcState(
      stagingRow.codigo_estado,
      stagingRow.estado,
    );

    await entityManager.query(
      `
        INSERT INTO mp.orden_compra (
          codigo,
          codigo_licitacion,
          canonical_state,
          raw_state_code,
          raw_state_label,
          raw_provider_state,
          fecha_envio,
          is_sentinel_1900_envio,
          tipo_moneda_oc,
          raw_monto_total_oc,
          nombre_proveedor,
          source_priority,
          last_seen_at,
          updated_at
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          $8,
          $9,
          $10,
          $11,
          $12,
          $13,
          now()
        )
        ON CONFLICT (codigo) DO UPDATE
        SET
          codigo_licitacion = COALESCE($2, mp.orden_compra.codigo_licitacion),
          canonical_state = CASE
            WHEN $14 THEN $3
            ELSE mp.orden_compra.canonical_state
          END,
          raw_state_code = COALESCE($4, mp.orden_compra.raw_state_code),
          raw_state_label = COALESCE($5, mp.orden_compra.raw_state_label),
          raw_provider_state = COALESCE($6, mp.orden_compra.raw_provider_state),
          fecha_envio = CASE
            WHEN $15 THEN $7
            ELSE mp.orden_compra.fecha_envio
          END,
          is_sentinel_1900_envio = CASE
            WHEN $15 THEN $8
            ELSE mp.orden_compra.is_sentinel_1900_envio
          END,
          tipo_moneda_oc = COALESCE($9, mp.orden_compra.tipo_moneda_oc),
          raw_monto_total_oc = COALESCE($10, mp.orden_compra.raw_monto_total_oc),
          nombre_proveedor = COALESCE($11, mp.orden_compra.nombre_proveedor),
          source_priority = COALESCE($12, mp.orden_compra.source_priority),
          last_seen_at = GREATEST(mp.orden_compra.last_seen_at, $13),
          updated_at = now()
      `,
      [
        stagingRow.codigo,
        stagingRow.codigo_licitacion,
        normalizedOcState.canonicalState,
        normalizedOcState.rawStateCode || stagingRow.codigo_estado,
        normalizedOcState.rawStateLabel || stagingRow.estado,
        stagingRow.estado_proveedor,
        parsedFechaEnvio.value,
        parsedFechaEnvio.isSentinel1900,
        stagingRow.tipo_moneda_oc,
        stagingRow.monto_total_oc,
        stagingRow.nombre_proveedor,
        stagingRow.source,
        stagingRow.fetched_at,
        stagingRow.codigo_estado !== null || stagingRow.estado !== null,
        stagingRow.fecha_envio !== null,
      ],
    );
  }

  async refreshLicitacionItemsFromCsvSnapshot(
    rawCsvFileId: string,
  ): Promise<number> {
    return this.coreDataSource.transaction(async (entityManager) => {
      const stagingRows = await this.selectLatestLicitacionItemStagingRows(
        entityManager,
        rawCsvFileId,
      );

      for (const stagingRow of stagingRows) {
        await this.upsertCanonicalLicitacionItem(entityManager, stagingRow);
      }

      return stagingRows.length;
    });
  }

  async refreshLicitacionOfertasFromCsvSnapshot(
    rawCsvFileId: string,
  ): Promise<number> {
    return this.coreDataSource.transaction(async (entityManager) => {
      const stagingRows = await this.selectLatestLicitacionOfertaStagingRows(
        entityManager,
        rawCsvFileId,
      );

      for (const stagingRow of stagingRows) {
        await this.upsertCanonicalLicitacionOferta(entityManager, stagingRow);
      }

      return stagingRows.length;
    });
  }

  async refreshLicitacionAdjudicacionesFromCsvSnapshot(
    rawCsvFileId: string,
  ): Promise<number> {
    return this.coreDataSource.transaction(async (entityManager) => {
      const stagingRows =
        await this.selectLatestLicitacionAdjudicacionStagingRows(
          entityManager,
          rawCsvFileId,
        );

      for (const stagingRow of stagingRows) {
        await this.upsertCanonicalLicitacionAdjudicacion(
          entityManager,
          stagingRow,
        );
      }

      return stagingRows.length;
    });
  }

  private async selectLatestLicitacionItemStagingRows(
    entityManager: EntityManager,
    rawCsvFileId: string,
  ): Promise<MercadoPublicoApiV1LicitacionItemStagingRow[]> {
    return entityManager.query<MercadoPublicoApiV1LicitacionItemStagingRow[]>(
      `
        SELECT DISTINCT ON (codigo_externo, codigoitem)
          stg.id,
          codigo_externo,
          codigoitem,
          nombre_producto_generico,
          COALESCE(cantidad_adjudicada, cantidad_ofertada) AS cantidad
        FROM mp.stg_csv_licitacion stg
        INNER JOIN mp.raw_csv_row raw_row
          ON raw_row.id = stg.raw_csv_row_id
        WHERE raw_row.raw_csv_file_id = $1
        ORDER BY codigo_externo, codigoitem, raw_row.row_number DESC, stg.created_at DESC, stg.id DESC
      `,
      [rawCsvFileId],
    );
  }

  private async selectLatestLicitacionOfertaStagingRows(
    entityManager: EntityManager,
    rawCsvFileId: string,
  ): Promise<MercadoPublicoApiV1LicitacionOfertaStagingRow[]> {
    return entityManager.query<MercadoPublicoApiV1LicitacionOfertaStagingRow[]>(
      `
        SELECT DISTINCT ON (codigo_externo, codigoitem, codigo_proveedor, nombre_de_la_oferta)
          stg.id,
          codigo_externo,
          codigoitem,
          codigo_proveedor,
          rut_proveedor,
          nombre_de_la_oferta,
          estado_oferta,
          cantidad_ofertada,
          valor_total_ofertado,
          oferta_seleccionada
        FROM mp.stg_csv_licitacion stg
        INNER JOIN mp.raw_csv_row raw_row
          ON raw_row.id = stg.raw_csv_row_id
        WHERE raw_row.raw_csv_file_id = $1
        ORDER BY codigo_externo, codigoitem, codigo_proveedor, nombre_de_la_oferta, raw_row.row_number DESC, stg.created_at DESC, stg.id DESC
      `,
      [rawCsvFileId],
    );
  }

  private async selectLatestLicitacionAdjudicacionStagingRows(
    entityManager: EntityManager,
    rawCsvFileId: string,
  ): Promise<MercadoPublicoApiV1LicitacionAdjudicacionStagingRow[]> {
    return entityManager.query<
      MercadoPublicoApiV1LicitacionAdjudicacionStagingRow[]
    >(
      `
        SELECT DISTINCT ON (codigo_externo, codigoitem, rut_proveedor)
          stg.id,
          codigo_externo,
          codigoitem,
          rut_proveedor,
          cantidad_adjudicada,
          monto_estimado_adjudicado
        FROM mp.stg_csv_licitacion stg
        INNER JOIN mp.raw_csv_row raw_row
          ON raw_row.id = stg.raw_csv_row_id
        WHERE raw_row.raw_csv_file_id = $1
        ORDER BY codigo_externo, codigoitem, rut_proveedor, raw_row.row_number DESC, stg.created_at DESC, stg.id DESC
      `,
      [rawCsvFileId],
    );
  }

  private async upsertCanonicalLicitacionItem(
    entityManager: EntityManager,
    stagingRow: MercadoPublicoApiV1LicitacionItemStagingRow,
  ): Promise<void> {
    await entityManager.query(
      `
        INSERT INTO mp.licitacion_item (
          codigo_externo,
          codigoitem,
          nombre_producto_generico,
          cantidad,
          updated_at
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          now()
        )
        ON CONFLICT (codigo_externo, codigoitem) DO UPDATE
        SET
          nombre_producto_generico = COALESCE($3, mp.licitacion_item.nombre_producto_generico),
          cantidad = COALESCE($4, mp.licitacion_item.cantidad),
          updated_at = now()
      `,
      [
        stagingRow.codigo_externo,
        stagingRow.codigoitem,
        stagingRow.nombre_producto_generico,
        stagingRow.cantidad,
      ],
    );
  }

  private async upsertCanonicalLicitacionOferta(
    entityManager: EntityManager,
    stagingRow: MercadoPublicoApiV1LicitacionOfertaStagingRow,
  ): Promise<void> {
    await entityManager.query(
      `
        INSERT INTO mp.licitacion_oferta (
          codigo_externo,
          codigoitem,
          codigo_proveedor,
          rut_proveedor,
          nombre_de_la_oferta,
          estado_oferta,
          cantidad_ofertada,
          raw_valor_total_ofertado,
          is_oferta_seleccionada,
          raw_oferta_seleccionada,
          updated_at
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          $8,
          $9,
          $10,
          now()
        )
        ON CONFLICT (codigo_externo, codigoitem, codigo_proveedor, nombre_de_la_oferta) DO UPDATE
        SET
          rut_proveedor = COALESCE($4, mp.licitacion_oferta.rut_proveedor),
          estado_oferta = COALESCE($6, mp.licitacion_oferta.estado_oferta),
          cantidad_ofertada = COALESCE($7, mp.licitacion_oferta.cantidad_ofertada),
          raw_valor_total_ofertado = COALESCE($8, mp.licitacion_oferta.raw_valor_total_ofertado),
          is_oferta_seleccionada = COALESCE($9, mp.licitacion_oferta.is_oferta_seleccionada),
          raw_oferta_seleccionada = COALESCE($10, mp.licitacion_oferta.raw_oferta_seleccionada),
          updated_at = now()
      `,
      [
        stagingRow.codigo_externo,
        stagingRow.codigoitem,
        stagingRow.codigo_proveedor,
        stagingRow.rut_proveedor,
        stagingRow.nombre_de_la_oferta,
        stagingRow.estado_oferta,
        stagingRow.cantidad_ofertada,
        stagingRow.valor_total_ofertado,
        stagingRow.oferta_seleccionada === 'Si',
        stagingRow.oferta_seleccionada,
      ],
    );
  }

  private async upsertCanonicalLicitacionAdjudicacion(
    entityManager: EntityManager,
    stagingRow: MercadoPublicoApiV1LicitacionAdjudicacionStagingRow,
  ): Promise<void> {
    await entityManager.query(
      `
        INSERT INTO mp.licitacion_adjudicacion (
          codigo_externo,
          codigoitem,
          rut_proveedor,
          cantidad_adjudicada,
          raw_monto_adjudicado,
          updated_at
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          now()
        )
        ON CONFLICT (codigo_externo, codigoitem, rut_proveedor) DO UPDATE
        SET
          cantidad_adjudicada = COALESCE($4, mp.licitacion_adjudicacion.cantidad_adjudicada),
          raw_monto_adjudicado = COALESCE($5, mp.licitacion_adjudicacion.raw_monto_adjudicado),
          updated_at = now()
      `,
      [
        stagingRow.codigo_externo,
        stagingRow.codigoitem,
        stagingRow.rut_proveedor,
        stagingRow.cantidad_adjudicada,
        stagingRow.monto_estimado_adjudicado,
      ],
    );
  }

  async refreshOrdenCompraItemsFromCsvSnapshot(
    rawCsvFileId: string,
  ): Promise<number> {
    return this.coreDataSource.transaction(async (entityManager) => {
      const stagingRows = await this.selectLatestOrdenCompraItemStagingRows(
        entityManager,
        rawCsvFileId,
      );

      for (const stagingRow of stagingRows) {
        await this.upsertCanonicalOrdenCompraItem(entityManager, stagingRow);
      }

      return stagingRows.length;
    });
  }

  async refreshCanonicalFromCsvSnapshot(rawCsvFileId: string): Promise<{
    licitacionItems: number;
    licitacionOfertas: number;
    licitacionAdjudicaciones: number;
    ordenCompraItems: number;
    total: number;
  }> {
    const result = {
      licitacionItems: 0,
      licitacionOfertas: 0,
      licitacionAdjudicaciones: 0,
      ordenCompraItems: 0,
      total: 0,
    };

    result.licitacionItems =
      await this.refreshLicitacionItemsFromCsvSnapshot(rawCsvFileId);
    result.licitacionOfertas =
      await this.refreshLicitacionOfertasFromCsvSnapshot(rawCsvFileId);
    result.licitacionAdjudicaciones =
      await this.refreshLicitacionAdjudicacionesFromCsvSnapshot(rawCsvFileId);
    result.ordenCompraItems =
      await this.refreshOrdenCompraItemsFromCsvSnapshot(rawCsvFileId);
    result.total =
      result.licitacionItems +
      result.licitacionOfertas +
      result.licitacionAdjudicaciones +
      result.ordenCompraItems;

    return result;
  }

  private async selectLatestOrdenCompraItemStagingRows(
    entityManager: EntityManager,
    rawCsvFileId: string,
  ): Promise<MercadoPublicoApiV1OrdenCompraItemStagingRow[]> {
    return entityManager.query<MercadoPublicoApiV1OrdenCompraItemStagingRow[]>(
      `
        SELECT DISTINCT ON (iditem)
          stg.id,
          iditem,
          codigo,
          total_linea_neto,
          codigo_producto_onu,
          forma_de_pago
        FROM mp.stg_csv_orden_compra stg
        INNER JOIN mp.raw_csv_row raw_row
          ON raw_row.id = stg.raw_csv_row_id
        WHERE raw_row.raw_csv_file_id = $1
        ORDER BY iditem, raw_row.row_number DESC, stg.created_at DESC, stg.id DESC
      `,
      [rawCsvFileId],
    );
  }

  private async upsertCanonicalOrdenCompraItem(
    entityManager: EntityManager,
    stagingRow: MercadoPublicoApiV1OrdenCompraItemStagingRow,
  ): Promise<void> {
    await entityManager.query(
      `
        INSERT INTO mp.orden_compra_item (
          iditem,
          codigo,
          raw_total_linea_neto,
          codigo_producto_onu,
          forma_de_pago,
          updated_at
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          now()
        )
        ON CONFLICT (iditem) DO UPDATE
        SET
          codigo = COALESCE($2, mp.orden_compra_item.codigo),
          raw_total_linea_neto = COALESCE($3, mp.orden_compra_item.raw_total_linea_neto),
          codigo_producto_onu = COALESCE($4, mp.orden_compra_item.codigo_producto_onu),
          forma_de_pago = COALESCE($5, mp.orden_compra_item.forma_de_pago),
          updated_at = now()
      `,
      [
        stagingRow.iditem,
        stagingRow.codigo,
        stagingRow.total_linea_neto,
        stagingRow.codigo_producto_onu,
        stagingRow.forma_de_pago,
      ],
    );
  }
}
