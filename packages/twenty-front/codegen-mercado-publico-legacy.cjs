const serverBaseUrl =
  process.env.CODEGEN_SERVER_BASE_URL ??
  process.env.REACT_APP_SERVER_BASE_URL ??
  'http://localhost:3000';
const schemaUrl = `${serverBaseUrl}/graphql`;

module.exports = {
  schema: process.env.CODEGEN_TOKEN
    ? {
        [schemaUrl]: {
          headers: { Authorization: `Bearer ${process.env.CODEGEN_TOKEN}` },
        },
      }
    : schemaUrl,
  documents: ['./src/modules/mercado-publico/graphql/**/*.{ts,tsx}'],
  overwrite: true,
  generates: {
    './src/generated/mercado-publico-legacy.graphql.ts': {
      plugins: ['typescript', 'typescript-operations', 'typed-document-node'],
      config: {
        skipTypename: false,
        defaultScalarType: 'any',
        scalars: { DateTime: 'string' },
        namingConvention: { enumValues: 'keep' },
      },
    },
  },
};
