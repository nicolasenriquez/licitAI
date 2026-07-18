/* @license Enterprise */

import { Injectable } from '@nestjs/common';

import { v4 } from 'uuid';

import { WorkspaceMigrationRunnerActionHandler } from 'src/engine/workspace-manager/workspace-migration/workspace-migration-runner/interfaces/workspace-migration-runner-action-handler-service.interface';

import { RowLevelPermissionPredicateGroupEntity } from 'src/engine/metadata-modules/row-level-permission-predicate/entities/row-level-permission-predicate-group.entity';
import { getUniversalFlatEntityEmptyForeignKeyAggregators } from 'src/engine/workspace-manager/workspace-migration/universal-flat-entity/utils/reset-universal-flat-entity-foreign-key-aggregators.util';
import { resolveUniversalRelationIdentifiersToIds } from 'src/engine/workspace-manager/workspace-migration/universal-flat-entity/utils/resolve-universal-relation-identifiers-to-ids.util';
import {
  type FlatCreateRowLevelPermissionPredicateGroupAction,
  type UniversalCreateRowLevelPermissionPredicateGroupAction,
} from 'src/engine/workspace-manager/workspace-migration/workspace-migration-builder/builders/row-level-permission-predicate-group/types/workspace-migration-row-level-permission-predicate-group-action.type';
import {
  type WorkspaceMigrationActionRunnerArgs,
  type WorkspaceMigrationActionRunnerContext,
} from 'src/engine/workspace-manager/workspace-migration/workspace-migration-runner/types/workspace-migration-action-runner-args.type';

@Injectable()
export class CreateRowLevelPermissionPredicateGroupActionHandlerService extends WorkspaceMigrationRunnerActionHandler(
  'create',
  'rowLevelPermissionPredicateGroup',
) {
  override async transpileUniversalActionToFlatAction({
    action,
    allFlatEntityMaps,
    flatApplication,
    workspaceId,
  }: WorkspaceMigrationActionRunnerArgs<UniversalCreateRowLevelPermissionPredicateGroupAction>): Promise<FlatCreateRowLevelPermissionPredicateGroupAction> {
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
        childRowLevelPermissionPredicateGroupIds: [],
        rowLevelPermissionPredicateIds: [],
        applicationId: flatApplication.id,
        id: action.id ?? v4(),
        workspaceId,
        ...getUniversalFlatEntityEmptyForeignKeyAggregators({
          metadataName: 'rowLevelPermissionPredicateGroup',
        }),
      },
    };
  }

  async executeForMetadata(
    context: WorkspaceMigrationActionRunnerContext<FlatCreateRowLevelPermissionPredicateGroupAction>,
  ): Promise<void> {
    const { flatAction, queryRunner } = context;
    const { flatEntity } = flatAction;

    const repository =
      queryRunner.manager.getRepository<RowLevelPermissionPredicateGroupEntity>(
        RowLevelPermissionPredicateGroupEntity,
      );

    await repository.insert({
      ...flatEntity,
    });
  }

  async executeForWorkspaceSchema(
    _context: WorkspaceMigrationActionRunnerContext<FlatCreateRowLevelPermissionPredicateGroupAction>,
  ): Promise<void> {
    return;
  }
}
