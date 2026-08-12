import { GUARDS_METADATA } from '@nestjs/common/constants';
import { type ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

import { RESOLVER_SCHEMA_SCOPE_KEY } from 'src/engine/api/graphql/graphql-config/constants/resolver-schema-scope-key.constant';
import {
  MercadoPublicoV2SyncControlNamespaceResolver,
  MercadoPublicoV2SyncControlResolver,
} from 'src/engine/core-modules/mercado-publico/graphql/mercado-publico-v2-sync-control.resolver';
import { MercadoPublicoV2SyncOperatorGuard } from 'src/engine/core-modules/mercado-publico/guards/mercado-publico-v2-sync-operator.guard';
import { type MercadoPublicoV2SyncControlService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-v2-sync-control.service';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';
import { PermissionsException } from 'src/engine/metadata-modules/permissions/permissions.exception';

describe('MercadoPublicoV2SyncControlResolver', () => {
  it.each([
    MercadoPublicoV2SyncControlResolver,
    MercadoPublicoV2SyncControlNamespaceResolver,
  ])('registers %p in core GraphQL schema', (resolver) => {
    expect(Reflect.getMetadata(RESOLVER_SCHEMA_SCOPE_KEY, resolver)).toBe(
      'core',
    );
  });

  it.each([
    MercadoPublicoV2SyncControlResolver,
    MercadoPublicoV2SyncControlNamespaceResolver,
  ])('guards %p with auth and explicit operator access', (resolver) => {
    expect(Reflect.getMetadata(GUARDS_METADATA, resolver)).toEqual([
      WorkspaceAuthGuard,
      MercadoPublicoV2SyncOperatorGuard,
    ]);
  });

  it('delegates a confirmed start and never touches a sync engine', async () => {
    const controlService = {
      submitCommand: jest.fn().mockResolvedValue({
        state: 'queued',
        commandId: 'command-1',
      }),
      getLatestRun: jest.fn(),
    } as unknown as jest.Mocked<MercadoPublicoV2SyncControlService>;
    const resolver = new MercadoPublicoV2SyncControlNamespaceResolver(
      controlService,
    );

    const input = {
      idempotencyKey: '11111111-1111-4111-8111-111111111111',
      confirmed: true,
    } as Parameters<typeof resolver.start>[0];

    await expect(resolver.start(input)).resolves.toMatchObject({
      state: 'queued',
    });
    expect(controlService.submitCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'start',
        idempotencyKey: '11111111-1111-4111-8111-111111111111',
        confirmed: true,
      }),
    );
  });

  it('rejects a start without confirmation', async () => {
    const controlService = {
      submitCommand: jest.fn(),
      getLatestRun: jest.fn(),
    } as unknown as jest.Mocked<MercadoPublicoV2SyncControlService>;
    const resolver = new MercadoPublicoV2SyncControlNamespaceResolver(
      controlService,
    );
    const input = {
      idempotencyKey: '11111111-1111-4111-8111-111111111111',
      confirmed: false,
    } as Parameters<typeof resolver.start>[0];

    await expect(resolver.start(input)).rejects.toThrow(/confirmation/i);
    expect(controlService.submitCommand).not.toHaveBeenCalled();
  });

  it('delegates a confirmed cancel', async () => {
    const controlService = {
      submitCommand: jest.fn().mockResolvedValue({ state: 'cancelled' }),
      getLatestRun: jest.fn(),
    } as unknown as jest.Mocked<MercadoPublicoV2SyncControlService>;
    const resolver = new MercadoPublicoV2SyncControlNamespaceResolver(
      controlService,
    );
    const input = {
      idempotencyKey: '22222222-2222-4222-8222-222222222222',
      confirmed: true,
    } as Parameters<typeof resolver.cancel>[0];

    await expect(resolver.cancel(input)).resolves.toMatchObject({
      state: 'cancelled',
    });
    expect(controlService.submitCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'cancel',
        confirmed: true,
      }),
    );
  });

  it('delegates a resume without requiring confirmation', async () => {
    const controlService = {
      submitCommand: jest.fn().mockResolvedValue({ state: 'queued' }),
      getLatestRun: jest.fn(),
    } as unknown as jest.Mocked<MercadoPublicoV2SyncControlService>;
    const resolver = new MercadoPublicoV2SyncControlNamespaceResolver(
      controlService,
    );
    const input = {
      idempotencyKey: '33333333-3333-4333-8333-333333333333',
      syncRunId: 'run-1',
    } as Parameters<typeof resolver.resume>[0];

    await expect(resolver.resume(input)).resolves.toMatchObject({
      state: 'queued',
    });
    expect(controlService.submitCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'resume',
        syncRunId: 'run-1',
        confirmed: true,
      }),
    );
  });

  it('delegates the latest workspace run to the control service', async () => {
    const controlService = {
      submitCommand: jest.fn(),
      getLatestRun: jest.fn().mockResolvedValue({ safeStatus: 'succeeded' }),
    } as unknown as jest.Mocked<MercadoPublicoV2SyncControlService>;
    const resolver = new MercadoPublicoV2SyncControlNamespaceResolver(
      controlService,
    );

    await expect(resolver.latestRun()).resolves.toMatchObject({
      safeStatus: 'succeeded',
    });
    expect(controlService.getLatestRun).toHaveBeenCalledTimes(1);
  });
});

