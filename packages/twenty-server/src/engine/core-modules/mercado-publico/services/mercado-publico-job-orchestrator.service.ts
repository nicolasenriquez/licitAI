import {
  BadRequestException,
  Injectable,
  Logger,
  NotImplementedException,
  Optional,
} from '@nestjs/common';

import {
  MERCADO_PUBLICO_SUPPORTED_JOB_NAMES_TEXT,
  type MercadoPublicoJobName,
  isMercadoPublicoJobName,
} from 'src/engine/core-modules/mercado-publico/mercado-publico.constants';
import { MercadoPublicoApiV1LicitacionesByDateService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-api-v1-licitaciones-by-date.service';
import { MercadoPublicoApiV1LicitacionDetailByCodigoService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-api-v1-licitacion-detail-by-codigo.service';
import { MercadoPublicoApiV1LicitacionesByStateService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-api-v1-licitaciones-by-state.service';
import { MercadoPublicoApiV1OcByDateService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-api-v1-oc-by-date.service';
import { MercadoPublicoApiV1OcByStateService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-api-v1-oc-by-state.service';
import { MercadoPublicoApiV1OcDetailByCodigoService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-api-v1-oc-detail-by-codigo.service';
import { MercadoPublicoApiV2CompraAgilIncrementalService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-api-v2-compra-agil-incremental.service';
import { MercadoPublicoV2GoldenPathService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-v2-golden-path.service';
import { MercadoPublicoApiV2CompraAgilPublicationWindowService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-api-v2-compra-agil-publication-window.service';
import { MercadoPublicoApiV2CompraAgilDetailByCodigoService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-api-v2-compra-agil-detail-by-codigo.service';
import { MercadoPublicoConfigService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-config.service';
import { MercadoPublicoCsvOcDownloadService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-csv-oc-download.service';
import { MercadoPublicoCsvLicitacionesDownloadService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-csv-licitaciones-download.service';
import { MercadoPublicoCsvProfileService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-csv-profile.service';
import { MercadoPublicoCsvRawLoadService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-csv-raw-load.service';
import { MercadoPublicoCanonicalRefreshService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-canonical-refresh.service';
import { MercadoPublicoCsvStagingProjectionService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-csv-staging-projection.service';
import { MercadoPublicoReconciliationService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-reconciliation.service';

@Injectable()
export class MercadoPublicoJobOrchestratorService {
  private readonly logger = new Logger(
    MercadoPublicoJobOrchestratorService.name,
  );

  constructor(
    private readonly mercadoPublicoConfigService: MercadoPublicoConfigService,
    private readonly mercadoPublicoApiV1LicitacionesByDateService: MercadoPublicoApiV1LicitacionesByDateService,
    private readonly mercadoPublicoApiV1LicitacionDetailByCodigoService: MercadoPublicoApiV1LicitacionDetailByCodigoService,
    private readonly mercadoPublicoApiV1LicitacionesByStateService: MercadoPublicoApiV1LicitacionesByStateService,
    private readonly mercadoPublicoApiV1OcByDateService: MercadoPublicoApiV1OcByDateService,
    private readonly mercadoPublicoApiV1OcByStateService: MercadoPublicoApiV1OcByStateService,
    private readonly mercadoPublicoApiV1OcDetailByCodigoService: MercadoPublicoApiV1OcDetailByCodigoService,
    private readonly mercadoPublicoApiV2CompraAgilIncrementalService: MercadoPublicoApiV2CompraAgilIncrementalService,
    private readonly mercadoPublicoApiV2CompraAgilPublicationWindowService: MercadoPublicoApiV2CompraAgilPublicationWindowService,
    private readonly mercadoPublicoApiV2CompraAgilDetailByCodigoService: MercadoPublicoApiV2CompraAgilDetailByCodigoService,
    private readonly mercadoPublicoCsvOcDownloadService: MercadoPublicoCsvOcDownloadService,
    private readonly mercadoPublicoCsvLicitacionesDownloadService: MercadoPublicoCsvLicitacionesDownloadService,
    private readonly mercadoPublicoCsvProfileService: MercadoPublicoCsvProfileService,
    private readonly mercadoPublicoCsvRawLoadService: MercadoPublicoCsvRawLoadService,
    private readonly mercadoPublicoCsvStagingProjectionService: MercadoPublicoCsvStagingProjectionService,
    private readonly mercadoPublicoCanonicalRefreshService: MercadoPublicoCanonicalRefreshService,
    private readonly mercadoPublicoReconciliationService: MercadoPublicoReconciliationService,
    @Optional()
    private readonly mercadoPublicoV2GoldenPathService?: MercadoPublicoV2GoldenPathService,
  ) {}

  async run(
    jobName: MercadoPublicoJobName,
    payload: Record<string, unknown>,
  ): Promise<void> {
    if (!isMercadoPublicoJobName(jobName)) {
      throw new BadRequestException(
        `Unsupported Mercado Publico job "${jobName}". Supported jobs: ${MERCADO_PUBLICO_SUPPORTED_JOB_NAMES_TEXT}`,
      );
    }

    const settings = this.mercadoPublicoConfigService.getSettings();

    this.logger.log(
      `Received Mercado Publico job "${jobName}" (csvDownloadEnabled=${settings.csvDownloadEnabled}, quotaTimezone=${settings.quotaTimezone})`,
    );

    if (jobName === 'api-v1-licitaciones-by-date') {
      await this.mercadoPublicoApiV1LicitacionesByDateService.run(payload);

      return;
    }

    if (jobName === 'api-v1-licitaciones-by-state') {
      await this.mercadoPublicoApiV1LicitacionesByStateService.run(payload);

      return;
    }

    if (jobName === 'api-v1-licitacion-detail-by-codigo') {
      await this.mercadoPublicoApiV1LicitacionDetailByCodigoService.run(
        payload,
      );

      return;
    }

    if (jobName === 'api-v1-oc-by-date') {
      await this.mercadoPublicoApiV1OcByDateService.run(payload);

      return;
    }

    if (jobName === 'api-v1-oc-by-state') {
      await this.mercadoPublicoApiV1OcByStateService.run(payload);

      return;
    }

    if (jobName === 'api-v1-oc-detail-by-codigo') {
      await this.mercadoPublicoApiV1OcDetailByCodigoService.run(payload);

      return;
    }

    if (jobName === 'api-v2-compra-agil-incremental') {
      if (this.mercadoPublicoV2GoldenPathService) {
        await this.mercadoPublicoV2GoldenPathService.runProduction(payload);

        return;
      }

      await this.mercadoPublicoApiV2CompraAgilIncrementalService.run(payload);

      return;
    }

    if (jobName === 'api-v2-compra-agil-by-publication-window') {
      await this.mercadoPublicoApiV2CompraAgilPublicationWindowService.run(
        payload,
      );

      return;
    }

    if (jobName === 'api-v2-compra-agil-detail-by-codigo') {
      await this.mercadoPublicoApiV2CompraAgilDetailByCodigoService.run(
        payload,
      );

      return;
    }

    if (jobName === 'csv-oc-download') {
      await this.mercadoPublicoCsvOcDownloadService.run(payload);

      return;
    }

    if (jobName === 'csv-licitaciones-download') {
      await this.mercadoPublicoCsvLicitacionesDownloadService.run(payload);

      return;
    }

    if (jobName === 'csv-file-profile') {
      await this.mercadoPublicoCsvProfileService.run(payload);

      return;
    }

    if (jobName === 'csv-raw-load') {
      await this.mercadoPublicoCsvRawLoadService.run(payload);

      return;
    }

    if (jobName === 'csv-staging-projection') {
      await this.mercadoPublicoCsvStagingProjectionService.run(payload);

      return;
    }

    if (jobName === 'csv-canonical-refresh') {
      const rawCsvFileId = this.parseRawCsvFileId(payload);
      const result =
        await this.mercadoPublicoCanonicalRefreshService.refreshCanonicalFromCsvSnapshot(
          rawCsvFileId,
        );

      this.logger.log(
        `Canonical rerun complete: items=${result.licitacionItems}, ofertas=${result.licitacionOfertas}, adjudicaciones=${result.licitacionAdjudicaciones}, OC_items=${result.ordenCompraItems}, total=${result.total}`,
      );

      return;
    }

    if (jobName === 'reconciliation-refresh') {
      const exactResult =
        await this.mercadoPublicoReconciliationService.refreshAllExactReconciliation();

      this.logger.log(
        `Exact reconciliation complete: codigo_externo=${exactResult.exactCodigoExterno}, csv_api_same_business_key=${exactResult.csvApiSameBusinessKey}, codigo_licitacion=${exactResult.exactCodigoLicitacion}, compra_agil_id_orden_compra=${exactResult.exactCompraAgilIdOrdenCompra}, total=${exactResult.total}`,
      );

      const heuristicResult =
        await this.mercadoPublicoReconciliationService.refreshAllHeuristicReconciliation();

      this.logger.log(
        `Heuristic reconciliation complete: candidates=${heuristicResult.candidates}, unmatched=${heuristicResult.unmatched}, events=${heuristicResult.events}, goldStatusesUpdated=${heuristicResult.goldStatusesUpdated}, total=${heuristicResult.total}`,
      );

      return;
    }

    throw new NotImplementedException(
      `Mercado Publico job "${jobName}" is registered and queued, but execution starts in tasks 3.4+.
Payload: ${JSON.stringify(payload)}`,
    );
  }

  private parseRawCsvFileId(payload: Record<string, unknown>): string {
    const rawCsvFileId = payload.raw_csv_file_id;

    if (typeof rawCsvFileId !== 'string' || rawCsvFileId.trim().length === 0) {
      throw new BadRequestException(
        'Mercado Publico csv-canonical-refresh payload requires a non-empty "raw_csv_file_id" string',
      );
    }

    return rawCsvFileId;
  }
}
