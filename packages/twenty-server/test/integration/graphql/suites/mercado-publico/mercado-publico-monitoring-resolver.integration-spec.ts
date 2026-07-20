import request from 'supertest';

import {
  cleanupMercadoPublicoFixtures,
  seedRawApiPayloads,
  seedStgJobRuns,
} from 'test/integration/graphql/suites/mercado-publico/fixtures/mercado-publico-fixtures';

const client = request(`http://localhost:${APP_PORT}`);
const authHeader = `Bearer ${APPLE_JANE_ADMIN_ACCESS_TOKEN}`;

const JOB_RUN_GQL_FIELDS = `
  id
  jobName
  jobRunId
  status
  startedAt
  finishedAt
  recordsFetched
  recordsStaged
  recordsCanonicalized
  recordsFailed
  errorSummary
  createdAt
`;

const API_CALL_LOG_GQL_FIELDS = `
  id
  source
  endpoint
  requestParams
  httpStatus
  fetchedAt
  recordsFetched
  errorSummary
  ingestionJobId
`;

const mpccJr1Started = new Date('2025-06-20T03:10:00Z');
const mpccJr1Finished = new Date('2025-06-20T03:12:00Z');
const mpccJr2Started = new Date('2025-06-20T02:00:00Z');
const mpccJr2Finished = new Date('2025-06-20T02:05:00Z');
const mpccJr3Started = new Date('2025-06-19T10:00:00Z');
const mpccJr4Started = new Date('2025-06-20T04:00:00Z');

const sensitiveRequestParams = {
  endpoint: 'by-date',
  code: '123',
  fecha: '2025-01-01',
  Authorization: 'Bearer secret-token-123',
  Cookie: 'session=abc123',
  token: 'api-key-xyz',
  password: 'super-secret',
  Ticket: 'TICKET-999',
  nested: {
    secret: 'nested-secret',
    Authorization: 'nested-bearer',
    safe_value: 'keep-me',
  },
  params: [
    { key: 'Authorization', val: 'arr-bearer' },
    { key: 'safe', val: 'visible' },
    { key: 'ticket', val: 'arr-ticket' },
  ],
};

