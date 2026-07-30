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

export enum CalendarChannelVisibility {
  METADATA = 'METADATA',
  SHARE_EVERYTHING = 'SHARE_EVERYTHING'
}

export type ComputeStepOutputSchemaInput = {
  /** Step JSON format */
  step: Scalars['JSON']['input'];
  /** Workflow version ID */
  workflowVersionId?: InputMaybe<Scalars['UUID']['input']>;
};

export type ConnectedAccountHandleDto = {
  __typename?: 'ConnectedAccountHandleDTO';
  handle: Scalars['String']['output'];
  id: Scalars['UUID']['output'];
  provider: Scalars['String']['output'];
};

export type CreateDraftFromWorkflowVersionInput = {
  /** Workflow ID */
  workflowId: Scalars['UUID']['input'];
  /** Workflow version ID */
  workflowVersionIdToCopy: Scalars['UUID']['input'];
};

export type CreateWorkflowVersionEdgeInput = {
  /** Workflow version source step ID */
  source: Scalars['String']['input'];
  /** Workflow version source step connection options */
  sourceConnectionOptions?: InputMaybe<Scalars['JSON']['input']>;
  /** Workflow version target step ID */
  target: Scalars['String']['input'];
  /** Workflow version ID */
  workflowVersionId: Scalars['String']['input'];
};

export type CreateWorkflowVersionStepInput = {
  /** Default settings for the step */
  defaultSettings?: InputMaybe<Scalars['JSON']['input']>;
  /** Step ID */
  id?: InputMaybe<Scalars['String']['input']>;
  /** Next step ID */
  nextStepId?: InputMaybe<Scalars['UUID']['input']>;
  /** Parent step connection options */
  parentStepConnectionOptions?: InputMaybe<Scalars['JSON']['input']>;
  /** Parent step ID */
  parentStepId?: InputMaybe<Scalars['String']['input']>;
  /** Step position */
  position?: InputMaybe<WorkflowStepPositionInput>;
  /** New step type */
  stepType: Scalars['String']['input'];
  /** Workflow version ID */
  workflowVersionId: Scalars['UUID']['input'];
};

export type DateTimeFilter = {
  eq?: InputMaybe<Scalars['DateTime']['input']>;
  gt?: InputMaybe<Scalars['DateTime']['input']>;
  gte?: InputMaybe<Scalars['DateTime']['input']>;
  in?: InputMaybe<Array<Scalars['DateTime']['input']>>;
  is?: InputMaybe<FilterIs>;
  lt?: InputMaybe<Scalars['DateTime']['input']>;
  lte?: InputMaybe<Scalars['DateTime']['input']>;
  neq?: InputMaybe<Scalars['DateTime']['input']>;
};

export type DeleteWorkflowVersionStepInput = {
  /** Step to delete ID */
  stepId: Scalars['String']['input'];
  /** Workflow version ID */
  workflowVersionId: Scalars['UUID']['input'];
};

export type DuplicateWorkflowInput = {
  /** Workflow ID to duplicate */
  workflowIdToDuplicate: Scalars['UUID']['input'];
  /** Workflow version ID to copy */
  workflowVersionIdToCopy: Scalars['UUID']['input'];
};

export type DuplicateWorkflowVersionStepInput = {
  stepId: Scalars['String']['input'];
  workflowVersionId: Scalars['String']['input'];
};

export enum FilterIs {
  NotNull = 'NotNull',
  Null = 'Null'
}

export type LinkMetadata = {
  __typename?: 'LinkMetadata';
  label: Scalars['String']['output'];
  url: Scalars['String']['output'];
};

export type LinksMetadata = {
  __typename?: 'LinksMetadata';
  primaryLinkLabel: Scalars['String']['output'];
  primaryLinkUrl: Scalars['String']['output'];
  secondaryLinks?: Maybe<Array<LinkMetadata>>;
};

export type MercadoPublicoApiCallLog = {
  __typename?: 'MercadoPublicoApiCallLog';
  endpoint: Scalars['String']['output'];
  errorSummary?: Maybe<Scalars['String']['output']>;
  fetchedAt: Scalars['DateTime']['output'];
  httpStatus: Scalars['Int']['output'];
  id: Scalars['String']['output'];
  ingestionJobId?: Maybe<Scalars['String']['output']>;
  recordsFetched?: Maybe<Scalars['Int']['output']>;
  requestParams?: Maybe<Scalars['JSON']['output']>;
  source: Scalars['String']['output'];
};

export type MercadoPublicoApiCallLogs = {
  __typename?: 'MercadoPublicoApiCallLogs';
  hasMore: Scalars['Boolean']['output'];
  items: Array<MercadoPublicoApiCallLog>;
};

export type MercadoPublicoApiQuotaUsage = {
  __typename?: 'MercadoPublicoApiQuotaUsage';
  generatedAt: Scalars['DateTime']['output'];
  sources: Array<MercadoPublicoApiQuotaUsageSource>;
};

export type MercadoPublicoApiQuotaUsageSource = {
  __typename?: 'MercadoPublicoApiQuotaUsageSource';
  dailyLimit: Scalars['Int']['output'];
  last429At?: Maybe<Scalars['DateTime']['output']>;
  remaining: Scalars['Int']['output'];
  resetAt?: Maybe<Scalars['DateTime']['output']>;
  source: Scalars['String']['output'];
  used: Scalars['Int']['output'];
};

export type MercadoPublicoCompraAgilSourceAmounts = {
  __typename?: 'MercadoPublicoCompraAgilSourceAmounts';
  available?: Maybe<Scalars['Float']['output']>;
  availableClp?: Maybe<Scalars['Float']['output']>;
  currency?: Maybe<Scalars['String']['output']>;
};

export type MercadoPublicoCompraAgilSourceCall = {
  __typename?: 'MercadoPublicoCompraAgilSourceCall';
  description?: Maybe<Scalars['String']['output']>;
  state?: Maybe<Scalars['String']['output']>;
};

export type MercadoPublicoCompraAgilSourceDates = {
  __typename?: 'MercadoPublicoCompraAgilSourceDates';
  firstCallClosingAt?: Maybe<Scalars['String']['output']>;
  lastChangedAt?: Maybe<Scalars['String']['output']>;
  secondCallClosingAt?: Maybe<Scalars['String']['output']>;
};

export type MercadoPublicoCompraAgilSourceDetail = {
  __typename?: 'MercadoPublicoCompraAgilSourceDetail';
  additionalDates: MercadoPublicoCompraAgilSourceDates;
  amounts: MercadoPublicoCompraAgilSourceAmounts;
  call: MercadoPublicoCompraAgilSourceCall;
  documents: Array<MercadoPublicoCompraAgilSourceDocument>;
  institution: MercadoPublicoCompraAgilSourceInstitution;
  offersReceived?: Maybe<Scalars['Int']['output']>;
  reasons: MercadoPublicoCompraAgilSourceReasons;
  sourcePath?: Maybe<Scalars['String']['output']>;
  state: MercadoPublicoCompraAgilSourceState;
};

export type MercadoPublicoCompraAgilSourceDocument = {
  __typename?: 'MercadoPublicoCompraAgilSourceDocument';
  id: Scalars['String']['output'];
  name?: Maybe<Scalars['String']['output']>;
};

export type MercadoPublicoCompraAgilSourceInstitution = {
  __typename?: 'MercadoPublicoCompraAgilSourceInstitution';
  buyerName?: Maybe<Scalars['String']['output']>;
  purchaseUnit?: Maybe<Scalars['String']['output']>;
  regionName?: Maybe<Scalars['String']['output']>;
  rut?: Maybe<Scalars['String']['output']>;
};

export type MercadoPublicoCompraAgilSourceReasons = {
  __typename?: 'MercadoPublicoCompraAgilSourceReasons';
  cancellation?: Maybe<Scalars['String']['output']>;
  deserted?: Maybe<Scalars['String']['output']>;
  selection?: Maybe<Scalars['String']['output']>;
};

export type MercadoPublicoCompraAgilSourceState = {
  __typename?: 'MercadoPublicoCompraAgilSourceState';
  code?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  label?: Maybe<Scalars['String']['output']>;
};

export type MercadoPublicoCsvFileHealth = {
  __typename?: 'MercadoPublicoCsvFileHealth';
  files: Array<MercadoPublicoCsvFileHealthEntry>;
  generatedAt: Scalars['DateTime']['output'];
};

export type MercadoPublicoCsvFileHealthEntry = {
  __typename?: 'MercadoPublicoCsvFileHealthEntry';
  detectedDelimiter?: Maybe<Scalars['String']['output']>;
  detectedEncoding?: Maybe<Scalars['String']['output']>;
  fileChecksum: Scalars['String']['output'];
  freshness?: Maybe<Scalars['String']['output']>;
  lastLoadedAt?: Maybe<Scalars['DateTime']['output']>;
  parseErrorCount: Scalars['Int']['output'];
  parseStatus: Scalars['String']['output'];
  parseSuccessCount: Scalars['Int']['output'];
  rowCount: Scalars['Int']['output'];
  schemaFingerprint?: Maybe<Scalars['String']['output']>;
  sourceDataset: Scalars['String']['output'];
  sourceFileName: Scalars['String']['output'];
  sourceModality?: Maybe<Scalars['String']['output']>;
  sourcePeriod: Scalars['String']['output'];
};

export type MercadoPublicoDetectedProcess = {
  __typename?: 'MercadoPublicoDetectedProcess';
  buyerCode?: Maybe<Scalars['String']['output']>;
  buyerName?: Maybe<Scalars['String']['output']>;
  canonicalState?: Maybe<Scalars['String']['output']>;
  closingAt?: Maybe<Scalars['DateTime']['output']>;
  lastSeenAt: Scalars['DateTime']['output'];
  processCode: Scalars['String']['output'];
  processType: MercadoPublicoDetectedProcessType;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
  rawStateCode?: Maybe<Scalars['String']['output']>;
  rawStateLabel?: Maybe<Scalars['String']['output']>;
  reconciliationStatus?: Maybe<Scalars['String']['output']>;
  sourcePriority?: Maybe<Scalars['String']['output']>;
  title?: Maybe<Scalars['String']['output']>;
};

export enum MercadoPublicoDetectedProcessSortDirection {
  asc = 'asc',
  desc = 'desc'
}

export type MercadoPublicoDetectedProcessSortInput = {
  direction: MercadoPublicoDetectedProcessSortDirection;
  key: MercadoPublicoDetectedProcessSortKey;
};

export enum MercadoPublicoDetectedProcessSortKey {
  canonicalState = 'canonicalState',
  closingAt = 'closingAt',
  lastSeenAt = 'lastSeenAt',
  processCode = 'processCode',
  publishedAt = 'publishedAt'
}

export enum MercadoPublicoDetectedProcessType {
  compra_agil = 'compra_agil',
  licitacion = 'licitacion',
  orden_compra = 'orden_compra'
}

export type MercadoPublicoDetectedProcesses = {
  __typename?: 'MercadoPublicoDetectedProcesses';
  items: Array<MercadoPublicoDetectedProcess>;
  limit: Scalars['Int']['output'];
  page: Scalars['Int']['output'];
  total: Scalars['Int']['output'];
};

export type MercadoPublicoJobRun = {
  __typename?: 'MercadoPublicoJobRun';
  createdAt: Scalars['DateTime']['output'];
  errorSummary?: Maybe<Scalars['String']['output']>;
  finishedAt?: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['String']['output'];
  jobName: Scalars['String']['output'];
  jobRunId: Scalars['String']['output'];
  rawCsvFileId?: Maybe<Scalars['String']['output']>;
  recordsCanonicalized?: Maybe<Scalars['Int']['output']>;
  recordsFailed?: Maybe<Scalars['Int']['output']>;
  recordsFetched?: Maybe<Scalars['Int']['output']>;
  recordsStaged?: Maybe<Scalars['Int']['output']>;
  startedAt: Scalars['DateTime']['output'];
  status: MercadoPublicoJobRunStatus;
};

