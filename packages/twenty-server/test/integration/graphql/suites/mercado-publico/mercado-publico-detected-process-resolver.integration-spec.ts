import request from 'supertest';

import {
  cleanupMercadoPublicoFixtures,
  seedGoldDetectedProcesses,
} from 'test/integration/graphql/suites/mercado-publico/fixtures/mercado-publico-fixtures';

const client = request(`http://localhost:${APP_PORT}`);
const authHeader = `Bearer ${APPLE_JANE_ADMIN_ACCESS_TOKEN}`;

const DETECTED_PROCESS_GQL_FIELDS = `
  processType
  processCode
  title
  canonicalState
  rawStateCode
  rawStateLabel
  buyerCode
  buyerName
  publishedAt
  closingAt
  sourcePriority
  reconciliationStatus
  lastSeenAt
`;

const PROCESS_DETAIL_GQL_FIELDS = `
  processType
  processCode
  title
  canonicalState
  rawState { code label }
  buyer { code name }
  dates { publishedAt closingAt }
  items { code name quantity amount }
  adjudications { supplierCode quantity amount }
  relatedOcs { code canonicalState matchType matchConfidence }
  sourceLineage { source rowCount lastSeenAt }
  reconciliationSummary { exact candidate unmatched manualReviewRequired }
  sourcePriority
  lastSeenAt
`;

const mpccCa1Published = new Date('2025-06-01T12:00:00Z');
const mpccCa1Closing = new Date('2025-07-15T17:00:00Z');
const mpccCa1LastSeen = new Date('2025-06-20T03:00:00Z');
const mpccCa2Published = new Date('2025-05-01T00:00:00Z');
const mpccCa2Closing = new Date('2025-08-01T00:00:00Z');
const mpccCa2LastSeen = new Date('2025-06-15T03:00:00Z');
const mpccL1Published = new Date('2025-04-01T09:00:00Z');
const mpccL1Closing = new Date('2025-06-30T15:00:00Z');
const mpccL1LastSeen = new Date('2025-06-18T03:00:00Z');

