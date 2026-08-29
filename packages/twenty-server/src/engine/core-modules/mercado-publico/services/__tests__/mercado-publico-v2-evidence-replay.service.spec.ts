import fixture from 'src/engine/core-modules/mercado-publico/drivers/api/__tests__/fixtures/v2-compra-agil-list.json';
import { MercadoPublicoPersistenceService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-persistence.service';
import { MercadoPublicoV2EvidenceReplayService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-v2-evidence-replay.service';
import { MercadoPublicoV2ProjectionService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-v2-projection.service';

describe('MercadoPublicoV2EvidenceReplayService', () => {
  it('rebuilds a code from retained list and detail observations', async () => {
    const observations = [
      {
        id: 'observation-a',
        codigo: 'FIXTURE-CA-001',
        raw_api_payload_id: 'payload-a',
        payload_checksum: 'checksum-a',
        provider_schema_fingerprint: 'schema-a',
        normalizer_version: 'v1',
        observed_at: new Date('2026-01-01T00:00:00Z'),
        source: 'api-v2-compra-agil',
        endpoint: 'list',
        snapshot_kind: 'list' as const,
        request_fingerprint: 'request-a',
        provider_changed_at_raw: '2026-01-01T00:00:00Z',
        raw_payload: fixture,
      },
      {
        id: 'observation-b',
        codigo: 'FIXTURE-CA-001',
        raw_api_payload_id: 'payload-b',
        payload_checksum: 'checksum-b',
        provider_schema_fingerprint: 'schema-b',
        normalizer_version: 'v1',
        observed_at: new Date('2026-01-02T00:00:00Z'),
        source: 'api-v2-compra-agil',
        endpoint: 'detail',
        snapshot_kind: 'detail' as const,
        request_fingerprint: 'request-b',
        provider_changed_at_raw: '2026-01-02T00:00:00Z',
        raw_payload: { payload: fixture.payload.items[0] },
      },
    ];
    const query = jest.fn().mockResolvedValue(observations);
    const projectionService = {
      rebuild: jest.fn().mockResolvedValue([
        {
          observationId: 'observation-a',
          created: true,
          applied: true,
          semanticChanged: false,
          skipped: false,
        },
        {
          observationId: 'observation-b',
          created: false,
          applied: true,
          semanticChanged: true,
          skipped: false,
        },
      ]),
    } as unknown as jest.Mocked<MercadoPublicoV2ProjectionService>;
    const service = new MercadoPublicoV2EvidenceReplayService(
      {} as MercadoPublicoPersistenceService,
      projectionService,
      { query } as never,
    );
    const counters = {
      recordsCreated: 0,
      recordsUpdated: 0,
      recordsSkipped: 0,
      historyWritten: 0,
      recordsFailed: 0,
    };
    const processEvidenceItem = (
      service as unknown as {
        processEvidenceItem: (
          context: { syncRunId: string; sourceSyncRunId: string | null },
          item: { id: string; codigo: string; status: string },
          replayCounters: typeof counters,
        ) => Promise<void>;
      }
    ).processEvidenceItem;

    await processEvidenceItem.call(
      service,
      { syncRunId: 'replay-run', sourceSyncRunId: 'source-run' },
      { id: 'item-1', codigo: 'FIXTURE-CA-001', status: 'processing' },
      counters,
    );

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining(
        'ORDER BY o.provider_changed_at ASC NULLS FIRST, o.observed_at ASC, o.id ASC',
      ),
      ['FIXTURE-CA-001'],
    );
    expect(projectionService.rebuild).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ observationId: 'observation-a' }),
        expect.objectContaining({
          observationId: 'observation-b',
          context: expect.objectContaining({ snapshotKind: 'detail' }),
        }),
      ]),
    );
    expect(counters).toMatchObject({
      recordsCreated: 1,
      recordsUpdated: 1,
      historyWritten: 1,
    });
  });
});
