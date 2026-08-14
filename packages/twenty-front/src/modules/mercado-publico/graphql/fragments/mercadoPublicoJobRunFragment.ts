import { gql } from '@apollo/client';

export const MERCADO_PUBLICO_JOB_RUN_FRAGMENT = gql`
  fragment MercadoPublicoJobRunFields on MercadoPublicoJobRun {
    id
    jobName
    jobRunId
    status
    startedAt
    finishedAt
    recordsFetched
    recordsStaged
    recordsCanonicalized
    recordsFailed
    errorSummary
    rawCsvFileId
    createdAt
  }
`;
