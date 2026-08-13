import { MercadoPublicoQueryResolver } from 'src/engine/core-modules/mercado-publico/mercado-publico-query.resolver';

const legacyReadQueryNames = [
  'mercadoPublicoDetectedProcesses',
  'mercadoPublicoProcessDetail',
  'mercadoPublicoJobRuns',
  'mercadoPublicoApiCallLog',
  'mercadoPublicoPipelineHealth',
  'mercadoPublicoApiQuotaUsage',
  'mercadoPublicoCsvFileHealth',
];

describe('Mercado Publico retained legacy query contract', () => {
  it('exposes exactly the seven retained read queries and no mutation', () => {
    const resolverMethods = Object.getOwnPropertyNames(
      MercadoPublicoQueryResolver.prototype,
    ).filter((methodName) => methodName !== 'constructor');

    expect(resolverMethods).toEqual(legacyReadQueryNames);
    expect(resolverMethods).not.toContain('mercadoPublicoMutation');
  });
});
