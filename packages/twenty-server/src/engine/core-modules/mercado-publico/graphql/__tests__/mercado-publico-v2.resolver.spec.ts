import {
  MercadoPublicoV2NamespaceResolver,
  type MercadoPublicoV2OpportunityFilterInput,
} from 'src/engine/core-modules/mercado-publico/graphql/mercado-publico-v2.resolver';
import { type MercadoPublicoV2BuyersReadService } from 'src/engine/core-modules/mercado-publico/graphql/mercado-publico-v2-buyers-read.service';
import { type MercadoPublicoV2HistoryReadService } from 'src/engine/core-modules/mercado-publico/graphql/mercado-publico-v2-history-read.service';
import { type MercadoPublicoV2ReadService } from 'src/engine/core-modules/mercado-publico/graphql/mercado-publico-v2-read.service';

describe('MercadoPublicoV2NamespaceResolver', () => {
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
