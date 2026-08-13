import { gql } from '@apollo/client';

export const GET_MERCADO_PUBLICO_PIPELINE_HEALTH = gql`
  query GetMercadoPublicoPipelineHealth {
    mercadoPublicoPipelineHealth {
      ...MercadoPublicoPipelineHealthFields
    }
  }
`;