export enum MercadoPublicoJobRunStatus {
  failed = 'failed',
  param_error = 'param_error',
  partial = 'partial',
  retryable_failed = 'retryable_failed',
  skipped = 'skipped',
  soft_miss = 'soft_miss',
  success = 'success'
}

export type MercadoPublicoJobRuns = {
  __typename?: 'MercadoPublicoJobRuns';
  hasMore: Scalars['Boolean']['output'];
  items: Array<MercadoPublicoJobRun>;
};

export type MercadoPublicoPipelineHealth = {
  __typename?: 'MercadoPublicoPipelineHealth';
  generatedAt: Scalars['DateTime']['output'];
  jobs: Array<MercadoPublicoPipelineHealthJob>;
};

export type MercadoPublicoPipelineHealthJob = {
  __typename?: 'MercadoPublicoPipelineHealthJob';
  expectedCadenceMs?: Maybe<Scalars['Float']['output']>;
  failureCount: Scalars['Int']['output'];
  freshness?: Maybe<Scalars['String']['output']>;
  jobName: Scalars['String']['output'];
  lagSinceLastSuccessMs?: Maybe<Scalars['Float']['output']>;
  lastFailureAt?: Maybe<Scalars['DateTime']['output']>;
  lastSuccessAt?: Maybe<Scalars['DateTime']['output']>;
  latestStatus?: Maybe<Scalars['String']['output']>;
};

export type MercadoPublicoProcessDetail = {
  __typename?: 'MercadoPublicoProcessDetail';
  adjudications?: Maybe<Array<MercadoPublicoProcessDetailAdjudication>>;
  buyer: MercadoPublicoProcessDetailBuyer;
  canonicalState?: Maybe<Scalars['String']['output']>;
  compraAgilSource?: Maybe<MercadoPublicoCompraAgilSourceDetail>;
  dates: MercadoPublicoProcessDetailDates;
  items: Array<MercadoPublicoProcessDetailItem>;
  lastSeenAt: Scalars['DateTime']['output'];
  processCode: Scalars['String']['output'];
  processType: MercadoPublicoDetectedProcessType;
  rawState: MercadoPublicoProcessDetailRawState;
  reconciliationSummary: MercadoPublicoProcessDetailReconciliationSummary;
  relatedOcs: Array<MercadoPublicoProcessDetailRelatedOc>;
  sourceLineage: Array<MercadoPublicoProcessDetailSourceLineageEntry>;
  sourcePriority?: Maybe<Scalars['String']['output']>;
  title?: Maybe<Scalars['String']['output']>;
};

export type MercadoPublicoProcessDetailAdjudication = {
  __typename?: 'MercadoPublicoProcessDetailAdjudication';
  amount?: Maybe<Scalars['Float']['output']>;
  quantity?: Maybe<Scalars['String']['output']>;
  supplierCode: Scalars['String']['output'];
};

export type MercadoPublicoProcessDetailBuyer = {
  __typename?: 'MercadoPublicoProcessDetailBuyer';
  code?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
};

export type MercadoPublicoProcessDetailDates = {
  __typename?: 'MercadoPublicoProcessDetailDates';
  closingAt?: Maybe<Scalars['DateTime']['output']>;
  publishedAt?: Maybe<Scalars['DateTime']['output']>;
};

export type MercadoPublicoProcessDetailItem = {
  __typename?: 'MercadoPublicoProcessDetailItem';
  amount?: Maybe<Scalars['Float']['output']>;
  code: Scalars['String']['output'];
  name?: Maybe<Scalars['String']['output']>;
  quantity?: Maybe<Scalars['String']['output']>;
};

export type MercadoPublicoProcessDetailRawState = {
  __typename?: 'MercadoPublicoProcessDetailRawState';
  code?: Maybe<Scalars['String']['output']>;
  label?: Maybe<Scalars['String']['output']>;
};

export type MercadoPublicoProcessDetailReconciliationSummary = {
  __typename?: 'MercadoPublicoProcessDetailReconciliationSummary';
  candidate: Scalars['Int']['output'];
  exact: Scalars['Int']['output'];
  manualReviewRequired: Scalars['Int']['output'];
  unmatched: Scalars['Int']['output'];
};

export type MercadoPublicoProcessDetailRelatedOc = {
  __typename?: 'MercadoPublicoProcessDetailRelatedOC';
  canonicalState?: Maybe<Scalars['String']['output']>;
  code: Scalars['String']['output'];
  matchConfidence: Scalars['String']['output'];
  matchType: Scalars['String']['output'];
};

export type MercadoPublicoProcessDetailSourceLineageEntry = {
  __typename?: 'MercadoPublicoProcessDetailSourceLineageEntry';
  lastSeenAt?: Maybe<Scalars['DateTime']['output']>;
  rowCount: Scalars['Int']['output'];
  source: Scalars['String']['output'];
};

export enum MessageChannelVisibility {
  METADATA = 'METADATA',
  SHARE_EVERYTHING = 'SHARE_EVERYTHING',
  SUBJECT = 'SUBJECT'
}

export type Mutation = {
  __typename?: 'Mutation';
  activateWorkflowVersion: Scalars['Boolean']['output'];
  computeStepOutputSchema: Scalars['JSON']['output'];
  createDraftFromWorkflowVersion: WorkflowVersionDto;
  createWorkflowVersionEdge: WorkflowVersionStepChanges;
  createWorkflowVersionStep: WorkflowVersionStepChanges;
  deactivateWorkflowVersion: Scalars['Boolean']['output'];
  deleteWorkflowVersionEdge: WorkflowVersionStepChanges;
  deleteWorkflowVersionStep: WorkflowVersionStepChanges;
  dismissMaintenanceModeBanner: Scalars['Boolean']['output'];
  dismissReconnectAccountBanner: Scalars['Boolean']['output'];
  duplicateWorkflow: WorkflowVersionDto;
  duplicateWorkflowVersionStep: WorkflowVersionStepChanges;
  retryWorkflowRun: WorkflowRun;
  runWorkflowVersion: RunWorkflowVersion;
  stopWorkflowRun: WorkflowRun;
  submitFormStep: Scalars['Boolean']['output'];
  testHttpRequest: TestHttpRequest;
  updateWorkflowRunStep: WorkflowAction;
  updateWorkflowVersionPositions: Scalars['Boolean']['output'];
  updateWorkflowVersionStep: WorkflowAction;
};


export type MutationActivateWorkflowVersionArgs = {
  workflowVersionId: Scalars['UUID']['input'];
};


export type MutationComputeStepOutputSchemaArgs = {
  input: ComputeStepOutputSchemaInput;
};


export type MutationCreateDraftFromWorkflowVersionArgs = {
  input: CreateDraftFromWorkflowVersionInput;
};


export type MutationCreateWorkflowVersionEdgeArgs = {
  input: CreateWorkflowVersionEdgeInput;
};


export type MutationCreateWorkflowVersionStepArgs = {
  input: CreateWorkflowVersionStepInput;
};


export type MutationDeactivateWorkflowVersionArgs = {
  workflowVersionId: Scalars['UUID']['input'];
};


export type MutationDeleteWorkflowVersionEdgeArgs = {
  input: CreateWorkflowVersionEdgeInput;
};


export type MutationDeleteWorkflowVersionStepArgs = {
  input: DeleteWorkflowVersionStepInput;
};


export type MutationDismissReconnectAccountBannerArgs = {
  connectedAccountId: Scalars['UUID']['input'];
};


export type MutationDuplicateWorkflowArgs = {
  input: DuplicateWorkflowInput;
};


export type MutationDuplicateWorkflowVersionStepArgs = {
  input: DuplicateWorkflowVersionStepInput;
};


export type MutationRetryWorkflowRunArgs = {
  workflowRunId: Scalars['UUID']['input'];
};


export type MutationRunWorkflowVersionArgs = {
  input: RunWorkflowVersionInput;
};


export type MutationStopWorkflowRunArgs = {
  workflowRunId: Scalars['UUID']['input'];
};


export type MutationSubmitFormStepArgs = {
  input: SubmitFormStepInput;
};


export type MutationTestHttpRequestArgs = {
  input: TestHttpRequestInput;
};


export type MutationUpdateWorkflowRunStepArgs = {
  input: UpdateWorkflowRunStepInput;
};


export type MutationUpdateWorkflowVersionPositionsArgs = {
  input: UpdateWorkflowVersionPositionsInput;
};


export type MutationUpdateWorkflowVersionStepArgs = {
  input: UpdateWorkflowVersionStepInput;
};

export type ObjectRecordFilterInput = {
  and?: InputMaybe<Array<ObjectRecordFilterInput>>;
  createdAt?: InputMaybe<DateTimeFilter>;
  deletedAt?: InputMaybe<DateTimeFilter>;
  id?: InputMaybe<UuidFilter>;
  not?: InputMaybe<ObjectRecordFilterInput>;
  or?: InputMaybe<Array<ObjectRecordFilterInput>>;
  updatedAt?: InputMaybe<DateTimeFilter>;
};

export type Query = {
  __typename?: 'Query';
  /** @deprecated Use getTimelineCalendarEventsFromObjectRecord instead */
  getTimelineCalendarEventsFromCompanyId: TimelineCalendarEventsWithTotal;
  getTimelineCalendarEventsFromObjectRecord: TimelineCalendarEventsWithTotal;
  /** @deprecated Use getTimelineCalendarEventsFromObjectRecord instead */
  getTimelineCalendarEventsFromOpportunityId: TimelineCalendarEventsWithTotal;
  /** @deprecated Use getTimelineCalendarEventsFromObjectRecord instead */
  getTimelineCalendarEventsFromPersonId: TimelineCalendarEventsWithTotal;
  /** @deprecated Use getTimelineThreadsFromObjectRecord instead */
  getTimelineThreadsFromCompanyId: TimelineThreadsWithTotal;
  getTimelineThreadsFromObjectRecord: TimelineThreadsWithTotal;
  /** @deprecated Use getTimelineThreadsFromObjectRecord instead */
  getTimelineThreadsFromOpportunityId: TimelineThreadsWithTotal;
  /** @deprecated Use getTimelineThreadsFromObjectRecord instead */
  getTimelineThreadsFromPersonId: TimelineThreadsWithTotal;
  isMaintenanceModeBannerDismissed: Scalars['Boolean']['output'];
  mercadoPublicoApiCallLog: MercadoPublicoApiCallLogs;
  mercadoPublicoApiQuotaUsage: MercadoPublicoApiQuotaUsage;
  mercadoPublicoCsvFileHealth: MercadoPublicoCsvFileHealth;
  mercadoPublicoDetectedProcesses: MercadoPublicoDetectedProcesses;
  mercadoPublicoJobRuns: MercadoPublicoJobRuns;
  mercadoPublicoPipelineHealth: MercadoPublicoPipelineHealth;
  mercadoPublicoProcessDetail?: Maybe<MercadoPublicoProcessDetail>;
  search: SearchResultConnection;
  workflowStepConnectedAccountHandle?: Maybe<ConnectedAccountHandleDto>;
};


export type QueryGetTimelineCalendarEventsFromCompanyIdArgs = {
  companyId: Scalars['UUID']['input'];
  page: Scalars['Int']['input'];
  pageSize: Scalars['Int']['input'];
};


export type QueryGetTimelineCalendarEventsFromObjectRecordArgs = {
  objectNameSingular: Scalars['String']['input'];
  page: Scalars['Int']['input'];
  pageSize: Scalars['Int']['input'];
  recordId: Scalars['UUID']['input'];
};


export type QueryGetTimelineCalendarEventsFromOpportunityIdArgs = {
  opportunityId: Scalars['UUID']['input'];
  page: Scalars['Int']['input'];
  pageSize: Scalars['Int']['input'];
};


export type QueryGetTimelineCalendarEventsFromPersonIdArgs = {
  page: Scalars['Int']['input'];
  pageSize: Scalars['Int']['input'];
  personId: Scalars['UUID']['input'];
};


export type QueryGetTimelineThreadsFromCompanyIdArgs = {
  companyId: Scalars['UUID']['input'];
  page: Scalars['Int']['input'];
  pageSize: Scalars['Int']['input'];
};


