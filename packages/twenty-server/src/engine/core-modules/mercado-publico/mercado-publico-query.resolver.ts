import { UseFilters, UseGuards, UsePipes } from '@nestjs/common';
import { Args, Query } from '@nestjs/graphql';

import { CoreResolver } from 'src/engine/api/graphql/graphql-config/decorators/core-resolver.decorator';
import { PreventNestToAutoLogGraphqlErrorsFilter } from 'src/engine/core-modules/graphql/filters/prevent-nest-to-auto-log-graphql-errors.filter';
import { ResolverValidationPipe } from 'src/engine/core-modules/graphql/pipes/resolver-validation.pipe';
import { MercadoPublicoApiCallLogReadService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-api-call-log-read.service';
import { MercadoPublicoApiQuotaUsageReadService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-api-quota-usage-read.service';
import { MercadoPublicoCsvFileHealthReadService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-csv-file-health-read.service';
import { MercadoPublicoDetectedProcessReadService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-detected-process-read.service';
import { MercadoPublicoJobRunReadService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-job-run-read.service';
import { MercadoPublicoPipelineHealthReadService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-pipeline-health-read.service';
import { MercadoPublicoProcessDetailReadService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-process-detail-read.service';
import {
  type MercadoPublicoDetectedProcessSortDirection,
  type MercadoPublicoDetectedProcessSortKey,
  type MercadoPublicoDetectedProcessType,
} from 'src/engine/core-modules/mercado-publico/constants/detected-process-read.constants';
import { type MercadoPublicoJobRunStatus } from 'src/engine/core-modules/mercado-publico/mercado-publico.constants';
import { type MercadoPublicoDetectedProcessDetail } from 'src/engine/core-modules/mercado-publico/types/process-detail-read.types';
import {
  type MercadoPublicoCompraAgilAnalytics,
  type MercadoPublicoListDetectedProcessesResult,
} from 'src/engine/core-modules/mercado-publico/types/detected-process-read.types';
import { type MercadoPublicoListJobRunsResult } from 'src/engine/core-modules/mercado-publico/types/job-run-read.types';
import { type MercadoPublicoListApiCallLogsResult } from 'src/engine/core-modules/mercado-publico/types/api-call-log-read.types';
import { UserAuthGuard } from 'src/engine/guards/user-auth.guard';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';
import {
  MercadoPublicoApiCallLogArgs,
  MercadoPublicoApiCallLogsDTO,
  MercadoPublicoApiQuotaUsageDTO,
  MercadoPublicoCompraAgilAnalyticsArgs,
  MercadoPublicoCompraAgilAnalyticsDTO,
  MercadoPublicoCsvFileHealthDTO,
  MercadoPublicoDetectedProcessesArgs,
  MercadoPublicoDetectedProcessesDTO,
  MercadoPublicoJobRunsArgs,
  MercadoPublicoJobRunsDTO,
  MercadoPublicoPipelineHealthDTO,
  MercadoPublicoProcessDetailArgs,
  MercadoPublicoProcessDetailDTO,
} from 'src/engine/core-modules/mercado-publico/dtos/mercado-publico-query.dto';
import { redactMercadoPublicoRequestParams } from 'src/engine/core-modules/mercado-publico/utils/redact-mercado-publico-request-params.util';

@CoreResolver()
@UsePipes(ResolverValidationPipe)
@UseGuards(WorkspaceAuthGuard, UserAuthGuard, NoPermissionGuard)
@UseFilters(PreventNestToAutoLogGraphqlErrorsFilter)
export class MercadoPublicoQueryResolver {
  constructor(
    private readonly detectedProcessReadService: MercadoPublicoDetectedProcessReadService,
    private readonly processDetailReadService: MercadoPublicoProcessDetailReadService,
    private readonly jobRunReadService: MercadoPublicoJobRunReadService,
    private readonly apiCallLogReadService: MercadoPublicoApiCallLogReadService,
    private readonly pipelineHealthReadService: MercadoPublicoPipelineHealthReadService,
    private readonly apiQuotaUsageReadService: MercadoPublicoApiQuotaUsageReadService,
    private readonly csvFileHealthReadService: MercadoPublicoCsvFileHealthReadService,
  ) {}

  @Query(() => MercadoPublicoDetectedProcessesDTO)
  async mercadoPublicoDetectedProcesses(
    @Args() args: MercadoPublicoDetectedProcessesArgs,
  ): Promise<MercadoPublicoListDetectedProcessesResult> {
    return this.detectedProcessReadService.listDetectedProcesses({
      processTypes: args.processTypes,
      states: args.states,
      buyerCode: args.buyerCode,
      publishedFrom: args.publishedFrom,
      publishedTo: args.publishedTo,
      changedSince: args.changedSince,
      search: args.search,
      regionName: args.regionName,
      closingFrom: args.closingFrom,
      closingTo: args.closingTo,
      hasDocuments: args.hasDocuments,
      callStages: args.callStages,
      amountMin: args.amountMin,
      amountMax: args.amountMax,
      buyerRut: args.buyerRut,
      page: args.page,
      limit: args.limit,
      sort: args.sort
        ? {
            key: args.sort.key as MercadoPublicoDetectedProcessSortKey,
            direction: args.sort
              .direction as MercadoPublicoDetectedProcessSortDirection,
          }
        : undefined,
    });
  }

  @Query(() => MercadoPublicoCompraAgilAnalyticsDTO)
  async mercadoPublicoCompraAgilAnalytics(
    @Args() args: MercadoPublicoCompraAgilAnalyticsArgs,
  ): Promise<MercadoPublicoCompraAgilAnalytics> {
    return this.detectedProcessReadService.getCompraAgilAnalytics({
      search: args.search,
      regionName: args.regionName,
      closingFrom: args.closingFrom,
      closingTo: args.closingTo,
      hasDocuments: args.hasDocuments,
      callStages: args.callStages,
      amountMin: args.amountMin,
      amountMax: args.amountMax,
      buyerRut: args.buyerRut,
    });
  }

  @Query(() => MercadoPublicoProcessDetailDTO, { nullable: true })
  async mercadoPublicoProcessDetail(
    @Args() args: MercadoPublicoProcessDetailArgs,
  ): Promise<MercadoPublicoDetectedProcessDetail | null> {
    return this.processDetailReadService.getDetectedProcessDetail(
      args.processType as MercadoPublicoDetectedProcessType,
      args.processCode,
    );
  }

  @Query(() => MercadoPublicoJobRunsDTO)
  async mercadoPublicoJobRuns(
    @Args() args: MercadoPublicoJobRunsArgs,
  ): Promise<MercadoPublicoListJobRunsResult> {
    return this.jobRunReadService.listJobRuns({
      statuses: args.statuses as MercadoPublicoJobRunStatus[] | undefined,
      jobName: args.jobName,
      startedFrom: args.startedFrom,
      startedTo: args.startedTo,
      limit: args.limit,
      offset: args.offset,
    });
  }

  @Query(() => MercadoPublicoApiCallLogsDTO)
  async mercadoPublicoApiCallLog(
    @Args() args: MercadoPublicoApiCallLogArgs,
  ): Promise<MercadoPublicoListApiCallLogsResult> {
    const result = await this.apiCallLogReadService.listApiCallLogs({
      source: args.source,
      endpoint: args.endpoint,
      httpStatus: args.httpStatus,
      limit: args.limit,
      offset: args.offset,
    });

    return {
      ...result,
      items: result.items.map((item) => ({
        ...item,
        requestParams: redactMercadoPublicoRequestParams(item.requestParams),
      })),
    };
  }

  @Query(() => MercadoPublicoPipelineHealthDTO)
  async mercadoPublicoPipelineHealth() {
    return this.pipelineHealthReadService.getPipelineHealth();
  }

  @Query(() => MercadoPublicoApiQuotaUsageDTO)
  async mercadoPublicoApiQuotaUsage() {
    return this.apiQuotaUsageReadService.getApiQuotaUsage();
  }

  @Query(() => MercadoPublicoCsvFileHealthDTO)
  async mercadoPublicoCsvFileHealth() {
    return this.csvFileHealthReadService.getCsvFileHealth();
  }
}
