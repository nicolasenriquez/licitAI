import {
  ArgsType,
  Field,
  GraphQLISODateTime,
  InputType,
  Int,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';

import GraphQLJSON from 'graphql-type-json';

import {
  type MercadoPublicoDetectedProcessSortDirection,
  type MercadoPublicoDetectedProcessSortKey,
  type MercadoPublicoDetectedProcessType,
} from 'src/engine/core-modules/mercado-publico/constants/detected-process-read.constants';
import { type MercadoPublicoJobRunStatus } from 'src/engine/core-modules/mercado-publico/mercado-publico.constants';

export enum MercadoPublicoDetectedProcessTypeGraphQL {
  licitacion = 'licitacion',
  orden_compra = 'orden_compra',
  compra_agil = 'compra_agil',
}

export enum MercadoPublicoDetectedProcessSortKeyGraphQL {
  lastSeenAt = 'lastSeenAt',
  publishedAt = 'publishedAt',
  closingAt = 'closingAt',
  processCode = 'processCode',
  canonicalState = 'canonicalState',
}

export enum MercadoPublicoDetectedProcessSortDirectionGraphQL {
  asc = 'asc',
  desc = 'desc',
}

export enum MercadoPublicoJobRunStatusGraphQL {
  success = 'success',
  failed = 'failed',
  soft_miss = 'soft_miss',
  param_error = 'param_error',
  retryable_failed = 'retryable_failed',
  skipped = 'skipped',
}

registerEnumType(MercadoPublicoDetectedProcessTypeGraphQL, {
  name: 'MercadoPublicoDetectedProcessType',
});
registerEnumType(MercadoPublicoDetectedProcessSortKeyGraphQL, {
  name: 'MercadoPublicoDetectedProcessSortKey',
});
registerEnumType(MercadoPublicoDetectedProcessSortDirectionGraphQL, {
  name: 'MercadoPublicoDetectedProcessSortDirection',
});
registerEnumType(MercadoPublicoJobRunStatusGraphQL, {
  name: 'MercadoPublicoJobRunStatus',
});

@InputType('MercadoPublicoDetectedProcessSortInput')
export class MercadoPublicoDetectedProcessSortInput {
  @Field(() => MercadoPublicoDetectedProcessSortKeyGraphQL)
  key: MercadoPublicoDetectedProcessSortKey;

  @Field(() => MercadoPublicoDetectedProcessSortDirectionGraphQL)
  direction: MercadoPublicoDetectedProcessSortDirection;
}

@ArgsType()
export class MercadoPublicoDetectedProcessesArgs {
  @Field(() => [MercadoPublicoDetectedProcessTypeGraphQL], {
    nullable: true,
  })
  processTypes?: MercadoPublicoDetectedProcessType[];

  @Field(() => [String], { nullable: true })
  states?: string[];

  @Field(() => String, { nullable: true })
  buyerCode?: string;

  @Field(() => GraphQLISODateTime, { nullable: true })
  publishedFrom?: Date;

  @Field(() => GraphQLISODateTime, { nullable: true })
  publishedTo?: Date;

  @Field(() => GraphQLISODateTime, { nullable: true })
  changedSince?: Date;

  @Field(() => MercadoPublicoDetectedProcessSortInput, { nullable: true })
  sort?: MercadoPublicoDetectedProcessSortInput;

  @Field(() => Int, { nullable: true })
  page?: number;

  @Field(() => Int, { nullable: true })
  limit?: number;
}

@ArgsType()
export class MercadoPublicoProcessDetailArgs {
  @Field(() => MercadoPublicoDetectedProcessTypeGraphQL)
  processType: MercadoPublicoDetectedProcessType;

  @Field(() => String)
  processCode: string;
}

@ArgsType()
export class MercadoPublicoJobRunsArgs {
  @Field(() => [MercadoPublicoJobRunStatusGraphQL], { nullable: true })
  statuses?: MercadoPublicoJobRunStatus[];

  @Field(() => String, { nullable: true })
  jobName?: string;

  @Field(() => GraphQLISODateTime, { nullable: true })
  startedFrom?: Date;

  @Field(() => GraphQLISODateTime, { nullable: true })
  startedTo?: Date;

  @Field(() => Int, { nullable: true })
  limit?: number;

  @Field(() => Int, { nullable: true })
  offset?: number;
}

@ArgsType()
export class MercadoPublicoApiCallLogArgs {
  @Field(() => String, { nullable: true })
  source?: string;

  @Field(() => String, { nullable: true })
  endpoint?: string;

  @Field(() => Int, { nullable: true })
  httpStatus?: number;

  @Field(() => Int, { nullable: true })
  limit?: number;

  @Field(() => Int, { nullable: true })
  offset?: number;
}

@ObjectType('MercadoPublicoDetectedProcess')
export class MercadoPublicoDetectedProcessDTO {
  @Field(() => MercadoPublicoDetectedProcessTypeGraphQL)
  processType: MercadoPublicoDetectedProcessType;

  @Field(() => String)
  processCode: string;

  @Field(() => String, { nullable: true })
  title: string | null;

  @Field(() => String, { nullable: true })
  canonicalState: string | null;

  @Field(() => String, { nullable: true })
  rawStateCode: string | null;

  @Field(() => String, { nullable: true })
  rawStateLabel: string | null;

  @Field(() => String, { nullable: true })
  buyerCode: string | null;

  @Field(() => String, { nullable: true })
  buyerName: string | null;

  @Field(() => GraphQLISODateTime, { nullable: true })
  publishedAt: Date | null;

  @Field(() => GraphQLISODateTime, { nullable: true })
  closingAt: Date | null;

  @Field(() => String, { nullable: true })
  sourcePriority: string | null;

  @Field(() => String, { nullable: true })
  reconciliationStatus: string | null;

  @Field(() => GraphQLISODateTime)
  lastSeenAt: Date;
}

@ObjectType('MercadoPublicoDetectedProcesses')
export class MercadoPublicoDetectedProcessesDTO {
  @Field(() => [MercadoPublicoDetectedProcessDTO])
  items: MercadoPublicoDetectedProcessDTO[];

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  page: number;

  @Field(() => Int)
  limit: number;
}

@ObjectType('MercadoPublicoProcessDetailRawState')
export class MercadoPublicoProcessDetailRawStateDTO {
  @Field(() => String, { nullable: true })
  code: string | null;

  @Field(() => String, { nullable: true })
  label: string | null;
}

@ObjectType('MercadoPublicoProcessDetailBuyer')
export class MercadoPublicoProcessDetailBuyerDTO {
  @Field(() => String, { nullable: true })
  code: string | null;

  @Field(() => String, { nullable: true })
  name: string | null;
}

@ObjectType('MercadoPublicoProcessDetailDates')
export class MercadoPublicoProcessDetailDatesDTO {
  @Field(() => GraphQLISODateTime, { nullable: true })
  publishedAt: Date | null;

  @Field(() => GraphQLISODateTime, { nullable: true })
  closingAt: Date | null;
}

@ObjectType('MercadoPublicoProcessDetailItem')
export class MercadoPublicoProcessDetailItemDTO {
  @Field(() => String)
  code: string;

  @Field(() => String, { nullable: true })
  name: string | null;

  @Field(() => String, { nullable: true })
  quantity: string | null;

  @Field(() => Number, { nullable: true })
  amount: number | null;
}

@ObjectType('MercadoPublicoProcessDetailAdjudication')
export class MercadoPublicoProcessDetailAdjudicationDTO {
  @Field(() => String)
  supplierCode: string;

  @Field(() => String, { nullable: true })
  quantity: string | null;

  @Field(() => Number, { nullable: true })
  amount: number | null;
}

@ObjectType('MercadoPublicoProcessDetailRelatedOC')
export class MercadoPublicoProcessDetailRelatedOcDTO {
  @Field(() => String)
  code: string;

  @Field(() => String, { nullable: true })
  canonicalState: string | null;

  @Field(() => String)
  matchType: string;

  @Field(() => String)
  matchConfidence: string;
}

@ObjectType('MercadoPublicoProcessDetailSourceLineageEntry')
export class MercadoPublicoProcessDetailSourceLineageEntryDTO {
  @Field(() => String)
  source: string;

  @Field(() => Int)
  rowCount: number;

  @Field(() => GraphQLISODateTime, { nullable: true })
  lastSeenAt: Date | null;
}

@ObjectType('MercadoPublicoProcessDetailReconciliationSummary')
export class MercadoPublicoProcessDetailReconciliationSummaryDTO {
  @Field(() => Int)
  exact: number;

  @Field(() => Int)
  candidate: number;

  @Field(() => Int)
  unmatched: number;

  @Field(() => Int)
  manualReviewRequired: number;
}

@ObjectType('MercadoPublicoProcessDetail')
export class MercadoPublicoProcessDetailDTO {
  @Field(() => MercadoPublicoDetectedProcessTypeGraphQL)
  processType: MercadoPublicoDetectedProcessType;

  @Field(() => String)
  processCode: string;

  @Field(() => String, { nullable: true })
  title: string | null;

  @Field(() => String, { nullable: true })
  canonicalState: string | null;

  @Field(() => MercadoPublicoProcessDetailRawStateDTO)
  rawState: MercadoPublicoProcessDetailRawStateDTO;

  @Field(() => MercadoPublicoProcessDetailBuyerDTO)
  buyer: MercadoPublicoProcessDetailBuyerDTO;

  @Field(() => MercadoPublicoProcessDetailDatesDTO)
  dates: MercadoPublicoProcessDetailDatesDTO;

  @Field(() => [MercadoPublicoProcessDetailItemDTO])
  items: MercadoPublicoProcessDetailItemDTO[];

  @Field(() => [MercadoPublicoProcessDetailAdjudicationDTO], {
    nullable: true,
  })
  adjudications: MercadoPublicoProcessDetailAdjudicationDTO[] | null;

  @Field(() => [MercadoPublicoProcessDetailRelatedOcDTO])
  relatedOcs: MercadoPublicoProcessDetailRelatedOcDTO[];

  @Field(() => [MercadoPublicoProcessDetailSourceLineageEntryDTO])
  sourceLineage: MercadoPublicoProcessDetailSourceLineageEntryDTO[];

  @Field(() => MercadoPublicoProcessDetailReconciliationSummaryDTO)
  reconciliationSummary: MercadoPublicoProcessDetailReconciliationSummaryDTO;

  @Field(() => String, { nullable: true })
  sourcePriority: string | null;

  @Field(() => GraphQLISODateTime)
  lastSeenAt: Date;
}

@ObjectType('MercadoPublicoJobRun')
export class MercadoPublicoJobRunDTO {
  @Field(() => String)
  id: string;

  @Field(() => String)
  jobName: string;

  @Field(() => String)
  jobRunId: string;

  @Field(() => MercadoPublicoJobRunStatusGraphQL)
  status: MercadoPublicoJobRunStatus;

  @Field(() => GraphQLISODateTime)
  startedAt: Date;

  @Field(() => GraphQLISODateTime, { nullable: true })
  finishedAt: Date | null;

  @Field(() => Int, { nullable: true })
  recordsFetched: number | null;

  @Field(() => Int, { nullable: true })
  recordsStaged: number | null;

  @Field(() => Int, { nullable: true })
  recordsCanonicalized: number | null;

  @Field(() => Int, { nullable: true })
  recordsFailed: number | null;

  @Field(() => String, { nullable: true })
  errorSummary: string | null;

  @Field(() => String, { nullable: true })
  rawCsvFileId: string | null;

  @Field(() => GraphQLISODateTime)
  createdAt: Date;
}

@ObjectType('MercadoPublicoJobRuns')
export class MercadoPublicoJobRunsDTO {
  @Field(() => [MercadoPublicoJobRunDTO])
  items: MercadoPublicoJobRunDTO[];

  @Field(() => Boolean)
  hasMore: boolean;
}

@ObjectType('MercadoPublicoApiCallLog')
export class MercadoPublicoApiCallLogDTO {
  @Field(() => String)
  id: string;

  @Field(() => String)
  source: string;

  @Field(() => String)
  endpoint: string;

  @Field(() => GraphQLJSON, { nullable: true })
  requestParams: unknown;

  @Field(() => Int)
  httpStatus: number;

  @Field(() => GraphQLISODateTime)
  fetchedAt: Date;

  @Field(() => Int, { nullable: true })
  recordsFetched: number | null;

  @Field(() => String, { nullable: true })
  errorSummary: string | null;

  @Field(() => String, { nullable: true })
  ingestionJobId: string | null;
}

@ObjectType('MercadoPublicoApiCallLogs')
export class MercadoPublicoApiCallLogsDTO {
  @Field(() => [MercadoPublicoApiCallLogDTO])
  items: MercadoPublicoApiCallLogDTO[];

  @Field(() => Boolean)
  hasMore: boolean;
}

@ObjectType('MercadoPublicoPipelineHealthJob')
export class MercadoPublicoPipelineHealthJobDTO {
  @Field(() => String)
  jobName: string;

  @Field(() => String, { nullable: true })
  latestStatus: string | null;

  @Field(() => GraphQLISODateTime, { nullable: true })
  lastSuccessAt: Date | null;

  @Field(() => GraphQLISODateTime, { nullable: true })
  lastFailureAt: Date | null;

  @Field(() => Number, { nullable: true })
  lagSinceLastSuccessMs: number | null;

  @Field(() => Int)
  failureCount: number;

  @Field(() => String, { nullable: true })
  freshness: string | null;

  @Field(() => Number, { nullable: true })
  expectedCadenceMs: number | null;
}

@ObjectType('MercadoPublicoPipelineHealth')
export class MercadoPublicoPipelineHealthDTO {
  @Field(() => [MercadoPublicoPipelineHealthJobDTO])
  jobs: MercadoPublicoPipelineHealthJobDTO[];

  @Field(() => GraphQLISODateTime)
  generatedAt: Date;
}

@ObjectType('MercadoPublicoApiQuotaUsageSource')
export class MercadoPublicoApiQuotaUsageSourceDTO {
  @Field(() => String)
  source: string;

  @Field(() => Int)
  dailyLimit: number;

  @Field(() => Int)
  used: number;

  @Field(() => Int)
  remaining: number;

  @Field(() => GraphQLISODateTime, { nullable: true })
  resetAt: Date | null;

  @Field(() => GraphQLISODateTime, { nullable: true })
  last429At: Date | null;
}

@ObjectType('MercadoPublicoApiQuotaUsage')
export class MercadoPublicoApiQuotaUsageDTO {
  @Field(() => [MercadoPublicoApiQuotaUsageSourceDTO])
  sources: MercadoPublicoApiQuotaUsageSourceDTO[];

  @Field(() => GraphQLISODateTime)
  generatedAt: Date;
}

@ObjectType('MercadoPublicoCsvFileHealthEntry')
export class MercadoPublicoCsvFileHealthEntryDTO {
  @Field(() => String)
  sourceDataset: string;

  @Field(() => String, { nullable: true })
  sourceModality: string | null;

  @Field(() => String)
  sourcePeriod: string;

  @Field(() => String)
  sourceFileName: string;

  @Field(() => String)
  fileChecksum: string;

  @Field(() => String, { nullable: true })
  detectedEncoding: string | null;

  @Field(() => String, { nullable: true })
  detectedDelimiter: string | null;

  @Field(() => String, { nullable: true })
  schemaFingerprint: string | null;

  @Field(() => Int)
  rowCount: number;

  @Field(() => String)
  parseStatus: string;

  @Field(() => Int)
  parseErrorCount: number;

  @Field(() => Int)
  parseSuccessCount: number;

  @Field(() => GraphQLISODateTime, { nullable: true })
  lastLoadedAt: Date | null;

  @Field(() => String, { nullable: true })
  freshness: string | null;
}

@ObjectType('MercadoPublicoCsvFileHealth')
export class MercadoPublicoCsvFileHealthDTO {
  @Field(() => [MercadoPublicoCsvFileHealthEntryDTO])
  files: MercadoPublicoCsvFileHealthEntryDTO[];

  @Field(() => GraphQLISODateTime)
  generatedAt: Date;
}
