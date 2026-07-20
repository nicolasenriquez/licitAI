import request from 'supertest';

const client = request(`http://localhost:${APP_PORT}`);
const authHeader = `Bearer ${APPLE_JANE_ADMIN_ACCESS_TOKEN}`;

const PIPELINE_HEALTH_JOB_GQL_FIELDS = `
  jobName
  latestStatus
  lastSuccessAt
  lastFailureAt
  lagSinceLastSuccessMs
  failureCount
  freshness
  expectedCadenceMs
`;

const API_QUOTA_SOURCE_GQL_FIELDS = `
  source
  dailyLimit
  used
  remaining
  resetAt
  last429At
`;

const CSV_FILE_HEALTH_ENTRY_GQL_FIELDS = `
  sourceDataset
  sourceModality
  sourcePeriod
  sourceFileName
  fileChecksum
  detectedEncoding
  detectedDelimiter
  schemaFingerprint
  rowCount
  parseStatus
  parseErrorCount
  parseSuccessCount
  lastLoadedAt
  freshness
`;

describe('mercadoPublico wrapper resolvers (integration)', () => {
  describe('pipeline health query', () => {
    it('should return pipeline health with job entries', async () => {
      const queryData = {
        query: `
          query {
            mercadoPublicoPipelineHealth {
              jobs { ${PIPELINE_HEALTH_JOB_GQL_FIELDS} }
              generatedAt
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

      const result = response.body.data.mercadoPublicoPipelineHealth;

      expect(result).toBeDefined();
      expect(Array.isArray(result.jobs)).toBe(true);
      expect(result.generatedAt).toBeTruthy();

      for (const job of result.jobs) {
        expect(job).toHaveProperty('jobName');
        expect(job).toHaveProperty('latestStatus');
        expect(job).toHaveProperty('failureCount');
        expect(typeof job.failureCount).toBe('number');
      }

      const resultKeys = Object.keys(result);

      expect(resultKeys).not.toContain('healthScore');
      expect(resultKeys).not.toContain('aggregateKpi');
    });
  });

  describe('API quota usage query', () => {
    it('should return API quota usage with source entries', async () => {
      const queryData = {
        query: `
          query {
            mercadoPublicoApiQuotaUsage {
              sources { ${API_QUOTA_SOURCE_GQL_FIELDS} }
              generatedAt
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

      const result = response.body.data.mercadoPublicoApiQuotaUsage;

      expect(result).toBeDefined();
      expect(Array.isArray(result.sources)).toBe(true);
      expect(result.generatedAt).toBeTruthy();

      for (const source of result.sources) {
        expect(source).toHaveProperty('source');
        expect(source).toHaveProperty('dailyLimit');
        expect(typeof source.dailyLimit).toBe('number');
        expect(source).toHaveProperty('used');
        expect(typeof source.used).toBe('number');
        expect(source).toHaveProperty('remaining');
        expect(typeof source.remaining).toBe('number');
      }

      const resultKeys = Object.keys(result);

      expect(resultKeys).not.toContain('syntheticQuotaScore');
      expect(resultKeys).not.toContain('utilizationPercentage');
    });

    it('should handle empty sources array', async () => {
      const queryData = {
        query: `
          query {
            mercadoPublicoApiQuotaUsage {
              sources { source }
              generatedAt
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

      const result = response.body.data.mercadoPublicoApiQuotaUsage;

      expect(Array.isArray(result.sources)).toBe(true);
    });
  });

  describe('CSV file health query', () => {
    it('should return CSV file health with file entries', async () => {
      const queryData = {
        query: `
          query {
            mercadoPublicoCsvFileHealth {
              files { ${CSV_FILE_HEALTH_ENTRY_GQL_FIELDS} }
              generatedAt
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

      const result = response.body.data.mercadoPublicoCsvFileHealth;

      expect(result).toBeDefined();
      expect(Array.isArray(result.files)).toBe(true);
      expect(result.generatedAt).toBeTruthy();

      for (const file of result.files) {
        expect(file).toHaveProperty('sourceDataset');
        expect(file).toHaveProperty('sourceFileName');
        expect(file).toHaveProperty('fileChecksum');
        expect(file).toHaveProperty('parseStatus');
        expect(typeof file.rowCount).toBe('number');
        expect(typeof file.parseErrorCount).toBe('number');
        expect(typeof file.parseSuccessCount).toBe('number');
      }
    });

    it('should tolerate null freshness', async () => {
      const queryData = {
        query: `
          query {
            mercadoPublicoCsvFileHealth {
              files { sourceDataset freshness }
              generatedAt
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

      const result = response.body.data.mercadoPublicoCsvFileHealth;

      for (const file of result.files) {
        const value = file.freshness;

        expect(
          value === null ||
            value === undefined ||
            value === 'no_configurado',
        ).toBeTruthy();
      }
    });
  });
});
