import { type MercadoPublicoJobRunStatus } from 'src/engine/core-modules/mercado-publico/mercado-publico.constants';

export type MercadoPublicoListJobRunsFilters = {
  statuses?: MercadoPublicoJobRunStatus[];
  jobName?: string;
  startedFrom?: Date;
  startedTo?: Date;
  limit?: number;
  offset?: number;
};

export type MercadoPublicoJobRunItem = {
  id: string;
  jobName: string;
  jobRunId: string;
  status: MercadoPublicoJobRunStatus;
  startedAt: Date;
  finishedAt: Date | null;
  recordsFetched: number | null;
  recordsStaged: number | null;
  recordsCanonicalized: number | null;
  recordsFailed: number | null;
  errorSummary: string | null;
  rawCsvFileId: string | null;
  createdAt: Date;
};

export type MercadoPublicoListJobRunsResult = {
  items: MercadoPublicoJobRunItem[];
  hasMore: boolean;
};
