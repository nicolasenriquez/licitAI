import { gql } from '@apollo/client';

export const MERCADO_PUBLICO_PROCESS_DETAIL_FRAGMENT = gql`
  fragment MercadoPublicoProcessDetailFields on MercadoPublicoProcessDetail {
    processType
    processCode
    title
    canonicalState
    rawState {
      code
      label
    }
    buyer {
      code
      name
    }
    dates {
      publishedAt
      closingAt
    }
    items {
      code
      name
      description
      quantity
      unit
      amount
    }
    adjudications {
      supplierCode
      quantity
      amount
    }
    relatedOcs {
      code
      canonicalState
      matchType
      matchConfidence
    }
    sourceLineage {
      source
      rowCount
      lastSeenAt
    }
    reconciliationSummary {
      exact
      candidate
      unmatched
      manualReviewRequired
    }
    compraAgilSource {
      sourcePath
      state {
        id
        code
        label
      }
      additionalDates {
        lastChangedAt
        firstCallClosingAt
        secondCallClosingAt
      }
      amounts {
        currency
        available
        availableClp
      }
      reasons {
        deserted
        selection
        cancellation
      }
      offersReceived
      documents {
        id
        name
      }
      institution {
        rut
        regionName
        purchaseUnit
        buyerName
      }
      call {
        description
        state
      }
      need {
        description
      }
      delivery {
        address
        leadTimeDays
      }
      budget {
        type
        currency
        estimated
        available
        availableClp
        exchangeRate
        exchangeRateAt
      }
      suppliers {
        rut
        name
        isEsm
        quote {
          id
          companyCode
          branchCode
          active
          buyerState
          createdAt
          validUntil
          netAmount
          taxAmount
          shippingAmount
          totalAmount
          taxName
          taxRate
          description
          inadmissibilityReason
          products {
            code
            name
            description
            quantity
            unitPrice
            totalAmount
          }
        }
      }
      flags {
        environmental
        socialEconomic
      }
    }
    sourcePriority
    lastSeenAt
  }
`;
