import { gql } from '@apollo/client';

gql`
  query MercadoPublicoV2ActiveOpportunities(
    $filter: MercadoPublicoV2OpportunityFilterInput
    $after: String
    $sort: MercadoPublicoV2OpportunitySort
  ) {
    mercadoPublicoV2 {
      opportunities(first: 100, filter: $filter, after: $after, sort: $sort) {
        edges {
          cursor
          node {
            codigo
            title
            state
            buyerName
            region
            publishedAt
            closingAt
            amount
            currency
            documentCount
            llamado
            availability
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
        totalCount
      }
    }
  }

  query MercadoPublicoV2Analytics(
    $filter: MercadoPublicoV2OpportunityFilterInput
  ) {
    mercadoPublicoV2 {
      analytics(filter: $filter) {
        population
        asOf
        freshness
        availability
      }
    }
  }

  query MercadoPublicoV2Buyers(
    $filter: MercadoPublicoV2OpportunityFilterInput
    $after: String
    $first: Int
  ) {
    mercadoPublicoV2 {
      buyers(filter: $filter, after: $after, first: $first) {
        edges {
          cursor
          node {
            buyerCode
            buyerName
            opportunityCount
            buyerCoverage
            amountCoverage
            availability
            completeness
            asOf
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }

  query MercadoPublicoV2History($codigo: String!, $after: String, $first: Int) {
    mercadoPublicoV2 {
      history(codigo: $codigo, after: $after, first: $first) {
        edges {
          cursor
          node {
            id
            codigo
            changedFields
            previousObservationId
            newObservationId
            providerChangedAt
            observedAt
            normalizerVersion
            providerSchemaFingerprint
            source
            endpoint
            snapshotKind
            createdAt
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }

  query MercadoPublicoV2SyncControlLatestRun {
    mercadoPublicoV2SyncControl {
      latestRun {
        safeStatus
        safeSummary
        canResume
        recordsDiscovered
        recordsHydrated
        recordsFailed
        recordsDeferred
        recordsProjected
        discoveryComplete
        completionReason
        startedAt
        updatedAt
        timeline {
          eventType
          at
          operatorName
        }
      }
    }
  }

  query MercadoPublicoV2SyncControlNavigationProbe {
    mercadoPublicoV2SyncControl {
      latestRun {
        safeStatus
      }
    }
  }

  mutation MercadoPublicoV2StartSync($input: MercadoPublicoV2StartSyncInput!) {
    mercadoPublicoV2SyncControl {
      start(input: $input) {
        state
      }
    }
  }

  mutation MercadoPublicoV2CancelSync(
    $input: MercadoPublicoV2CancelSyncInput!
  ) {
    mercadoPublicoV2SyncControl {
      cancel(input: $input) {
        state
      }
    }
  }

  mutation MercadoPublicoV2ResumeSync(
    $input: MercadoPublicoV2ResumeSyncInput!
  ) {
    mercadoPublicoV2SyncControl {
      resume(input: $input) {
        state
      }
    }
  }
`;
