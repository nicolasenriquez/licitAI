import { gql } from '@apollo/client';

export const GET_MERCADO_PUBLICO_DETECTED_PROCESSES = gql`
  query GetMercadoPublicoDetectedProcesses(
    $processTypes: [MercadoPublicoDetectedProcessType!]
    $states: [String!]
    $buyerCode: String
    $publishedFrom: DateTime
    $publishedTo: DateTime
    $changedSince: DateTime
    $search: String
    $regionName: String
    $closingFrom: DateTime
    $closingTo: DateTime
    $hasDocuments: Boolean
    $callStages: [MercadoPublicoCompraAgilCallStage!]
    $amountMin: Float
    $amountMax: Float
    $buyerRut: String
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
      search: $search
      regionName: $regionName
      closingFrom: $closingFrom
      closingTo: $closingTo
      hasDocuments: $hasDocuments
      callStages: $callStages
      amountMin: $amountMin
      amountMax: $amountMax
      buyerRut: $buyerRut
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
