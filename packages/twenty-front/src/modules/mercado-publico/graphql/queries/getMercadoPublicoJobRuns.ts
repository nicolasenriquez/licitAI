import { gql } from '@apollo/client';

export const GET_MERCADO_PUBLICO_JOB_RUNS = gql`
  query GetMercadoPublicoJobRuns(
    $statuses: [MercadoPublicoJobRunStatus!]
    $jobName: String
    $startedFrom: DateTime
    $startedTo: DateTime
    $limit: Int
    $offset: Int
  ) {
    mercadoPublicoJobRuns(
      statuses: $statuses
      jobName: $jobName
      startedFrom: $startedFrom
      startedTo: $startedTo
      limit: $limit
      offset: $offset
    ) {
      items {
        ...MercadoPublicoJobRunFields
      }
      hasMore
    }
  }
`;
