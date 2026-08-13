import { gql } from '@apollo/client';

export const GET_MERCADO_PUBLICO_DETECTED_PROCESSES = gql`
  query GetMercadoPublicoDetectedProcesses(
    $processTypes: [MercadoPublicoDetectedProcessType!]
    $states: [String!]
    $buyerCode: String
    $publishedFrom: DateTime
    $publishedTo: DateTime
    $changedSince: DateTime
    $sort: MercadoPublicoDetectedProcessSortInput
    $page: Int
    $limit: Int
  ) {
    mercadoPublicoDetectedProcesses(
      processTypes: $processTypes
      states: $states
      buyerCode: $buyerCode
      publishedFrom: $publishedFrom
      publishedTo: $publishedTo
      changedSince: $changedSince
      sort: $sort
      page: $page
      limit: $limit
    ) {
      items {
        ...MercadoPublicoDetectedProcessFields
      }
      total
      page
      limit
    }
  }
`;
