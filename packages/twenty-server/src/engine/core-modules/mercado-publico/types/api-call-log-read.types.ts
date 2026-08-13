export type MercadoPublicoListApiCallLogsFilters = {
  source?: string;
  endpoint?: string;
  httpStatus?: number;
  limit?: number;
  offset?: number;
};

export type MercadoPublicoApiCallLogItem = {
  id: string;
  source: string;
  endpoint: string;
  requestParams: unknown;
  httpStatus: number;
  fetchedAt: Date;
  recordsFetched: number | null;
  errorSummary: string | null;
  ingestionJobId: string | null;
};

export type MercadoPublicoListApiCallLogsResult = {
  items: MercadoPublicoApiCallLogItem[];
  hasMore: boolean;
};
