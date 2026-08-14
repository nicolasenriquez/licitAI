import { UseGuards } from '@nestjs/common';
import {
  Args,
  Field,
  Float,
  GraphQLISODateTime,
  Int,
  ObjectType,
  ResolveField,
} from '@nestjs/graphql';
import GraphQLJSON from 'graphql-type-json';

import { CoreResolver } from 'src/engine/api/graphql/graphql-config/decorators/core-resolver.decorator';
import {
  MercadoPublicoV2DetailFreshnessDTO,
  MercadoPublicoV2DetailProvenanceDTO,
  MercadoPublicoV2NamespaceDTO,
  MercadoPublicoV2OpportunityDTO,
} from 'src/engine/core-modules/mercado-publico/graphql/mercado-publico-v2.resolver';
import {
  MercadoPublicoV2DetailReadService,
  type MercadoPublicoV2ChildRelation,
  type MercadoPublicoV2Detail,
  type MercadoPublicoV2RelationConnection,
  type MercadoPublicoV2RelationNode,
  type MercadoPublicoV2SanitizedPayload,
} from 'src/engine/core-modules/mercado-publico/graphql/mercado-publico-v2-detail-read.service';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';

@ObjectType()
export class MercadoPublicoV2RelationAvailabilityDTO {
  @Field()
  availability!: string;

  @Field(() => Int, { nullable: true })
  totalCount!: number | null;

  @Field(() => String, { nullable: true })
  sourceKind!: string | null;

  @Field(() => GraphQLISODateTime, { nullable: true })
  asOf!: Date | null;
}

@ObjectType()
export class MercadoPublicoV2RelationNodeDTO {
  @Field(() => String, { nullable: true })
  id!: string | null;

  @Field(() => String, { nullable: true })
  name!: string | null;

  @Field(() => String, { nullable: true })
  productCode!: string | null;

  @Field(() => String, { nullable: true })
  description!: string | null;

  @Field(() => Float, { nullable: true })
  quantity!: number | null;

  @Field(() => String, { nullable: true })
  unit!: string | null;

  @Field(() => String, { nullable: true })
  unitPrice!: string | null;

  @Field(() => String, { nullable: true })
  totalAmount!: string | null;

  @Field(() => String, { nullable: true })
  providerId!: string | null;

  @Field(() => String, { nullable: true })
  providerName!: string | null;

  @Field(() => String, { nullable: true })
  providerRut!: string | null;

  @Field(() => String, { nullable: true })
  providerKey!: string | null;

  @Field(() => Int)
  ordinal!: number;
}

@ObjectType()
export class MercadoPublicoV2RelationEdgeDTO {
  @Field()
  cursor!: string;

  @Field(() => MercadoPublicoV2RelationNodeDTO)
  node!: MercadoPublicoV2RelationNodeDTO;
}

@ObjectType()
export class MercadoPublicoV2RelationPageInfoDTO {
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
export class MercadoPublicoV2RelationConnectionDTO {
  @Field(() => [MercadoPublicoV2RelationEdgeDTO])
  edges!: MercadoPublicoV2RelationEdgeDTO[];

  @Field(() => MercadoPublicoV2RelationPageInfoDTO)
  pageInfo!: MercadoPublicoV2RelationPageInfoDTO;

  @Field(() => MercadoPublicoV2RelationAvailabilityDTO)
  availability!: MercadoPublicoV2RelationAvailabilityDTO;
}

@ObjectType()
export class MercadoPublicoV2SanitizedPayloadDTO {
  @Field()
  codigo!: string;

  @Field()
  observationId!: string;

  @Field(() => GraphQLJSON)
  payload!: unknown;

  @Field()
  sourcePayloadChecksum!: string;

  @Field()
  sanitizedPayloadChecksum!: string;