export type QueryGetTimelineThreadsFromObjectRecordArgs = {
  objectNameSingular: Scalars['String']['input'];
  page: Scalars['Int']['input'];
  pageSize: Scalars['Int']['input'];
  recordId: Scalars['UUID']['input'];
};


export type QueryGetTimelineThreadsFromOpportunityIdArgs = {
  opportunityId: Scalars['UUID']['input'];
  page: Scalars['Int']['input'];
  pageSize: Scalars['Int']['input'];
};


export type QueryGetTimelineThreadsFromPersonIdArgs = {
  page: Scalars['Int']['input'];
  pageSize: Scalars['Int']['input'];
  personId: Scalars['UUID']['input'];
};


export type QueryMercadoPublicoApiCallLogArgs = {
  endpoint?: InputMaybe<Scalars['String']['input']>;
  httpStatus?: InputMaybe<Scalars['Int']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  source?: InputMaybe<Scalars['String']['input']>;
};


export type QueryMercadoPublicoDetectedProcessesArgs = {
  buyerCode?: InputMaybe<Scalars['String']['input']>;
  changedSince?: InputMaybe<Scalars['DateTime']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  processTypes?: InputMaybe<Array<MercadoPublicoDetectedProcessType>>;
  publishedFrom?: InputMaybe<Scalars['DateTime']['input']>;
  publishedTo?: InputMaybe<Scalars['DateTime']['input']>;
  sort?: InputMaybe<MercadoPublicoDetectedProcessSortInput>;
  states?: InputMaybe<Array<Scalars['String']['input']>>;
};


export type QueryMercadoPublicoJobRunsArgs = {
  jobName?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  startedFrom?: InputMaybe<Scalars['DateTime']['input']>;
  startedTo?: InputMaybe<Scalars['DateTime']['input']>;
  statuses?: InputMaybe<Array<MercadoPublicoJobRunStatus>>;
};


export type QueryMercadoPublicoProcessDetailArgs = {
  processCode: Scalars['String']['input'];
  processType: MercadoPublicoDetectedProcessType;
};


export type QuerySearchArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  excludedObjectNameSingulars?: InputMaybe<Array<Scalars['String']['input']>>;
  filter?: InputMaybe<ObjectRecordFilterInput>;
  includedObjectNameSingulars?: InputMaybe<Array<Scalars['String']['input']>>;
  limit: Scalars['Int']['input'];
  searchInput: Scalars['String']['input'];
};


export type QueryWorkflowStepConnectedAccountHandleArgs = {
  connectedAccountId: Scalars['UUID']['input'];
};

export type RunWorkflowVersion = {
  __typename?: 'RunWorkflowVersion';
  workflowRunId: Scalars['UUID']['output'];
};

export type RunWorkflowVersionInput = {
  /** Execution result in JSON format */
  payload?: InputMaybe<Scalars['JSON']['input']>;
  /** Workflow run ID */
  workflowRunId?: InputMaybe<Scalars['UUID']['input']>;
  /** Workflow version ID */
  workflowVersionId: Scalars['UUID']['input'];
};

export type SearchRecord = {
  __typename?: 'SearchRecord';
  imageUrl?: Maybe<Scalars['String']['output']>;
  label: Scalars['String']['output'];
  objectLabelSingular: Scalars['String']['output'];
  objectNameSingular: Scalars['String']['output'];
  recordId: Scalars['UUID']['output'];
  tsRank: Scalars['Float']['output'];
  tsRankCD: Scalars['Float']['output'];
};

export type SearchResultConnection = {
  __typename?: 'SearchResultConnection';
  edges: Array<SearchResultEdge>;
  pageInfo: SearchResultPageInfo;
};

export type SearchResultEdge = {
  __typename?: 'SearchResultEdge';
  cursor: Scalars['String']['output'];
  node: SearchRecord;
};

export type SearchResultPageInfo = {
  __typename?: 'SearchResultPageInfo';
  endCursor?: Maybe<Scalars['String']['output']>;
  hasNextPage: Scalars['Boolean']['output'];
};

export type SubmitFormStepInput = {
  /** Form response in JSON format */
  response: Scalars['JSON']['input'];
  /** Workflow step ID */
  stepId: Scalars['UUID']['input'];
  /** Workflow run ID */
  workflowRunId: Scalars['UUID']['input'];
};

export type TestHttpRequest = {
  __typename?: 'TestHttpRequest';
  /** Error information */
  error?: Maybe<Scalars['JSON']['output']>;
  /** Response headers */
  headers?: Maybe<Scalars['JSON']['output']>;
  /** Message describing the result */
  message: Scalars['String']['output'];
  /** Response data */
  result?: Maybe<Scalars['JSON']['output']>;
  /** HTTP status code */
  status?: Maybe<Scalars['Float']['output']>;
  /** HTTP status text */
  statusText?: Maybe<Scalars['String']['output']>;
  /** Whether the request was successful */
  success: Scalars['Boolean']['output'];
};

export type TestHttpRequestInput = {
  /** Request body */
  body?: InputMaybe<Scalars['JSON']['input']>;
  /** HTTP headers */
  headers?: InputMaybe<Scalars['JSON']['input']>;
  /** HTTP method */
  method: Scalars['String']['input'];
  /** URL to make the request to */
  url: Scalars['String']['input'];
};

export type TimelineCalendarEvent = {
  __typename?: 'TimelineCalendarEvent';
  conferenceLink: LinksMetadata;
  conferenceSolution: Scalars['String']['output'];
  description: Scalars['String']['output'];
  endsAt: Scalars['DateTime']['output'];
  id: Scalars['UUID']['output'];
  isCanceled: Scalars['Boolean']['output'];
  isFullDay: Scalars['Boolean']['output'];
  location: Scalars['String']['output'];
  participants: Array<TimelineCalendarEventParticipant>;
  startsAt: Scalars['DateTime']['output'];
  title: Scalars['String']['output'];
  visibility: CalendarChannelVisibility;
};

export type TimelineCalendarEventParticipant = {
  __typename?: 'TimelineCalendarEventParticipant';
  avatarUrl: Scalars['String']['output'];
  displayName: Scalars['String']['output'];
  firstName: Scalars['String']['output'];
  handle: Scalars['String']['output'];
  lastName: Scalars['String']['output'];
  personId?: Maybe<Scalars['UUID']['output']>;
  workspaceMemberId?: Maybe<Scalars['UUID']['output']>;
};

export type TimelineCalendarEventsWithTotal = {
  __typename?: 'TimelineCalendarEventsWithTotal';
  timelineCalendarEvents: Array<TimelineCalendarEvent>;
  totalNumberOfCalendarEvents: Scalars['Int']['output'];
};

export type TimelineThread = {
  __typename?: 'TimelineThread';
  firstParticipant: TimelineThreadParticipant;
  id: Scalars['UUID']['output'];
  lastMessageBody: Scalars['String']['output'];
  lastMessageReceivedAt: Scalars['DateTime']['output'];
  lastTwoParticipants: Array<TimelineThreadParticipant>;
  numberOfMessagesInThread: Scalars['Float']['output'];
  participantCount: Scalars['Float']['output'];
  read: Scalars['Boolean']['output'];
  subject: Scalars['String']['output'];
  visibility: MessageChannelVisibility;
};

export type TimelineThreadParticipant = {
  __typename?: 'TimelineThreadParticipant';
  avatarUrl: Scalars['String']['output'];
  displayName: Scalars['String']['output'];
  firstName: Scalars['String']['output'];
  handle: Scalars['String']['output'];
  lastName: Scalars['String']['output'];
  personId?: Maybe<Scalars['UUID']['output']>;
  workspaceMemberId?: Maybe<Scalars['UUID']['output']>;
};

export type TimelineThreadsWithTotal = {
  __typename?: 'TimelineThreadsWithTotal';
  timelineThreads: Array<TimelineThread>;
  totalNumberOfThreads: Scalars['Int']['output'];
};

export type UuidFilter = {
  eq?: InputMaybe<Scalars['UUID']['input']>;
  gt?: InputMaybe<Scalars['UUID']['input']>;
  gte?: InputMaybe<Scalars['UUID']['input']>;
  in?: InputMaybe<Array<Scalars['UUID']['input']>>;
  is?: InputMaybe<FilterIs>;
  lt?: InputMaybe<Scalars['UUID']['input']>;
  lte?: InputMaybe<Scalars['UUID']['input']>;
  neq?: InputMaybe<Scalars['UUID']['input']>;
};

export type UpdateWorkflowRunStepInput = {
  /** Step to update in JSON format */
  step: Scalars['JSON']['input'];
  /** Workflow run ID */
  workflowRunId: Scalars['UUID']['input'];
};

export type UpdateWorkflowVersionPositionsInput = {
  /** Workflow version updated positions */
  positions: Array<WorkflowStepPositionUpdateInput>;
  /** Workflow version ID */
  workflowVersionId: Scalars['UUID']['input'];
};

export type UpdateWorkflowVersionStepInput = {
  /** Step to update in JSON format */
  step: Scalars['JSON']['input'];
  /** Workflow version ID */
  workflowVersionId: Scalars['UUID']['input'];
};

export type WorkflowAction = {
  __typename?: 'WorkflowAction';
  id: Scalars['UUID']['output'];
  name: Scalars['String']['output'];
  nextStepIds?: Maybe<Array<Scalars['UUID']['output']>>;
  position?: Maybe<WorkflowStepPosition>;
  settings: Scalars['JSON']['output'];
  type: WorkflowActionType;
  valid: Scalars['Boolean']['output'];
};

export enum WorkflowActionType {
  AI_AGENT = 'AI_AGENT',
  CODE = 'CODE',
  CREATE_RECORD = 'CREATE_RECORD',
  DELAY = 'DELAY',
  DELETE_RECORD = 'DELETE_RECORD',
  DRAFT_EMAIL = 'DRAFT_EMAIL',
  EMPTY = 'EMPTY',
  FILTER = 'FILTER',
  FIND_RECORDS = 'FIND_RECORDS',
  FORM = 'FORM',
  HTTP_REQUEST = 'HTTP_REQUEST',
  IF_ELSE = 'IF_ELSE',
  ITERATOR = 'ITERATOR',
  LOGIC_FUNCTION = 'LOGIC_FUNCTION',
  SEND_EMAIL = 'SEND_EMAIL',
  UPDATE_RECORD = 'UPDATE_RECORD',
  UPSERT_RECORD = 'UPSERT_RECORD'
}

export type WorkflowRun = {
  __typename?: 'WorkflowRun';
  id: Scalars['UUID']['output'];
  status: WorkflowRunStatusEnum;
};

/** Status of the workflow run */
export enum WorkflowRunStatusEnum {
  COMPLETED = 'COMPLETED',
  ENQUEUED = 'ENQUEUED',
  FAILED = 'FAILED',
  NOT_STARTED = 'NOT_STARTED',
  RUNNING = 'RUNNING',
  STOPPED = 'STOPPED',
  STOPPING = 'STOPPING'
}

export type WorkflowStepPosition = {
  __typename?: 'WorkflowStepPosition';
  x: Scalars['Float']['output'];
  y: Scalars['Float']['output'];
};

export type WorkflowStepPositionInput = {
  x: Scalars['Float']['input'];
  y: Scalars['Float']['input'];
};

export type WorkflowStepPositionUpdateInput = {
  /** Step or trigger ID */
  id: Scalars['String']['input'];
  /** Position of the step or trigger */
  position: WorkflowStepPositionInput;
};

export type WorkflowVersionDto = {
  __typename?: 'WorkflowVersionDTO';
  createdAt: Scalars['String']['output'];
  id: Scalars['UUID']['output'];
  name: Scalars['String']['output'];
  status: Scalars['String']['output'];
  steps?: Maybe<Scalars['JSON']['output']>;
  trigger?: Maybe<Scalars['JSON']['output']>;
  updatedAt: Scalars['String']['output'];
  workflowId: Scalars['UUID']['output'];
};

