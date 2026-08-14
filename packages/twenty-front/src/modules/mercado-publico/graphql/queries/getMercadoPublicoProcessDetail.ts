import { gql } from '@apollo/client';

export const GET_MERCADO_PUBLICO_PROCESS_DETAIL = gql`
  query GetMercadoPublicoProcessDetail(
    $processType: MercadoPublicoDetectedProcessType!
    $processCode: String!
  ) {
    mercadoPublicoProcessDetail(
      processType: $processType
      processCode: $processCode
    ) {
      ...MercadoPublicoProcessDetailFields
    }
  }
`;
