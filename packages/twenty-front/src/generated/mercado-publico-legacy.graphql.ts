import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  DateTime: { input: string; output: string; }
  JSON: { input: any; output: any; }
  UUID: { input: any; output: any; }
};

// Mercado Público generated additions
export type MercadoPublicoDetectedProcess = {
  __typename?: 'MercadoPublicoDetectedProcess';
  processType: MercadoPublicoDetectedProcessType;
  processCode: Scalars['String']['output'];
  title?: Maybe<Scalars['String']['output']>;
  canonicalState?: Maybe<Scalars['String']['output']>;
  rawStateCode?: Maybe<Scalars['String']['output']>;
  rawStateLabel?: Maybe<Scalars['String']['output']>;
  buyerCode?: Maybe<Scalars['String']['output']>;
  buyerName?: Maybe<Scalars['String']['output']>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  closingAt?: Maybe<Scalars['DateTime']['output']>;
  sourcePriority?: Maybe<Scalars['String']['output']>;
  reconciliationStatus?: Maybe<Scalars['String']['output']>;
  lastSeenAt: Scalars['DateTime']['output'];
};

export enum MercadoPublicoDetectedProcessType {
  licitacion = 'licitacion',
  orden_compra = 'orden_compra',
  compra_agil = 'compra_agil'
}

export type MercadoPublicoDetectedProcesses = {
  __typename?: 'MercadoPublicoDetectedProcesses';
  items: Array<MercadoPublicoDetectedProcess>;
  total: Scalars['Int']['output'];
  page: Scalars['Int']['output'];
  limit: Scalars['Int']['output'];
};

export type MercadoPublicoProcessDetailRawState = {
  __typename?: 'MercadoPublicoProcessDetailRawState';
  code?: Maybe<Scalars['String']['output']>;
  label?: Maybe<Scalars['String']['output']>;
};

export type MercadoPublicoProcessDetailBuyer = {
  __typename?: 'MercadoPublicoProcessDetailBuyer';
  code?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
};

export type MercadoPublicoProcessDetailDates = {
  __typename?: 'MercadoPublicoProcessDetailDates';
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  closingAt?: Maybe<Scalars['DateTime']['output']>;
};

export type MercadoPublicoProcessDetailItem = {
  __typename?: 'MercadoPublicoProcessDetailItem';
  code: Scalars['String']['output'];
  name?: Maybe<Scalars['String']['output']>;
  quantity?: Maybe<Scalars['String']['output']>;
  amount?: Maybe<Scalars['Float']['output']>;
};

export type MercadoPublicoProcessDetailAdjudication = {
  __typename?: 'MercadoPublicoProcessDetailAdjudication';
  supplierCode: Scalars['String']['output'];
  quantity?: Maybe<Scalars['String']['output']>;
  amount?: Maybe<Scalars['Float']['output']>;
};

export type MercadoPublicoProcessDetailRelatedOc = {
  __typename?: 'MercadoPublicoProcessDetailRelatedOC';
  code: Scalars['String']['output'];
  canonicalState?: Maybe<Scalars['String']['output']>;
  matchType: Scalars['String']['output'];
  matchConfidence: Scalars['String']['output'];
};

export type MercadoPublicoProcessDetailSourceLineageEntry = {
  __typename?: 'MercadoPublicoProcessDetailSourceLineageEntry';
  source: Scalars['String']['output'];
  rowCount: Scalars['Int']['output'];
  lastSeenAt?: Maybe<Scalars['DateTime']['output']>;
};

export type MercadoPublicoProcessDetailReconciliationSummary = {
  __typename?: 'MercadoPublicoProcessDetailReconciliationSummary';
  exact: Scalars['Int']['output'];
  candidate: Scalars['Int']['output'];
  unmatched: Scalars['Int']['output'];
  manualReviewRequired: Scalars['Int']['output'];
};

export type MercadoPublicoProcessDetail = {
  __typename?: 'MercadoPublicoProcessDetail';
  processType: MercadoPublicoDetectedProcessType;
  processCode: Scalars['String']['output'];
  title?: Maybe<Scalars['String']['output']>;
  canonicalState?: Maybe<Scalars['String']['output']>;
  rawState: MercadoPublicoProcessDetailRawState;
  buyer: MercadoPublicoProcessDetailBuyer;
  dates: MercadoPublicoProcessDetailDates;
  items: Array<MercadoPublicoProcessDetailItem>;
  adjudications?: Maybe<Array<MercadoPublicoProcessDetailAdjudication>>;
  relatedOcs: Array<MercadoPublicoProcessDetailRelatedOc>;
  sourceLineage: Array<MercadoPublicoProcessDetailSourceLineageEntry>;
  reconciliationSummary: MercadoPublicoProcessDetailReconciliationSummary;
  sourcePriority?: Maybe<Scalars['String']['output']>;
  lastSeenAt: Scalars['DateTime']['output'];
};

export type MercadoPublicoJobRun = {
  __typename?: 'MercadoPublicoJobRun';
  id: Scalars['String']['output'];
  jobName: Scalars['String']['output'];
  jobRunId: Scalars['String']['output'];
  status: MercadoPublicoJobRunStatus;
  startedAt: Scalars['DateTime']['output'];
  finishedAt?: Maybe<Scalars['DateTime']['output']>;
  recordsFetched?: Maybe<Scalars['Int']['output']>;
  recordsStaged?: Maybe<Scalars['Int']['output']>;
  recordsCanonicalized?: Maybe<Scalars['Int']['output']>;
  recordsFailed?: Maybe<Scalars['Int']['output']>;
  errorSummary?: Maybe<Scalars['String']['output']>;
  rawCsvFileId?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
};

