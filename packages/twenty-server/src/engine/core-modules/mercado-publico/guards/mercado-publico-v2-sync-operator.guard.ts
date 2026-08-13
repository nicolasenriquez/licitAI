import {
  Injectable,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

import { msg } from '@lingui/core/macro';
import { isDefined } from 'twenty-shared/utils';

import { MercadoPublicoV2SyncControlService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-v2-sync-control.service';
import {
  PermissionsException,
  PermissionsExceptionCode,
  PermissionsExceptionMessage,
} from 'src/engine/metadata-modules/permissions/permissions.exception';

@Injectable()
export class MercadoPublicoV2SyncOperatorGuard implements CanActivate {
  constructor(
    private readonly mercadoPublicoV2SyncControlService: MercadoPublicoV2SyncControlService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const gqlContext = GqlExecutionContext.create(context);
    const request = gqlContext.getContext().req;

    if (isDefined(request.apiKey) || isDefined(request.application)) {
      throw new PermissionsException(
        PermissionsExceptionMessage.PERMISSION_DENIED,
        PermissionsExceptionCode.PERMISSION_DENIED,
        {
          userFriendlyMessage: msg`Mercado Publico V2 sync control is restricted to explicit human operators`,
        },
      );
    }

    const workspaceId = request.workspace?.id;
    const userWorkspaceId = request.userWorkspaceId;

    if (!isDefined(workspaceId) || !isDefined(userWorkspaceId)) {
      throw new PermissionsException(
        PermissionsExceptionMessage.PERMISSION_DENIED,
        PermissionsExceptionCode.PERMISSION_DENIED,
        {
          userFriendlyMessage: msg`Mercado Publico V2 sync control requires an authenticated workspace member`,
        },
      );
    }

    const isOperator = await this.mercadoPublicoV2SyncControlService.isOperator(
      { workspaceId, userWorkspaceId },
    );

    if (!isOperator) {
      throw new PermissionsException(
        PermissionsExceptionMessage.PERMISSION_DENIED,
        PermissionsExceptionCode.PERMISSION_DENIED,
        {
          userFriendlyMessage: msg`You are not an explicit Mercado Publico V2 sync operator`,
        },
      );
    }

    return true;
  }
}
