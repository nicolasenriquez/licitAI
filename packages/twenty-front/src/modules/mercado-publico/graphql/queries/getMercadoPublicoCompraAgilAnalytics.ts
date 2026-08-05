import { gql } from '@apollo/client';

export const GET_MERCADO_PUBLICO_COMPRA_AGIL_ANALYTICS = gql`
  query GetMercadoPublicoCompraAgilAnalytics(
    $search: String
    $regionName: String
    $closingFrom: DateTime
    $closingTo: DateTime
    $hasDocuments: Boolean
    $callStages: [MercadoPublicoCompraAgilCallStage!]
    $amountMin: Float
    $amountMax: Float
    $buyerRut: String
  ) {
    mercadoPublicoCompraAgilAnalytics(
      search: $search
      regionName: $regionName
      closingFrom: $closingFrom
      closingTo: $closingTo
      hasDocuments: $hasDocuments
      callStages: $callStages
      amountMin: $amountMin
      amountMax: $amountMax
      buyerRut: $buyerRut
    ) {
      summary {
        totalFound
        closingNext24Hours
        knownAmountAvailableClp
        positiveDocumentCount
      }
      closingByDay {
        date
        count
      }
      regions {
        regionName
        count
      }
      topBuyers {
        buyerKey
        buyerName
        count
      }
      amountBands {
        band
        count
      }
      callStages {
        callStage
        count
      }
      documentAvailability {
        hasDocuments
        count
      }
      metadata {
        filteredPopulation
        calculatedAt
        timezone
        completePopulation
        coverage {
          closingAt
          regionName
          buyerIdentity
          amountAvailableClp
          callStage
          documentCount
          offersReceivedCount
        }
      }
    }
  }
`;
