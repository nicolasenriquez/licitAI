import { gql } from '@apollo/client';

export const MERCADO_PUBLICO_API_QUOTA_USAGE_FRAGMENT = gql`
  fragment MercadoPublicoApiQuotaUsageFields on MercadoPublicoApiQuotaUsage {
    sources {
      source
      dailyLimit
      used
      remaining
      resetAt
      last429At
    }
    generatedAt
  }
`;