  @Field()
  redacted!: boolean;
}

const toOpportunityDetailDTO = (
  detail: MercadoPublicoV2Detail,
): MercadoPublicoV2OpportunityDTO => ({
  codigo: detail.codigo,
  title: detail.title,
  state: detail.state,
  buyerName: detail.buyerName,
  region: detail.region,
  publishedAt: detail.publishedAt,
  closingAt: detail.closingAt,
  amount: detail.amount,
  currency: detail.currency,
  documentCount: detail.documentCount,
  llamado: detail.llamado,
  observationId: detail.observationId,
  normalizerVersion: detail.normalizerVersion,
  providerSchemaFingerprint: detail.providerSchemaFingerprint,
  availability: detail.availability,
  description: detail.description,
  deliveryAddress: detail.deliveryAddress,
  deliveryDays: detail.deliveryDays,
  cancellationAt: detail.cancellationAt,
  callDescription: detail.callDescription,
  callFirstClosingAt: detail.callFirstClosingAt,
  callSecondClosingAt: detail.callSecondClosingAt,
  budgetType: detail.budgetType,
  budgetEstimate: detail.budgetEstimate,
  budgetCurrency: detail.budgetCurrency,
  cancelMotive: detail.cancelMotive,
  desertedMotive: detail.desertedMotive,
  selectionMotive: detail.selectionMotive,
  totalOffers: detail.totalOffers,
  totalDemands: detail.totalDemands,
  finePenalty: detail.finePenalty,
  lifecycleReason: detail.lifecycleReason,
  detailFreshness: {
    status: detail.detailFreshness.status,
    lastError: detail.detailFreshness.lastError,
    asOf: detail.detailFreshness.asOf,
  } satisfies MercadoPublicoV2DetailFreshnessDTO,
  provenance: {
    observationId: detail.provenance.observationId,
    normalizerVersion: detail.provenance.normalizerVersion,
    providerSchemaFingerprint: detail.provenance.providerSchemaFingerprint,
    snapshotKind: detail.provenance.snapshotKind,
    source: detail.provenance.source,
    endpoint: detail.provenance.endpoint,
    observedAt: detail.provenance.observedAt,
    providerChangedAt: detail.provenance.providerChangedAt,
  } satisfies MercadoPublicoV2DetailProvenanceDTO,
});

const toRelationNodeDTO = (
  node: MercadoPublicoV2RelationNode,
): MercadoPublicoV2RelationNodeDTO => ({ ...node });

const toRelationConnectionDTO = (
  connection: MercadoPublicoV2RelationConnection,
): MercadoPublicoV2RelationConnectionDTO => ({
  edges: connection.edges.map((edge) => ({
    cursor: edge.cursor,
    node: toRelationNodeDTO(edge.node),
  })),
  pageInfo: {
    hasNextPage: connection.hasNextPage,
    hasPreviousPage: false,
    startCursor: connection.startCursor,
    endCursor: connection.endCursor,
  },
  availability: { ...connection.availability },
});

@UseGuards(WorkspaceAuthGuard, NoPermissionGuard)
@CoreResolver(() => MercadoPublicoV2NamespaceDTO)
export class MercadoPublicoV2DetailResolver {
  constructor(
    private readonly mercadoPublicoV2DetailReadService: MercadoPublicoV2DetailReadService,
  ) {}

  @ResolveField(() => MercadoPublicoV2OpportunityDTO, { nullable: true })
  async opportunity(
    @Args('codigo') codigo: string,
  ): Promise<MercadoPublicoV2OpportunityDTO | null> {
    const detail =
      await this.mercadoPublicoV2DetailReadService.getOpportunityDetail(codigo);

    return detail ? toOpportunityDetailDTO(detail) : null;
  }

  @ResolveField(() => MercadoPublicoV2RelationConnectionDTO, { nullable: true })
  async documents(
    @Args('codigo') codigo: string,
    @Args('observationId', { type: () => String, nullable: true })
    observationId?: string,
    @Args('after', { type: () => String, nullable: true }) after?: string,
    @Args('first', { type: () => Int, nullable: true }) first?: number,
  ): Promise<MercadoPublicoV2RelationConnectionDTO | null> {
    return this.getRelation('documents', codigo, observationId, after, first);
  }

  @ResolveField(() => MercadoPublicoV2RelationConnectionDTO, { nullable: true })
  async items(
    @Args('codigo') codigo: string,
    @Args('observationId', { type: () => String, nullable: true })
    observationId?: string,
    @Args('after', { type: () => String, nullable: true }) after?: string,
    @Args('first', { type: () => Int, nullable: true }) first?: number,
  ): Promise<MercadoPublicoV2RelationConnectionDTO | null> {
    return this.getRelation('items', codigo, observationId, after, first);
  }

  @ResolveField(() => MercadoPublicoV2RelationConnectionDTO, { nullable: true })
  async offers(
    @Args('codigo') codigo: string,
    @Args('observationId', { type: () => String, nullable: true })
    observationId?: string,
    @Args('after', { type: () => String, nullable: true }) after?: string,
    @Args('first', { type: () => Int, nullable: true }) first?: number,
  ): Promise<MercadoPublicoV2RelationConnectionDTO | null> {
    return this.getRelation('offers', codigo, observationId, after, first);
  }

  @ResolveField(() => MercadoPublicoV2RelationConnectionDTO, { nullable: true })
  async quotedProducts(
    @Args('codigo') codigo: string,
    @Args('observationId', { type: () => String, nullable: true })
    observationId?: string,
    @Args('after', { type: () => String, nullable: true }) after?: string,
    @Args('first', { type: () => Int, nullable: true }) first?: number,
  ): Promise<MercadoPublicoV2RelationConnectionDTO | null> {
    return this.getRelation(
      'quotedProducts',
      codigo,
      observationId,
      after,
      first,
    );
  }

  @ResolveField(() => MercadoPublicoV2SanitizedPayloadDTO, { nullable: true })
  async rawPayload(
    @Args('codigo') codigo: string,
  ): Promise<MercadoPublicoV2SanitizedPayloadDTO | null> {
    const payload =
      await this.mercadoPublicoV2DetailReadService.getSanitizedOpportunityPayloadByCodigo(
        codigo,
      );

    return payload ? this.toSanitizedPayloadDTO(payload) : null;
  }

  private async getRelation(
    relation: MercadoPublicoV2ChildRelation,
    codigo: string,
    observationId?: string,
    after?: string,
    first?: number,
  ): Promise<MercadoPublicoV2RelationConnectionDTO | null> {
    const result =
      await this.mercadoPublicoV2DetailReadService.listOpportunityRelation({
        codigo,
        observationId,
        relation,
        after,
        first,
      });

    return result ? toRelationConnectionDTO(result) : null;
  }

  private toSanitizedPayloadDTO(
    payload: MercadoPublicoV2SanitizedPayload,
  ): MercadoPublicoV2SanitizedPayloadDTO {
    return { ...payload };
  }
}
