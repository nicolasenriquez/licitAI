import { gql } from '@apollo/client';

export const MERCADO_PUBLICO_CSV_FILE_HEALTH_FRAGMENT = gql`
  fragment MercadoPublicoCsvFileHealthFields on MercadoPublicoCsvFileHealth {
    files {
      sourceDataset
      sourceModality
      sourcePeriod
      sourceFileName
      fileChecksum
      detectedEncoding
      detectedDelimiter
      schemaFingerprint
      rowCount
      parseStatus
      parseErrorCount
      parseSuccessCount
      lastLoadedAt
      freshness
    }
    generatedAt
  }
`;