export type WorkflowVersionStepChanges = {
  __typename?: 'WorkflowVersionStepChanges';
  stepsDiff?: Maybe<Scalars['JSON']['output']>;
  triggerDiff?: Maybe<Scalars['JSON']['output']>;
};

export type TimelineCalendarEventFragmentFragment = { __typename?: 'TimelineCalendarEvent', id: any, title: string, description: string, location: string, startsAt: string, endsAt: string, isFullDay: boolean, visibility: CalendarChannelVisibility, participants: Array<{ __typename?: 'TimelineCalendarEventParticipant', personId?: any | null, workspaceMemberId?: any | null, firstName: string, lastName: string, displayName: string, avatarUrl: string, handle: string }> };

export type TimelineCalendarEventParticipantFragmentFragment = { __typename?: 'TimelineCalendarEventParticipant', personId?: any | null, workspaceMemberId?: any | null, firstName: string, lastName: string, displayName: string, avatarUrl: string, handle: string };

export type TimelineCalendarEventsWithTotalFragmentFragment = { __typename?: 'TimelineCalendarEventsWithTotal', totalNumberOfCalendarEvents: number, timelineCalendarEvents: Array<{ __typename?: 'TimelineCalendarEvent', id: any, title: string, description: string, location: string, startsAt: string, endsAt: string, isFullDay: boolean, visibility: CalendarChannelVisibility, participants: Array<{ __typename?: 'TimelineCalendarEventParticipant', personId?: any | null, workspaceMemberId?: any | null, firstName: string, lastName: string, displayName: string, avatarUrl: string, handle: string }> }> };

export type GetTimelineCalendarEventsFromObjectRecordQueryVariables = Exact<{
  objectNameSingular: Scalars['String']['input'];
  recordId: Scalars['UUID']['input'];
  page: Scalars['Int']['input'];
  pageSize: Scalars['Int']['input'];
}>;


export type GetTimelineCalendarEventsFromObjectRecordQuery = { __typename?: 'Query', getTimelineCalendarEventsFromObjectRecord: { __typename?: 'TimelineCalendarEventsWithTotal', totalNumberOfCalendarEvents: number, timelineCalendarEvents: Array<{ __typename?: 'TimelineCalendarEvent', id: any, title: string, description: string, location: string, startsAt: string, endsAt: string, isFullDay: boolean, visibility: CalendarChannelVisibility, participants: Array<{ __typename?: 'TimelineCalendarEventParticipant', personId?: any | null, workspaceMemberId?: any | null, firstName: string, lastName: string, displayName: string, avatarUrl: string, handle: string }> }> } };

export type ParticipantFragmentFragment = { __typename?: 'TimelineThreadParticipant', personId?: any | null, workspaceMemberId?: any | null, firstName: string, lastName: string, displayName: string, avatarUrl: string, handle: string };

export type TimelineThreadFragmentFragment = { __typename?: 'TimelineThread', id: any, read: boolean, visibility: MessageChannelVisibility, lastMessageReceivedAt: string, lastMessageBody: string, subject: string, numberOfMessagesInThread: number, participantCount: number, firstParticipant: { __typename?: 'TimelineThreadParticipant', personId?: any | null, workspaceMemberId?: any | null, firstName: string, lastName: string, displayName: string, avatarUrl: string, handle: string }, lastTwoParticipants: Array<{ __typename?: 'TimelineThreadParticipant', personId?: any | null, workspaceMemberId?: any | null, firstName: string, lastName: string, displayName: string, avatarUrl: string, handle: string }> };

export type TimelineThreadsWithTotalFragmentFragment = { __typename?: 'TimelineThreadsWithTotal', totalNumberOfThreads: number, timelineThreads: Array<{ __typename?: 'TimelineThread', id: any, read: boolean, visibility: MessageChannelVisibility, lastMessageReceivedAt: string, lastMessageBody: string, subject: string, numberOfMessagesInThread: number, participantCount: number, firstParticipant: { __typename?: 'TimelineThreadParticipant', personId?: any | null, workspaceMemberId?: any | null, firstName: string, lastName: string, displayName: string, avatarUrl: string, handle: string }, lastTwoParticipants: Array<{ __typename?: 'TimelineThreadParticipant', personId?: any | null, workspaceMemberId?: any | null, firstName: string, lastName: string, displayName: string, avatarUrl: string, handle: string }> }> };

export type GetTimelineThreadsFromObjectRecordQueryVariables = Exact<{
  objectNameSingular: Scalars['String']['input'];
  recordId: Scalars['UUID']['input'];
  page: Scalars['Int']['input'];
  pageSize: Scalars['Int']['input'];
}>;


export type GetTimelineThreadsFromObjectRecordQuery = { __typename?: 'Query', getTimelineThreadsFromObjectRecord: { __typename?: 'TimelineThreadsWithTotal', totalNumberOfThreads: number, timelineThreads: Array<{ __typename?: 'TimelineThread', id: any, read: boolean, visibility: MessageChannelVisibility, lastMessageReceivedAt: string, lastMessageBody: string, subject: string, numberOfMessagesInThread: number, participantCount: number, firstParticipant: { __typename?: 'TimelineThreadParticipant', personId?: any | null, workspaceMemberId?: any | null, firstName: string, lastName: string, displayName: string, avatarUrl: string, handle: string }, lastTwoParticipants: Array<{ __typename?: 'TimelineThreadParticipant', personId?: any | null, workspaceMemberId?: any | null, firstName: string, lastName: string, displayName: string, avatarUrl: string, handle: string }> }> } };

export type SearchQueryVariables = Exact<{
  searchInput: Scalars['String']['input'];
  limit: Scalars['Int']['input'];
  after?: InputMaybe<Scalars['String']['input']>;
  excludedObjectNameSingulars?: InputMaybe<Array<Scalars['String']['input']> | Scalars['String']['input']>;
  includedObjectNameSingulars?: InputMaybe<Array<Scalars['String']['input']> | Scalars['String']['input']>;
  filter?: InputMaybe<ObjectRecordFilterInput>;
}>;


export type SearchQuery = { __typename?: 'Query', search: { __typename?: 'SearchResultConnection', edges: Array<{ __typename?: 'SearchResultEdge', cursor: string, node: { __typename?: 'SearchRecord', recordId: any, objectNameSingular: string, objectLabelSingular: string, label: string, imageUrl?: string | null, tsRankCD: number, tsRank: number } }>, pageInfo: { __typename?: 'SearchResultPageInfo', hasNextPage: boolean, endCursor?: string | null } } };

export type MercadoPublicoApiCallLogFieldsFragment = { __typename?: 'MercadoPublicoApiCallLog', id: string, source: string, endpoint: string, requestParams?: any | null, httpStatus: number, fetchedAt: string, recordsFetched?: number | null, errorSummary?: string | null, ingestionJobId?: string | null };

export type MercadoPublicoApiQuotaUsageFieldsFragment = { __typename?: 'MercadoPublicoApiQuotaUsage', generatedAt: string, sources: Array<{ __typename?: 'MercadoPublicoApiQuotaUsageSource', source: string, dailyLimit: number, used: number, remaining: number, resetAt?: string | null, last429At?: string | null }> };

export type MercadoPublicoCsvFileHealthFieldsFragment = { __typename?: 'MercadoPublicoCsvFileHealth', generatedAt: string, files: Array<{ __typename?: 'MercadoPublicoCsvFileHealthEntry', sourceDataset: string, sourceModality?: string | null, sourcePeriod: string, sourceFileName: string, fileChecksum: string, detectedEncoding?: string | null, detectedDelimiter?: string | null, schemaFingerprint?: string | null, rowCount: number, parseStatus: string, parseErrorCount: number, parseSuccessCount: number, lastLoadedAt?: string | null, freshness?: string | null }> };

export type MercadoPublicoDetectedProcessFieldsFragment = { __typename?: 'MercadoPublicoDetectedProcess', processType: MercadoPublicoDetectedProcessType, processCode: string, title?: string | null, canonicalState?: string | null, rawStateCode?: string | null, rawStateLabel?: string | null, buyerCode?: string | null, buyerName?: string | null, publishedAt?: string | null, closingAt?: string | null, sourcePriority?: string | null, reconciliationStatus?: string | null, lastSeenAt: string };

export type MercadoPublicoJobRunFieldsFragment = { __typename?: 'MercadoPublicoJobRun', id: string, jobName: string, jobRunId: string, status: MercadoPublicoJobRunStatus, startedAt: string, finishedAt?: string | null, recordsFetched?: number | null, recordsStaged?: number | null, recordsCanonicalized?: number | null, recordsFailed?: number | null, errorSummary?: string | null, rawCsvFileId?: string | null, createdAt: string };

export type MercadoPublicoPipelineHealthFieldsFragment = { __typename?: 'MercadoPublicoPipelineHealth', generatedAt: string, jobs: Array<{ __typename?: 'MercadoPublicoPipelineHealthJob', jobName: string, latestStatus?: string | null, lastSuccessAt?: string | null, lastFailureAt?: string | null, lagSinceLastSuccessMs?: number | null, failureCount: number, freshness?: string | null, expectedCadenceMs?: number | null }> };

export type MercadoPublicoProcessDetailFieldsFragment = { __typename?: 'MercadoPublicoProcessDetail', processType: MercadoPublicoDetectedProcessType, processCode: string, title?: string | null, canonicalState?: string | null, sourcePriority?: string | null, lastSeenAt: string, rawState: { __typename?: 'MercadoPublicoProcessDetailRawState', code?: string | null, label?: string | null }, buyer: { __typename?: 'MercadoPublicoProcessDetailBuyer', code?: string | null, name?: string | null }, dates: { __typename?: 'MercadoPublicoProcessDetailDates', publishedAt?: string | null, closingAt?: string | null }, items: Array<{ __typename?: 'MercadoPublicoProcessDetailItem', code: string, name?: string | null, quantity?: string | null, amount?: number | null }>, adjudications?: Array<{ __typename?: 'MercadoPublicoProcessDetailAdjudication', supplierCode: string, quantity?: string | null, amount?: number | null }> | null, relatedOcs: Array<{ __typename?: 'MercadoPublicoProcessDetailRelatedOC', code: string, canonicalState?: string | null, matchType: string, matchConfidence: string }>, sourceLineage: Array<{ __typename?: 'MercadoPublicoProcessDetailSourceLineageEntry', source: string, rowCount: number, lastSeenAt?: string | null }>, reconciliationSummary: { __typename?: 'MercadoPublicoProcessDetailReconciliationSummary', exact: number, candidate: number, unmatched: number, manualReviewRequired: number }, compraAgilSource?: { __typename?: 'MercadoPublicoCompraAgilSourceDetail', sourcePath?: string | null, offersReceived?: number | null, state: { __typename?: 'MercadoPublicoCompraAgilSourceState', id?: string | null, code?: string | null, label?: string | null }, additionalDates: { __typename?: 'MercadoPublicoCompraAgilSourceDates', lastChangedAt?: string | null, firstCallClosingAt?: string | null, secondCallClosingAt?: string | null }, amounts: { __typename?: 'MercadoPublicoCompraAgilSourceAmounts', currency?: string | null, available?: number | null, availableClp?: number | null }, reasons: { __typename?: 'MercadoPublicoCompraAgilSourceReasons', deserted?: string | null, selection?: string | null, cancellation?: string | null }, documents: Array<{ __typename?: 'MercadoPublicoCompraAgilSourceDocument', id: string, name?: string | null }>, institution: { __typename?: 'MercadoPublicoCompraAgilSourceInstitution', rut?: string | null, regionName?: string | null, purchaseUnit?: string | null, buyerName?: string | null }, call: { __typename?: 'MercadoPublicoCompraAgilSourceCall', description?: string | null, state?: string | null } } | null };

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


