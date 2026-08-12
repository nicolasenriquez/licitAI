const serverBaseUrl =
  process.env.REACT_APP_SERVER_BASE_URL ?? 'http://localhost:3000';
const schemaUrl = `${serverBaseUrl}/admin-panel`;

module.exports = {
  schema: process.env.CODEGEN_TOKEN
    ? {
        [schemaUrl]: {
          headers: { Authorization: `Bearer ${process.env.CODEGEN_TOKEN}` },
        },
      }
    : schemaUrl,
  documents: [
    './src/modules/settings/admin-panel/**/graphql/**/*.{ts,tsx}',
    './src/modules/settings/application-registrations/graphql/fragments/*.{ts,tsx}',

    '!./src/**/*.test.{ts,tsx}',
    '!./src/**/*.stories.{ts,tsx}',
    '!./src/**/__mocks__/*.ts',
  ],
  overwrite: true,
  generates: {
    './src/generated-admin/graphql.ts': {
      plugins: ['typescript', 'typescript-operations', 'typed-document-node'],
      config: {
        skipTypename: false,
        defaultScalarType: 'any',
        scalars: {
          DateTime: 'string',
          UUID: 'string',
        },
        namingConvention: { enumValues: 'keep' },
      },
    },
  },
};
