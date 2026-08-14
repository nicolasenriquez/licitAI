import { gql } from '@apollo/client';

export const GET_MERCADO_PUBLICO_API_CALL_LOG = gql`
  query GetMercadoPublicoApiCallLog(
    $source: String
    $endpoint: String
    $httpStatus: Int
    $limit: Int
    $offset: Int
  ) {
    mercadoPublicoApiCallLog(
      source: $source
      endpoint: $endpoint
      httpStatus: $httpStatus
      limit: $limit
      offset: $offset
    ) {
      items {
        ...MercadoPublicoApiCallLogFields
      }
      hasMore
    }
  }
`;
