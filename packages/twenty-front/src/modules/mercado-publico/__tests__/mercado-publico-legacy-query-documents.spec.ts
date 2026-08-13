import {
  GetMercadoPublicoApiCallLogDocument,
  GetMercadoPublicoApiQuotaUsageDocument,
  GetMercadoPublicoCsvFileHealthDocument,
  GetMercadoPublicoDetectedProcessesDocument,
  GetMercadoPublicoJobRunsDocument,
  GetMercadoPublicoPipelineHealthDocument,
  GetMercadoPublicoProcessDetailDocument,
} from '~/generated/graphql';

const legacyReadDocuments = [
  GetMercadoPublicoDetectedProcessesDocument,
  GetMercadoPublicoProcessDetailDocument,
  GetMercadoPublicoJobRunsDocument,
  GetMercadoPublicoApiCallLogDocument,
  GetMercadoPublicoPipelineHealthDocument,
  GetMercadoPublicoApiQuotaUsageDocument,
  GetMercadoPublicoCsvFileHealthDocument,
];

const legacyReadOperationNames = [
  'GetMercadoPublicoDetectedProcesses',
  'GetMercadoPublicoProcessDetail',
  'GetMercadoPublicoJobRuns',
  'GetMercadoPublicoApiCallLog',
  'GetMercadoPublicoPipelineHealth',
  'GetMercadoPublicoApiQuotaUsage',
  'GetMercadoPublicoCsvFileHealth',
];

describe('Mercado Publico retained legacy generated documents', () => {
  it('generates exactly the seven retained read operations', () => {
    expect(
      legacyReadDocuments.map((document) => {
        const operation = document.definitions.find(
          (definition) => definition.kind === 'OperationDefinition',
        );

        return [operation?.operation, operation?.name?.value];
      }),
    ).toEqual(
      legacyReadOperationNames.map((operationName) => ['query', operationName]),
    );
  });
});
