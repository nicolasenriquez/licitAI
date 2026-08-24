import { Module } from '@nestjs/common';

import { MercadoPublicoV2DebtRecoveryCronCommand } from 'src/engine/core-modules/mercado-publico/crons/commands/mercado-publico-v2-debt-recovery.cron.command';
import { MercadoPublicoV2SyncRecoveryCronCommand } from 'src/engine/core-modules/mercado-publico/crons/commands/mercado-publico-v2-sync-recovery.cron.command';
import { MercadoPublicoV2DebtRecoveryCronJob } from 'src/engine/core-modules/mercado-publico/crons/jobs/mercado-publico-v2-debt-recovery.cron.job';
import { MercadoPublicoV2SyncRecoveryCronJob } from 'src/engine/core-modules/mercado-publico/crons/jobs/mercado-publico-v2-sync-recovery.cron.job';
import { MercadoPublicoSyncOperatorCommand } from 'src/engine/core-modules/mercado-publico/commands/mercado-publico-sync-operator.command';
import { MercadoPublicoV2E2EReadModelSeedCommand } from 'src/engine/core-modules/mercado-publico/commands/mercado-publico-v2-e2e-read-model-seed.command';
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
import { MercadoPublicoV2SyncCommandJob } from 'src/engine/core-modules/mercado-publico/jobs/mercado-publico-v2-sync-command.job';
import { SecureHttpClientModule } from 'src/engine/core-modules/secure-http-client/secure-http-client.module';
import { MercadoPublicoConfigService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-config.service';
import { MercadoPublicoPersistenceService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-persistence.service';
import { MercadoPublicoQuotaTrackerService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-quota-tracker.service';
import { MercadoPublicoV2DurableSyncService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-v2-durable-sync.service';
import { MercadoPublicoV2ProjectionService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-v2-projection.service';
import { MercadoPublicoV2EvidenceReplayService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-v2-evidence-replay.service';

@Module({
  imports: [SecureHttpClientModule],
  providers: [
    MercadoPublicoConfigService,
    MercadoPublicoPersistenceService,
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
    MercadoPublicoApiV2CompraAgilClientService,
    MercadoPublicoSyncOperatorCommand,
    MercadoPublicoV2E2EReadModelSeedCommand,
    MercadoPublicoV2SyncCommandJob,
    MercadoPublicoV2SyncRecoveryCronJob,
    MercadoPublicoV2SyncRecoveryCronCommand,
    MercadoPublicoV2DebtRecoveryCronJob,
    MercadoPublicoV2DebtRecoveryCronCommand,
  ],
  exports: [
    MercadoPublicoConfigService,
    MercadoPublicoV2DurableSyncService,
    MercadoPublicoV2ProjectionService,
    MercadoPublicoV2EvidenceReplayService,
  ],
})
export class MercadoPublicoModule {}
