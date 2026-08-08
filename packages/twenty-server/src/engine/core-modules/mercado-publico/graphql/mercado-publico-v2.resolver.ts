import { UseGuards } from '@nestjs/common';
import {
  Args,
  Field,
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

  @ResolveField(() => MercadoPublicoV2OpportunityDTO, { nullable: true })
  async opportunity(
    @Args('codigo') codigo: string,
  ): Promise<MercadoPublicoV2OpportunityDTO | null> {
    const row = await this.mercadoPublicoV2ReadService.getOpportunity(codigo);

    return row ? toOpportunityDTO(row) : null;
  }
}
