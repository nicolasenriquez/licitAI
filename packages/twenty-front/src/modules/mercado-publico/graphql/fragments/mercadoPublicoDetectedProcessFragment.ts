import { gql } from '@apollo/client';

export const MERCADO_PUBLICO_DETECTED_PROCESS_FRAGMENT = gql`
  fragment MercadoPublicoDetectedProcessFields on MercadoPublicoDetectedProcess {
    processType
    processCode
    title
    canonicalState
    rawStateCode
    rawStateLabel
    buyerCode
    buyerName
    buyerRut
    purchaseUnitName
    regionName
    amountAvailableClp
    callStage
    documentCount
    offersReceivedCount
    publishedAt
    closingAt
    sourcePriority
    reconciliationStatus
    lastSeenAt
  }
`;
