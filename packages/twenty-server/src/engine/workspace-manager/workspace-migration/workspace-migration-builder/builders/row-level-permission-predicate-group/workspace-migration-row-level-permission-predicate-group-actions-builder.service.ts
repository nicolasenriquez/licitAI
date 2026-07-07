/* @license Enterprise */

import { Injectable } from '@nestjs/common';

import { ALL_METADATA_NAME } from 'twenty-shared/metadata';

import { WorkspaceEntityMigrationBuilderService } from 'src/engine/workspace-manager/workspace-migration/workspace-migration-builder/services/workspace-entity-migration-builder.service';
import { FlatEntityUpdateValidationArgs } from 'src/engine/workspace-manager/workspace-migration/workspace-migration-builder/types/universal-flat-entity-update-validation-args.type';
import { UniversalFlatEntityValidationArgs } from 'src/engine/workspace-manager/workspace-migration/workspace-migration-builder/types/universal-flat-entity-validation-args.type';
import { UniversalFlatEntityValidationReturnType } from 'src/engine/workspace-manager/workspace-migration/workspace-migration-builder/types/universal-flat-entity-validation-result.type';
import { FlatRowLevelPermissionPredicateGroupValidatorService } from 'src/engine/workspace-manager/workspace-migration/workspace-migration-builder/validators/services/flat-row-level-permission-predicate-group-validator.service';

@Injectable()
export class WorkspaceMigrationRowLevelPermissionPredicateGroupActionsBuilderService extends WorkspaceEntityMigrationBuilderService<
  typeof ALL_METADATA_NAME.rowLevelPermissionPredicateGroup
> {
  constructor(
    private readonly flatRowLevelPermissionPredicateGroupValidatorService: FlatRowLevelPermissionPredicateGroupValidatorService,
  ) {
    super(ALL_METADATA_NAME.rowLevelPermissionPredicateGroup);
  }

  protected validateFlatEntityCreation(
    args: UniversalFlatEntityValidationArgs<
      typeof ALL_METADATA_NAME.rowLevelPermissionPredicateGroup
    >,
  ): UniversalFlatEntityValidationReturnType<
    typeof ALL_METADATA_NAME.rowLevelPermissionPredicateGroup,
    'create'
  > {
    const validationResult =
      this.flatRowLevelPermissionPredicateGroupValidatorService.validateFlatRowLevelPermissionPredicateGroupCreation(
        args,
      );

    if (validationResult.errors.length > 0) {
      return {
        status: 'fail',
        ...validationResult,
      };
    }

    const { flatEntityToValidate } = args;

    return {
      status: 'success',
      action: {
        type: 'create',
        metadataName: 'rowLevelPermissionPredicateGroup',
        flatEntity: flatEntityToValidate,
      },
    };
  }

  protected validateFlatEntityDeletion(
    args: UniversalFlatEntityValidationArgs<
      typeof ALL_METADATA_NAME.rowLevelPermissionPredicateGroup
    >,
  ): UniversalFlatEntityValidationReturnType<
    typeof ALL_METADATA_NAME.rowLevelPermissionPredicateGroup,
    'delete'
  > {
    const validationResult =
      this.flatRowLevelPermissionPredicateGroupValidatorService.validateFlatRowLevelPermissionPredicateGroupDeletion(
        args,
      );

    if (validationResult.errors.length > 0) {
      return {
        status: 'fail',
        ...validationResult,
      };
    }

    const { flatEntityToValidate } = args;

    return {
      status: 'success',
      action: {
        type: 'delete',
        metadataName: 'rowLevelPermissionPredicateGroup',
        universalIdentifier: flatEntityToValidate.universalIdentifier,
      },
    };
  }

  protected validateFlatEntityUpdate(
    args: FlatEntityUpdateValidationArgs<
      typeof ALL_METADATA_NAME.rowLevelPermissionPredicateGroup
    >,
  ): UniversalFlatEntityValidationReturnType<
    typeof ALL_METADATA_NAME.rowLevelPermissionPredicateGroup,
    'update'
  > {
    const validationResult =
      this.flatRowLevelPermissionPredicateGroupValidatorService.validateFlatRowLevelPermissionPredicateGroupUpdate(
        args,
      );

    if (validationResult.errors.length > 0) {
      return {
        status: 'fail',
        ...validationResult,
      };
    }

    const { universalIdentifier, flatEntityUpdate } = args;

    return {
      status: 'success',
      action: {
        type: 'update',
        metadataName: 'rowLevelPermissionPredicateGroup',
        universalIdentifier,
        update: flatEntityUpdate,
      },
    };
  }
}
