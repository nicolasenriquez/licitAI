import { UseGuards } from '@nestjs/common';
import {
  Args,
  Field,
  GraphQLISODateTime,
  InputType,
  Int,
  Mutation,
  ObjectType,
  Query,
  ResolveField,
} from '@nestjs/graphql';

import { CoreResolver } from 'src/engine/api/graphql/graphql-config/decorators/core-resolver.decorator';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { AuthUserWorkspaceId } from 'src/engine/decorators/auth/auth-user-workspace-id.decorator';
import { AuthWorkspace } from 'src/engine/decorators/auth/auth-workspace.decorator';
import { MercadoPublicoV2SyncOperatorGuard } from 'src/engine/core-modules/mercado-publico/guards/mercado-publico-v2-sync-operator.guard';
import { MercadoPublicoV2SyncControlService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-v2-sync-control.service';
import { CustomPermissionGuard } from 'src/engine/guards/custom-permission.guard';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';

@ObjectType()
export class MercadoPublicoV2SyncControlNamespaceDTO {}

@ObjectType()
export class MercadoPublicoV2SyncTimelineEventDTO {
  @Field()
  eventType!: string;

  @Field(() => GraphQLISODateTime)
  at!: Date;

  @Field(() => String, { nullable: true })
  operatorName!: string | null;
}

@ObjectType()
export class MercadoPublicoV2LatestRunDTO {
  @Field()
  safeStatus!: string;

  @Field(() => String, { nullable: true })
  safeSummary!: string | null;

  @Field()
  canResume!: boolean;

  @Field(() => Int)
  recordsDiscovered!: number;

  @Field(() => Int)
  recordsHydrated!: number;

  @Field(() => Int)
  recordsFailed!: number;

  @Field(() => Int)
  recordsDeferred!: number;

  @Field(() => Int)
  recordsProjected!: number;

  @Field()
  discoveryComplete!: boolean;

  @Field(() => String, { nullable: true })
  completionReason!: string | null;

  @Field(() => GraphQLISODateTime, { nullable: true })
  startedAt!: Date | null;

  @Field(() => GraphQLISODateTime, { nullable: true })
  updatedAt!: Date | null;

  @Field(() => [MercadoPublicoV2SyncTimelineEventDTO])
  timeline!: MercadoPublicoV2SyncTimelineEventDTO[];
}

@ObjectType()
export class MercadoPublicoV2SyncCommandResultDTO {
  @Field()
  state!: string;
}

@InputType()
export class MercadoPublicoV2StartSyncInput {
  @Field()
  idempotencyKey!: string;

  @Field()
  confirmed!: boolean;

  @Field(() => Int, { nullable: true })
  maxPages?: number;
}

@InputType()
export class MercadoPublicoV2CancelSyncInput {
  @Field()
  idempotencyKey!: string;

  @Field()
  confirmed!: boolean;
}

@InputType()
export class MercadoPublicoV2ResumeSyncInput {
  @Field()
  idempotencyKey!: string;
}

@UseGuards(
  WorkspaceAuthGuard,
  CustomPermissionGuard,
  MercadoPublicoV2SyncOperatorGuard,
)
@CoreResolver()
export class MercadoPublicoV2SyncControlResolver {
  @Query(() => MercadoPublicoV2SyncControlNamespaceDTO)
  mercadoPublicoV2SyncControl(): MercadoPublicoV2SyncControlNamespaceDTO {
    return {};
  }

  @Mutation(() => MercadoPublicoV2SyncControlNamespaceDTO, {
    name: 'mercadoPublicoV2SyncControl',
  })
  mercadoPublicoV2SyncControlMutation(): MercadoPublicoV2SyncControlNamespaceDTO {
    return {};
  }
}

@UseGuards(
  WorkspaceAuthGuard,
  CustomPermissionGuard,
  MercadoPublicoV2SyncOperatorGuard,
)
@CoreResolver(() => MercadoPublicoV2SyncControlNamespaceDTO)
export class MercadoPublicoV2SyncControlNamespaceResolver {
  constructor(
    private readonly mercadoPublicoV2SyncControlService: MercadoPublicoV2SyncControlService,
  ) {}

  @ResolveField(() => MercadoPublicoV2LatestRunDTO, { nullable: true })
  latestRun(
    @AuthWorkspace() workspace?: WorkspaceEntity,
  ): Promise<MercadoPublicoV2LatestRunDTO | null> {
    return this.mercadoPublicoV2SyncControlService.getLatestRun(
      workspace?.id ?? '',
    );
  }

  @ResolveField(() => MercadoPublicoV2SyncCommandResultDTO)
  async start(
    @Args('input', { type: () => MercadoPublicoV2StartSyncInput })
    input: MercadoPublicoV2StartSyncInput,
    @AuthWorkspace() workspace?: WorkspaceEntity,
    @AuthUserWorkspaceId() userWorkspaceId?: string,
  ): Promise<MercadoPublicoV2SyncCommandResultDTO> {
    if (input.confirmed !== true) {
      throw new Error(
        'Confirmation required to start a Mercado Publico V2 sync',
      );
    }

    const result = await this.mercadoPublicoV2SyncControlService.submitCommand({
      workspaceId: workspace?.id ?? '',
      actorUserWorkspaceId: userWorkspaceId ?? '',
      action: 'start',
      idempotencyKey: input.idempotencyKey,
      confirmed: input.confirmed,
      maxPages: input.maxPages,
    });

    return { state: result.state };
  }

  @ResolveField(() => MercadoPublicoV2SyncCommandResultDTO)
  async cancel(
    @Args('input', { type: () => MercadoPublicoV2CancelSyncInput })
    input: MercadoPublicoV2CancelSyncInput,
    @AuthWorkspace() workspace?: WorkspaceEntity,
    @AuthUserWorkspaceId() userWorkspaceId?: string,
  ): Promise<MercadoPublicoV2SyncCommandResultDTO> {
    if (input.confirmed !== true) {
      throw new Error(
        'Confirmation required to cancel a Mercado Publico V2 sync',
      );
    }

    const result = await this.mercadoPublicoV2SyncControlService.submitCommand({
      workspaceId: workspace?.id ?? '',
      actorUserWorkspaceId: userWorkspaceId ?? '',
      action: 'cancel',
      idempotencyKey: input.idempotencyKey,
      confirmed: input.confirmed,
    });

    return { state: result.state };
  }

  @ResolveField(() => MercadoPublicoV2SyncCommandResultDTO)
  async resume(
    @Args('input', { type: () => MercadoPublicoV2ResumeSyncInput })
    input: MercadoPublicoV2ResumeSyncInput,
    @AuthWorkspace() workspace?: WorkspaceEntity,
    @AuthUserWorkspaceId() userWorkspaceId?: string,
  ): Promise<MercadoPublicoV2SyncCommandResultDTO> {
    const result = await this.mercadoPublicoV2SyncControlService.submitCommand({
      workspaceId: workspace?.id ?? '',
      actorUserWorkspaceId: userWorkspaceId ?? '',
      action: 'resume',
      idempotencyKey: input.idempotencyKey,
    });

    return { state: result.state };
  }
}
