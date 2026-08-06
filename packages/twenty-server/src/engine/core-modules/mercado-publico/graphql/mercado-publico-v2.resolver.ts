import { UseGuards } from '@nestjs/common';
import {
  Args,
  Field,
  GraphQLISODateTime,
  InputType,
  Int,
  ObjectType,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';

import {
  encodeMercadoPublicoV2OpportunityCursor,
  MercadoPublicoV2ReadService,
  type MercadoPublicoV2OpportunityFilter,
  type MercadoPublicoV2OpportunityRow,
} from 'src/engine/core-modules/mercado-publico/graphql/mercado-publico-v2-read.service';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';

@InputType()
export class MercadoPublicoV2OpportunityFilterInput {
  @Field({ nullable: true })
  search?: string;

  @Field(() => [String], { nullable: true })
  states?: string[];

  @Field(() => Int, { nullable: true })
  region?: number;
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
  observationId: row.observation_id,
  normalizerVersion: row.normalizer_version,
  providerSchemaFingerprint: row.provider_schema_fingerprint,
  availability: row.availability,
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
    @Args('after', { nullable: true }) after?: string,
    @Args('first', { type: () => Int, nullable: true, defaultValue: 50 })
    first?: number,
  ): Promise<MercadoPublicoV2OpportunityConnectionDTO> {
    const result = await this.mercadoPublicoV2ReadService.listOpportunities(
      filter as MercadoPublicoV2OpportunityFilter,
      after,
      first,
    );
    const edges = result.rows.map((row) => ({
      cursor: encodeMercadoPublicoV2OpportunityCursor(row),
      node: toOpportunityDTO(row),
    }));

    return {
      edges,
      pageInfo: {
        hasNextPage: result.hasNextPage,
        hasPreviousPage: after !== undefined,
        startCursor: result.startCursor,
        endCursor: result.endCursor,
      },
      totalCount: result.totalCount,
    };
  }

  @ResolveField(() => MercadoPublicoV2OpportunityDTO, { nullable: true })
  async opportunity(
    @Args('codigo') codigo: string,
  ): Promise<MercadoPublicoV2OpportunityDTO | null> {
    const row = await this.mercadoPublicoV2ReadService.getOpportunity(codigo);

    return row ? toOpportunityDTO(row) : null;
  }
}
