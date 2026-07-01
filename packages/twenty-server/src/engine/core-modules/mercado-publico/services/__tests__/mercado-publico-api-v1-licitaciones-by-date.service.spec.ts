import { MercadoPublicoApiV1LicitacionesByDateService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-api-v1-licitaciones-by-date.service';
import { MercadoPublicoApiV1LicitacionesClientService } from 'src/engine/core-modules/mercado-publico/drivers/api/mercado-publico-api-v1-licitaciones-client.service';
import { MercadoPublicoCanonicalRefreshService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-canonical-refresh.service';
import { MercadoPublicoPersistenceService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-persistence.service';

describe('MercadoPublicoApiV1LicitacionesByDateService', () => {
  const mockMercadoPublicoApiV1LicitacionesClientService = {
    getByDate: jest.fn(),
  } as unknown as jest.Mocked<MercadoPublicoApiV1LicitacionesClientService>;

  const mockMercadoPublicoPersistenceService = {
    createJobRun: jest.fn().mockResolvedValue({
      id: 'job-run-record-id',
      jobRunId: 'job-run-id',
      startedAt: new Date('2026-06-29T00:00:00.000Z'),
    }),
    finalizeJobRun: jest.fn(),
    persistApiFailure: jest.fn(),
    persistV1LicitacionesSnapshot: jest.fn(),
  } as unknown as jest.Mocked<MercadoPublicoPersistenceService>;
  const mockMercadoPublicoCanonicalRefreshService = {
    refreshV1LicitacionesFromApiSnapshot: jest.fn(),
  } as unknown as jest.Mocked<MercadoPublicoCanonicalRefreshService>;

  const service = new MercadoPublicoApiV1LicitacionesByDateService(
    mockMercadoPublicoApiV1LicitacionesClientService,
    mockMercadoPublicoCanonicalRefreshService,
    mockMercadoPublicoPersistenceService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    mockMercadoPublicoPersistenceService.createJobRun.mockResolvedValue({
      id: 'job-run-record-id',
      jobRunId: 'job-run-id',
      startedAt: new Date('2026-06-29T00:00:00.000Z'),
    });
    mockMercadoPublicoCanonicalRefreshService.refreshV1LicitacionesFromApiSnapshot.mockReset();
  });

  it('should persist success path and finalize the job run', async () => {
    mockMercadoPublicoApiV1LicitacionesClientService.getByDate.mockResolvedValue(
      {
        endpoint: 'by-date',
        source: 'api-v1-licitaciones',
        requestParams: { fecha: '15062026' },
        requestFingerprint: 'request-fingerprint',
        payloadChecksum: 'payload-checksum',
        schemaFingerprint: 'schema-fingerprint',
        httpStatus: 200,
        fetchedAt: new Date('2026-06-15T00:00:00.000Z'),
        rawPayload: { Listado: [{ CodigoExterno: 'L1' }] },
        licitaciones: [{ CodigoExterno: 'L1' }],
      },
    );
    mockMercadoPublicoPersistenceService.persistV1LicitacionesSnapshot.mockResolvedValue(
      {
        rawApiPayloadId: 'raw-id',
        recordsFetched: 1,
        recordsStaged: 1,
        recordsCanonicalized: 0,
      },
    );
    mockMercadoPublicoCanonicalRefreshService.refreshV1LicitacionesFromApiSnapshot.mockResolvedValue(
      1,
    );

    await service.run({ date: '2026-06-15' });

    expect(
      mockMercadoPublicoPersistenceService.createJobRun,
    ).toHaveBeenCalledWith('api-v1-licitaciones-by-date');
    expect(
      mockMercadoPublicoApiV1LicitacionesClientService.getByDate,
    ).toHaveBeenCalledWith(expect.any(Date));
    expect(
      mockMercadoPublicoPersistenceService.persistV1LicitacionesSnapshot,
    ).toHaveBeenCalledWith({
      jobRunRecordId: 'job-run-record-id',
      apiResponse: expect.objectContaining({
        requestParams: { fecha: '15062026' },
      }),
      snapshotKind: 'list',
    });
    expect(
      mockMercadoPublicoCanonicalRefreshService.refreshV1LicitacionesFromApiSnapshot,
    ).toHaveBeenCalledWith('raw-id');
    expect(
      mockMercadoPublicoPersistenceService.finalizeJobRun,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        jobRunRecordId: 'job-run-record-id',
        status: 'success',
        recordsFetched: 1,
        recordsStaged: 1,
        recordsCanonicalized: 1,
        recordsFailed: 0,
      }),
    );
  });

  it('should persist raw failure payload and finalize the job run as failed', async () => {
    mockMercadoPublicoApiV1LicitacionesClientService.getByDate.mockResolvedValue(
      {
        endpoint: 'by-date',
        source: 'api-v1-licitaciones',
        requestParams: { fecha: '15062026' },
        requestFingerprint: 'request-fingerprint',
        payloadChecksum: 'payload-checksum',
        schemaFingerprint: 'schema-fingerprint',
        httpStatus: 200,
        fetchedAt: new Date('2026-06-15T00:00:00.000Z'),
        rawPayload: {
          Codigo: 203,
          Mensaje: 'Ticket no válido.',
        },
        licitaciones: [],
        errorSummary: 'hard_fail',
        errorCode: '203',
        errorMessage: 'Ticket no válido.',
      },
    );

    await expect(service.run({ date: '2026-06-15' })).rejects.toThrow(
      'hard_fail: code=203: Ticket no válido.',
    );

    expect(
      mockMercadoPublicoPersistenceService.persistApiFailure,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        source: 'api-v1-licitaciones',
        endpoint: 'by-date',
        errorSummaryText: 'hard_fail: code=203: Ticket no válido.',
      }),
    );
    expect(
      mockMercadoPublicoPersistenceService.finalizeJobRun,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        jobRunRecordId: 'job-run-record-id',
        status: 'failed',
        recordsFetched: 0,
        recordsFailed: 1,
      }),
    );
  });
});