describe('mercadoPublicoDetectedProcesses + mercadoPublicoProcessDetail resolvers (integration)', () => {
  beforeAll(async () => {
    await seedGoldDetectedProcesses([
      {
        process_type: 'compra_agil',
        process_code: 'mpcc-CA-001',
        title: 'Insumos hospitalarios',
        canonical_state: 'publicada',
        raw_state_code: 'pub',
        raw_state_label: 'Publicada',
        buyer_code: 'B001',
        buyer_name: 'MINSAL',
        published_at: mpccCa1Published,
        closing_at: mpccCa1Closing,
        source_priority: 'api-v2-compra-agil',
        reconciliation_status: 'exact',
        last_seen_at: mpccCa1LastSeen,
      },
      {
        process_type: 'compra_agil',
        process_code: 'mpcc-CA-002',
        title: 'Arriendo de equipos',
        canonical_state: 'cerrada',
        raw_state_code: 'cer',
        raw_state_label: 'Cerrada',
        buyer_code: 'B002',
        buyer_name: 'SSS',
        published_at: mpccCa2Published,
        closing_at: mpccCa2Closing,
        source_priority: 'api-v2-compra-agil',
        reconciliation_status: 'unmatched',
        last_seen_at: mpccCa2LastSeen,
      },
      {
        process_type: 'compra_agil',
        process_code: 'mpcc-CA-003',
        title: null,
        canonical_state: 'proveedor_seleccionado',
        raw_state_code: 'ps',
        raw_state_label: 'Proveedor Seleccionado',
        buyer_code: 'B003',
        buyer_name: null,
        published_at: new Date('2025-06-10T10:00:00Z'),
        closing_at: null,
        source_priority: null,
        reconciliation_status: 'candidate',
        last_seen_at: new Date('2025-06-22T03:00:00Z'),
      },
      {
        process_type: 'licitacion',
        process_code: 'mpcc-LIC-001',
        title: 'Construcción de puente',
        canonical_state: 'publicada',
        raw_state_code: 'pub',
        raw_state_label: 'Publicada',
        buyer_code: 'B010',
        buyer_name: 'MOP',
        published_at: mpccL1Published,
        closing_at: mpccL1Closing,
        source_priority: 'api-v1-licitaciones',
        reconciliation_status: 'exact',
        last_seen_at: mpccL1LastSeen,
      },
    ]);
  });

  afterAll(async () => {
    await cleanupMercadoPublicoFixtures();
  });

  describe('detected-process list query', () => {
    it('should list detected processes with processTypes filter', async () => {
      const queryData = {
        query: `
          query {
            mercadoPublicoDetectedProcesses(
              processTypes: ["compra_agil"]
              page: 1
              limit: 10
            ) {
              items {
                ${DETECTED_PROCESS_GQL_FIELDS}
              }
              total
              page
              limit
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

      const result = response.body.data.mercadoPublicoDetectedProcesses;

      expect(result.items).toBeDefined();
      expect(result.items.length).toBe(3);
      expect(result.total).toBe(3);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('should filter by states and return matching subset', async () => {
      const queryData = {
        query: `
          query {
            mercadoPublicoDetectedProcesses(
              processTypes: ["compra_agil"]
              states: ["publicada", "proveedor_seleccionado"]
              page: 1
              limit: 10
            ) {
              items { processCode canonicalState }
              total
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

      const result = response.body.data.mercadoPublicoDetectedProcesses;

      expect(result.items.length).toBe(2);
      expect(result.total).toBe(2);
      const states = result.items.map((i: { canonicalState: string }) => i.canonicalState);

      expect(states).toContain('publicada');
      expect(states).toContain('proveedor_seleccionado');
    });

    it('should filter by exact buyerCode', async () => {
      const queryData = {
        query: `
          query {
            mercadoPublicoDetectedProcesses(
              processTypes: ["compra_agil"]
              buyerCode: "B001"
              page: 1
              limit: 10
            ) {
              items { processCode buyerCode buyerName }
              total
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

      const result = response.body.data.mercadoPublicoDetectedProcesses;

      expect(result.items.length).toBe(1);
      expect(result.items[0].processCode).toBe('mpcc-CA-001');
      expect(result.items[0].buyerCode).toBe('B001');
      expect(result.items[0].buyerName).toBe('MINSAL');
    });

    it('should filter by publishedFrom and publishedTo', async () => {
      const queryData = {
        query: `
          query {
            mercadoPublicoDetectedProcesses(
              processTypes: ["compra_agil"]
              publishedFrom: "2025-06-01T00:00:00.000Z"
              publishedTo:   "2025-06-30T00:00:00.000Z"
              page: 1
              limit: 10
            ) {
              items { processCode publishedAt }
              total
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

      const result = response.body.data.mercadoPublicoDetectedProcesses;

      expect(result.items.length).toBe(2);
      const codes = result.items.map((i: { processCode: string }) => i.processCode);

      expect(codes).toContain('mpcc-CA-001');
      expect(codes).toContain('mpcc-CA-003');
    });

    it('should filter by changedSince', async () => {
      const queryData = {
        query: `
          query {
            mercadoPublicoDetectedProcesses(
              processTypes: ["compra_agil"]
              changedSince: "2025-06-20T00:00:00.000Z"
              page: 1
              limit: 10
            ) {
              items { processCode lastSeenAt }
              total
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

      const result = response.body.data.mercadoPublicoDetectedProcesses;

      expect(result.total).toBeLessThanOrEqual(3);
      for (const item of result.items) {
        expect(new Date(item.lastSeenAt).getTime()).toBeGreaterThanOrEqual(
          new Date('2025-06-20T00:00:00.000Z').getTime(),
        );
      }
    });

    it('should support pagination with page/limit/total', async () => {
      const queryData = {
        query: `
          query {
            mercadoPublicoDetectedProcesses(
              processTypes: ["compra_agil"]
              page: 1
              limit: 2
            ) {
              items { processCode }
              total
              page
              limit
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

      const result = response.body.data.mercadoPublicoDetectedProcesses;

      expect(result.items.length).toBe(2);
      expect(result.total).toBe(3);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(2);
    });

    it('should show page 2 with different items when limit splits total', async () => {
      const queryData = {
        query: `
          query {
            mercadoPublicoDetectedProcesses(
              processTypes: ["compra_agil"]
              page: 2
              limit: 2
            ) {
              items { processCode }
              total
              page
              limit
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

      const result = response.body.data.mercadoPublicoDetectedProcesses;

      expect(result.items.length).toBe(1);
      expect(result.total).toBe(3);
      expect(result.page).toBe(2);
    });

    it('should sort by closingAt ascending', async () => {
      const queryData = {
        query: `
          query {
            mercadoPublicoDetectedProcesses(
              processTypes: ["compra_agil"]
              sort: { key: closingAt, direction: asc }
              page: 1
              limit: 10
            ) {
              items { processCode closingAt }
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

      const items = response.body.data.mercadoPublicoDetectedProcesses.items;
      const closingDates = items.map((i: { closingAt: string | null }) => i.closingAt);

      const nonNullIndices = closingDates
        .map((d: string | null, idx: number) => (d !== null ? idx : -1))
        .filter((idx: number) => idx !== -1);

      for (let i = 1; i < nonNullIndices.length; i++) {
        expect(
          new Date(closingDates[nonNullIndices[i]]).getTime(),
        ).toBeGreaterThanOrEqual(
          new Date(closingDates[nonNullIndices[i - 1]]).getTime(),
        );
      }
    });

    it('should sort by lastSeenAt descending', async () => {
      const queryData = {
        query: `
          query {
            mercadoPublicoDetectedProcesses(
              processTypes: ["compra_agil"]
              sort: { key: lastSeenAt, direction: desc }
              page: 1
              limit: 10
            ) {
              items { processCode lastSeenAt }
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

      const items = response.body.data.mercadoPublicoDetectedProcesses.items;
      const lastSeenDates = items.map((i: { lastSeenAt: string }) =>
        new Date(i.lastSeenAt).getTime(),
      );

      for (let i = 1; i < lastSeenDates.length; i++) {
        expect(lastSeenDates[i]).toBeLessThanOrEqual(lastSeenDates[i - 1]);
      }
    });

    it('should return empty items and zero total for unknown buyerCode', async () => {
      const queryData = {
        query: `
          query {
            mercadoPublicoDetectedProcesses(
              processTypes: ["compra_agil"]
              buyerCode: "NONEXISTENT"
              page: 1
              limit: 10
            ) {
              items { processCode }
              total
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

      const result = response.body.data.mercadoPublicoDetectedProcesses;

      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe('process detail query', () => {
    it('should return process detail by processType and processCode', async () => {
      const queryData = {
        query: `
          query {
            mercadoPublicoProcessDetail(
              processType: "compra_agil"
              processCode: "mpcc-CA-001"
            ) {
              ${PROCESS_DETAIL_GQL_FIELDS}
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

      const detail = response.body.data.mercadoPublicoProcessDetail;

      expect(detail).toBeDefined();
      expect(detail.processType).toBe('compra_agil');
      expect(detail.processCode).toBe('mpcc-CA-001');
      expect(detail.title).toBe('Insumos hospitalarios');
      expect(detail.canonicalState).toBe('publicada');
      expect(detail.rawState.code).toBe('pub');
      expect(detail.rawState.label).toBe('Publicada');
      expect(detail.buyer.code).toBe('B001');
      expect(detail.buyer.name).toBe('MINSAL');
      expect(detail.dates.publishedAt).toBeTruthy();
      expect(detail.dates.closingAt).toBeTruthy();
    });

    it('should return null for non-existent process', async () => {
      const queryData = {
        query: `
          query {
            mercadoPublicoProcessDetail(
              processType: "compra_agil"
              processCode: "mpcc-NOEXIST"
            ) {
              processCode
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
      expect(response.body.data.mercadoPublicoProcessDetail).toBeNull();
    });

    it('should handle null buyer name gracefully', async () => {
      const queryData = {
        query: `
          query {
            mercadoPublicoProcessDetail(
              processType: "compra_agil"
              processCode: "mpcc-CA-003"
            ) {
              processCode
              title
              canonicalState
              buyer { code name }
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

      const detail = response.body.data.mercadoPublicoProcessDetail;

      expect(detail.processCode).toBe('mpcc-CA-003');
      expect(detail.title).toBeNull();
      expect(detail.canonicalState).toBe('proveedor_seleccionado');
      expect(detail.buyer.code).toBe('B003');
      expect(detail.buyer.name).toBeNull();
    });

    it('should return items, adjudications, relatedOCs, reconciliation summary from DTO', async () => {
      const queryData = {
        query: `
          query {
            mercadoPublicoProcessDetail(
              processType: "compra_agil"
              processCode: "mpcc-CA-001"
            ) {
              items { code name quantity amount }
              adjudications { supplierCode quantity amount }
              relatedOcs { code canonicalState matchType matchConfidence }
              sourceLineage { source rowCount lastSeenAt }
              reconciliationSummary { exact candidate unmatched manualReviewRequired }
              sourcePriority
              lastSeenAt
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

      const detail = response.body.data.mercadoPublicoProcessDetail;

      expect(Array.isArray(detail.items)).toBe(true);
      expect(Array.isArray(detail.adjudications)).toBe(true);
      expect(Array.isArray(detail.relatedOcs)).toBe(true);
      expect(Array.isArray(detail.sourceLineage)).toBe(true);
      expect(detail.reconciliationSummary).toBeDefined();
      expect(typeof detail.reconciliationSummary.exact).toBe('number');
      expect(detail.sourcePriority).toBe('api-v2-compra-agil');
      expect(detail.lastSeenAt).toBeTruthy();

      for (const item of detail.items) {
        expect(item).toHaveProperty('code');
        expect(item).toHaveProperty('name');
      }

      for (const adj of detail.adjudications) {
        expect(adj).toHaveProperty('supplierCode');
      }

      for (const oc of detail.relatedOcs) {
        expect(oc).toHaveProperty('code');
        expect(oc).toHaveProperty('matchType');
        expect(oc).toHaveProperty('matchConfidence');
      }

      for (const lineage of detail.sourceLineage) {
        expect(lineage).toHaveProperty('source');
        expect(typeof lineage.rowCount).toBe('number');
      }

      const detailDoesNotHave = Object.keys(detail);

      expect(detailDoesNotHave).not.toContain('ocAmount');
      expect(detailDoesNotHave).not.toContain('awardDate');
      expect(detailDoesNotHave).not.toContain('percentageConfidence');
      expect(detailDoesNotHave).not.toContain('approvalState');
    });

    it('should handle licitacion processes', async () => {
      const queryData = {
        query: `
          query {
            mercadoPublicoDetectedProcesses(
              processTypes: ["licitacion"]
              page: 1
              limit: 10
            ) {
              items { processType processCode title canonicalState }
              total
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

      const result = response.body.data.mercadoPublicoDetectedProcesses;

      expect(result.total).toBe(1);
      expect(result.items[0].processType).toBe('licitacion');
      expect(result.items[0].processCode).toBe('mpcc-LIC-001');
    });
  });
});
