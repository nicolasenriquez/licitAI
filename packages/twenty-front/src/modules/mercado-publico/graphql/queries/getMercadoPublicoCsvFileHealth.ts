import { gql } from '@apollo/client';

export const GET_MERCADO_PUBLICO_CSV_FILE_HEALTH = gql`
  query GetMercadoPublicoCsvFileHealth {
    mercadoPublicoCsvFileHealth {
      ...MercadoPublicoCsvFileHealthFields
    }
  }
`;