export enum MercadoPublicoJobRunStatus {
  success = 'success',
  failed = 'failed',
  soft_miss = 'soft_miss',
  param_error = 'param_error',
  retryable_failed = 'retryable_failed',
  skipped = 'skipped'
}

export type MercadoPublicoJobRuns = {
  __typename?: 'MercadoPublicoJobRuns';
  items: Array<MercadoPublicoJobRun>;
  hasMore: Scalars['Boolean']['output'];
};

export type MercadoPublicoApiCallLog = {
  __typename?: 'MercadoPublicoApiCallLog';
  id: Scalars['String']['output'];
  source: Scalars['String']['output'];
  endpoint: Scalars['String']['output'];
  requestParams?: Maybe<Scalars['JSON']['output']>;
  httpStatus: Scalars['Int']['output'];
  fetchedAt: Scalars['DateTime']['output'];
  recordsFetched?: Maybe<Scalars['Int']['output']>;
  errorSummary?: Maybe<Scalars['String']['output']>;
  ingestionJobId?: Maybe<Scalars['String']['output']>;
};

export type MercadoPublicoApiCallLogs = {
  __typename?: 'MercadoPublicoApiCallLogs';
  items: Array<MercadoPublicoApiCallLog>;
  hasMore: Scalars['Boolean']['output'];
};

export type MercadoPublicoPipelineHealthJob = {
  __typename?: 'MercadoPublicoPipelineHealthJob';
  jobName: Scalars['String']['output'];
  latestStatus?: Maybe<Scalars['String']['output']>;
  lastSuccessAt?: Maybe<Scalars['DateTime']['output']>;
  lastFailureAt?: Maybe<Scalars['DateTime']['output']>;
  lagSinceLastSuccessMs?: Maybe<Scalars['Float']['output']>;
  failureCount: Scalars['Int']['output'];
  freshness?: Maybe<Scalars['String']['output']>;
  expectedCadenceMs?: Maybe<Scalars['Float']['output']>;
};

export type MercadoPublicoPipelineHealth = {
  __typename?: 'MercadoPublicoPipelineHealth';
  jobs: Array<MercadoPublicoPipelineHealthJob>;
  generatedAt: Scalars['DateTime']['output'];
};

export type MercadoPublicoApiQuotaUsageSource = {
  __typename?: 'MercadoPublicoApiQuotaUsageSource';
  source: Scalars['String']['output'];
  dailyLimit: Scalars['Int']['output'];
  used: Scalars['Int']['output'];
  remaining: Scalars['Int']['output'];
  resetAt?: Maybe<Scalars['DateTime']['output']>;
  last429At?: Maybe<Scalars['DateTime']['output']>;
};

export type MercadoPublicoApiQuotaUsage = {
  __typename?: 'MercadoPublicoApiQuotaUsage';
  sources: Array<MercadoPublicoApiQuotaUsageSource>;
  generatedAt: Scalars['DateTime']['output'];
};

export type MercadoPublicoCsvFileHealthEntry = {
  __typename?: 'MercadoPublicoCsvFileHealthEntry';
  sourceDataset: Scalars['String']['output'];
  sourceModality?: Maybe<Scalars['String']['output']>;
  sourcePeriod: Scalars['String']['output'];
  sourceFileName: Scalars['String']['output'];
  fileChecksum: Scalars['String']['output'];
  detectedEncoding?: Maybe<Scalars['String']['output']>;
  detectedDelimiter?: Maybe<Scalars['String']['output']>;
  schemaFingerprint?: Maybe<Scalars['String']['output']>;
  rowCount: Scalars['Int']['output'];
  parseStatus: Scalars['String']['output'];
  parseErrorCount: Scalars['Int']['output'];
  parseSuccessCount: Scalars['Int']['output'];
  lastLoadedAt?: Maybe<Scalars['DateTime']['output']>;
  freshness?: Maybe<Scalars['String']['output']>;
};

export type MercadoPublicoCsvFileHealth = {
  __typename?: 'MercadoPublicoCsvFileHealth';
  files: Array<MercadoPublicoCsvFileHealthEntry>;
  generatedAt: Scalars['DateTime']['output'];
};




