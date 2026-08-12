import { UseGuards } from '@nestjs/common';
import {
  Args,
  Field,
  Float,
  GraphQLISODateTime,
  InputType,
  Int,
  ObjectType,
  Query,
  registerEnumType,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';

import {
  MercadoPublicoV2BuyersReadService,
  type MercadoPublicoV2BuyerAggregate,
} from 'src/engine/core-modules/mercado-publico/graphql/mercado-publico-v2-buyers-read.service';
import {
  MercadoPublicoV2HistoryReadService,
  type MercadoPublicoV2HistoryEvent,
} from 'src/engine/core-modules/mercado-publico/graphql/mercado-publico-v2-history-read.service';
import {
  encodeMercadoPublicoV2OpportunityCursor,
  MercadoPublicoV2ReadService,
  type MercadoPublicoV2Analytics,
  type MercadoPublicoV2AnalyticsBucket,
  type MercadoPublicoV2OpportunityFilter,
  type MercadoPublicoV2OpportunityRow,
  type MercadoPublicoV2OpportunitySort,
} from 'src/engine/core-modules/mercado-publico/graphql/mercado-publico-v2-read.service';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';

export enum MercadoPublicoV2OpportunitySortEnum {
  CLOSING_AT_DESC = 'closing_at_desc',
  CLOSING_AT_ASC = 'closing_at_asc',
  PUBLISHED_AT_DESC = 'published_at_desc',
  PUBLISHED_AT_ASC = 'published_at_asc',
  AMOUNT_DESC = 'amount_desc',
  AMOUNT_ASC = 'amount_asc',
}

registerEnumType(MercadoPublicoV2OpportunitySortEnum, {
  name: 'MercadoPublicoV2OpportunitySort',
});

@InputType()
export class MercadoPublicoV2OpportunityFilterInput {
  @Field({ nullable: true })
  search?: string;

  @Field(() => [String], { nullable: true })
  states?: string[];

  @Field(() => Int, { nullable: true })
  region?: number;

  @Field({ nullable: true })
  buyer?: string;

  @Field(() => GraphQLISODateTime, { nullable: true })
  closingAtFrom?: Date;

  @Field(() => GraphQLISODateTime, { nullable: true })
  closingAtTo?: Date;

  @Field(() => Int, { nullable: true })
  documentCountMin?: number;

  @Field(() => Int, { nullable: true })
  documentCountMax?: number;

  @Field(() => Int, { nullable: true })
  llamado?: number;

  @Field({ nullable: true })
  amountMin?: string;

  @Field({ nullable: true })
  amountMax?: string;

  @Field(() => [String], { nullable: true })
  currencies?: string[];

  @Field({ nullable: true })
  cohortStatus?: 'active' | 'terminal';
}

@ObjectType()
export class MercadoPublicoV2DetailFreshnessDTO {
  @Field()
  status!: string;

  @Field(() => String, { nullable: true })
  lastError!: string | null;

  @Field(() => GraphQLISODateTime, { nullable: true })
  asOf!: Date | null;
}

@ObjectType()
export class MercadoPublicoV2DetailProvenanceDTO {
  @Field(() => String, { nullable: true })
  observationId!: string | null;

  @Field(() => String, { nullable: true })
  normalizerVersion!: string | null;

  @Field(() => String, { nullable: true })
  providerSchemaFingerprint!: string | null;

  @Field(() => String, { nullable: true })
  snapshotKind!: string | null;

  @Field(() => String, { nullable: true })
  source!: string | null;

  @Field(() => String, { nullable: true })
  endpoint!: string | null;

  @Field(() => GraphQLISODateTime, { nullable: true })
  observedAt!: Date | null;

  @Field(() => GraphQLISODateTime, { nullable: true })
  providerChangedAt!: Date | null;
}

@ObjectType()
export class MercadoPublicoV2OpportunityDTO {
  @Field()
  codigo!: string;

  @Field(() => String, { nullable: true })
  title!: string | null;

  @Field(() => String, { nullable: true })
  state!: string | null;

  @Field(() => String, { nullable: true })
  buyerName!: string | null;

  @Field(() => Int, { nullable: true })
  region!: number | null;

  @Field(() => GraphQLISODateTime, { nullable: true })
  publishedAt!: Date | null;

  @Field(() => GraphQLISODateTime, { nullable: true })
  closingAt!: Date | null;

  @Field(() => String, { nullable: true })
  amount!: string | null;

  @Field(() => String, { nullable: true })
  currency!: string | null;

  @Field(() => Int, { nullable: true })
  documentCount!: number | null;

  @Field(() => Int, { nullable: true })
  llamado!: number | null;

  @Field(() => String, { nullable: true })
  observationId!: string | null;

  @Field(() => String, { nullable: true })
  normalizerVersion!: string | null;

  @Field(() => String, { nullable: true })
  providerSchemaFingerprint!: string | null;

  @Field()
  availability!: string;

  @Field(() => String, { nullable: true })
  description!: string | null;

  @Field(() => String, { nullable: true })
  deliveryAddress!: string | null;

  @Field(() => Int, { nullable: true })
  deliveryDays!: number | null;

  @Field(() => GraphQLISODateTime, { nullable: true })
  cancellationAt!: Date | null;

  @Field(() => String, { nullable: true })
  callDescription!: string | null;

  @Field(() => GraphQLISODateTime, { nullable: true })
  callFirstClosingAt!: Date | null;

  @Field(() => GraphQLISODateTime, { nullable: true })
  callSecondClosingAt!: Date | null;

  @Field(() => String, { nullable: true })
  budgetType!: string | null;

  @Field(() => String, { nullable: true })
  budgetEstimate!: string | null;

  @Field(() => String, { nullable: true })
  budgetCurrency!: string | null;

  @Field(() => String, { nullable: true })
  cancelMotive!: string | null;

  @Field(() => String, { nullable: true })
  desertedMotive!: string | null;

  @Field(() => String, { nullable: true })
  selectionMotive!: string | null;

  @Field(() => Int, { nullable: true })
  totalOffers!: number | null;

  @Field(() => Int, { nullable: true })
  totalDemands!: number | null;

  @Field(() => String, { nullable: true })
  finePenalty!: string | null;

  @Field(() => String, { nullable: true })
  lifecycleReason!: string | null;

  @Field(() => MercadoPublicoV2DetailFreshnessDTO, { nullable: true })
  detailFreshness!: MercadoPublicoV2DetailFreshnessDTO | null;

  @Field(() => MercadoPublicoV2DetailProvenanceDTO, { nullable: true })
  provenance!: MercadoPublicoV2DetailProvenanceDTO | null;
}

@ObjectType()
export class MercadoPublicoV2OpportunityEdgeDTO {
  @Field()
  cursor!: string;

  @Field(() => MercadoPublicoV2OpportunityDTO)
  node!: MercadoPublicoV2OpportunityDTO;
}

@ObjectType()
export class MercadoPublicoV2PageInfoDTO {
  @Field()
  hasNextPage!: boolean;

  @Field()
  hasPreviousPage!: boolean;

  @Field(() => String, { nullable: true })
  startCursor!: string | null;

  @Field(() => String, { nullable: true })
  endCursor!: string | null;
}

@ObjectType()
export class MercadoPublicoV2OpportunityConnectionDTO {
  @Field(() => [MercadoPublicoV2OpportunityEdgeDTO])
  edges!: MercadoPublicoV2OpportunityEdgeDTO[];

  @Field(() => MercadoPublicoV2PageInfoDTO)
  pageInfo!: MercadoPublicoV2PageInfoDTO;

  @Field(() => Int)
  totalCount!: number;
}

@ObjectType()
export class MercadoPublicoV2AnalyticsBucketDTO {
  @Field(() => String, { nullable: true })
  key!: string | null;

  @Field(() => Int)
  count!: number;
}

@ObjectType()
export class MercadoPublicoV2AnalyticsCoverageDTO {
  @Field(() => Int)
  closingAt!: number;

  @Field(() => Int)
  state!: number;

  @Field(() => Int)
  region!: number;

  @Field(() => Int)
  buyer!: number;

  @Field(() => Int)
  amount!: number;

  @Field(() => Int)
  currency!: number;

  @Field(() => Int)
  documentCount!: number;

  @Field(() => Int)
  llamado!: number;
}

@ObjectType()
export class MercadoPublicoV2AnalyticsDTO {
  @Field(() => Int)
  population!: number;

  @Field(() => GraphQLISODateTime)
  calculatedAt!: Date;

  @Field(() => GraphQLISODateTime, { nullable: true })
  asOf!: Date | null;

  @Field()
  freshness!: string;

  @Field()
  completeness!: string;

  @Field()
  availability!: string;

  @Field(() => MercadoPublicoV2AnalyticsCoverageDTO)
  coverage!: MercadoPublicoV2AnalyticsCoverageDTO;

  @Field(() => [MercadoPublicoV2AnalyticsBucketDTO])
  stateBuckets!: MercadoPublicoV2AnalyticsBucketDTO[];

  @Field(() => [MercadoPublicoV2AnalyticsBucketDTO])
  regionBuckets!: MercadoPublicoV2AnalyticsBucketDTO[];

  @Field(() => [MercadoPublicoV2AnalyticsBucketDTO])
  currencyBuckets!: MercadoPublicoV2AnalyticsBucketDTO[];

  @Field(() => [MercadoPublicoV2AnalyticsBucketDTO])
  closingDateBuckets!: MercadoPublicoV2AnalyticsBucketDTO[];

  @Field(() => [MercadoPublicoV2AnalyticsBucketDTO])
  documentBuckets!: MercadoPublicoV2AnalyticsBucketDTO[];

  @Field(() => [MercadoPublicoV2AnalyticsBucketDTO])
  llamadoBuckets!: MercadoPublicoV2AnalyticsBucketDTO[];
}

@ObjectType()
export class MercadoPublicoV2NamespaceDTO {}

@ObjectType()
export class MercadoPublicoV2HistoryEventDTO {
  @Field()
  id!: string;

  @Field()
  codigo!: string;

  @Field(() => [String])
  changedFields!: string[];

  @Field(() => String, { nullable: true })
  previousObservationId!: string | null;

  @Field(() => String, { nullable: true })
  newObservationId!: string | null;

  @Field(() => GraphQLISODateTime, { nullable: true })
  providerChangedAt!: Date | null;

  @Field(() => GraphQLISODateTime, { nullable: true })
  observedAt!: Date | null;

  @Field(() => String, { nullable: true })
  normalizerVersion!: string | null;

  @Field(() => String, { nullable: true })
  providerSchemaFingerprint!: string | null;

  @Field(() => String, { nullable: true })
  source!: string | null;

  @Field(() => String, { nullable: true })
  endpoint!: string | null;

  @Field(() => String, { nullable: true })
  snapshotKind!: string | null;

  @Field(() => GraphQLISODateTime)
  createdAt!: Date;
}

@ObjectType()
export class MercadoPublicoV2HistoryEdgeDTO {
  @Field()
  cursor!: string;

  @Field(() => MercadoPublicoV2HistoryEventDTO)
  node!: MercadoPublicoV2HistoryEventDTO;
}

@ObjectType()
export class MercadoPublicoV2HistoryConnectionDTO {
  @Field(() => [MercadoPublicoV2HistoryEdgeDTO])
  edges!: MercadoPublicoV2HistoryEdgeDTO[];

  @Field(() => MercadoPublicoV2PageInfoDTO)
  pageInfo!: MercadoPublicoV2PageInfoDTO;
}

@ObjectType()
export class MercadoPublicoV2BuyerDTO {
  @Field()
  buyerCode!: string;

  @Field(() => String, { nullable: true })
  buyerName!: string | null;

  @Field(() => Int)
  opportunityCount!: number;

  @Field(() => Float)
  buyerCoverage!: number;

  @Field(() => Float)
  amountCoverage!: number;

  @Field()
  availability!: string;

  @Field()
  completeness!: string;

  @Field(() => GraphQLISODateTime, { nullable: true })
  asOf!: Date | null;
}

@ObjectType()
export class MercadoPublicoV2BuyerEdgeDTO {
  @Field()
  cursor!: string;

  @Field(() => MercadoPublicoV2BuyerDTO)
  node!: MercadoPublicoV2BuyerDTO;
}

@ObjectType()
export class MercadoPublicoV2BuyerConnectionDTO {
  @Field(() => [MercadoPublicoV2BuyerEdgeDTO])
  edges!: MercadoPublicoV2BuyerEdgeDTO[];

  @Field(() => MercadoPublicoV2PageInfoDTO)
  pageInfo!: MercadoPublicoV2PageInfoDTO;
}

const toOpportunityDTO = (
  row: MercadoPublicoV2OpportunityRow,
): MercadoPublicoV2OpportunityDTO => ({
  codigo: row.codigo,
  title: row.title,
  state: row.canonical_state,
  buyerName: row.buyer_name,
  region: row.region,
  publishedAt: row.published_at,
  closingAt: row.closing_at,
  amount: row.amount,
  currency: row.currency_source,
  documentCount: row.document_count,
  llamado: row.llamado,
  observationId: row.observation_id,
  normalizerVersion: row.normalizer_version,
  providerSchemaFingerprint: row.provider_schema_fingerprint,
  availability: row.availability,
  description: null,
  deliveryAddress: null,
  deliveryDays: null,
  cancellationAt: null,
  callDescription: null,
  callFirstClosingAt: null,
  callSecondClosingAt: null,
  budgetType: null,
  budgetEstimate: null,
  budgetCurrency: null,
  cancelMotive: null,
  desertedMotive: null,
  selectionMotive: null,
  totalOffers: null,
  totalDemands: null,
  finePenalty: null,
  lifecycleReason: null,
  detailFreshness: null,
  provenance: null,
});

const toAnalyticsBucketDTO = (
  bucket: MercadoPublicoV2AnalyticsBucket,
): MercadoPublicoV2AnalyticsBucketDTO => ({
  key: bucket.key,
  count: bucket.count,
});

const toAnalyticsDTO = (
  analytics: MercadoPublicoV2Analytics,
): MercadoPublicoV2AnalyticsDTO => ({
  population: analytics.population,
  calculatedAt: analytics.calculatedAt,
  asOf: analytics.asOf,
  freshness: analytics.freshness,
  completeness: analytics.completeness,
  availability: analytics.availability,
  coverage: analytics.coverage,
  stateBuckets: analytics.stateBuckets.map(toAnalyticsBucketDTO),
  regionBuckets: analytics.regionBuckets.map(toAnalyticsBucketDTO),
  currencyBuckets: analytics.currencyBuckets.map(toAnalyticsBucketDTO),
  closingDateBuckets: analytics.closingDateBuckets.map(toAnalyticsBucketDTO),
  documentBuckets: analytics.documentBuckets.map(toAnalyticsBucketDTO),
  llamadoBuckets: analytics.llamadoBuckets.map(toAnalyticsBucketDTO),
});

const toHistoryEventDTO = (
  event: MercadoPublicoV2HistoryEvent,
): MercadoPublicoV2HistoryEventDTO => ({
  id: event.id,
  codigo: event.codigo,
  changedFields: event.changedFields,
  previousObservationId: event.previousObservationId,
  newObservationId: event.newObservationId,
  providerChangedAt: event.providerChangedAt,
  observedAt: event.observedAt,
  normalizerVersion: event.normalizerVersion,
  providerSchemaFingerprint: event.providerSchemaFingerprint,
  source: event.source,
  endpoint: event.endpoint,
  snapshotKind: event.snapshotKind,
  createdAt: event.createdAt,
});

const toBuyerDTO = (
  buyer: MercadoPublicoV2BuyerAggregate,
): MercadoPublicoV2BuyerDTO => ({
  buyerCode: buyer.buyerCode,
  buyerName: buyer.buyerName,
  opportunityCount: buyer.opportunityCount,
  buyerCoverage: buyer.buyerCoverage,
  amountCoverage: buyer.amountCoverage,
  availability: buyer.availability,
  completeness: buyer.completeness,
  asOf: buyer.asOf,
});

@UseGuards(WorkspaceAuthGuard, NoPermissionGuard)
@Resolver()
export class MercadoPublicoV2Resolver {
  @Query(() => MercadoPublicoV2NamespaceDTO)
  mercadoPublicoV2(): MercadoPublicoV2NamespaceDTO {
    return {};
  }
}

@UseGuards(WorkspaceAuthGuard, NoPermissionGuard)
@Resolver(() => MercadoPublicoV2NamespaceDTO)
export class MercadoPublicoV2NamespaceResolver {
  constructor(
    private readonly mercadoPublicoV2ReadService: MercadoPublicoV2ReadService,
    private readonly mercadoPublicoV2HistoryReadService: MercadoPublicoV2HistoryReadService,
    private readonly mercadoPublicoV2BuyersReadService: MercadoPublicoV2BuyersReadService,
  ) {}

  @ResolveField(() => MercadoPublicoV2OpportunityConnectionDTO)
  async opportunities(
    @Args('filter', {
      type: () => MercadoPublicoV2OpportunityFilterInput,
      nullable: true,
    })
    filter?: MercadoPublicoV2OpportunityFilterInput,
    @Args('after', { type: () => String, nullable: true })
    after?: string | null,
    @Args('first', { type: () => Int, nullable: true, defaultValue: 100 })
    first?: number,
    @Args('sort', {
      type: () => MercadoPublicoV2OpportunitySortEnum,
      nullable: true,
      defaultValue: MercadoPublicoV2OpportunitySortEnum.CLOSING_AT_DESC,
    })
    sort?: MercadoPublicoV2OpportunitySortEnum,
  ): Promise<MercadoPublicoV2OpportunityConnectionDTO> {
    const resolvedSort =
      sort ?? MercadoPublicoV2OpportunitySortEnum.CLOSING_AT_DESC;
    const result = await this.mercadoPublicoV2ReadService.listOpportunities(
      filter as MercadoPublicoV2OpportunityFilter,
      after,
      first,
      resolvedSort as MercadoPublicoV2OpportunitySort,
    );
    const edges = result.rows.map((row) => ({
      cursor: encodeMercadoPublicoV2OpportunityCursor(
        row,
        resolvedSort as MercadoPublicoV2OpportunitySort,
      ),
      node: toOpportunityDTO(row),
    }));

    return {
      edges,
      pageInfo: {
        hasNextPage: result.hasNextPage,
        hasPreviousPage: after != null,
        startCursor: result.startCursor,
        endCursor: result.endCursor,
      },
      totalCount: result.totalCount,
    };
  }

  @ResolveField(() => MercadoPublicoV2AnalyticsDTO)
  async analytics(
    @Args('filter', {
      type: () => MercadoPublicoV2OpportunityFilterInput,
      nullable: true,
    })
    filter?: MercadoPublicoV2OpportunityFilterInput,
  ): Promise<MercadoPublicoV2AnalyticsDTO> {
    const result = await this.mercadoPublicoV2ReadService.getAnalytics(
      filter as MercadoPublicoV2OpportunityFilter,
    );

    return toAnalyticsDTO(result);
  }

  @ResolveField(() => MercadoPublicoV2HistoryConnectionDTO)
  async history(
    @Args('codigo', { type: () => String })
    codigo: string,
    @Args('after', { type: () => String, nullable: true })
    after?: string | null,
    @Args('first', { type: () => Int, nullable: true, defaultValue: 50 })
    first?: number,
  ): Promise<MercadoPublicoV2HistoryConnectionDTO> {
    const result = await this.mercadoPublicoV2HistoryReadService.listHistory(
      codigo,
      after,
      first,
    );

    return {
      edges: result.rows.map((event) => ({
        cursor: event.cursor,
        node: toHistoryEventDTO(event),
      })),
      pageInfo: {
        hasNextPage: result.hasNextPage,
        hasPreviousPage: after != null,
        startCursor: result.startCursor,
        endCursor: result.endCursor,
      },
    };
  }

  @ResolveField(() => MercadoPublicoV2BuyerConnectionDTO)
  async buyers(
    @Args('filter', {
      type: () => MercadoPublicoV2OpportunityFilterInput,
      nullable: true,
    })
    filter?: MercadoPublicoV2OpportunityFilterInput,
    @Args('after', { type: () => String, nullable: true })
    after?: string | null,
    @Args('first', { type: () => Int, nullable: true, defaultValue: 50 })
    first?: number,
  ): Promise<MercadoPublicoV2BuyerConnectionDTO> {
    const result = await this.mercadoPublicoV2BuyersReadService.listBuyers(
      filter as MercadoPublicoV2OpportunityFilter,
      after,
      first,
    );

    return {
      edges: result.rows.map((row) => ({
        cursor: row.cursor ?? result.startCursor ?? '',
        node: toBuyerDTO(row),
      })),
      pageInfo: {
        hasNextPage: result.hasNextPage,
        hasPreviousPage: after != null,
        startCursor: result.startCursor,
        endCursor: result.endCursor,
      },
    };
  }
}
