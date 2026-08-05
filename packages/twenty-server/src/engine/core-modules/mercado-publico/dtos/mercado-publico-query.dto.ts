import {
  ArgsType,
  Field,
  Float,
  GraphQLISODateTime,
  InputType,
  Int,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';

import GraphQLJSON from 'graphql-type-json';

import {
  type MercadoPublicoCompraAgilAnalytics,
  type MercadoPublicoCompraAgilAnalyticsMetadata,
  type MercadoPublicoCompraAgilAnalyticsSummary,
  type MercadoPublicoCompraAgilAmountBand,
  type MercadoPublicoCompraAgilBuyerBucket,
  type MercadoPublicoCompraAgilCallStageBucket,
  type MercadoPublicoCompraAgilClosingBucket,
  type MercadoPublicoCompraAgilDocumentAvailabilityBucket,
  type MercadoPublicoCompraAgilRegionBucket,
  type MercadoPublicoCompraAgilCoverage,
} from 'src/engine/core-modules/mercado-publico/types/detected-process-read.types';
import {
  type MercadoPublicoCompraAgilCallStage,
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
  amountAvailableClp = 'amountAvailableClp',
  processCode = 'processCode',
  canonicalState = 'canonicalState',
}

export enum MercadoPublicoDetectedProcessSortDirectionGraphQL {
  asc = 'asc',
  desc = 'desc',
}

export enum MercadoPublicoCompraAgilCallStageGraphQL {
  first_call = 'first_call',
  second_call = 'second_call',
}

export enum MercadoPublicoJobRunStatusGraphQL {
  success = 'success',
  partial = 'partial',
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
registerEnumType(MercadoPublicoCompraAgilCallStageGraphQL, {
  name: 'MercadoPublicoCompraAgilCallStage',
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

  @Field(() => String, { nullable: true })
  search?: string;

  @Field(() => String, { nullable: true })
  regionName?: string;

  @Field(() => GraphQLISODateTime, { nullable: true })
  closingFrom?: Date;

  @Field(() => GraphQLISODateTime, { nullable: true })
  closingTo?: Date;

  @Field(() => Boolean, { nullable: true })
  hasDocuments?: boolean;

  @Field(() => [MercadoPublicoCompraAgilCallStageGraphQL], {
    nullable: true,
  })
  callStages?: MercadoPublicoCompraAgilCallStage[];

  @Field(() => Float, { nullable: true })
  amountMin?: number;

  @Field(() => Float, { nullable: true })
  amountMax?: number;

  @Field(() => String, { nullable: true })
  buyerRut?: string;

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

  @Field(() => String, { nullable: true })
  buyerRut: string | null;

  @Field(() => String, { nullable: true })
  purchaseUnitName: string | null;

  @Field(() => String, { nullable: true })
  regionName: string | null;

  @Field(() => Float, { nullable: true })
  amountAvailableClp: number | null;

  @Field(() => MercadoPublicoCompraAgilCallStageGraphQL, { nullable: true })
  callStage: MercadoPublicoCompraAgilCallStage | null;

  @Field(() => Int, { nullable: true })
  documentCount: number | null;

  @Field(() => Int, { nullable: true })
  offersReceivedCount: number | null;

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

@ArgsType()
export class MercadoPublicoCompraAgilAnalyticsArgs {
  @Field(() => String, { nullable: true })
  search?: string;

  @Field(() => String, { nullable: true })
  regionName?: string;

  @Field(() => GraphQLISODateTime, { nullable: true })
  closingFrom?: Date;

  @Field(() => GraphQLISODateTime, { nullable: true })
  closingTo?: Date;

  @Field(() => Boolean, { nullable: true })
  hasDocuments?: boolean;

  @Field(() => [MercadoPublicoCompraAgilCallStageGraphQL], {
    nullable: true,
  })
  callStages?: MercadoPublicoCompraAgilCallStage[];

  @Field(() => Float, { nullable: true })
  amountMin?: number;

  @Field(() => Float, { nullable: true })
  amountMax?: number;

  @Field(() => String, { nullable: true })
  buyerRut?: string;
}

@ObjectType('MercadoPublicoCompraAgilAnalyticsSummary')
export class MercadoPublicoCompraAgilAnalyticsSummaryDTO implements MercadoPublicoCompraAgilAnalyticsSummary {
  @Field(() => Int)
  totalFound: number;

  @Field(() => Int)
  closingNext24Hours: number;

  @Field(() => Float, { nullable: true })
  knownAmountAvailableClp: number | null;

  @Field(() => Int)
  positiveDocumentCount: number;
}

@ObjectType('MercadoPublicoCompraAgilClosingBucket')
export class MercadoPublicoCompraAgilClosingBucketDTO implements MercadoPublicoCompraAgilClosingBucket {
  @Field(() => String)
  date: string;

  @Field(() => Int)
  count: number;
}

@ObjectType('MercadoPublicoCompraAgilRegionBucket')
export class MercadoPublicoCompraAgilRegionBucketDTO implements MercadoPublicoCompraAgilRegionBucket {
  @Field(() => String)
  regionName: string;

  @Field(() => Int)
  count: number;
}

@ObjectType('MercadoPublicoCompraAgilBuyerBucket')
export class MercadoPublicoCompraAgilBuyerBucketDTO implements MercadoPublicoCompraAgilBuyerBucket {
  @Field(() => String)
  buyerKey: string;

  @Field(() => String, { nullable: true })
  buyerName: string | null;

  @Field(() => Int)
  count: number;
}

@ObjectType('MercadoPublicoCompraAgilAmountBand')
export class MercadoPublicoCompraAgilAmountBandDTO implements MercadoPublicoCompraAgilAmountBand {
  @Field(() => String)
  band: string;

  @Field(() => Int)
  count: number;
}

@ObjectType('MercadoPublicoCompraAgilCallStageBucket')
export class MercadoPublicoCompraAgilCallStageBucketDTO implements MercadoPublicoCompraAgilCallStageBucket {
  @Field(() => MercadoPublicoCompraAgilCallStageGraphQL)
  callStage: MercadoPublicoCompraAgilCallStage;

  @Field(() => Int)
  count: number;
}

@ObjectType('MercadoPublicoCompraAgilDocumentAvailabilityBucket')
export class MercadoPublicoCompraAgilDocumentAvailabilityBucketDTO implements MercadoPublicoCompraAgilDocumentAvailabilityBucket {
  @Field(() => Boolean)
  hasDocuments: boolean;

  @Field(() => Int)
  count: number;
}

@ObjectType('MercadoPublicoCompraAgilCoverage')
export class MercadoPublicoCompraAgilCoverageDTO implements MercadoPublicoCompraAgilCoverage {
  @Field(() => Int)
  closingAt: number;

  @Field(() => Int)
  regionName: number;

  @Field(() => Int)
  buyerIdentity: number;

  @Field(() => Int)
  amountAvailableClp: number;

  @Field(() => Int)
  callStage: number;

  @Field(() => Int)
  documentCount: number;

  @Field(() => Int)
  offersReceivedCount: number;
}

@ObjectType('MercadoPublicoCompraAgilAnalyticsMetadata')
export class MercadoPublicoCompraAgilAnalyticsMetadataDTO implements MercadoPublicoCompraAgilAnalyticsMetadata {
  @Field(() => Int)
  filteredPopulation: number;

  @Field(() => GraphQLISODateTime)
  calculatedAt: Date;

  @Field(() => String)
  timezone: string;

  @Field(() => Boolean)
  completePopulation: boolean;

  @Field(() => MercadoPublicoCompraAgilCoverageDTO)
  coverage: MercadoPublicoCompraAgilCoverageDTO;
}

@ObjectType('MercadoPublicoCompraAgilAnalytics')
export class MercadoPublicoCompraAgilAnalyticsDTO implements MercadoPublicoCompraAgilAnalytics {
  @Field(() => MercadoPublicoCompraAgilAnalyticsSummaryDTO)
  summary: MercadoPublicoCompraAgilAnalyticsSummaryDTO;

  @Field(() => [MercadoPublicoCompraAgilClosingBucketDTO])
  closingByDay: MercadoPublicoCompraAgilClosingBucketDTO[];

  @Field(() => [MercadoPublicoCompraAgilRegionBucketDTO])
  regions: MercadoPublicoCompraAgilRegionBucketDTO[];

  @Field(() => [MercadoPublicoCompraAgilBuyerBucketDTO])
  topBuyers: MercadoPublicoCompraAgilBuyerBucketDTO[];

  @Field(() => [MercadoPublicoCompraAgilAmountBandDTO])
  amountBands: MercadoPublicoCompraAgilAmountBandDTO[];

  @Field(() => [MercadoPublicoCompraAgilCallStageBucketDTO])
  callStages: MercadoPublicoCompraAgilCallStageBucketDTO[];

  @Field(() => [MercadoPublicoCompraAgilDocumentAvailabilityBucketDTO])
  documentAvailability: MercadoPublicoCompraAgilDocumentAvailabilityBucketDTO[];

  @Field(() => MercadoPublicoCompraAgilAnalyticsMetadataDTO)
  metadata: MercadoPublicoCompraAgilAnalyticsMetadataDTO;
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
  description: string | null;

  @Field(() => String, { nullable: true })
  quantity: string | null;

  @Field(() => String, { nullable: true })
  unit: string | null;

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

@ObjectType('MercadoPublicoCompraAgilSourceState')
export class MercadoPublicoCompraAgilSourceStateDTO {
  @Field(() => String, { nullable: true })
  id: string | null;

  @Field(() => String, { nullable: true })
  code: string | null;

  @Field(() => String, { nullable: true })
  label: string | null;
}

@ObjectType('MercadoPublicoCompraAgilSourceDates')
export class MercadoPublicoCompraAgilSourceDatesDTO {
  @Field(() => String, { nullable: true })
  lastChangedAt: string | null;

  @Field(() => String, { nullable: true })
  firstCallClosingAt: string | null;

  @Field(() => String, { nullable: true })
  secondCallClosingAt: string | null;
}

@ObjectType('MercadoPublicoCompraAgilSourceAmounts')
export class MercadoPublicoCompraAgilSourceAmountsDTO {
  @Field(() => String, { nullable: true })
  currency: string | null;

  @Field(() => Float, { nullable: true })
  available: number | null;

  @Field(() => Float, { nullable: true })
  availableClp: number | null;
}

@ObjectType('MercadoPublicoCompraAgilSourceReasons')
export class MercadoPublicoCompraAgilSourceReasonsDTO {
  @Field(() => String, { nullable: true })
  deserted: string | null;

  @Field(() => String, { nullable: true })
  selection: string | null;

  @Field(() => String, { nullable: true })
  cancellation: string | null;
}

@ObjectType('MercadoPublicoCompraAgilSourceDocument')
export class MercadoPublicoCompraAgilSourceDocumentDTO {
  @Field(() => String)
  id: string;

  @Field(() => String, { nullable: true })
  name: string | null;
}

@ObjectType('MercadoPublicoCompraAgilSourceInstitution')
export class MercadoPublicoCompraAgilSourceInstitutionDTO {
  @Field(() => String, { nullable: true })
  rut: string | null;

  @Field(() => String, { nullable: true })
  regionName: string | null;

  @Field(() => String, { nullable: true })
  purchaseUnit: string | null;

  @Field(() => String, { nullable: true })
  buyerName: string | null;
}

@ObjectType('MercadoPublicoCompraAgilSourceCall')
export class MercadoPublicoCompraAgilSourceCallDTO {
  @Field(() => String, { nullable: true })
  description: string | null;

  @Field(() => String, { nullable: true })
  state: string | null;
}

@ObjectType('MercadoPublicoCompraAgilSourceNeed')
export class MercadoPublicoCompraAgilSourceNeedDTO {
  @Field(() => String, { nullable: true })
  description: string | null;
}

@ObjectType('MercadoPublicoCompraAgilSourceDelivery')
export class MercadoPublicoCompraAgilSourceDeliveryDTO {
  @Field(() => String, { nullable: true })
  address: string | null;

  @Field(() => Int, { nullable: true })
  leadTimeDays: number | null;
}

@ObjectType('MercadoPublicoCompraAgilSourceBudget')
export class MercadoPublicoCompraAgilSourceBudgetDTO {
  @Field(() => String, { nullable: true }) type: string | null;
  @Field(() => String, { nullable: true }) currency: string | null;
  @Field(() => Float, { nullable: true }) estimated: number | null;
  @Field(() => Float, { nullable: true }) available: number | null;
  @Field(() => Float, { nullable: true }) availableClp: number | null;
  @Field(() => Float, { nullable: true }) exchangeRate: number | null;
  @Field(() => String, { nullable: true }) exchangeRateAt: string | null;
}

@ObjectType('MercadoPublicoCompraAgilSourceQuotedProduct')
export class MercadoPublicoCompraAgilSourceQuotedProductDTO {
  @Field(() => String, { nullable: true }) code: string | null;
  @Field(() => String, { nullable: true }) name: string | null;
  @Field(() => String, { nullable: true }) description: string | null;
  @Field(() => String, { nullable: true }) quantity: string | null;
  @Field(() => Float, { nullable: true }) unitPrice: number | null;
  @Field(() => Float, { nullable: true }) totalAmount: number | null;
}

@ObjectType('MercadoPublicoCompraAgilSourceQuote')
export class MercadoPublicoCompraAgilSourceQuoteDTO {
  @Field(() => String, { nullable: true }) id: string | null;
  @Field(() => String, { nullable: true }) companyCode: string | null;
  @Field(() => String, { nullable: true }) branchCode: string | null;
  @Field(() => Boolean, { nullable: true }) active: boolean | null;
  @Field(() => String, { nullable: true }) buyerState: string | null;
  @Field(() => String, { nullable: true }) createdAt: string | null;
  @Field(() => String, { nullable: true }) validUntil: string | null;
  @Field(() => Float, { nullable: true }) netAmount: number | null;
  @Field(() => Float, { nullable: true }) taxAmount: number | null;
  @Field(() => Float, { nullable: true }) shippingAmount: number | null;
  @Field(() => Float, { nullable: true }) totalAmount: number | null;
  @Field(() => String, { nullable: true }) taxName: string | null;
  @Field(() => Float, { nullable: true }) taxRate: number | null;
  @Field(() => String, { nullable: true }) description: string | null;
  @Field(() => String, { nullable: true }) inadmissibilityReason: string | null;
  @Field(() => [MercadoPublicoCompraAgilSourceQuotedProductDTO])
  products: MercadoPublicoCompraAgilSourceQuotedProductDTO[];
}

@ObjectType('MercadoPublicoCompraAgilSourceSupplier')
export class MercadoPublicoCompraAgilSourceSupplierDTO {
  @Field(() => String, { nullable: true }) rut: string | null;
  @Field(() => String, { nullable: true }) name: string | null;
  @Field(() => Boolean, { nullable: true }) isEsm: boolean | null;
  @Field(() => MercadoPublicoCompraAgilSourceQuoteDTO)
  quote: MercadoPublicoCompraAgilSourceQuoteDTO;
}

@ObjectType('MercadoPublicoCompraAgilSourceFlags')
export class MercadoPublicoCompraAgilSourceFlagsDTO {
  @Field(() => Boolean, { nullable: true }) environmental: boolean | null;
  @Field(() => Boolean, { nullable: true }) socialEconomic: boolean | null;
}

@ObjectType('MercadoPublicoCompraAgilSourceDetail')
export class MercadoPublicoCompraAgilSourceDetailDTO {
  @Field(() => String, { nullable: true })
  sourcePath: string | null;

  @Field(() => MercadoPublicoCompraAgilSourceStateDTO)
  state: MercadoPublicoCompraAgilSourceStateDTO;

  @Field(() => MercadoPublicoCompraAgilSourceDatesDTO)
  additionalDates: MercadoPublicoCompraAgilSourceDatesDTO;

  @Field(() => MercadoPublicoCompraAgilSourceAmountsDTO)
  amounts: MercadoPublicoCompraAgilSourceAmountsDTO;

  @Field(() => MercadoPublicoCompraAgilSourceReasonsDTO)
  reasons: MercadoPublicoCompraAgilSourceReasonsDTO;

  @Field(() => Int, { nullable: true })
  offersReceived: number | null;

  @Field(() => [MercadoPublicoCompraAgilSourceDocumentDTO])
  documents: MercadoPublicoCompraAgilSourceDocumentDTO[];

  @Field(() => MercadoPublicoCompraAgilSourceInstitutionDTO)
  institution: MercadoPublicoCompraAgilSourceInstitutionDTO;

  @Field(() => MercadoPublicoCompraAgilSourceCallDTO)
  call: MercadoPublicoCompraAgilSourceCallDTO;

  @Field(() => MercadoPublicoCompraAgilSourceNeedDTO)
  need: MercadoPublicoCompraAgilSourceNeedDTO;

  @Field(() => MercadoPublicoCompraAgilSourceDeliveryDTO)
  delivery: MercadoPublicoCompraAgilSourceDeliveryDTO;

  @Field(() => MercadoPublicoCompraAgilSourceBudgetDTO)
  budget: MercadoPublicoCompraAgilSourceBudgetDTO;

  @Field(() => [MercadoPublicoCompraAgilSourceSupplierDTO])
  suppliers: MercadoPublicoCompraAgilSourceSupplierDTO[];

  @Field(() => MercadoPublicoCompraAgilSourceFlagsDTO)
  flags: MercadoPublicoCompraAgilSourceFlagsDTO;
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

  @Field(() => MercadoPublicoCompraAgilSourceDetailDTO, { nullable: true })
  compraAgilSource: MercadoPublicoCompraAgilSourceDetailDTO | null;

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