export type QueryMercadoPublicoDetectedProcessesArgs = {
  processTypes?: InputMaybe<Array<MercadoPublicoDetectedProcessType>>;
  states?: InputMaybe<Array<Scalars['String']['input']>>;
  buyerCode?: InputMaybe<Scalars['String']['input']>;
  publishedFrom?: InputMaybe<Scalars['DateTime']['input']>;
  publishedTo?: InputMaybe<Scalars['DateTime']['input']>;
  changedSince?: InputMaybe<Scalars['DateTime']['input']>;
  sort?: InputMaybe<MercadoPublicoDetectedProcessSortInput>;
  page?: InputMaybe<Scalars['Int']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryMercadoPublicoProcessDetailArgs = {
  processType: MercadoPublicoDetectedProcessType;
  processCode: Scalars['String']['input'];
};


export type QueryMercadoPublicoJobRunsArgs = {
  statuses?: InputMaybe<Array<MercadoPublicoJobRunStatus>>;
  jobName?: InputMaybe<Scalars['String']['input']>;
  startedFrom?: InputMaybe<Scalars['DateTime']['input']>;
  startedTo?: InputMaybe<Scalars['DateTime']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryMercadoPublicoApiCallLogArgs = {
  source?: InputMaybe<Scalars['String']['input']>;
  endpoint?: InputMaybe<Scalars['String']['input']>;
  httpStatus?: InputMaybe<Scalars['Int']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
};

export type MercadoPublicoDetectedProcessSortInput = {
  key: MercadoPublicoDetectedProcessSortKey;
  direction: MercadoPublicoDetectedProcessSortDirection;
};

export enum MercadoPublicoDetectedProcessSortKey {
  lastSeenAt = 'lastSeenAt',
  publishedAt = 'publishedAt',
  closingAt = 'closingAt',
  processCode = 'processCode',
  canonicalState = 'canonicalState'
}

export enum MercadoPublicoDetectedProcessSortDirection {
  asc = 'asc',
  desc = 'desc'
}

export type MercadoPublicoApiCallLogFieldsFragment = { __typename?: 'MercadoPublicoApiCallLog', id: string, source: string, endpoint: string, requestParams?: any | null, httpStatus: number, fetchedAt: string, recordsFetched?: number | null, errorSummary?: string | null, ingestionJobId?: string | null };

export type MercadoPublicoApiQuotaUsageFieldsFragment = { __typename?: 'MercadoPublicoApiQuotaUsage', generatedAt: string, sources: Array<{ __typename?: 'MercadoPublicoApiQuotaUsageSource', source: string, dailyLimit: number, used: number, remaining: number, resetAt?: string | null, last429At?: string | null }> };

export type MercadoPublicoCsvFileHealthFieldsFragment = { __typename?: 'MercadoPublicoCsvFileHealth', generatedAt: string, files: Array<{ __typename?: 'MercadoPublicoCsvFileHealthEntry', sourceDataset: string, sourceModality?: string | null, sourcePeriod: string, sourceFileName: string, fileChecksum: string, detectedEncoding?: string | null, detectedDelimiter?: string | null, schemaFingerprint?: string | null, rowCount: number, parseStatus: string, parseErrorCount: number, parseSuccessCount: number, lastLoadedAt?: string | null, freshness?: string | null }> };

export type MercadoPublicoDetectedProcessFieldsFragment = { __typename?: 'MercadoPublicoDetectedProcess', processType: MercadoPublicoDetectedProcessType, processCode: string, title?: string | null, canonicalState?: string | null, rawStateCode?: string | null, rawStateLabel?: string | null, buyerCode?: string | null, buyerName?: string | null, publishedAt?: string | null, closingAt?: string | null, sourcePriority?: string | null, reconciliationStatus?: string | null, lastSeenAt: string };

export type MercadoPublicoJobRunFieldsFragment = { __typename?: 'MercadoPublicoJobRun', id: string, jobName: string, jobRunId: string, status: MercadoPublicoJobRunStatus, startedAt: string, finishedAt?: string | null, recordsFetched?: number | null, recordsStaged?: number | null, recordsCanonicalized?: number | null, recordsFailed?: number | null, errorSummary?: string | null, rawCsvFileId?: string | null, createdAt: string };

export type MercadoPublicoPipelineHealthFieldsFragment = { __typename?: 'MercadoPublicoPipelineHealth', generatedAt: string, jobs: Array<{ __typename?: 'MercadoPublicoPipelineHealthJob', jobName: string, latestStatus?: string | null, lastSuccessAt?: string | null, lastFailureAt?: string | null, lagSinceLastSuccessMs?: number | null, failureCount: number, freshness?: string | null, expectedCadenceMs?: number | null }> };

export type MercadoPublicoProcessDetailFieldsFragment = { __typename?: 'MercadoPublicoProcessDetail', processType: MercadoPublicoDetectedProcessType, processCode: string, title?: string | null, canonicalState?: string | null, sourcePriority?: string | null, lastSeenAt: string, rawState: { __typename?: 'MercadoPublicoProcessDetailRawState', code?: string | null, label?: string | null }, buyer: { __typename?: 'MercadoPublicoProcessDetailBuyer', code?: string | null, name?: string | null }, dates: { __typename?: 'MercadoPublicoProcessDetailDates', publishedAt?: string | null, closingAt?: string | null }, items: Array<{ __typename?: 'MercadoPublicoProcessDetailItem', code: string, name?: string | null, quantity?: string | null, amount?: number | null }>, adjudications?: Array<{ __typename?: 'MercadoPublicoProcessDetailAdjudication', supplierCode: string, quantity?: string | null, amount?: number | null }> | null, relatedOcs: Array<{ __typename?: 'MercadoPublicoProcessDetailRelatedOC', code: string, canonicalState?: string | null, matchType: string, matchConfidence: string }>, sourceLineage: Array<{ __typename?: 'MercadoPublicoProcessDetailSourceLineageEntry', source: string, rowCount: number, lastSeenAt?: string | null }>, reconciliationSummary: { __typename?: 'MercadoPublicoProcessDetailReconciliationSummary', exact: number, candidate: number, unmatched: number, manualReviewRequired: number } };

export type GetMercadoPublicoApiCallLogQueryVariables = Exact<{
  source?: InputMaybe<Scalars['String']['input']>;
  endpoint?: InputMaybe<Scalars['String']['input']>;
  httpStatus?: InputMaybe<Scalars['Int']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetMercadoPublicoApiCallLogQuery = { __typename?: 'Query', mercadoPublicoApiCallLog: { __typename?: 'MercadoPublicoApiCallLogs', hasMore: boolean, items: Array<{ __typename?: 'MercadoPublicoApiCallLog', id: string, source: string, endpoint: string, requestParams?: any | null, httpStatus: number, fetchedAt: string, recordsFetched?: number | null, errorSummary?: string | null, ingestionJobId?: string | null }> } };

export type GetMercadoPublicoApiQuotaUsageQueryVariables = Exact<{ [key: string]: never; }>;


export type GetMercadoPublicoApiQuotaUsageQuery = { __typename?: 'Query', mercadoPublicoApiQuotaUsage: { __typename?: 'MercadoPublicoApiQuotaUsage', generatedAt: string, sources: Array<{ __typename?: 'MercadoPublicoApiQuotaUsageSource', source: string, dailyLimit: number, used: number, remaining: number, resetAt?: string | null, last429At?: string | null }> } };

export type GetMercadoPublicoCsvFileHealthQueryVariables = Exact<{ [key: string]: never; }>;


export type GetMercadoPublicoCsvFileHealthQuery = { __typename?: 'Query', mercadoPublicoCsvFileHealth: { __typename?: 'MercadoPublicoCsvFileHealth', generatedAt: string, files: Array<{ __typename?: 'MercadoPublicoCsvFileHealthEntry', sourceDataset: string, sourceModality?: string | null, sourcePeriod: string, sourceFileName: string, fileChecksum: string, detectedEncoding?: string | null, detectedDelimiter?: string | null, schemaFingerprint?: string | null, rowCount: number, parseStatus: string, parseErrorCount: number, parseSuccessCount: number, lastLoadedAt?: string | null, freshness?: string | null }> } };

export type GetMercadoPublicoDetectedProcessesQueryVariables = Exact<{
  processTypes?: InputMaybe<Array<MercadoPublicoDetectedProcessType> | MercadoPublicoDetectedProcessType>;
  states?: InputMaybe<Array<Scalars['String']['input']> | Scalars['String']['input']>;
  buyerCode?: InputMaybe<Scalars['String']['input']>;
  publishedFrom?: InputMaybe<Scalars['DateTime']['input']>;
  publishedTo?: InputMaybe<Scalars['DateTime']['input']>;
  changedSince?: InputMaybe<Scalars['DateTime']['input']>;
  sort?: InputMaybe<MercadoPublicoDetectedProcessSortInput>;
  page?: InputMaybe<Scalars['Int']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetMercadoPublicoDetectedProcessesQuery = { __typename?: 'Query', mercadoPublicoDetectedProcesses: { __typename?: 'MercadoPublicoDetectedProcesses', total: number, page: number, limit: number, items: Array<{ __typename?: 'MercadoPublicoDetectedProcess', processType: MercadoPublicoDetectedProcessType, processCode: string, title?: string | null, canonicalState?: string | null, rawStateCode?: string | null, rawStateLabel?: string | null, buyerCode?: string | null, buyerName?: string | null, publishedAt?: string | null, closingAt?: string | null, sourcePriority?: string | null, reconciliationStatus?: string | null, lastSeenAt: string }> } };

export type GetMercadoPublicoJobRunsQueryVariables = Exact<{
  statuses?: InputMaybe<Array<MercadoPublicoJobRunStatus> | MercadoPublicoJobRunStatus>;
  jobName?: InputMaybe<Scalars['String']['input']>;
  startedFrom?: InputMaybe<Scalars['DateTime']['input']>;
  startedTo?: InputMaybe<Scalars['DateTime']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetMercadoPublicoJobRunsQuery = { __typename?: 'Query', mercadoPublicoJobRuns: { __typename?: 'MercadoPublicoJobRuns', hasMore: boolean, items: Array<{ __typename?: 'MercadoPublicoJobRun', id: string, jobName: string, jobRunId: string, status: MercadoPublicoJobRunStatus, startedAt: string, finishedAt?: string | null, recordsFetched?: number | null, recordsStaged?: number | null, recordsCanonicalized?: number | null, recordsFailed?: number | null, errorSummary?: string | null, rawCsvFileId?: string | null, createdAt: string }> } };

export type GetMercadoPublicoPipelineHealthQueryVariables = Exact<{ [key: string]: never; }>;


export type GetMercadoPublicoPipelineHealthQuery = { __typename?: 'Query', mercadoPublicoPipelineHealth: { __typename?: 'MercadoPublicoPipelineHealth', generatedAt: string, jobs: Array<{ __typename?: 'MercadoPublicoPipelineHealthJob', jobName: string, latestStatus?: string | null, lastSuccessAt?: string | null, lastFailureAt?: string | null, lagSinceLastSuccessMs?: number | null, failureCount: number, freshness?: string | null, expectedCadenceMs?: number | null }> } };

export type GetMercadoPublicoProcessDetailQueryVariables = Exact<{
  processType: MercadoPublicoDetectedProcessType;
  processCode: Scalars['String']['input'];
}>;


export type GetMercadoPublicoProcessDetailQuery = { __typename?: 'Query', mercadoPublicoProcessDetail?: { __typename?: 'MercadoPublicoProcessDetail', processType: MercadoPublicoDetectedProcessType, processCode: string, title?: string | null, canonicalState?: string | null, sourcePriority?: string | null, lastSeenAt: string, rawState: { __typename?: 'MercadoPublicoProcessDetailRawState', code?: string | null, label?: string | null }, buyer: { __typename?: 'MercadoPublicoProcessDetailBuyer', code?: string | null, name?: string | null }, dates: { __typename?: 'MercadoPublicoProcessDetailDates', publishedAt?: string | null, closingAt?: string | null }, items: Array<{ __typename?: 'MercadoPublicoProcessDetailItem', code: string, name?: string | null, quantity?: string | null, amount?: number | null }>, adjudications?: Array<{ __typename?: 'MercadoPublicoProcessDetailAdjudication', supplierCode: string, quantity?: string | null, amount?: number | null }> | null, relatedOcs: Array<{ __typename?: 'MercadoPublicoProcessDetailRelatedOC', code: string, canonicalState?: string | null, matchType: string, matchConfidence: string }>, sourceLineage: Array<{ __typename?: 'MercadoPublicoProcessDetailSourceLineageEntry', source: string, rowCount: number, lastSeenAt?: string | null }>, reconciliationSummary: { __typename?: 'MercadoPublicoProcessDetailReconciliationSummary', exact: number, candidate: number, unmatched: number, manualReviewRequired: number } } | null };

export const MercadoPublicoApiCallLogFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MercadoPublicoApiCallLogFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MercadoPublicoApiCallLog"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"endpoint"}},{"kind":"Field","name":{"kind":"Name","value":"requestParams"}},{"kind":"Field","name":{"kind":"Name","value":"httpStatus"}},{"kind":"Field","name":{"kind":"Name","value":"fetchedAt"}},{"kind":"Field","name":{"kind":"Name","value":"recordsFetched"}},{"kind":"Field","name":{"kind":"Name","value":"errorSummary"}},{"kind":"Field","name":{"kind":"Name","value":"ingestionJobId"}}]}}]} as unknown as DocumentNode<MercadoPublicoApiCallLogFieldsFragment, unknown>;
export const MercadoPublicoApiQuotaUsageFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MercadoPublicoApiQuotaUsageFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MercadoPublicoApiQuotaUsage"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"sources"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"dailyLimit"}},{"kind":"Field","name":{"kind":"Name","value":"used"}},{"kind":"Field","name":{"kind":"Name","value":"remaining"}},{"kind":"Field","name":{"kind":"Name","value":"resetAt"}},{"kind":"Field","name":{"kind":"Name","value":"last429At"}}]}},{"kind":"Field","name":{"kind":"Name","value":"generatedAt"}}]}}]} as unknown as DocumentNode<MercadoPublicoApiQuotaUsageFieldsFragment, unknown>;
export const MercadoPublicoCsvFileHealthFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MercadoPublicoCsvFileHealthFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MercadoPublicoCsvFileHealth"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"files"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"sourceDataset"}},{"kind":"Field","name":{"kind":"Name","value":"sourceModality"}},{"kind":"Field","name":{"kind":"Name","value":"sourcePeriod"}},{"kind":"Field","name":{"kind":"Name","value":"sourceFileName"}},{"kind":"Field","name":{"kind":"Name","value":"fileChecksum"}},{"kind":"Field","name":{"kind":"Name","value":"detectedEncoding"}},{"kind":"Field","name":{"kind":"Name","value":"detectedDelimiter"}},{"kind":"Field","name":{"kind":"Name","value":"schemaFingerprint"}},{"kind":"Field","name":{"kind":"Name","value":"rowCount"}},{"kind":"Field","name":{"kind":"Name","value":"parseStatus"}},{"kind":"Field","name":{"kind":"Name","value":"parseErrorCount"}},{"kind":"Field","name":{"kind":"Name","value":"parseSuccessCount"}},{"kind":"Field","name":{"kind":"Name","value":"lastLoadedAt"}},{"kind":"Field","name":{"kind":"Name","value":"freshness"}}]}},{"kind":"Field","name":{"kind":"Name","value":"generatedAt"}}]}}]} as unknown as DocumentNode<MercadoPublicoCsvFileHealthFieldsFragment, unknown>;
export const MercadoPublicoDetectedProcessFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MercadoPublicoDetectedProcessFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MercadoPublicoDetectedProcess"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"processType"}},{"kind":"Field","name":{"kind":"Name","value":"processCode"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"canonicalState"}},{"kind":"Field","name":{"kind":"Name","value":"rawStateCode"}},{"kind":"Field","name":{"kind":"Name","value":"rawStateLabel"}},{"kind":"Field","name":{"kind":"Name","value":"buyerCode"}},{"kind":"Field","name":{"kind":"Name","value":"buyerName"}},{"kind":"Field","name":{"kind":"Name","value":"publishedAt"}},{"kind":"Field","name":{"kind":"Name","value":"closingAt"}},{"kind":"Field","name":{"kind":"Name","value":"sourcePriority"}},{"kind":"Field","name":{"kind":"Name","value":"reconciliationStatus"}},{"kind":"Field","name":{"kind":"Name","value":"lastSeenAt"}}]}}]} as unknown as DocumentNode<MercadoPublicoDetectedProcessFieldsFragment, unknown>;
export const MercadoPublicoJobRunFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MercadoPublicoJobRunFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MercadoPublicoJobRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"jobName"}},{"kind":"Field","name":{"kind":"Name","value":"jobRunId"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"startedAt"}},{"kind":"Field","name":{"kind":"Name","value":"finishedAt"}},{"kind":"Field","name":{"kind":"Name","value":"recordsFetched"}},{"kind":"Field","name":{"kind":"Name","value":"recordsStaged"}},{"kind":"Field","name":{"kind":"Name","value":"recordsCanonicalized"}},{"kind":"Field","name":{"kind":"Name","value":"recordsFailed"}},{"kind":"Field","name":{"kind":"Name","value":"errorSummary"}},{"kind":"Field","name":{"kind":"Name","value":"rawCsvFileId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]} as unknown as DocumentNode<MercadoPublicoJobRunFieldsFragment, unknown>;
export const MercadoPublicoPipelineHealthFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MercadoPublicoPipelineHealthFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MercadoPublicoPipelineHealth"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"jobs"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"jobName"}},{"kind":"Field","name":{"kind":"Name","value":"latestStatus"}},{"kind":"Field","name":{"kind":"Name","value":"lastSuccessAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastFailureAt"}},{"kind":"Field","name":{"kind":"Name","value":"lagSinceLastSuccessMs"}},{"kind":"Field","name":{"kind":"Name","value":"failureCount"}},{"kind":"Field","name":{"kind":"Name","value":"freshness"}},{"kind":"Field","name":{"kind":"Name","value":"expectedCadenceMs"}}]}},{"kind":"Field","name":{"kind":"Name","value":"generatedAt"}}]}}]} as unknown as DocumentNode<MercadoPublicoPipelineHealthFieldsFragment, unknown>;
export const MercadoPublicoProcessDetailFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MercadoPublicoProcessDetailFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MercadoPublicoProcessDetail"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"processType"}},{"kind":"Field","name":{"kind":"Name","value":"processCode"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"canonicalState"}},{"kind":"Field","name":{"kind":"Name","value":"rawState"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"label"}}]}},{"kind":"Field","name":{"kind":"Name","value":"buyer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"dates"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"publishedAt"}},{"kind":"Field","name":{"kind":"Name","value":"closingAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"quantity"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}}]}},{"kind":"Field","name":{"kind":"Name","value":"adjudications"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"supplierCode"}},{"kind":"Field","name":{"kind":"Name","value":"quantity"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}}]}},{"kind":"Field","name":{"kind":"Name","value":"relatedOcs"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"canonicalState"}},{"kind":"Field","name":{"kind":"Name","value":"matchType"}},{"kind":"Field","name":{"kind":"Name","value":"matchConfidence"}}]}},{"kind":"Field","name":{"kind":"Name","value":"sourceLineage"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"rowCount"}},{"kind":"Field","name":{"kind":"Name","value":"lastSeenAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"reconciliationSummary"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"exact"}},{"kind":"Field","name":{"kind":"Name","value":"candidate"}},{"kind":"Field","name":{"kind":"Name","value":"unmatched"}},{"kind":"Field","name":{"kind":"Name","value":"manualReviewRequired"}}]}},{"kind":"Field","name":{"kind":"Name","value":"sourcePriority"}},{"kind":"Field","name":{"kind":"Name","value":"lastSeenAt"}}]}}]} as unknown as DocumentNode<MercadoPublicoProcessDetailFieldsFragment, unknown>;
export const GetMercadoPublicoApiCallLogDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetMercadoPublicoApiCallLog"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"source"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"endpoint"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"httpStatus"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"offset"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"mercadoPublicoApiCallLog"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"source"},"value":{"kind":"Variable","name":{"kind":"Name","value":"source"}}},{"kind":"Argument","name":{"kind":"Name","value":"endpoint"},"value":{"kind":"Variable","name":{"kind":"Name","value":"endpoint"}}},{"kind":"Argument","name":{"kind":"Name","value":"httpStatus"},"value":{"kind":"Variable","name":{"kind":"Name","value":"httpStatus"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"offset"},"value":{"kind":"Variable","name":{"kind":"Name","value":"offset"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MercadoPublicoApiCallLogFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"hasMore"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MercadoPublicoApiCallLogFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MercadoPublicoApiCallLog"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"endpoint"}},{"kind":"Field","name":{"kind":"Name","value":"requestParams"}},{"kind":"Field","name":{"kind":"Name","value":"httpStatus"}},{"kind":"Field","name":{"kind":"Name","value":"fetchedAt"}},{"kind":"Field","name":{"kind":"Name","value":"recordsFetched"}},{"kind":"Field","name":{"kind":"Name","value":"errorSummary"}},{"kind":"Field","name":{"kind":"Name","value":"ingestionJobId"}}]}}]} as unknown as DocumentNode<GetMercadoPublicoApiCallLogQuery, GetMercadoPublicoApiCallLogQueryVariables>;
export const GetMercadoPublicoApiQuotaUsageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetMercadoPublicoApiQuotaUsage"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"mercadoPublicoApiQuotaUsage"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MercadoPublicoApiQuotaUsageFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MercadoPublicoApiQuotaUsageFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MercadoPublicoApiQuotaUsage"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"sources"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"dailyLimit"}},{"kind":"Field","name":{"kind":"Name","value":"used"}},{"kind":"Field","name":{"kind":"Name","value":"remaining"}},{"kind":"Field","name":{"kind":"Name","value":"resetAt"}},{"kind":"Field","name":{"kind":"Name","value":"last429At"}}]}},{"kind":"Field","name":{"kind":"Name","value":"generatedAt"}}]}}]} as unknown as DocumentNode<GetMercadoPublicoApiQuotaUsageQuery, GetMercadoPublicoApiQuotaUsageQueryVariables>;
export const GetMercadoPublicoCsvFileHealthDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetMercadoPublicoCsvFileHealth"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"mercadoPublicoCsvFileHealth"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MercadoPublicoCsvFileHealthFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MercadoPublicoCsvFileHealthFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MercadoPublicoCsvFileHealth"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"files"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"sourceDataset"}},{"kind":"Field","name":{"kind":"Name","value":"sourceModality"}},{"kind":"Field","name":{"kind":"Name","value":"sourcePeriod"}},{"kind":"Field","name":{"kind":"Name","value":"sourceFileName"}},{"kind":"Field","name":{"kind":"Name","value":"fileChecksum"}},{"kind":"Field","name":{"kind":"Name","value":"detectedEncoding"}},{"kind":"Field","name":{"kind":"Name","value":"detectedDelimiter"}},{"kind":"Field","name":{"kind":"Name","value":"schemaFingerprint"}},{"kind":"Field","name":{"kind":"Name","value":"rowCount"}},{"kind":"Field","name":{"kind":"Name","value":"parseStatus"}},{"kind":"Field","name":{"kind":"Name","value":"parseErrorCount"}},{"kind":"Field","name":{"kind":"Name","value":"parseSuccessCount"}},{"kind":"Field","name":{"kind":"Name","value":"lastLoadedAt"}},{"kind":"Field","name":{"kind":"Name","value":"freshness"}}]}},{"kind":"Field","name":{"kind":"Name","value":"generatedAt"}}]}}]} as unknown as DocumentNode<GetMercadoPublicoCsvFileHealthQuery, GetMercadoPublicoCsvFileHealthQueryVariables>;
export const GetMercadoPublicoDetectedProcessesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetMercadoPublicoDetectedProcesses"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"processTypes"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"MercadoPublicoDetectedProcessType"}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"states"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"buyerCode"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"publishedFrom"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"DateTime"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"publishedTo"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"DateTime"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"changedSince"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"DateTime"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"sort"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"MercadoPublicoDetectedProcessSortInput"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"page"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"mercadoPublicoDetectedProcesses"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"processTypes"},"value":{"kind":"Variable","name":{"kind":"Name","value":"processTypes"}}},{"kind":"Argument","name":{"kind":"Name","value":"states"},"value":{"kind":"Variable","name":{"kind":"Name","value":"states"}}},{"kind":"Argument","name":{"kind":"Name","value":"buyerCode"},"value":{"kind":"Variable","name":{"kind":"Name","value":"buyerCode"}}},{"kind":"Argument","name":{"kind":"Name","value":"publishedFrom"},"value":{"kind":"Variable","name":{"kind":"Name","value":"publishedFrom"}}},{"kind":"Argument","name":{"kind":"Name","value":"publishedTo"},"value":{"kind":"Variable","name":{"kind":"Name","value":"publishedTo"}}},{"kind":"Argument","name":{"kind":"Name","value":"changedSince"},"value":{"kind":"Variable","name":{"kind":"Name","value":"changedSince"}}},{"kind":"Argument","name":{"kind":"Name","value":"sort"},"value":{"kind":"Variable","name":{"kind":"Name","value":"sort"}}},{"kind":"Argument","name":{"kind":"Name","value":"page"},"value":{"kind":"Variable","name":{"kind":"Name","value":"page"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MercadoPublicoDetectedProcessFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"total"}},{"kind":"Field","name":{"kind":"Name","value":"page"}},{"kind":"Field","name":{"kind":"Name","value":"limit"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MercadoPublicoDetectedProcessFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MercadoPublicoDetectedProcess"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"processType"}},{"kind":"Field","name":{"kind":"Name","value":"processCode"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"canonicalState"}},{"kind":"Field","name":{"kind":"Name","value":"rawStateCode"}},{"kind":"Field","name":{"kind":"Name","value":"rawStateLabel"}},{"kind":"Field","name":{"kind":"Name","value":"buyerCode"}},{"kind":"Field","name":{"kind":"Name","value":"buyerName"}},{"kind":"Field","name":{"kind":"Name","value":"publishedAt"}},{"kind":"Field","name":{"kind":"Name","value":"closingAt"}},{"kind":"Field","name":{"kind":"Name","value":"sourcePriority"}},{"kind":"Field","name":{"kind":"Name","value":"reconciliationStatus"}},{"kind":"Field","name":{"kind":"Name","value":"lastSeenAt"}}]}}]} as unknown as DocumentNode<GetMercadoPublicoDetectedProcessesQuery, GetMercadoPublicoDetectedProcessesQueryVariables>;
export const GetMercadoPublicoJobRunsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetMercadoPublicoJobRuns"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"statuses"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"MercadoPublicoJobRunStatus"}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"jobName"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"startedFrom"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"DateTime"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"startedTo"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"DateTime"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"offset"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"mercadoPublicoJobRuns"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"statuses"},"value":{"kind":"Variable","name":{"kind":"Name","value":"statuses"}}},{"kind":"Argument","name":{"kind":"Name","value":"jobName"},"value":{"kind":"Variable","name":{"kind":"Name","value":"jobName"}}},{"kind":"Argument","name":{"kind":"Name","value":"startedFrom"},"value":{"kind":"Variable","name":{"kind":"Name","value":"startedFrom"}}},{"kind":"Argument","name":{"kind":"Name","value":"startedTo"},"value":{"kind":"Variable","name":{"kind":"Name","value":"startedTo"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"offset"},"value":{"kind":"Variable","name":{"kind":"Name","value":"offset"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MercadoPublicoJobRunFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"hasMore"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MercadoPublicoJobRunFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MercadoPublicoJobRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"jobName"}},{"kind":"Field","name":{"kind":"Name","value":"jobRunId"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"startedAt"}},{"kind":"Field","name":{"kind":"Name","value":"finishedAt"}},{"kind":"Field","name":{"kind":"Name","value":"recordsFetched"}},{"kind":"Field","name":{"kind":"Name","value":"recordsStaged"}},{"kind":"Field","name":{"kind":"Name","value":"recordsCanonicalized"}},{"kind":"Field","name":{"kind":"Name","value":"recordsFailed"}},{"kind":"Field","name":{"kind":"Name","value":"errorSummary"}},{"kind":"Field","name":{"kind":"Name","value":"rawCsvFileId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]} as unknown as DocumentNode<GetMercadoPublicoJobRunsQuery, GetMercadoPublicoJobRunsQueryVariables>;
export const GetMercadoPublicoPipelineHealthDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetMercadoPublicoPipelineHealth"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"mercadoPublicoPipelineHealth"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MercadoPublicoPipelineHealthFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MercadoPublicoPipelineHealthFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MercadoPublicoPipelineHealth"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"jobs"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"jobName"}},{"kind":"Field","name":{"kind":"Name","value":"latestStatus"}},{"kind":"Field","name":{"kind":"Name","value":"lastSuccessAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastFailureAt"}},{"kind":"Field","name":{"kind":"Name","value":"lagSinceLastSuccessMs"}},{"kind":"Field","name":{"kind":"Name","value":"failureCount"}},{"kind":"Field","name":{"kind":"Name","value":"freshness"}},{"kind":"Field","name":{"kind":"Name","value":"expectedCadenceMs"}}]}},{"kind":"Field","name":{"kind":"Name","value":"generatedAt"}}]}}]} as unknown as DocumentNode<GetMercadoPublicoPipelineHealthQuery, GetMercadoPublicoPipelineHealthQueryVariables>;
export const GetMercadoPublicoProcessDetailDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetMercadoPublicoProcessDetail"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"processType"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"MercadoPublicoDetectedProcessType"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"processCode"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"mercadoPublicoProcessDetail"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"processType"},"value":{"kind":"Variable","name":{"kind":"Name","value":"processType"}}},{"kind":"Argument","name":{"kind":"Name","value":"processCode"},"value":{"kind":"Variable","name":{"kind":"Name","value":"processCode"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MercadoPublicoProcessDetailFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MercadoPublicoProcessDetailFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MercadoPublicoProcessDetail"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"processType"}},{"kind":"Field","name":{"kind":"Name","value":"processCode"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"canonicalState"}},{"kind":"Field","name":{"kind":"Name","value":"rawState"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"label"}}]}},{"kind":"Field","name":{"kind":"Name","value":"buyer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"dates"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"publishedAt"}},{"kind":"Field","name":{"kind":"Name","value":"closingAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"quantity"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}}]}},{"kind":"Field","name":{"kind":"Name","value":"adjudications"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"supplierCode"}},{"kind":"Field","name":{"kind":"Name","value":"quantity"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}}]}},{"kind":"Field","name":{"kind":"Name","value":"relatedOcs"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"canonicalState"}},{"kind":"Field","name":{"kind":"Name","value":"matchType"}},{"kind":"Field","name":{"kind":"Name","value":"matchConfidence"}}]}},{"kind":"Field","name":{"kind":"Name","value":"sourceLineage"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"rowCount"}},{"kind":"Field","name":{"kind":"Name","value":"lastSeenAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"reconciliationSummary"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"exact"}},{"kind":"Field","name":{"kind":"Name","value":"candidate"}},{"kind":"Field","name":{"kind":"Name","value":"unmatched"}},{"kind":"Field","name":{"kind":"Name","value":"manualReviewRequired"}}]}},{"kind":"Field","name":{"kind":"Name","value":"sourcePriority"}},{"kind":"Field","name":{"kind":"Name","value":"lastSeenAt"}}]}}]} as unknown as DocumentNode<GetMercadoPublicoProcessDetailQuery, GetMercadoPublicoProcessDetailQueryVariables>;