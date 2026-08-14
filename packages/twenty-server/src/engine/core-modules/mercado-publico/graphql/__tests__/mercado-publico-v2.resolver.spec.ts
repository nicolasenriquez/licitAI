import { GUARDS_METADATA } from '@nestjs/common/constants';

import { RESOLVER_SCHEMA_SCOPE_KEY } from 'src/engine/api/graphql/graphql-config/constants/resolver-schema-scope-key.constant';
import { MercadoPublicoV2DetailResolver } from 'src/engine/core-modules/mercado-publico/graphql/mercado-publico-v2-detail.resolver';
import {
  MercadoPublicoV2Resolver,
  MercadoPublicoV2NamespaceResolver,
  type MercadoPublicoV2OpportunityFilterInput,
} from 'src/engine/core-modules/mercado-publico/graphql/mercado-publico-v2.resolver';
import { type MercadoPublicoV2BuyersReadService } from 'src/engine/core-modules/mercado-publico/graphql/mercado-publico-v2-buyers-read.service';
import { type MercadoPublicoV2HistoryReadService } from 'src/engine/core-modules/mercado-publico/graphql/mercado-publico-v2-history-read.service';
import { type MercadoPublicoV2ReadService } from 'src/engine/core-modules/mercado-publico/graphql/mercado-publico-v2-read.service';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';

describe('MercadoPublicoV2NamespaceResolver', () => {
  it.each([
    MercadoPublicoV2Resolver,
    MercadoPublicoV2NamespaceResolver,
    MercadoPublicoV2DetailResolver,
  ])('registers %p in core GraphQL schema', (resolver) => {
    expect(Reflect.getMetadata(RESOLVER_SCHEMA_SCOPE_KEY, resolver)).toBe(
      'core',
    );
  });

  it('protects namespace fields with workspace authentication', () => {
    expect(
      Reflect.getMetadata(GUARDS_METADATA, MercadoPublicoV2NamespaceResolver),
    ).toEqual([WorkspaceAuthGuard, NoPermissionGuard]);
  });

  it('delegates required history identity and maps event edges', async () => {
    const historyService = {
      listHistory: jest.fn().mockResolvedValue({
        rows: [
          {
            id: 'history-1',
            codigo: 'CA-1',
            cursor: 'history-cursor-1',
            changedFields: ['title'],
            previousObservationId: 'observation-1',
            newObservationId: 'observation-2',
            providerChangedAt: null,
            observedAt: new Date('2026-08-10T12:00:00Z'),
            normalizerVersion: 'v1',
            providerSchemaFingerprint: 'schema-1',
            source: 'api-v2-compra-agil',
            endpoint: 'list',
            snapshotKind: 'list',
            createdAt: new Date('2026-08-10T12:00:01Z'),
          },
        ],
        hasNextPage: false,
        startCursor: 'history-cursor-1',
        endCursor: 'history-cursor-1',
      }),
    } as unknown as MercadoPublicoV2HistoryReadService;
    const resolver = new MercadoPublicoV2NamespaceResolver(
      {} as MercadoPublicoV2ReadService,
      historyService,
      {} as MercadoPublicoV2BuyersReadService,
    );

    const result = await resolver.history('CA-1', null, 10);

    expect(historyService.listHistory).toHaveBeenCalledWith('CA-1', null, 10);
    expect(result.edges[0]).toMatchObject({
      cursor: 'history-cursor-1',
      node: {
        codigo: 'CA-1',
        changedFields: ['title'],
        previousObservationId: 'observation-1',
        newObservationId: 'observation-2',
      },
    });
  });

  it('delegates buyers with the same filter input used by Activas', async () => {
    const filter: MercadoPublicoV2OpportunityFilterInput = {
      states: ['publicada'],
      region: 13,
    };
    const buyersService = {
      listBuyers: jest.fn().mockResolvedValue({
        rows: [
          {
            buyerCode: 'BUYER-001',
            buyerName: 'Municipalidad',
            opportunityCount: 2,
            buyerCoverage: 1,
            amountCoverage: 1,
            availability: 'available',
            completeness: 'complete',
            asOf: new Date('2026-08-10T12:00:00Z'),
          },
        ],
        hasNextPage: false,
        startCursor: 'buyer-cursor-1',
        endCursor: 'buyer-cursor-1',
      }),
    } as unknown as MercadoPublicoV2BuyersReadService;
    const resolver = new MercadoPublicoV2NamespaceResolver(
      {} as MercadoPublicoV2ReadService,
      {} as MercadoPublicoV2HistoryReadService,
      buyersService,
    );

    const result = await resolver.buyers(filter, 'buyer-cursor-0', 10);

    expect(buyersService.listBuyers).toHaveBeenCalledWith(
      filter,
      'buyer-cursor-0',
      10,
    );
    expect(result.edges[0]).toMatchObject({
      cursor: 'buyer-cursor-1',
      node: {
        buyerCode: 'BUYER-001',
        opportunityCount: 2,
        buyerCoverage: 1,
        amountCoverage: 1,
      },
    });
  });
});