describe('mercadoPublicoJobRuns + mercadoPublicoApiCallLog resolvers (integration)', () => {
  beforeAll(async () => {
    await seedStgJobRuns([
      {
        id: 'a0000001-0001-0001-0001-000000000001',
        job_name: 'api-v2-compra-agil-incremental',
        job_run_id: 'run-cc-001',
        status: 'success',
        started_at: mpccJr1Started,
        finished_at: mpccJr1Finished,
        records_fetched: 100,
        records_staged: 100,
        records_canonicalized: 95,
        records_failed: 0,
        error_summary: null,
      },
      {
        id: 'a0000001-0001-0001-0001-000000000002',
        job_name: 'csv-licitaciones-download',
        job_run_id: 'run-cc-002',
        status: 'failed',
        started_at: mpccJr2Started,
        finished_at: mpccJr2Finished,
        records_fetched: 0,
        records_staged: 0,
        records_canonicalized: 0,
        records_failed: 0,
        error_summary: 'csv_storage_write_failed: disk full',
      },
      {
        id: 'a0000001-0001-0001-0001-000000000003',
        job_name: 'api-v1-licitaciones-by-date',
        job_run_id: 'run-cc-003',
        status: 'soft_miss',
        started_at: mpccJr3Started,
        finished_at: new Date('2025-06-19T10:01:00Z'),
        records_fetched: 0,
        records_staged: 0,
        records_canonicalized: 0,
        records_failed: 0,
        error_summary: null,
      },
      {
        id: 'a0000001-0001-0001-0001-000000000004',
        job_name: 'csv-oc-download',
        job_run_id: 'run-cc-004',
        status: 'param_error',
        started_at: mpccJr4Started,
        finished_at: null,
        records_fetched: null,
        records_staged: null,
        records_canonicalized: null,
        records_failed: null,
        error_summary: 'param_error: missing required param "fecha"',
      },
      {
        id: 'a0000001-0001-0001-0001-000000000005',
        job_name: 'api-v1-oc-by-date',
        job_run_id: 'run-cc-005',
        status: 'retryable_failed',
        started_at: new Date('2025-06-20T05:00:00Z'),
        finished_at: new Date('2025-06-20T05:03:00Z'),
        records_fetched: 10,
        records_staged: 10,
        records_canonicalized: 0,
        records_failed: 10,
        error_summary: 'retryable_failed: timeout after 3 attempts',
      },
    ]);

    await seedRawApiPayloads([
      {
        id: 'b0000001-0001-0001-0001-000000000001',
        source: 'api-v2-compra-agil',
        endpoint: 'list',
        request_fingerprint: 'fp-cc-001',
        payload_checksum: 'chk-cc-001',
        request_params: sensitiveRequestParams,
        http_status: 200,
        fetched_at: mpccJr1Started,
        raw_payload: { resultados: [] },
        schema_fingerprint: 'sfp-cc-001',
        ingestion_job_id: 'a0000001-0001-0001-0001-000000000001',
        error_summary: null,
        records_fetched: 100,
      },
      {
        id: 'b0000001-0001-0001-0001-000000000002',
        source: 'csv-datos-abiertos',
        endpoint: 'oc-download',
        request_fingerprint: 'fp-cc-002',
        payload_checksum: 'chk-cc-002',
        request_params: { mes: 'enero', password: 'csv-secret' },
        http_status: 500,
        fetched_at: mpccJr2Started,
        raw_payload: { error: 'storage error' },
        schema_fingerprint: 'sfp-cc-002',
        ingestion_job_id: 'a0000001-0001-0001-0001-000000000002',
        error_summary: 'download_failed',
        records_fetched: null,
      },
      {
        id: 'b0000001-0001-0001-0001-000000000003',
        source: 'api-v1-licitaciones',
        endpoint: 'by-date',
        request_fingerprint: 'fp-cc-003',
        payload_checksum: 'chk-cc-003',
        request_params: { fecha: '2025-01-01', ticket: 'TICKET-123' },
        http_status: 404,
        fetched_at: mpccJr3Started,
        raw_payload: {},
        schema_fingerprint: 'sfp-cc-003',
        ingestion_job_id: 'a0000001-0001-0001-0001-000000000003',
        error_summary: '404_not_found',
        records_fetched: 0,
      },
      {
        id: 'b0000001-0001-0001-0001-000000000004',
        source: 'api-v2-compra-agil',
        endpoint: 'detail-by-codigo',
        request_fingerprint: 'fp-cc-004',
        payload_checksum: 'chk-cc-004',
        request_params: {
          safe_param: 'visible_value',
          non_secret_nested: { key: 'value' },
        },
        http_status: 200,
        fetched_at: new Date('2025-06-20T01:00:00Z'),
        raw_payload: { code: 'CA-123' },
        schema_fingerprint: 'sfp-cc-004',
        ingestion_job_id: null,
        error_summary: null,
        records_fetched: 1,
      },
    ]);
  });

  afterAll(async () => {
    await cleanupMercadoPublicoFixtures();
  });

  describe('job-run list query', () => {
    it('should list job runs with all statuses', async () => {
      const queryData = {
        query: `
          query {
            mercadoPublicoJobRuns(limit: 10) {
              items { ${JOB_RUN_GQL_FIELDS} }
              hasMore
            }
          }
        `,
      };

      const response = await client
        .post('/graphql')
        .set('Authorization', authHeader)
        .send(queryData);

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeUndefined();

      const result = response.body.data.mercadoPublicoJobRuns;

      expect(result.items.length).toBe(5);

      const statuses = result.items.map(
        (i: { status: string }) => i.status,
      );

      expect(statuses).toContain('success');
      expect(statuses).toContain('failed');
      expect(statuses).toContain('soft_miss');
      expect(statuses).toContain('param_error');
      expect(statuses).toContain('retryable_failed');
    });

    it('should filter by status', async () => {
      const queryData = {
        query: `
          query {
            mercadoPublicoJobRuns(
              statuses: ["success", "soft_miss"]
              limit: 10
            ) {
              items { id status }
              hasMore
            }
          }
        `,
      };

      const response = await client
        .post('/graphql')
        .set('Authorization', authHeader)
        .send(queryData);

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeUndefined();

      const result = response.body.data.mercadoPublicoJobRuns;
      const statuses = result.items.map((i: { status: string }) => i.status);

      expect(statuses.length).toBe(2);
      expect(statuses).toContain('success');
      expect(statuses).toContain('soft_miss');
    });

    it('should filter by jobName', async () => {
      const queryData = {
        query: `
          query {
            mercadoPublicoJobRuns(
              jobName: "csv-licitaciones-download"
              limit: 10
            ) {
              items { id jobName status errorSummary }
              hasMore
            }
          }
        `,
      };

      const response = await client
        .post('/graphql')
        .set('Authorization', authHeader)
        .send(queryData);

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeUndefined();

      const result = response.body.data.mercadoPublicoJobRuns;

      expect(result.items.length).toBe(1);
      expect(result.items[0].jobName).toBe('csv-licitaciones-download');
      expect(result.items[0].status).toBe('failed');
      expect(result.items[0].errorSummary).toBe(
        'csv_storage_write_failed: disk full',
      );
    });

    it('should paginate with limit/offset and hasMore', async () => {
      const queryData = {
        query: `
          query {
            mercadoPublicoJobRuns(limit: 2) {
              items { id }
              hasMore
            }
          }
        `,
      };

      const response = await client
        .post('/graphql')
        .set('Authorization', authHeader)
        .send(queryData);

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeUndefined();

      const result = response.body.data.mercadoPublicoJobRuns;

      expect(result.items.length).toBe(2);
      expect(result.hasMore).toBe(true);
    });

    it('should advance offset correctly', async () => {
      const page1 = await client
        .post('/graphql')
        .set('Authorization', authHeader)
        .send({
          query: `
            query {
              mercadoPublicoJobRuns(limit: 2, offset: 0) {
                items { id }
                hasMore
              }
            }
          `,
        });

      const page2 = await client
        .post('/graphql')
        .set('Authorization', authHeader)
        .send({
          query: `
            query {
              mercadoPublicoJobRuns(limit: 2, offset: 2) {
                items { id }
                hasMore
              }
            }
          `,
        });

      expect(page1.body.data.mercadoPublicoJobRuns.items.length).toBe(2);
      expect(page2.body.data.mercadoPublicoJobRuns.items.length).toBeGreaterThanOrEqual(1);

      const page1Ids = page1.body.data.mercadoPublicoJobRuns.items.map(
        (i: { id: string }) => i.id,
      );
      const page2Ids = page2.body.data.mercadoPublicoJobRuns.items.map(
        (i: { id: string }) => i.id,
      );

      for (const id of page2Ids) {
        expect(page1Ids).not.toContain(id);
      }
    });

    it('should expose error_summary for expandable detail', async () => {
      const queryData = {
        query: `
          query {
            mercadoPublicoJobRuns(
              jobName: "csv-oc-download"
              limit: 10
            ) {
              items {
                id
                status
                errorSummary
              }
              hasMore
            }
          }
        `,
      };

      const response = await client
        .post('/graphql')
        .set('Authorization', authHeader)
        .send(queryData);

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeUndefined();

      const items = response.body.data.mercadoPublicoJobRuns.items;

      expect(items.length).toBe(1);
      expect(items[0].status).toBe('param_error');
      expect(items[0].errorSummary).toBe(
        'param_error: missing required param "fecha"',
      );
    });

    it('should return null errorSummary for success status', async () => {
      const queryData = {
        query: `
          query {
            mercadoPublicoJobRuns(
              statuses: ["success"]
              limit: 10
            ) {
              items { id status errorSummary }
              hasMore
            }
          }
        `,
      };

      const response = await client
        .post('/graphql')
        .set('Authorization', authHeader)
        .send(queryData);

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeUndefined();

      const items = response.body.data.mercadoPublicoJobRuns.items;

      expect(items.length).toBe(1);
      expect(items[0].errorSummary).toBeNull();
    });
  });

  describe('API call log query', () => {
    it('should list API call log entries', async () => {
      const queryData = {
        query: `
          query {
            mercadoPublicoApiCallLog(limit: 10) {
              items { ${API_CALL_LOG_GQL_FIELDS} }
              hasMore
            }
          }
        `,
      };

      const response = await client
        .post('/graphql')
        .set('Authorization', authHeader)
        .send(queryData);

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeUndefined();

      const result = response.body.data.mercadoPublicoApiCallLog;

      expect(result.items.length).toBe(4);
      expect(result.hasMore).toBe(false);
    });

    it('should filter by source', async () => {
      const queryData = {
        query: `
          query {
            mercadoPublicoApiCallLog(
              source: "api-v2-compra-agil"
              limit: 10
            ) {
              items { id source endpoint }
              hasMore
            }
          }
        `,
      };

      const response = await client
        .post('/graphql')
        .set('Authorization', authHeader)
        .send(queryData);

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeUndefined();

      const result = response.body.data.mercadoPublicoApiCallLog;

      expect(result.items.length).toBe(2);

      for (const item of result.items) {
        expect(item.source).toBe('api-v2-compra-agil');
      }
    });

    it('should filter by endpoint', async () => {
      const queryData = {
        query: `
          query {
            mercadoPublicoApiCallLog(
              endpoint: "detail-by-codigo"
              limit: 10
            ) {
              items { id source endpoint }
              hasMore
            }
          }
        `,
      };

      const response = await client
        .post('/graphql')
        .set('Authorization', authHeader)
        .send(queryData);

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeUndefined();

      const result = response.body.data.mercadoPublicoApiCallLog;

      expect(result.items.length).toBe(1);
      expect(result.items[0].source).toBe('api-v2-compra-agil');
      expect(result.items[0].endpoint).toBe('detail-by-codigo');
    });

    it('should filter by httpStatus', async () => {
      const queryData = {
        query: `
          query {
            mercadoPublicoApiCallLog(
              httpStatus: 200
              limit: 10
            ) {
              items { id httpStatus }
              hasMore
            }
          }
        `,
      };

      const response = await client
        .post('/graphql')
        .set('Authorization', authHeader)
        .send(queryData);

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeUndefined();

      const result = response.body.data.mercadoPublicoApiCallLog;

      for (const item of result.items) {
        expect(item.httpStatus).toBe(200);
      }
    });

    it('should paginate with limit/offset and hasMore', async () => {
      const queryData = {
        query: `
          query {
            mercadoPublicoApiCallLog(limit: 2) {
              items { id }
              hasMore
            }
          }
        `,
      };

      const response = await client
        .post('/graphql')
        .set('Authorization', authHeader)
        .send(queryData);

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeUndefined();

      const result = response.body.data.mercadoPublicoApiCallLog;

      expect(result.items.length).toBe(2);
      expect(result.hasMore).toBe(true);
    });

    it('should link API call to ingestion job via ingestionJobId', async () => {
      const queryData = {
        query: `
          query {
            mercadoPublicoApiCallLog(
              source: "api-v2-compra-agil"
              endpoint: "list"
              limit: 10
            ) {
              items { id source endpoint ingestionJobId }
              hasMore
            }
          }
        `,
      };

      const response = await client
        .post('/graphql')
        .set('Authorization', authHeader)
        .send(queryData);

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeUndefined();

      const items = response.body.data.mercadoPublicoApiCallLog.items;

      expect(items.length).toBe(1);
      expect(items[0].ingestionJobId).toBe(
        'a0000001-0001-0001-0001-000000000001',
      );
    });

    describe('request parameter redaction', () => {
      const SENSITIVE_KEY_REGEX = /^(?:\*+)$|^\[REDACTED\]$/;

      it('should redact top-level sensitive keys', async () => {
        const queryData = {
          query: `
            query {
              mercadoPublicoApiCallLog(
                source: "api-v2-compra-agil"
                endpoint: "list"
                limit: 10
              ) {
                items { id requestParams }
                hasMore
              }
            }
          `,
        };

        const response = await client
          .post('/graphql')
          .set('Authorization', authHeader)
          .send(queryData);

        expect(response.status).toBe(200);
        expect(response.body.errors).toBeUndefined();

        const items = response.body.data.mercadoPublicoApiCallLog.items;

        expect(items.length).toBe(1);

        const params = items[0].requestParams;

        expect(typeof params).toBe('object');
        expect(params.Authorization).not.toBe('Bearer secret-token-123');
        expect(String(params.Cookie)).not.toBe('session=abc123');
        expect(String(params.token)).not.toBe('api-key-xyz');
        expect(String(params.password)).not.toBe('super-secret');
        expect(String(params.Ticket)).not.toBe('TICKET-999');

        for (const key of [
          'Authorization',
          'Cookie',
          'token',
          'password',
          'Ticket',
        ]) {
          expect(String(params[key])).not.toMatch(/secret-token-123/);
          expect(String(params[key])).not.toMatch(/session=abc123/);
          expect(String(params[key])).not.toMatch(/api-key-xyz/);
          expect(String(params[key])).not.toMatch(/super-secret/);
          expect(String(params[key])).not.toMatch(/TICKET-999/);
        }

        expect(params.endpoint).toBe('by-date');
        expect(params.fecha).toBe('2025-01-01');
        expect(params.code).toBe('123');
      });

      it('should redact nested object sensitive keys', async () => {
        const queryData = {
          query: `
            query {
              mercadoPublicoApiCallLog(
                source: "api-v2-compra-agil"
                endpoint: "list"
                limit: 10
              ) {
                items { id requestParams }
                hasMore
              }
            }
          `,
        };

        const response = await client
          .post('/graphql')
          .set('Authorization', authHeader)
          .send(queryData);

        expect(response.status).toBe(200);
        expect(response.body.errors).toBeUndefined();

        const params =
          response.body.data.mercadoPublicoApiCallLog.items[0].requestParams;
        const nested = params.nested;

        expect(nested).toBeDefined();

        if (typeof nested === 'object' && nested !== null) {
          expect(String(nested.secret)).not.toBe('nested-secret');
          expect(String(nested.Authorization)).not.toBe('nested-bearer');
          expect(nested.safe_value).toBe('keep-me');
        }
      });

      it('should redact sensitive keys inside arrays', async () => {
        const queryData = {
          query: `
            query {
              mercadoPublicoApiCallLog(
                source: "api-v2-compra-agil"
                endpoint: "list"
                limit: 10
              ) {
                items { id requestParams }
                hasMore
              }
            }
          `,
        };

        const response = await client
          .post('/graphql')
          .set('Authorization', authHeader)
          .send(queryData);

        expect(response.status).toBe(200);
        expect(response.body.errors).toBeUndefined();

        const params =
          response.body.data.mercadoPublicoApiCallLog.items[0].requestParams;
        const arr = params.params;

        expect(Array.isArray(arr)).toBe(true);

        const authEntry = arr.find(
          (e: { key: string }) => e.key === 'Authorization',
        );

        expect(authEntry).toBeDefined();
        expect(String(authEntry.val)).not.toBe('arr-bearer');

        const ticketEntry = arr.find(
          (e: { key: string }) => e.key === 'ticket',
        );

        expect(ticketEntry).toBeDefined();
        expect(String(ticketEntry.val)).not.toBe('arr-ticket');

        const safeEntry = arr.find(
          (e: { key: string }) => e.key === 'safe',
        );

        expect(safeEntry).toBeDefined();
        expect(safeEntry.val).toBe('visible');
      });

      it('should preserve non-sensitive keys at all levels', async () => {
        const queryData = {
          query: `
            query {
              mercadoPublicoApiCallLog(
                source: "api-v2-compra-agil"
                endpoint: "list"
                limit: 10
              ) {
                items { id requestParams }
                hasMore
              }
            }
          `,
        };

        const response = await client
          .post('/graphql')
          .set('Authorization', authHeader)
          .send(queryData);

        expect(response.status).toBe(200);
        expect(response.body.errors).toBeUndefined();

        const params =
          response.body.data.mercadoPublicoApiCallLog.items[0].requestParams;

        expect(params.endpoint).toBe('by-date');
        expect(params.code).toBe('123');
        expect(params.fecha).toBe('2025-01-01');
        expect(params.nested).toBeDefined();
        expect(params.nested.safe_value).toBe('2025-01-01');
        expect(Array.isArray(params.params)).toBe(true);
      });

      it('should redact sensitive keys for CSV-download payloads', async () => {
        const queryData = {
          query: `
            query {
              mercadoPublicoApiCallLog(
                source: "csv-datos-abiertos"
                limit: 10
              ) {
                items { id requestParams }
                hasMore
              }
            }
          `,
        };

        const response = await client
          .post('/graphql')
          .set('Authorization', authHeader)
          .send(queryData);

        expect(response.status).toBe(200);
        expect(response.body.errors).toBeUndefined();

        const items = response.body.data.mercadoPublicoApiCallLog.items;

        expect(items.length).toBe(1);

        const params = items[0].requestParams;

        expect(typeof params).toBe('object');
        expect(String(params.password)).not.toBe('csv-secret');
        expect(params.mes).toBe('enero');
      });
    });
  });
});
