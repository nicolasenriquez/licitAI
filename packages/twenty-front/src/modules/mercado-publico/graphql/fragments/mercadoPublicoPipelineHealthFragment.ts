import { gql } from '@apollo/client';

export const MERCADO_PUBLICO_PIPELINE_HEALTH_FRAGMENT = gql`
  fragment MercadoPublicoPipelineHealthFields on MercadoPublicoPipelineHealth {
    jobs {
      jobName
      latestStatus
      lastSuccessAt
      lastFailureAt
      lagSinceLastSuccessMs
      failureCount
      freshness
      expectedCadenceMs
    }
    generatedAt
  }
`;