describe('MercadoPublicoV2SyncOperatorGuard', () => {
  const buildContext = (request: Record<string, unknown>) => {
    const gqlContext = { req: request };

    jest
      .spyOn(GqlExecutionContext, 'create')
      .mockReturnValue({ getContext: () => gqlContext } as never);

    return {} as ExecutionContext;
  };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('allows a human session with an explicit operator assignment', async () => {
    const controlService = {
      isOperator: jest.fn().mockResolvedValue(true),
    } as unknown as jest.Mocked<MercadoPublicoV2SyncControlService>;
    const guard = new MercadoPublicoV2SyncOperatorGuard(controlService);
    const context = buildContext({
      workspace: { id: 'workspace-1' },
      userWorkspaceId: 'user-workspace-1',
    });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(controlService.isOperator).toHaveBeenCalledWith({
      workspaceId: 'workspace-1',
      userWorkspaceId: 'user-workspace-1',
    });
  });

  it('denies an analyst without an operator assignment', async () => {
    const controlService = {
      isOperator: jest.fn().mockResolvedValue(false),
    } as unknown as jest.Mocked<MercadoPublicoV2SyncControlService>;
    const guard = new MercadoPublicoV2SyncOperatorGuard(controlService);
    const context = buildContext({
      workspace: { id: 'workspace-1' },
      userWorkspaceId: 'user-workspace-analyst',
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      PermissionsException,
    );
  });

  it('denies an unassigned workspace administrator', async () => {
    const controlService = {
      isOperator: jest.fn().mockResolvedValue(false),
    } as unknown as jest.Mocked<MercadoPublicoV2SyncControlService>;
    const guard = new MercadoPublicoV2SyncOperatorGuard(controlService);
    const context = buildContext({
      workspace: { id: 'workspace-1' },
      userWorkspaceId: 'user-workspace-admin',
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      PermissionsException,
    );
    expect(controlService.isOperator).toHaveBeenCalledWith({
      workspaceId: 'workspace-1',
      userWorkspaceId: 'user-workspace-admin',
    });
  });

  it('denies an API key request without consulting operator assignments', async () => {
    const controlService = {
      isOperator: jest.fn(),
    } as unknown as jest.Mocked<MercadoPublicoV2SyncControlService>;
    const guard = new MercadoPublicoV2SyncOperatorGuard(controlService);
    const context = buildContext({
      workspace: { id: 'workspace-1' },
      apiKey: { id: 'api-key-1' },
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      PermissionsException,
    );
    expect(controlService.isOperator).not.toHaveBeenCalled();
  });

  it('denies an application request without consulting operator assignments', async () => {
    const controlService = {
      isOperator: jest.fn(),
    } as unknown as jest.Mocked<MercadoPublicoV2SyncControlService>;
    const guard = new MercadoPublicoV2SyncOperatorGuard(controlService);
    const context = buildContext({
      workspace: { id: 'workspace-1' },
      application: { id: 'application-1' },
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      PermissionsException,
    );
    expect(controlService.isOperator).not.toHaveBeenCalled();
  });
});