export type GetMercadoPublicoProcessDetailQuery = { __typename?: 'Query', mercadoPublicoProcessDetail?: { __typename?: 'MercadoPublicoProcessDetail', processType: MercadoPublicoDetectedProcessType, processCode: string, title?: string | null, canonicalState?: string | null, sourcePriority?: string | null, lastSeenAt: string, rawState: { __typename?: 'MercadoPublicoProcessDetailRawState', code?: string | null, label?: string | null }, buyer: { __typename?: 'MercadoPublicoProcessDetailBuyer', code?: string | null, name?: string | null }, dates: { __typename?: 'MercadoPublicoProcessDetailDates', publishedAt?: string | null, closingAt?: string | null }, items: Array<{ __typename?: 'MercadoPublicoProcessDetailItem', code: string, name?: string | null, quantity?: string | null, amount?: number | null }>, adjudications?: Array<{ __typename?: 'MercadoPublicoProcessDetailAdjudication', supplierCode: string, quantity?: string | null, amount?: number | null }> | null, relatedOcs: Array<{ __typename?: 'MercadoPublicoProcessDetailRelatedOC', code: string, canonicalState?: string | null, matchType: string, matchConfidence: string }>, sourceLineage: Array<{ __typename?: 'MercadoPublicoProcessDetailSourceLineageEntry', source: string, rowCount: number, lastSeenAt?: string | null }>, reconciliationSummary: { __typename?: 'MercadoPublicoProcessDetailReconciliationSummary', exact: number, candidate: number, unmatched: number, manualReviewRequired: number }, compraAgilSource?: { __typename?: 'MercadoPublicoCompraAgilSourceDetail', sourcePath?: string | null, offersReceived?: number | null, state: { __typename?: 'MercadoPublicoCompraAgilSourceState', id?: string | null, code?: string | null, label?: string | null }, additionalDates: { __typename?: 'MercadoPublicoCompraAgilSourceDates', lastChangedAt?: string | null, firstCallClosingAt?: string | null, secondCallClosingAt?: string | null }, amounts: { __typename?: 'MercadoPublicoCompraAgilSourceAmounts', currency?: string | null, available?: number | null, availableClp?: number | null }, reasons: { __typename?: 'MercadoPublicoCompraAgilSourceReasons', deserted?: string | null, selection?: string | null, cancellation?: string | null }, documents: Array<{ __typename?: 'MercadoPublicoCompraAgilSourceDocument', id: string, name?: string | null }>, institution: { __typename?: 'MercadoPublicoCompraAgilSourceInstitution', rut?: string | null, regionName?: string | null, purchaseUnit?: string | null, buyerName?: string | null }, call: { __typename?: 'MercadoPublicoCompraAgilSourceCall', description?: string | null, state?: string | null } } | null } | null };

export type WorkflowDiffFragmentFragment = { __typename?: 'WorkflowVersionStepChanges', triggerDiff?: any | null, stepsDiff?: any | null };

export type ActivateWorkflowVersionMutationVariables = Exact<{
  workflowVersionId: Scalars['UUID']['input'];
}>;


export type ActivateWorkflowVersionMutation = { __typename?: 'Mutation', activateWorkflowVersion: boolean };

export type ComputeStepOutputSchemaMutationVariables = Exact<{
  input: ComputeStepOutputSchemaInput;
}>;


export type ComputeStepOutputSchemaMutation = { __typename?: 'Mutation', computeStepOutputSchema: any };

export type CreateDraftFromWorkflowVersionMutationVariables = Exact<{
  input: CreateDraftFromWorkflowVersionInput;
}>;


export type CreateDraftFromWorkflowVersionMutation = { __typename?: 'Mutation', createDraftFromWorkflowVersion: { __typename?: 'WorkflowVersionDTO', id: any, name: string, status: string, trigger?: any | null, steps?: any | null, createdAt: string, updatedAt: string } };

export type CreateWorkflowVersionEdgeMutationVariables = Exact<{
  input: CreateWorkflowVersionEdgeInput;
}>;


export type CreateWorkflowVersionEdgeMutation = { __typename?: 'Mutation', createWorkflowVersionEdge: { __typename?: 'WorkflowVersionStepChanges', triggerDiff?: any | null, stepsDiff?: any | null } };

export type CreateWorkflowVersionStepMutationVariables = Exact<{
  input: CreateWorkflowVersionStepInput;
}>;


export type CreateWorkflowVersionStepMutation = { __typename?: 'Mutation', createWorkflowVersionStep: { __typename?: 'WorkflowVersionStepChanges', triggerDiff?: any | null, stepsDiff?: any | null } };

export type DeactivateWorkflowVersionMutationVariables = Exact<{
  workflowVersionId: Scalars['UUID']['input'];
}>;


export type DeactivateWorkflowVersionMutation = { __typename?: 'Mutation', deactivateWorkflowVersion: boolean };

export type DeleteWorkflowVersionEdgeMutationVariables = Exact<{
  input: CreateWorkflowVersionEdgeInput;
}>;


export type DeleteWorkflowVersionEdgeMutation = { __typename?: 'Mutation', deleteWorkflowVersionEdge: { __typename?: 'WorkflowVersionStepChanges', triggerDiff?: any | null, stepsDiff?: any | null } };

export type DeleteWorkflowVersionStepMutationVariables = Exact<{
  input: DeleteWorkflowVersionStepInput;
}>;


export type DeleteWorkflowVersionStepMutation = { __typename?: 'Mutation', deleteWorkflowVersionStep: { __typename?: 'WorkflowVersionStepChanges', triggerDiff?: any | null, stepsDiff?: any | null } };

export type DuplicateWorkflowMutationVariables = Exact<{
  input: DuplicateWorkflowInput;
}>;


export type DuplicateWorkflowMutation = { __typename?: 'Mutation', duplicateWorkflow: { __typename?: 'WorkflowVersionDTO', id: any, name: string, status: string, trigger?: any | null, steps?: any | null, createdAt: string, updatedAt: string, workflowId: any } };

export type DuplicateWorkflowVersionStepMutationVariables = Exact<{
  input: DuplicateWorkflowVersionStepInput;
}>;


export type DuplicateWorkflowVersionStepMutation = { __typename?: 'Mutation', duplicateWorkflowVersionStep: { __typename?: 'WorkflowVersionStepChanges', triggerDiff?: any | null, stepsDiff?: any | null } };

export type RetryWorkflowRunMutationVariables = Exact<{
  workflowRunId: Scalars['UUID']['input'];
}>;


export type RetryWorkflowRunMutation = { __typename?: 'Mutation', retryWorkflowRun: { __typename: 'WorkflowRun', id: any, status: WorkflowRunStatusEnum } };

export type RunWorkflowVersionMutationVariables = Exact<{
  input: RunWorkflowVersionInput;
}>;


export type RunWorkflowVersionMutation = { __typename?: 'Mutation', runWorkflowVersion: { __typename?: 'RunWorkflowVersion', workflowRunId: any } };

export type StopWorkflowRunMutationVariables = Exact<{
  workflowRunId: Scalars['UUID']['input'];
}>;


export type StopWorkflowRunMutation = { __typename?: 'Mutation', stopWorkflowRun: { __typename: 'WorkflowRun', id: any, status: WorkflowRunStatusEnum } };

export type UpdateWorkflowRunStepMutationVariables = Exact<{
  input: UpdateWorkflowRunStepInput;
}>;


export type UpdateWorkflowRunStepMutation = { __typename?: 'Mutation', updateWorkflowRunStep: { __typename?: 'WorkflowAction', id: any, name: string, type: WorkflowActionType, settings: any, valid: boolean, nextStepIds?: Array<any> | null, position?: { __typename?: 'WorkflowStepPosition', x: number, y: number } | null } };

export type UpdateWorkflowVersionStepMutationVariables = Exact<{
  input: UpdateWorkflowVersionStepInput;
}>;


export type UpdateWorkflowVersionStepMutation = { __typename?: 'Mutation', updateWorkflowVersionStep: { __typename?: 'WorkflowAction', id: any, name: string, type: WorkflowActionType, settings: any, valid: boolean, nextStepIds?: Array<any> | null, position?: { __typename?: 'WorkflowStepPosition', x: number, y: number } | null } };

export type WorkflowStepConnectedAccountHandleQueryVariables = Exact<{
  connectedAccountId: Scalars['UUID']['input'];
}>;


export type WorkflowStepConnectedAccountHandleQuery = { __typename?: 'Query', workflowStepConnectedAccountHandle?: { __typename?: 'ConnectedAccountHandleDTO', id: any, handle: string, provider: string } | null };

export type SubmitFormStepMutationVariables = Exact<{
  input: SubmitFormStepInput;
}>;


export type SubmitFormStepMutation = { __typename?: 'Mutation', submitFormStep: boolean };

export type TestHttpRequestMutationVariables = Exact<{
  input: TestHttpRequestInput;
}>;


export type TestHttpRequestMutation = { __typename?: 'Mutation', testHttpRequest: { __typename?: 'TestHttpRequest', success: boolean, message: string, result?: any | null, error?: any | null, status?: number | null, statusText?: string | null, headers?: any | null } };

export type UpdateWorkflowVersionPositionsMutationVariables = Exact<{
  input: UpdateWorkflowVersionPositionsInput;
}>;


export type UpdateWorkflowVersionPositionsMutation = { __typename?: 'Mutation', updateWorkflowVersionPositions: boolean };

export const TimelineCalendarEventParticipantFragmentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TimelineCalendarEventParticipantFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TimelineCalendarEventParticipant"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"personId"}},{"kind":"Field","name":{"kind":"Name","value":"workspaceMemberId"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"handle"}}]}}]} as unknown as DocumentNode<TimelineCalendarEventParticipantFragmentFragment, unknown>;
export const TimelineCalendarEventFragmentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TimelineCalendarEventFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TimelineCalendarEvent"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"location"}},{"kind":"Field","name":{"kind":"Name","value":"startsAt"}},{"kind":"Field","name":{"kind":"Name","value":"endsAt"}},{"kind":"Field","name":{"kind":"Name","value":"isFullDay"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"Field","name":{"kind":"Name","value":"participants"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TimelineCalendarEventParticipantFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TimelineCalendarEventParticipantFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TimelineCalendarEventParticipant"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"personId"}},{"kind":"Field","name":{"kind":"Name","value":"workspaceMemberId"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"handle"}}]}}]} as unknown as DocumentNode<TimelineCalendarEventFragmentFragment, unknown>;
export const TimelineCalendarEventsWithTotalFragmentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TimelineCalendarEventsWithTotalFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TimelineCalendarEventsWithTotal"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalNumberOfCalendarEvents"}},{"kind":"Field","name":{"kind":"Name","value":"timelineCalendarEvents"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TimelineCalendarEventFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TimelineCalendarEventParticipantFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TimelineCalendarEventParticipant"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"personId"}},{"kind":"Field","name":{"kind":"Name","value":"workspaceMemberId"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"handle"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TimelineCalendarEventFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TimelineCalendarEvent"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"location"}},{"kind":"Field","name":{"kind":"Name","value":"startsAt"}},{"kind":"Field","name":{"kind":"Name","value":"endsAt"}},{"kind":"Field","name":{"kind":"Name","value":"isFullDay"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"Field","name":{"kind":"Name","value":"participants"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TimelineCalendarEventParticipantFragment"}}]}}]}}]} as unknown as DocumentNode<TimelineCalendarEventsWithTotalFragmentFragment, unknown>;
export const ParticipantFragmentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ParticipantFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TimelineThreadParticipant"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"personId"}},{"kind":"Field","name":{"kind":"Name","value":"workspaceMemberId"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"handle"}}]}}]} as unknown as DocumentNode<ParticipantFragmentFragment, unknown>;
export const TimelineThreadFragmentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TimelineThreadFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TimelineThread"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"read"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"Field","name":{"kind":"Name","value":"firstParticipant"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ParticipantFragment"}}]}},{"kind":"Field","name":{"kind":"Name","value":"lastTwoParticipants"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ParticipantFragment"}}]}},{"kind":"Field","name":{"kind":"Name","value":"lastMessageReceivedAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastMessageBody"}},{"kind":"Field","name":{"kind":"Name","value":"subject"}},{"kind":"Field","name":{"kind":"Name","value":"numberOfMessagesInThread"}},{"kind":"Field","name":{"kind":"Name","value":"participantCount"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ParticipantFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TimelineThreadParticipant"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"personId"}},{"kind":"Field","name":{"kind":"Name","value":"workspaceMemberId"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"handle"}}]}}]} as unknown as DocumentNode<TimelineThreadFragmentFragment, unknown>;
export const TimelineThreadsWithTotalFragmentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TimelineThreadsWithTotalFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TimelineThreadsWithTotal"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalNumberOfThreads"}},{"kind":"Field","name":{"kind":"Name","value":"timelineThreads"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TimelineThreadFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ParticipantFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TimelineThreadParticipant"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"personId"}},{"kind":"Field","name":{"kind":"Name","value":"workspaceMemberId"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"handle"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TimelineThreadFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TimelineThread"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"read"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"Field","name":{"kind":"Name","value":"firstParticipant"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ParticipantFragment"}}]}},{"kind":"Field","name":{"kind":"Name","value":"lastTwoParticipants"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ParticipantFragment"}}]}},{"kind":"Field","name":{"kind":"Name","value":"lastMessageReceivedAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastMessageBody"}},{"kind":"Field","name":{"kind":"Name","value":"subject"}},{"kind":"Field","name":{"kind":"Name","value":"numberOfMessagesInThread"}},{"kind":"Field","name":{"kind":"Name","value":"participantCount"}}]}}]} as unknown as DocumentNode<TimelineThreadsWithTotalFragmentFragment, unknown>;
export const MercadoPublicoApiCallLogFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MercadoPublicoApiCallLogFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MercadoPublicoApiCallLog"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"endpoint"}},{"kind":"Field","name":{"kind":"Name","value":"requestParams"}},{"kind":"Field","name":{"kind":"Name","value":"httpStatus"}},{"kind":"Field","name":{"kind":"Name","value":"fetchedAt"}},{"kind":"Field","name":{"kind":"Name","value":"recordsFetched"}},{"kind":"Field","name":{"kind":"Name","value":"errorSummary"}},{"kind":"Field","name":{"kind":"Name","value":"ingestionJobId"}}]}}]} as unknown as DocumentNode<MercadoPublicoApiCallLogFieldsFragment, unknown>;
export const MercadoPublicoApiQuotaUsageFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MercadoPublicoApiQuotaUsageFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MercadoPublicoApiQuotaUsage"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"sources"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"dailyLimit"}},{"kind":"Field","name":{"kind":"Name","value":"used"}},{"kind":"Field","name":{"kind":"Name","value":"remaining"}},{"kind":"Field","name":{"kind":"Name","value":"resetAt"}},{"kind":"Field","name":{"kind":"Name","value":"last429At"}}]}},{"kind":"Field","name":{"kind":"Name","value":"generatedAt"}}]}}]} as unknown as DocumentNode<MercadoPublicoApiQuotaUsageFieldsFragment, unknown>;
export const MercadoPublicoCsvFileHealthFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MercadoPublicoCsvFileHealthFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MercadoPublicoCsvFileHealth"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"files"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"sourceDataset"}},{"kind":"Field","name":{"kind":"Name","value":"sourceModality"}},{"kind":"Field","name":{"kind":"Name","value":"sourcePeriod"}},{"kind":"Field","name":{"kind":"Name","value":"sourceFileName"}},{"kind":"Field","name":{"kind":"Name","value":"fileChecksum"}},{"kind":"Field","name":{"kind":"Name","value":"detectedEncoding"}},{"kind":"Field","name":{"kind":"Name","value":"detectedDelimiter"}},{"kind":"Field","name":{"kind":"Name","value":"schemaFingerprint"}},{"kind":"Field","name":{"kind":"Name","value":"rowCount"}},{"kind":"Field","name":{"kind":"Name","value":"parseStatus"}},{"kind":"Field","name":{"kind":"Name","value":"parseErrorCount"}},{"kind":"Field","name":{"kind":"Name","value":"parseSuccessCount"}},{"kind":"Field","name":{"kind":"Name","value":"lastLoadedAt"}},{"kind":"Field","name":{"kind":"Name","value":"freshness"}}]}},{"kind":"Field","name":{"kind":"Name","value":"generatedAt"}}]}}]} as unknown as DocumentNode<MercadoPublicoCsvFileHealthFieldsFragment, unknown>;
export const MercadoPublicoDetectedProcessFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MercadoPublicoDetectedProcessFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MercadoPublicoDetectedProcess"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"processType"}},{"kind":"Field","name":{"kind":"Name","value":"processCode"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"canonicalState"}},{"kind":"Field","name":{"kind":"Name","value":"rawStateCode"}},{"kind":"Field","name":{"kind":"Name","value":"rawStateLabel"}},{"kind":"Field","name":{"kind":"Name","value":"buyerCode"}},{"kind":"Field","name":{"kind":"Name","value":"buyerName"}},{"kind":"Field","name":{"kind":"Name","value":"publishedAt"}},{"kind":"Field","name":{"kind":"Name","value":"closingAt"}},{"kind":"Field","name":{"kind":"Name","value":"sourcePriority"}},{"kind":"Field","name":{"kind":"Name","value":"reconciliationStatus"}},{"kind":"Field","name":{"kind":"Name","value":"lastSeenAt"}}]}}]} as unknown as DocumentNode<MercadoPublicoDetectedProcessFieldsFragment, unknown>;
export const MercadoPublicoJobRunFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MercadoPublicoJobRunFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MercadoPublicoJobRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"jobName"}},{"kind":"Field","name":{"kind":"Name","value":"jobRunId"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"startedAt"}},{"kind":"Field","name":{"kind":"Name","value":"finishedAt"}},{"kind":"Field","name":{"kind":"Name","value":"recordsFetched"}},{"kind":"Field","name":{"kind":"Name","value":"recordsStaged"}},{"kind":"Field","name":{"kind":"Name","value":"recordsCanonicalized"}},{"kind":"Field","name":{"kind":"Name","value":"recordsFailed"}},{"kind":"Field","name":{"kind":"Name","value":"errorSummary"}},{"kind":"Field","name":{"kind":"Name","value":"rawCsvFileId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]} as unknown as DocumentNode<MercadoPublicoJobRunFieldsFragment, unknown>;
export const MercadoPublicoPipelineHealthFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MercadoPublicoPipelineHealthFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MercadoPublicoPipelineHealth"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"jobs"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"jobName"}},{"kind":"Field","name":{"kind":"Name","value":"latestStatus"}},{"kind":"Field","name":{"kind":"Name","value":"lastSuccessAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastFailureAt"}},{"kind":"Field","name":{"kind":"Name","value":"lagSinceLastSuccessMs"}},{"kind":"Field","name":{"kind":"Name","value":"failureCount"}},{"kind":"Field","name":{"kind":"Name","value":"freshness"}},{"kind":"Field","name":{"kind":"Name","value":"expectedCadenceMs"}}]}},{"kind":"Field","name":{"kind":"Name","value":"generatedAt"}}]}}]} as unknown as DocumentNode<MercadoPublicoPipelineHealthFieldsFragment, unknown>;
export const MercadoPublicoProcessDetailFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MercadoPublicoProcessDetailFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MercadoPublicoProcessDetail"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"processType"}},{"kind":"Field","name":{"kind":"Name","value":"processCode"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"canonicalState"}},{"kind":"Field","name":{"kind":"Name","value":"rawState"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"label"}}]}},{"kind":"Field","name":{"kind":"Name","value":"buyer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"dates"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"publishedAt"}},{"kind":"Field","name":{"kind":"Name","value":"closingAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"quantity"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}}]}},{"kind":"Field","name":{"kind":"Name","value":"adjudications"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"supplierCode"}},{"kind":"Field","name":{"kind":"Name","value":"quantity"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}}]}},{"kind":"Field","name":{"kind":"Name","value":"relatedOcs"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"canonicalState"}},{"kind":"Field","name":{"kind":"Name","value":"matchType"}},{"kind":"Field","name":{"kind":"Name","value":"matchConfidence"}}]}},{"kind":"Field","name":{"kind":"Name","value":"sourceLineage"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"rowCount"}},{"kind":"Field","name":{"kind":"Name","value":"lastSeenAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"reconciliationSummary"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"exact"}},{"kind":"Field","name":{"kind":"Name","value":"candidate"}},{"kind":"Field","name":{"kind":"Name","value":"unmatched"}},{"kind":"Field","name":{"kind":"Name","value":"manualReviewRequired"}}]}},{"kind":"Field","name":{"kind":"Name","value":"compraAgilSource"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"sourcePath"}},{"kind":"Field","name":{"kind":"Name","value":"state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"label"}}]}},{"kind":"Field","name":{"kind":"Name","value":"additionalDates"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"lastChangedAt"}},{"kind":"Field","name":{"kind":"Name","value":"firstCallClosingAt"}},{"kind":"Field","name":{"kind":"Name","value":"secondCallClosingAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"amounts"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"available"}},{"kind":"Field","name":{"kind":"Name","value":"availableClp"}}]}},{"kind":"Field","name":{"kind":"Name","value":"reasons"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deserted"}},{"kind":"Field","name":{"kind":"Name","value":"selection"}},{"kind":"Field","name":{"kind":"Name","value":"cancellation"}}]}},{"kind":"Field","name":{"kind":"Name","value":"offersReceived"}},{"kind":"Field","name":{"kind":"Name","value":"documents"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"institution"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"rut"}},{"kind":"Field","name":{"kind":"Name","value":"regionName"}},{"kind":"Field","name":{"kind":"Name","value":"purchaseUnit"}},{"kind":"Field","name":{"kind":"Name","value":"buyerName"}}]}},{"kind":"Field","name":{"kind":"Name","value":"call"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"state"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"sourcePriority"}},{"kind":"Field","name":{"kind":"Name","value":"lastSeenAt"}}]}}]} as unknown as DocumentNode<MercadoPublicoProcessDetailFieldsFragment, unknown>;
export const WorkflowDiffFragmentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"WorkflowDiffFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"WorkflowVersionStepChanges"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"triggerDiff"}},{"kind":"Field","name":{"kind":"Name","value":"stepsDiff"}}]}}]} as unknown as DocumentNode<WorkflowDiffFragmentFragment, unknown>;
export const GetTimelineCalendarEventsFromObjectRecordDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetTimelineCalendarEventsFromObjectRecord"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"objectNameSingular"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"recordId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"page"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pageSize"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getTimelineCalendarEventsFromObjectRecord"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"objectNameSingular"},"value":{"kind":"Variable","name":{"kind":"Name","value":"objectNameSingular"}}},{"kind":"Argument","name":{"kind":"Name","value":"recordId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"recordId"}}},{"kind":"Argument","name":{"kind":"Name","value":"page"},"value":{"kind":"Variable","name":{"kind":"Name","value":"page"}}},{"kind":"Argument","name":{"kind":"Name","value":"pageSize"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pageSize"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TimelineCalendarEventsWithTotalFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TimelineCalendarEventParticipantFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TimelineCalendarEventParticipant"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"personId"}},{"kind":"Field","name":{"kind":"Name","value":"workspaceMemberId"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"handle"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TimelineCalendarEventFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TimelineCalendarEvent"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"location"}},{"kind":"Field","name":{"kind":"Name","value":"startsAt"}},{"kind":"Field","name":{"kind":"Name","value":"endsAt"}},{"kind":"Field","name":{"kind":"Name","value":"isFullDay"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"Field","name":{"kind":"Name","value":"participants"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TimelineCalendarEventParticipantFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TimelineCalendarEventsWithTotalFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TimelineCalendarEventsWithTotal"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalNumberOfCalendarEvents"}},{"kind":"Field","name":{"kind":"Name","value":"timelineCalendarEvents"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TimelineCalendarEventFragment"}}]}}]}}]} as unknown as DocumentNode<GetTimelineCalendarEventsFromObjectRecordQuery, GetTimelineCalendarEventsFromObjectRecordQueryVariables>;
export const GetTimelineThreadsFromObjectRecordDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetTimelineThreadsFromObjectRecord"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"objectNameSingular"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"recordId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"page"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pageSize"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getTimelineThreadsFromObjectRecord"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"objectNameSingular"},"value":{"kind":"Variable","name":{"kind":"Name","value":"objectNameSingular"}}},{"kind":"Argument","name":{"kind":"Name","value":"recordId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"recordId"}}},{"kind":"Argument","name":{"kind":"Name","value":"page"},"value":{"kind":"Variable","name":{"kind":"Name","value":"page"}}},{"kind":"Argument","name":{"kind":"Name","value":"pageSize"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pageSize"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TimelineThreadsWithTotalFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ParticipantFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TimelineThreadParticipant"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"personId"}},{"kind":"Field","name":{"kind":"Name","value":"workspaceMemberId"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"displayName"}},{"kind":"Field","name":{"kind":"Name","value":"avatarUrl"}},{"kind":"Field","name":{"kind":"Name","value":"handle"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TimelineThreadFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TimelineThread"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"read"}},{"kind":"Field","name":{"kind":"Name","value":"visibility"}},{"kind":"Field","name":{"kind":"Name","value":"firstParticipant"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ParticipantFragment"}}]}},{"kind":"Field","name":{"kind":"Name","value":"lastTwoParticipants"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ParticipantFragment"}}]}},{"kind":"Field","name":{"kind":"Name","value":"lastMessageReceivedAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastMessageBody"}},{"kind":"Field","name":{"kind":"Name","value":"subject"}},{"kind":"Field","name":{"kind":"Name","value":"numberOfMessagesInThread"}},{"kind":"Field","name":{"kind":"Name","value":"participantCount"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TimelineThreadsWithTotalFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TimelineThreadsWithTotal"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalNumberOfThreads"}},{"kind":"Field","name":{"kind":"Name","value":"timelineThreads"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TimelineThreadFragment"}}]}}]}}]} as unknown as DocumentNode<GetTimelineThreadsFromObjectRecordQuery, GetTimelineThreadsFromObjectRecordQueryVariables>;
export const SearchDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Search"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"searchInput"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"after"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"excludedObjectNameSingulars"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"includedObjectNameSingulars"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filter"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ObjectRecordFilterInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"search"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"searchInput"},"value":{"kind":"Variable","name":{"kind":"Name","value":"searchInput"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"after"},"value":{"kind":"Variable","name":{"kind":"Name","value":"after"}}},{"kind":"Argument","name":{"kind":"Name","value":"excludedObjectNameSingulars"},"value":{"kind":"Variable","name":{"kind":"Name","value":"excludedObjectNameSingulars"}}},{"kind":"Argument","name":{"kind":"Name","value":"includedObjectNameSingulars"},"value":{"kind":"Variable","name":{"kind":"Name","value":"includedObjectNameSingulars"}}},{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filter"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"edges"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"node"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"recordId"}},{"kind":"Field","name":{"kind":"Name","value":"objectNameSingular"}},{"kind":"Field","name":{"kind":"Name","value":"objectLabelSingular"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"}},{"kind":"Field","name":{"kind":"Name","value":"tsRankCD"}},{"kind":"Field","name":{"kind":"Name","value":"tsRank"}}]}},{"kind":"Field","name":{"kind":"Name","value":"cursor"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pageInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hasNextPage"}},{"kind":"Field","name":{"kind":"Name","value":"endCursor"}}]}}]}}]}}]} as unknown as DocumentNode<SearchQuery, SearchQueryVariables>;
export const GetMercadoPublicoApiCallLogDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetMercadoPublicoApiCallLog"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"source"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"endpoint"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"httpStatus"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"offset"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"mercadoPublicoApiCallLog"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"source"},"value":{"kind":"Variable","name":{"kind":"Name","value":"source"}}},{"kind":"Argument","name":{"kind":"Name","value":"endpoint"},"value":{"kind":"Variable","name":{"kind":"Name","value":"endpoint"}}},{"kind":"Argument","name":{"kind":"Name","value":"httpStatus"},"value":{"kind":"Variable","name":{"kind":"Name","value":"httpStatus"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"offset"},"value":{"kind":"Variable","name":{"kind":"Name","value":"offset"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MercadoPublicoApiCallLogFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"hasMore"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MercadoPublicoApiCallLogFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MercadoPublicoApiCallLog"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"endpoint"}},{"kind":"Field","name":{"kind":"Name","value":"requestParams"}},{"kind":"Field","name":{"kind":"Name","value":"httpStatus"}},{"kind":"Field","name":{"kind":"Name","value":"fetchedAt"}},{"kind":"Field","name":{"kind":"Name","value":"recordsFetched"}},{"kind":"Field","name":{"kind":"Name","value":"errorSummary"}},{"kind":"Field","name":{"kind":"Name","value":"ingestionJobId"}}]}}]} as unknown as DocumentNode<GetMercadoPublicoApiCallLogQuery, GetMercadoPublicoApiCallLogQueryVariables>;
export const GetMercadoPublicoApiQuotaUsageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetMercadoPublicoApiQuotaUsage"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"mercadoPublicoApiQuotaUsage"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MercadoPublicoApiQuotaUsageFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MercadoPublicoApiQuotaUsageFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MercadoPublicoApiQuotaUsage"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"sources"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"dailyLimit"}},{"kind":"Field","name":{"kind":"Name","value":"used"}},{"kind":"Field","name":{"kind":"Name","value":"remaining"}},{"kind":"Field","name":{"kind":"Name","value":"resetAt"}},{"kind":"Field","name":{"kind":"Name","value":"last429At"}}]}},{"kind":"Field","name":{"kind":"Name","value":"generatedAt"}}]}}]} as unknown as DocumentNode<GetMercadoPublicoApiQuotaUsageQuery, GetMercadoPublicoApiQuotaUsageQueryVariables>;
export const GetMercadoPublicoCsvFileHealthDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetMercadoPublicoCsvFileHealth"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"mercadoPublicoCsvFileHealth"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MercadoPublicoCsvFileHealthFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MercadoPublicoCsvFileHealthFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MercadoPublicoCsvFileHealth"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"files"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"sourceDataset"}},{"kind":"Field","name":{"kind":"Name","value":"sourceModality"}},{"kind":"Field","name":{"kind":"Name","value":"sourcePeriod"}},{"kind":"Field","name":{"kind":"Name","value":"sourceFileName"}},{"kind":"Field","name":{"kind":"Name","value":"fileChecksum"}},{"kind":"Field","name":{"kind":"Name","value":"detectedEncoding"}},{"kind":"Field","name":{"kind":"Name","value":"detectedDelimiter"}},{"kind":"Field","name":{"kind":"Name","value":"schemaFingerprint"}},{"kind":"Field","name":{"kind":"Name","value":"rowCount"}},{"kind":"Field","name":{"kind":"Name","value":"parseStatus"}},{"kind":"Field","name":{"kind":"Name","value":"parseErrorCount"}},{"kind":"Field","name":{"kind":"Name","value":"parseSuccessCount"}},{"kind":"Field","name":{"kind":"Name","value":"lastLoadedAt"}},{"kind":"Field","name":{"kind":"Name","value":"freshness"}}]}},{"kind":"Field","name":{"kind":"Name","value":"generatedAt"}}]}}]} as unknown as DocumentNode<GetMercadoPublicoCsvFileHealthQuery, GetMercadoPublicoCsvFileHealthQueryVariables>;
export const GetMercadoPublicoDetectedProcessesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetMercadoPublicoDetectedProcesses"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"processTypes"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"MercadoPublicoDetectedProcessType"}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"states"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"buyerCode"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"publishedFrom"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"DateTime"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"publishedTo"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"DateTime"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"changedSince"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"DateTime"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"sort"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"MercadoPublicoDetectedProcessSortInput"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"page"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"mercadoPublicoDetectedProcesses"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"processTypes"},"value":{"kind":"Variable","name":{"kind":"Name","value":"processTypes"}}},{"kind":"Argument","name":{"kind":"Name","value":"states"},"value":{"kind":"Variable","name":{"kind":"Name","value":"states"}}},{"kind":"Argument","name":{"kind":"Name","value":"buyerCode"},"value":{"kind":"Variable","name":{"kind":"Name","value":"buyerCode"}}},{"kind":"Argument","name":{"kind":"Name","value":"publishedFrom"},"value":{"kind":"Variable","name":{"kind":"Name","value":"publishedFrom"}}},{"kind":"Argument","name":{"kind":"Name","value":"publishedTo"},"value":{"kind":"Variable","name":{"kind":"Name","value":"publishedTo"}}},{"kind":"Argument","name":{"kind":"Name","value":"changedSince"},"value":{"kind":"Variable","name":{"kind":"Name","value":"changedSince"}}},{"kind":"Argument","name":{"kind":"Name","value":"sort"},"value":{"kind":"Variable","name":{"kind":"Name","value":"sort"}}},{"kind":"Argument","name":{"kind":"Name","value":"page"},"value":{"kind":"Variable","name":{"kind":"Name","value":"page"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MercadoPublicoDetectedProcessFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"total"}},{"kind":"Field","name":{"kind":"Name","value":"page"}},{"kind":"Field","name":{"kind":"Name","value":"limit"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MercadoPublicoDetectedProcessFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MercadoPublicoDetectedProcess"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"processType"}},{"kind":"Field","name":{"kind":"Name","value":"processCode"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"canonicalState"}},{"kind":"Field","name":{"kind":"Name","value":"rawStateCode"}},{"kind":"Field","name":{"kind":"Name","value":"rawStateLabel"}},{"kind":"Field","name":{"kind":"Name","value":"buyerCode"}},{"kind":"Field","name":{"kind":"Name","value":"buyerName"}},{"kind":"Field","name":{"kind":"Name","value":"publishedAt"}},{"kind":"Field","name":{"kind":"Name","value":"closingAt"}},{"kind":"Field","name":{"kind":"Name","value":"sourcePriority"}},{"kind":"Field","name":{"kind":"Name","value":"reconciliationStatus"}},{"kind":"Field","name":{"kind":"Name","value":"lastSeenAt"}}]}}]} as unknown as DocumentNode<GetMercadoPublicoDetectedProcessesQuery, GetMercadoPublicoDetectedProcessesQueryVariables>;
export const GetMercadoPublicoJobRunsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetMercadoPublicoJobRuns"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"statuses"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"MercadoPublicoJobRunStatus"}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"jobName"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"startedFrom"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"DateTime"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"startedTo"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"DateTime"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"offset"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"mercadoPublicoJobRuns"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"statuses"},"value":{"kind":"Variable","name":{"kind":"Name","value":"statuses"}}},{"kind":"Argument","name":{"kind":"Name","value":"jobName"},"value":{"kind":"Variable","name":{"kind":"Name","value":"jobName"}}},{"kind":"Argument","name":{"kind":"Name","value":"startedFrom"},"value":{"kind":"Variable","name":{"kind":"Name","value":"startedFrom"}}},{"kind":"Argument","name":{"kind":"Name","value":"startedTo"},"value":{"kind":"Variable","name":{"kind":"Name","value":"startedTo"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"offset"},"value":{"kind":"Variable","name":{"kind":"Name","value":"offset"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MercadoPublicoJobRunFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"hasMore"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MercadoPublicoJobRunFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MercadoPublicoJobRun"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"jobName"}},{"kind":"Field","name":{"kind":"Name","value":"jobRunId"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"startedAt"}},{"kind":"Field","name":{"kind":"Name","value":"finishedAt"}},{"kind":"Field","name":{"kind":"Name","value":"recordsFetched"}},{"kind":"Field","name":{"kind":"Name","value":"recordsStaged"}},{"kind":"Field","name":{"kind":"Name","value":"recordsCanonicalized"}},{"kind":"Field","name":{"kind":"Name","value":"recordsFailed"}},{"kind":"Field","name":{"kind":"Name","value":"errorSummary"}},{"kind":"Field","name":{"kind":"Name","value":"rawCsvFileId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]} as unknown as DocumentNode<GetMercadoPublicoJobRunsQuery, GetMercadoPublicoJobRunsQueryVariables>;
export const GetMercadoPublicoPipelineHealthDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetMercadoPublicoPipelineHealth"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"mercadoPublicoPipelineHealth"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MercadoPublicoPipelineHealthFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MercadoPublicoPipelineHealthFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MercadoPublicoPipelineHealth"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"jobs"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"jobName"}},{"kind":"Field","name":{"kind":"Name","value":"latestStatus"}},{"kind":"Field","name":{"kind":"Name","value":"lastSuccessAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastFailureAt"}},{"kind":"Field","name":{"kind":"Name","value":"lagSinceLastSuccessMs"}},{"kind":"Field","name":{"kind":"Name","value":"failureCount"}},{"kind":"Field","name":{"kind":"Name","value":"freshness"}},{"kind":"Field","name":{"kind":"Name","value":"expectedCadenceMs"}}]}},{"kind":"Field","name":{"kind":"Name","value":"generatedAt"}}]}}]} as unknown as DocumentNode<GetMercadoPublicoPipelineHealthQuery, GetMercadoPublicoPipelineHealthQueryVariables>;
export const GetMercadoPublicoProcessDetailDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetMercadoPublicoProcessDetail"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"processType"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"MercadoPublicoDetectedProcessType"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"processCode"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"mercadoPublicoProcessDetail"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"processType"},"value":{"kind":"Variable","name":{"kind":"Name","value":"processType"}}},{"kind":"Argument","name":{"kind":"Name","value":"processCode"},"value":{"kind":"Variable","name":{"kind":"Name","value":"processCode"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MercadoPublicoProcessDetailFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MercadoPublicoProcessDetailFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MercadoPublicoProcessDetail"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"processType"}},{"kind":"Field","name":{"kind":"Name","value":"processCode"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"canonicalState"}},{"kind":"Field","name":{"kind":"Name","value":"rawState"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"label"}}]}},{"kind":"Field","name":{"kind":"Name","value":"buyer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"dates"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"publishedAt"}},{"kind":"Field","name":{"kind":"Name","value":"closingAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"quantity"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}}]}},{"kind":"Field","name":{"kind":"Name","value":"adjudications"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"supplierCode"}},{"kind":"Field","name":{"kind":"Name","value":"quantity"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}}]}},{"kind":"Field","name":{"kind":"Name","value":"relatedOcs"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"canonicalState"}},{"kind":"Field","name":{"kind":"Name","value":"matchType"}},{"kind":"Field","name":{"kind":"Name","value":"matchConfidence"}}]}},{"kind":"Field","name":{"kind":"Name","value":"sourceLineage"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"rowCount"}},{"kind":"Field","name":{"kind":"Name","value":"lastSeenAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"reconciliationSummary"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"exact"}},{"kind":"Field","name":{"kind":"Name","value":"candidate"}},{"kind":"Field","name":{"kind":"Name","value":"unmatched"}},{"kind":"Field","name":{"kind":"Name","value":"manualReviewRequired"}}]}},{"kind":"Field","name":{"kind":"Name","value":"compraAgilSource"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"sourcePath"}},{"kind":"Field","name":{"kind":"Name","value":"state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"label"}}]}},{"kind":"Field","name":{"kind":"Name","value":"additionalDates"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"lastChangedAt"}},{"kind":"Field","name":{"kind":"Name","value":"firstCallClosingAt"}},{"kind":"Field","name":{"kind":"Name","value":"secondCallClosingAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"amounts"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"currency"}},{"kind":"Field","name":{"kind":"Name","value":"available"}},{"kind":"Field","name":{"kind":"Name","value":"availableClp"}}]}},{"kind":"Field","name":{"kind":"Name","value":"reasons"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deserted"}},{"kind":"Field","name":{"kind":"Name","value":"selection"}},{"kind":"Field","name":{"kind":"Name","value":"cancellation"}}]}},{"kind":"Field","name":{"kind":"Name","value":"offersReceived"}},{"kind":"Field","name":{"kind":"Name","value":"documents"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"institution"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"rut"}},{"kind":"Field","name":{"kind":"Name","value":"regionName"}},{"kind":"Field","name":{"kind":"Name","value":"purchaseUnit"}},{"kind":"Field","name":{"kind":"Name","value":"buyerName"}}]}},{"kind":"Field","name":{"kind":"Name","value":"call"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"state"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"sourcePriority"}},{"kind":"Field","name":{"kind":"Name","value":"lastSeenAt"}}]}}]} as unknown as DocumentNode<GetMercadoPublicoProcessDetailQuery, GetMercadoPublicoProcessDetailQueryVariables>;
export const ActivateWorkflowVersionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ActivateWorkflowVersion"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"workflowVersionId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activateWorkflowVersion"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"workflowVersionId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"workflowVersionId"}}}]}]}}]} as unknown as DocumentNode<ActivateWorkflowVersionMutation, ActivateWorkflowVersionMutationVariables>;
export const ComputeStepOutputSchemaDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ComputeStepOutputSchema"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ComputeStepOutputSchemaInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"computeStepOutputSchema"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]} as unknown as DocumentNode<ComputeStepOutputSchemaMutation, ComputeStepOutputSchemaMutationVariables>;
export const CreateDraftFromWorkflowVersionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateDraftFromWorkflowVersion"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateDraftFromWorkflowVersionInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createDraftFromWorkflowVersion"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"trigger"}},{"kind":"Field","name":{"kind":"Name","value":"steps"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<CreateDraftFromWorkflowVersionMutation, CreateDraftFromWorkflowVersionMutationVariables>;
export const CreateWorkflowVersionEdgeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateWorkflowVersionEdge"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateWorkflowVersionEdgeInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createWorkflowVersionEdge"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"WorkflowDiffFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"WorkflowDiffFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"WorkflowVersionStepChanges"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"triggerDiff"}},{"kind":"Field","name":{"kind":"Name","value":"stepsDiff"}}]}}]} as unknown as DocumentNode<CreateWorkflowVersionEdgeMutation, CreateWorkflowVersionEdgeMutationVariables>;
export const CreateWorkflowVersionStepDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateWorkflowVersionStep"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateWorkflowVersionStepInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createWorkflowVersionStep"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"WorkflowDiffFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"WorkflowDiffFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"WorkflowVersionStepChanges"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"triggerDiff"}},{"kind":"Field","name":{"kind":"Name","value":"stepsDiff"}}]}}]} as unknown as DocumentNode<CreateWorkflowVersionStepMutation, CreateWorkflowVersionStepMutationVariables>;
export const DeactivateWorkflowVersionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeactivateWorkflowVersion"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"workflowVersionId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deactivateWorkflowVersion"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"workflowVersionId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"workflowVersionId"}}}]}]}}]} as unknown as DocumentNode<DeactivateWorkflowVersionMutation, DeactivateWorkflowVersionMutationVariables>;
export const DeleteWorkflowVersionEdgeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteWorkflowVersionEdge"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateWorkflowVersionEdgeInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteWorkflowVersionEdge"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"WorkflowDiffFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"WorkflowDiffFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"WorkflowVersionStepChanges"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"triggerDiff"}},{"kind":"Field","name":{"kind":"Name","value":"stepsDiff"}}]}}]} as unknown as DocumentNode<DeleteWorkflowVersionEdgeMutation, DeleteWorkflowVersionEdgeMutationVariables>;
export const DeleteWorkflowVersionStepDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteWorkflowVersionStep"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DeleteWorkflowVersionStepInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteWorkflowVersionStep"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"WorkflowDiffFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"WorkflowDiffFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"WorkflowVersionStepChanges"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"triggerDiff"}},{"kind":"Field","name":{"kind":"Name","value":"stepsDiff"}}]}}]} as unknown as DocumentNode<DeleteWorkflowVersionStepMutation, DeleteWorkflowVersionStepMutationVariables>;
export const DuplicateWorkflowDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DuplicateWorkflow"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DuplicateWorkflowInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"duplicateWorkflow"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"trigger"}},{"kind":"Field","name":{"kind":"Name","value":"steps"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"workflowId"}}]}}]}}]} as unknown as DocumentNode<DuplicateWorkflowMutation, DuplicateWorkflowMutationVariables>;
export const DuplicateWorkflowVersionStepDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DuplicateWorkflowVersionStep"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DuplicateWorkflowVersionStepInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"duplicateWorkflowVersionStep"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"WorkflowDiffFragment"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"WorkflowDiffFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"WorkflowVersionStepChanges"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"triggerDiff"}},{"kind":"Field","name":{"kind":"Name","value":"stepsDiff"}}]}}]} as unknown as DocumentNode<DuplicateWorkflowVersionStepMutation, DuplicateWorkflowVersionStepMutationVariables>;
export const RetryWorkflowRunDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RetryWorkflowRun"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"workflowRunId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"retryWorkflowRun"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"workflowRunId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"workflowRunId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"__typename"}}]}}]}}]} as unknown as DocumentNode<RetryWorkflowRunMutation, RetryWorkflowRunMutationVariables>;
export const RunWorkflowVersionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RunWorkflowVersion"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"RunWorkflowVersionInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"runWorkflowVersion"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"workflowRunId"}}]}}]}}]} as unknown as DocumentNode<RunWorkflowVersionMutation, RunWorkflowVersionMutationVariables>;
export const StopWorkflowRunDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"StopWorkflowRun"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"workflowRunId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"stopWorkflowRun"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"workflowRunId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"workflowRunId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"__typename"}}]}}]}}]} as unknown as DocumentNode<StopWorkflowRunMutation, StopWorkflowRunMutationVariables>;
export const UpdateWorkflowRunStepDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateWorkflowRunStep"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateWorkflowRunStepInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateWorkflowRunStep"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"settings"}},{"kind":"Field","name":{"kind":"Name","value":"valid"}},{"kind":"Field","name":{"kind":"Name","value":"nextStepIds"}},{"kind":"Field","name":{"kind":"Name","value":"position"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"x"}},{"kind":"Field","name":{"kind":"Name","value":"y"}}]}}]}}]}}]} as unknown as DocumentNode<UpdateWorkflowRunStepMutation, UpdateWorkflowRunStepMutationVariables>;
export const UpdateWorkflowVersionStepDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateWorkflowVersionStep"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateWorkflowVersionStepInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateWorkflowVersionStep"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"settings"}},{"kind":"Field","name":{"kind":"Name","value":"valid"}},{"kind":"Field","name":{"kind":"Name","value":"nextStepIds"}},{"kind":"Field","name":{"kind":"Name","value":"position"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"x"}},{"kind":"Field","name":{"kind":"Name","value":"y"}}]}}]}}]}}]} as unknown as DocumentNode<UpdateWorkflowVersionStepMutation, UpdateWorkflowVersionStepMutationVariables>;
export const WorkflowStepConnectedAccountHandleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"WorkflowStepConnectedAccountHandle"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"connectedAccountId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"workflowStepConnectedAccountHandle"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"connectedAccountId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"connectedAccountId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"handle"}},{"kind":"Field","name":{"kind":"Name","value":"provider"}}]}}]}}]} as unknown as DocumentNode<WorkflowStepConnectedAccountHandleQuery, WorkflowStepConnectedAccountHandleQueryVariables>;
export const SubmitFormStepDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SubmitFormStep"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SubmitFormStepInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"submitFormStep"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]} as unknown as DocumentNode<SubmitFormStepMutation, SubmitFormStepMutationVariables>;
export const TestHttpRequestDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"TestHttpRequest"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"TestHttpRequestInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"testHttpRequest"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"result"}},{"kind":"Field","name":{"kind":"Name","value":"error"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"statusText"}},{"kind":"Field","name":{"kind":"Name","value":"headers"}}]}}]}}]} as unknown as DocumentNode<TestHttpRequestMutation, TestHttpRequestMutationVariables>;
export const UpdateWorkflowVersionPositionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateWorkflowVersionPositions"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateWorkflowVersionPositionsInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateWorkflowVersionPositions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]} as unknown as DocumentNode<UpdateWorkflowVersionPositionsMutation, UpdateWorkflowVersionPositionsMutationVariables>;
