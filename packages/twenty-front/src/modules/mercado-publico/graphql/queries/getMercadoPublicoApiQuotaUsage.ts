import { gql } from '@apollo/client';

export const GET_MERCADO_PUBLICO_API_QUOTA_USAGE = gql`
  query GetMercadoPublicoApiQuotaUsage {
    mercadoPublicoApiQuotaUsage {
      ...MercadoPublicoApiQuotaUsageFields
    }
  }
`;
