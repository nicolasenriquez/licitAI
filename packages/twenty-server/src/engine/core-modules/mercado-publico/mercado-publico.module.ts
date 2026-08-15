import { Module } from '@nestjs/common';

import { MercadoPublicoV2DebtRecoveryCronCommand } from 'src/engine/core-modules/mercado-publico/crons/commands/mercado-publico-v2-debt-recovery.cron.command';
import { MercadoPublicoV2SyncRecoveryCronCommand } from 'src/engine/core-modules/mercado-publico/crons/commands/mercado-publico-v2-sync-recovery.cron.command';
import { MercadoPublicoV2DebtRecoveryCronJob } from 'src/engine/core-modules/mercado-publico/crons/jobs/mercado-publico-v2-debt-recovery.cron.job';
import { MercadoPublicoV2SyncRecoveryCronJob } from 'src/engine/core-modules/mercado-publico/crons/jobs/mercado-publico-v2-sync-recovery.cron.job';
import { MercadoPublicoRunCommand } from 'src/engine/core-modules/mercado-publico/commands/mercado-publico-run.command';
import { MercadoPublicoSyncOperatorCommand } from 'src/engine/core-modules/mercado-publico/commands/mercado-publico-sync-operator.command';
import { MercadoPublicoV2E2EFixtureCommand } from 'src/engine/core-modules/mercado-publico/commands/mercado-publico-v2-e2e-fixture.command';
import { MercadoPublicoApiV1LicitacionesClientService } from 'src/engine/core-modules/mercado-publico/drivers/api/mercado-publico-api-v1-licitaciones-client.service';
import { MercadoPublicoApiV1OrdenesDeCompraClientService } from 'src/engine/core-modules/mercado-publico/drivers/api/mercado-publico-api-v1-ordenes-de-compra-client.service';
import { MercadoPublicoApiV2CompraAgilClientService } from 'src/engine/core-modules/mercado-publico/drivers/api/mercado-publico-api-v2-compra-agil-client.service';
import {
  MercadoPublicoV2NamespaceResolver,
  MercadoPublicoV2Resolver,
} from 'src/engine/core-modules/mercado-publico/graphql/mercado-publico-v2.resolver';
import {
  MercadoPublicoV2SyncControlNamespaceResolver,
  MercadoPublicoV2SyncControlResolver,
} from 'src/engine/core-modules/mercado-publico/graphql/mercado-publico-v2-sync-control.resolver';
import { MercadoPublicoV2SyncOperatorGuard } from 'src/engine/core-modules/mercado-publico/guards/mercado-publico-v2-sync-operator.guard';
import { MercadoPublicoV2SyncControlService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-v2-sync-control.service';
import { MercadoPublicoV2DetailResolver } from 'src/engine/core-modules/mercado-publico/graphql/mercado-publico-v2-detail.resolver';
import { MercadoPublicoV2BuyersReadService } from 'src/engine/core-modules/mercado-publico/graphql/mercado-publico-v2-buyers-read.service';
import { MercadoPublicoV2HistoryReadService } from 'src/engine/core-modules/mercado-publico/graphql/mercado-publico-v2-history-read.service';
import { MercadoPublicoV2DetailReadService } from 'src/engine/core-modules/mercado-publico/graphql/mercado-publico-v2-detail-read.service';
import { MercadoPublicoV2ReadService } from 'src/engine/core-modules/mercado-publico/graphql/mercado-publico-v2-read.service';
import { MercadoPublicoJob } from 'src/engine/core-modules/mercado-publico/jobs/mercado-publico.job';
import { MercadoPublicoV2SyncCommandJob } from 'src/engine/core-modules/mercado-publico/jobs/mercado-publico-v2-sync-command.job';
import { MercadoPublicoQueryResolver } from 'src/engine/core-modules/mercado-publico/mercado-publico-query.resolver';
import { SecureHttpClientModule } from 'src/engine/core-modules/secure-http-client/secure-http-client.module';
import { MercadoPublicoApiCallLogReadService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-api-call-log-read.service';
import { MercadoPublicoApiV1LicitacionesByDateService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-api-v1-licitaciones-by-date.service';
import { MercadoPublicoApiV1LicitacionDetailByCodigoService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-api-v1-licitacion-detail-by-codigo.service';
import { MercadoPublicoApiV1LicitacionesByStateService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-api-v1-licitaciones-by-state.service';
import { MercadoPublicoApiV1OcByDateService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-api-v1-oc-by-date.service';
import { MercadoPublicoApiV1OcByStateService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-api-v1-oc-by-state.service';
import { MercadoPublicoApiV1OcDetailByCodigoService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-api-v1-oc-detail-by-codigo.service';
import { MercadoPublicoApiV2CompraAgilIncrementalService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-api-v2-compra-agil-incremental.service';
import { MercadoPublicoApiV2CompraAgilPublicationWindowService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-api-v2-compra-agil-publication-window.service';
import { MercadoPublicoApiV2CompraAgilDetailByCodigoService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-api-v2-compra-agil-detail-by-codigo.service';
import { MercadoPublicoCanonicalRefreshService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-canonical-refresh.service';
import { MercadoPublicoConfigService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-config.service';
import { MercadoPublicoDetectedProcessReadService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-detected-process-read.service';
import { MercadoPublicoApiQuotaUsageReadService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-api-quota-usage-read.service';
import { MercadoPublicoCsvFileHealthReadService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-csv-file-health-read.service';
import { MercadoPublicoPipelineHealthReadService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-pipeline-health-read.service';
import { MercadoPublicoProcessDetailReadService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-process-detail-read.service';
import { MercadoPublicoJobOrchestratorService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-job-orchestrator.service';
import { MercadoPublicoPersistenceService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-persistence.service';
import { MercadoPublicoCsvDownloadSharedService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-csv-download-shared.service';
import { MercadoPublicoCsvOcDownloadService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-csv-oc-download.service';
import { MercadoPublicoCsvLicitacionesDownloadService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-csv-licitaciones-download.service';
import { MercadoPublicoCsvProfilingService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-csv-profiling.service';
import { MercadoPublicoCsvProfileService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-csv-profile.service';
import { MercadoPublicoCsvRawLoadService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-csv-raw-load.service';
import { MercadoPublicoCsvStagingProjectionService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-csv-staging-projection.service';
import { MercadoPublicoJobRunReadService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-job-run-read.service';
import { MercadoPublicoReconciliationService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-reconciliation.service';
import { MercadoPublicoQuotaTrackerService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-quota-tracker.service';
import { MercadoPublicoV2DurableSyncService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-v2-durable-sync.service';
import { MercadoPublicoV2ProjectionService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-v2-projection.service';
import { MercadoPublicoV2EvidenceReplayService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-v2-evidence-replay.service';

@Module({
  imports: [SecureHttpClientModule],
  providers: [
    MercadoPublicoConfigService,
    MercadoPublicoJobOrchestratorService,
    MercadoPublicoPersistenceService,
    MercadoPublicoCsvDownloadSharedService,
    MercadoPublicoCsvOcDownloadService,
    MercadoPublicoCsvLicitacionesDownloadService,
    MercadoPublicoCsvProfilingService,
    MercadoPublicoCsvProfileService,
    MercadoPublicoCsvRawLoadService,
    MercadoPublicoCsvStagingProjectionService,
    MercadoPublicoReconciliationService,
    MercadoPublicoQuotaTrackerService,
    MercadoPublicoV2DurableSyncService,
    MercadoPublicoV2ProjectionService,
    MercadoPublicoV2EvidenceReplayService,
    MercadoPublicoV2ReadService,
    MercadoPublicoV2DetailReadService,
    MercadoPublicoV2HistoryReadService,
    MercadoPublicoV2BuyersReadService,
    MercadoPublicoV2NamespaceResolver,
    MercadoPublicoV2Resolver,
    MercadoPublicoV2DetailResolver,
    MercadoPublicoV2SyncControlResolver,
    MercadoPublicoV2SyncControlNamespaceResolver,
    MercadoPublicoV2SyncOperatorGuard,
    MercadoPublicoV2SyncControlService,
    MercadoPublicoCanonicalRefreshService,
    MercadoPublicoApiCallLogReadService,
    MercadoPublicoApiQuotaUsageReadService,
    MercadoPublicoCsvFileHealthReadService,
    MercadoPublicoDetectedProcessReadService,
    MercadoPublicoPipelineHealthReadService,
    MercadoPublicoProcessDetailReadService,
    MercadoPublicoJobRunReadService,
    MercadoPublicoQueryResolver,
    MercadoPublicoApiV1LicitacionesClientService,
    MercadoPublicoApiV1OrdenesDeCompraClientService,
    MercadoPublicoApiV2CompraAgilClientService,
    MercadoPublicoApiV1LicitacionesByDateService,
    MercadoPublicoApiV1LicitacionDetailByCodigoService,
    MercadoPublicoApiV1LicitacionesByStateService,
    MercadoPublicoApiV1OcByDateService,
    MercadoPublicoApiV1OcByStateService,
    MercadoPublicoApiV1OcDetailByCodigoService,
    MercadoPublicoApiV2CompraAgilIncrementalService,
    MercadoPublicoApiV2CompraAgilPublicationWindowService,
    MercadoPublicoApiV2CompraAgilDetailByCodigoService,
    MercadoPublicoRunCommand,
    MercadoPublicoSyncOperatorCommand,
    MercadoPublicoV2E2EFixtureCommand,
    MercadoPublicoJob,
    MercadoPublicoV2SyncCommandJob,
    MercadoPublicoV2SyncRecoveryCronJob,
    MercadoPublicoV2SyncRecoveryCronCommand,
    MercadoPublicoV2DebtRecoveryCronJob,
    MercadoPublicoV2DebtRecoveryCronCommand,
  ],
  exports: [
    MercadoPublicoConfigService,
    MercadoPublicoJobOrchestratorService,
    MercadoPublicoApiQuotaUsageReadService,
    MercadoPublicoCsvFileHealthReadService,
    MercadoPublicoDetectedProcessReadService,
    MercadoPublicoPipelineHealthReadService,
    MercadoPublicoProcessDetailReadService,
    MercadoPublicoV2DurableSyncService,
    MercadoPublicoV2ProjectionService,
    MercadoPublicoV2EvidenceReplayService,
  ],
})
export class MercadoPublicoModule {}
