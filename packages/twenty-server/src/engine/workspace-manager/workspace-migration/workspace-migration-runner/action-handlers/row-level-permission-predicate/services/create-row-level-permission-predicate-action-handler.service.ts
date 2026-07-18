/* @license Enterprise */

import { Injectable } from '@nestjs/common';

import { v4 } from 'uuid';

import { WorkspaceMigrationRunnerActionHandler } from 'src/engine/workspace-manager/workspace-migration/workspace-migration-runner/interfaces/workspace-migration-runner-action-handler-service.interface';

import { RowLevelPermissionPredicateEntity } from 'src/engine/metadata-modules/row-level-permission-predicate/entities/row-level-permission-predicate.entity';
import { getUniversalFlatEntityEmptyForeignKeyAggregators } from 'src/engine/workspace-manager/workspace-migration/universal-flat-entity/utils/reset-universal-flat-entity-foreign-key-aggregators.util';
import { resolveUniversalRelationIdentifiersToIds } from 'src/engine/workspace-manager/workspace-migration/universal-flat-entity/utils/resolve-universal-relation-identifiers-to-ids.util';
import {
  type FlatCreateRowLevelPermissionPredicateAction,
  type UniversalCreateRowLevelPermissionPredicateAction,
} from 'src/engine/workspace-manager/workspace-migration/workspace-migration-builder/builders/row-level-permission-predicate/types/workspace-migration-row-level-permission-predicate-action.type';
import {
  type WorkspaceMigrationActionRunnerArgs,
  type WorkspaceMigrationActionRunnerContext,
} from 'src/engine/workspace-manager/workspace-migration/workspace-migration-runner/types/workspace-migration-action-runner-args.type';

@Injectable()
export class CreateRowLevelPermissionPredicateActionHandlerService extends WorkspaceMigrationRunnerActionHandler(
  'create',
  'rowLevelPermissionPredicate',
) {
  override async transpileUniversalActionToFlatAction({
    action,
    allFlatEntityMaps,
    flatApplication,
    workspaceId,
  }: WorkspaceMigrationActionRunnerArgs<UniversalCreateRowLevelPermissionPredicateAction>): Promise<FlatCreateRowLevelPermissionPredicateAction> {
    const resolvedRelationIds = resolveUniversalRelationIdentifiersToIds({
      flatEntityMaps: allFlatEntityMaps,
      metadataName: action.metadataName,
      universalForeignKeyValues: action.flatEntity,
    });

    return {
      ...action,
      flatEntity: {
        ...action.flatEntity,
        ...resolvedRelationIds,
        applicationId: flatApplication.id,
        id: action.id ?? v4(),
        workspaceId,
        ...getUniversalFlatEntityEmptyForeignKeyAggregators({
          metadataName: 'rowLevelPermissionPredicate',
        }),
      },
    };
  }

  async executeForMetadata(
    context: WorkspaceMigrationActionRunnerContext<FlatCreateRowLevelPermissionPredicateAction>,
  ): Promise<void> {
    const { flatAction, queryRunner } = context;
    const { flatEntity } = flatAction;

    const repository =
      queryRunner.manager.getRepository<RowLevelPermissionPredicateEntity>(
        RowLevelPermissionPredicateEntity,
      );

    await repository.insert({
      ...flatEntity,
    });
  }

  async executeForWorkspaceSchema(
    _context: WorkspaceMigrationActionRunnerContext<FlatCreateRowLevelPermissionPredicateAction>,
  ): Promise<void> {
    return;
  }
}
