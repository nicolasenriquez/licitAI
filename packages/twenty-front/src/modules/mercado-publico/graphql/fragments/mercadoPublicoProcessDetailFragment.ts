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
      quantity
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
    sourcePriority
    lastSeenAt
  }
`;
