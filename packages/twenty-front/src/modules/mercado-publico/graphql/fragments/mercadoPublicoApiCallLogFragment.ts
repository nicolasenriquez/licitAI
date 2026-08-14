import { gql } from '@apollo/client';

export const MERCADO_PUBLICO_API_CALL_LOG_FRAGMENT = gql`
  fragment MercadoPublicoApiCallLogFields on MercadoPublicoApiCallLog {
    id
    source
    endpoint
    requestParams
    httpStatus
    fetchedAt
    recordsFetched
    errorSummary
    ingestionJobId
  }
`;
