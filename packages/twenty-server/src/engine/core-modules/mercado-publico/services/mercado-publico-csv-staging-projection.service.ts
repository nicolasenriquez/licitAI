import { BadRequestException, Injectable, Logger } from '@nestjs/common';

import { classifyFailure } from 'src/engine/core-modules/mercado-publico/drivers/api/utils/classify-http-failure.util';
import { MercadoPublicoPersistenceService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-persistence.service';
import { MercadoPublicoRecordedJobFailureError } from 'src/engine/core-modules/mercado-publico/services/utils/mercado-publico-recorded-job-failure.error';
import { mapMercadoPublicoErrorSummaryToJobRunStatus } from 'src/engine/core-modules/mercado-publico/services/utils/map-mercado-publico-error-summary-to-job-run-status.util';
import { buildMercadoPublicoUnexpectedErrorSummaryText } from 'src/engine/core-modules/mercado-publico/services/utils/build-mercado-publico-error-summary-text.util';
import { OC_STAGING_COLUMN_MAP } from 'src/engine/core-modules/mercado-publico/services/utils/csv/oc-staging-column-map.constant';
import { LICITACIONES_STAGING_COLUMN_MAP } from 'src/engine/core-modules/mercado-publico/services/utils/csv/licitaciones-staging-column-map.constant';
import { projectStagingRow } from 'src/engine/core-modules/mercado-publico/services/utils/csv/project-staging-row.util';

type MercadoPublicoCsvStagingProjectionPayload = {
  raw_csv_file_id: string;
};

const BATCH_SIZE = 1000;
const RAW_ROW_PAGE_SIZE = 1000;

@Injectable()
export class MercadoPublicoCsvStagingProjectionService {
  private readonly logger = new Logger(
    MercadoPublicoCsvStagingProjectionService.name,
  );

  constructor(
    private readonly mercadoPublicoPersistenceService: MercadoPublicoPersistenceService,
  ) {}

  async run(payload: Record<string, unknown>): Promise<void> {
    const jobRunRecord =
      await this.mercadoPublicoPersistenceService.createJobRun(
        'csv-staging-projection',
      );

    try {
      const parsedPayload = this.parsePayload(payload);
      const rawFileRow =
        await this.mercadoPublicoPersistenceService.getRawCsvFileById(
          parsedPayload.raw_csv_file_id,
        );

      if (!rawFileRow) {
        throw new Error(
          `raw_csv_file row not found for id ${parsedPayload.raw_csv_file_id}`,
        );
      }

      await this.mercadoPublicoPersistenceService.linkJobRunToRawCsvFile(
        jobRunRecord.id,
        rawFileRow.id,
      );

      const observedColumns: string[] = await this.getObservedColumns(
        parsedPayload.raw_csv_file_id,
      );

      if (observedColumns.length === 0) {
        throw new Error(
          `No observed_columns for raw_csv_file ${parsedPayload.raw_csv_file_id}. Run csv-file-profile first.`,
        );
      }

      const recordsFetched =
        await this.mercadoPublicoPersistenceService.countRawCsvRowsByFileId(
          parsedPayload.raw_csv_file_id,
        );

      let stagedCount = 0;

      if (rawFileRow.source_dataset === 'oc') {
        stagedCount = await this.projectOrdenCompra(
          parsedPayload.raw_csv_file_id,
          observedColumns,
          rawFileRow.source_period,
        );
      } else if (rawFileRow.source_dataset === 'licitaciones') {
        stagedCount = await this.projectLicitacion(
          parsedPayload.raw_csv_file_id,
          observedColumns,
          rawFileRow.source_period,
        );
      } else {
        throw new Error(
          `Unsupported source_dataset "${rawFileRow.source_dataset}" for CSV staging projection`,
        );
      }

      const errorSummary =
        stagedCount === 0
          ? 'CSV staging projection found no importable rows'
          : stagedCount < recordsFetched
            ? `CSV staging projection skipped ${recordsFetched - stagedCount} raw rows`
            : undefined;

      await this.mercadoPublicoPersistenceService.finalizeJobRun({
        jobRunRecordId: jobRunRecord.id,
        status: errorSummary === undefined ? 'success' : 'failed',
        finishedAt: new Date(),
        recordsFetched,
        recordsStaged: stagedCount,
        recordsCanonicalized: 0,
        recordsFailed: errorSummary === undefined ? 0 : 1,
        errorSummary,
      });

      if (errorSummary !== undefined) {
        throw new MercadoPublicoRecordedJobFailureError(errorSummary, false);
      }

      this.logger.log(
        `Staging projection complete for ${rawFileRow.source_dataset}/${rawFileRow.source_period}: ${stagedCount} rows staged`,
      );
    } catch (error) {
      if (error instanceof MercadoPublicoRecordedJobFailureError) {
        this.logger.error(error.message);

        throw error;
      }

      const errorSummary = classifyFailure(error);
      const errorSummaryText = buildMercadoPublicoUnexpectedErrorSummaryText(
        errorSummary,
        error,
      );

      await this.mercadoPublicoPersistenceService.finalizeJobRun({
        jobRunRecordId: jobRunRecord.id,
        status: mapMercadoPublicoErrorSummaryToJobRunStatus(errorSummary),
        finishedAt: new Date(),
        errorSummary: errorSummaryText,
        recordsFailed: 1,
      });

      this.logger.error(errorSummaryText);

      if (error instanceof BadRequestException) {
        throw new MercadoPublicoRecordedJobFailureError(
          errorSummaryText,
          false,
        );
      }

      throw error;
    }
  }

  private parsePayload(
    payload: Record<string, unknown>,
  ): MercadoPublicoCsvStagingProjectionPayload {
    const rawCsvFileId = payload.raw_csv_file_id;

    if (typeof rawCsvFileId !== 'string' || rawCsvFileId.length === 0) {
      throw new BadRequestException(
        'CSV staging projection payload requires a non-empty "raw_csv_file_id" string (UUID)',
      );
    }

    return {
      raw_csv_file_id: rawCsvFileId,
    };
  }

  private async getObservedColumns(rawCsvFileId: string): Promise<string[]> {
    return this.mercadoPublicoPersistenceService.getRawCsvFileObservedColumns(
      rawCsvFileId,
    );
  }

  private async projectOrdenCompra(
    rawCsvFileId: string,
    observedColumns: string[],
    sourcePeriod: string,
  ): Promise<number> {
    let staged = 0;
    let batch: Array<{
      rawCsvRowId: string;
      sourceDataset: string;
      sourcePeriod: string;
      codigo: string | null;
      sourceId: string | null;
      iditem: string | null;
      codigoLicitacion: string | null;
      fechaEnvio: string | null;
      estado: string | null;
      descripcionTipoOc: string | null;
      codigoAbreviadoTipoOc: string | null;
      codigoTipo: string | null;
      tipoMonedaOc: string | null;
      montoTotalOcPesosChilenos: string | null;
      impuestosOc: string | null;
      unidadCompra: string | null;
      nombreProveedor: string | null;
      codigoProductoOnu: string | null;
      totalLineaNeto: string | null;
      esCompraAgil: string | null;
      esTratoDirecto: string | null;
      formaDePago: string | null;
      codigoConvenioMarco: string | null;
      allObservedFields: unknown;
    }> = [];

    await this.mercadoPublicoPersistenceService.deleteStgCsvOrdenCompraRowsByRawFileId(
      rawCsvFileId,
    );

    const flush = async () => {
      if (batch.length === 0) {
        return;
      }

      await this.mercadoPublicoPersistenceService.insertStgCsvOrdenCompraRows({
        rows: batch,
      });
      batch = [];
    };

    let lastRowNumber = 0;

    while (true) {
      const rows =
        await this.mercadoPublicoPersistenceService.getRawCsvRowsPageByFileId(
          rawCsvFileId,
          lastRowNumber,
          RAW_ROW_PAGE_SIZE,
        );

      if (rows.length === 0) {
        break;
      }

      for (const row of rows) {
        lastRowNumber = row.row_number;

        if (
          row.parse_status !== 'success' ||
          !Array.isArray(row.raw_row_json)
        ) {
          continue;
        }

        const values = projectStagingRow(
          row.raw_row_json,
          observedColumns,
          OC_STAGING_COLUMN_MAP,
        );

        batch.push({
          rawCsvRowId: row.id,
          sourceDataset: 'oc',
          sourcePeriod,
          codigo: values.codigo,
          sourceId: values.source_id,
          iditem: values.iditem,
          codigoLicitacion: values.codigo_licitacion,
          fechaEnvio: values.fecha_envio,
          estado: values.estado,
          descripcionTipoOc: values.descripcion_tipo_oc,
          codigoAbreviadoTipoOc: values.codigo_abreviado_tipo_oc,
          codigoTipo: values.codigo_tipo,
          tipoMonedaOc: values.tipo_moneda_oc,
          montoTotalOcPesosChilenos: values.monto_total_oc_pesos_chilenos,
          impuestosOc: values.impuestos_oc,
          unidadCompra: values.unidad_compra,
          nombreProveedor: values.nombre_proveedor,
          codigoProductoOnu: values.codigo_producto_onu,
          totalLineaNeto: values.total_linea_neto,
          esCompraAgil: values.es_compra_agil,
          esTratoDirecto: values.es_trato_directo,
          formaDePago: values.forma_de_pago,
          codigoConvenioMarco: values.codigo_convenio_marco,
          allObservedFields: row.raw_row_json,
        });
        staged++;

        if (batch.length >= BATCH_SIZE) {
          await flush();
        }
      }
    }

    await flush();

    return staged;
  }

  private async projectLicitacion(
    rawCsvFileId: string,
    observedColumns: string[],
    sourcePeriod: string,
  ): Promise<number> {
    let staged = 0;
    let batch: Array<{
      rawCsvRowId: string;
      sourceDataset: string;
      sourcePeriod: string;
      codigoExterno: string | null;
      codigo: string | null;
      codigoitem: string | null;
      codigoProveedor: string | null;
      rutProveedor: string | null;
      nombreDeLaOferta: string | null;
      estadoOferta: string | null;
      ofertaSeleccionada: string | null;
      cantidadOfertada: string | null;
      valorTotalOfertado: string | null;
      tipoDeAdquisicion: string | null;
      fechaPublicacion: string | null;
      fechaAdjudicacion: string | null;
      estado: string | null;
      nombreUnidad: string | null;
      nombreProductoGenerico: string | null;
      cantidadAdjudicada: string | null;
      montoEstimadoAdjudicado: string | null;
      allObservedFields: unknown;
    }> = [];

    await this.mercadoPublicoPersistenceService.deleteStgCsvLicitacionRowsByRawFileId(
      rawCsvFileId,
    );

    const flush = async () => {
      if (batch.length === 0) {
        return;
      }

      await this.mercadoPublicoPersistenceService.insertStgCsvLicitacionRows({
        rows: batch,
      });
      batch = [];
    };

    let lastRowNumber = 0;

    while (true) {
      const rows =
        await this.mercadoPublicoPersistenceService.getRawCsvRowsPageByFileId(
          rawCsvFileId,
          lastRowNumber,
          RAW_ROW_PAGE_SIZE,
        );

      if (rows.length === 0) {
        break;
      }

      for (const row of rows) {
        lastRowNumber = row.row_number;

        if (
          row.parse_status !== 'success' ||
          !Array.isArray(row.raw_row_json)
        ) {
          continue;
        }

        const values = projectStagingRow(
          row.raw_row_json,
          observedColumns,
          LICITACIONES_STAGING_COLUMN_MAP,
        );

        batch.push({
          rawCsvRowId: row.id,
          sourceDataset: 'licitaciones',
          sourcePeriod,
          codigoExterno: values.codigo_externo,
          codigo: values.codigo,
          codigoitem: values.codigoitem,
          codigoProveedor: values.codigo_proveedor,
          rutProveedor: values.rut_proveedor,
          nombreDeLaOferta: values.nombre_de_la_oferta,
          estadoOferta: values.estado_oferta,
          ofertaSeleccionada: values.oferta_seleccionada,
          cantidadOfertada: values.cantidad_ofertada,
          valorTotalOfertado: values.valor_total_ofertado,
          tipoDeAdquisicion: values.tipo_de_adquisicion,
          fechaPublicacion: values.fecha_publicacion,
          fechaAdjudicacion: values.fecha_adjudicacion,
          estado: values.estado,
          nombreUnidad: values.nombre_unidad,
          nombreProductoGenerico: values.nombre_producto_generico,
          cantidadAdjudicada: values.cantidad_adjudicada,
          montoEstimadoAdjudicado: values.monto_estimado_adjudicado,
          allObservedFields: row.raw_row_json,
        });
        staged++;

        if (batch.length >= BATCH_SIZE) {
          await flush();
        }
      }
    }

    await flush();

    return staged;
  }
}
