import { Module } from '@nestjs/common';

import { MercadoPublicoRunCommand } from 'src/engine/core-modules/mercado-publico/commands/mercado-publico-run.command';
import { MercadoPublicoApiV1LicitacionesClientService } from 'src/engine/core-modules/mercado-publico/drivers/api/mercado-publico-api-v1-licitaciones-client.service';
import { MercadoPublicoApiV1OrdenesDeCompraClientService } from 'src/engine/core-modules/mercado-publico/drivers/api/mercado-publico-api-v1-ordenes-de-compra-client.service';
import { MercadoPublicoApiV2CompraAgilClientService } from 'src/engine/core-modules/mercado-publico/drivers/api/mercado-publico-api-v2-compra-agil-client.service';
import { MercadoPublicoJob } from 'src/engine/core-modules/mercado-publico/jobs/mercado-publico.job';
import { SecureHttpClientModule } from 'src/engine/core-modules/secure-http-client/secure-http-client.module';
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
import { MercadoPublicoJobOrchestratorService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-job-orchestrator.service';
import { MercadoPublicoPersistenceService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-persistence.service';

@Module({
  imports: [SecureHttpClientModule],
  providers: [
    MercadoPublicoConfigService,
    MercadoPublicoJobOrchestratorService,
    MercadoPublicoPersistenceService,
    MercadoPublicoCanonicalRefreshService,
    MercadoPublicoDetectedProcessReadService,
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
    MercadoPublicoJob,
  ],
  exports: [
    MercadoPublicoConfigService,
    MercadoPublicoJobOrchestratorService,
    MercadoPublicoDetectedProcessReadService,
  ],
})
export class MercadoPublicoModule {}
