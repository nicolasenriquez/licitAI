import {
  type MercadoPublicoDetectedProcessSortDirection,
  type MercadoPublicoDetectedProcessSortKey,
  type MercadoPublicoDetectedProcessType,
} from 'src/engine/core-modules/mercado-publico/constants/detected-process-read.constants';

export type MercadoPublicoListDetectedProcessesFilters = {
  processTypes?: MercadoPublicoDetectedProcessType[];
  states?: string[];
  buyerCode?: string;
  publishedFrom?: Date;
  publishedTo?: Date;
  changedSince?: Date;
  page?: number;
  limit?: number;
  sort?: {
    key: MercadoPublicoDetectedProcessSortKey;
    direction: MercadoPublicoDetectedProcessSortDirection;
  };
};

export type MercadoPublicoDetectedProcessItem = {
  processType: MercadoPublicoDetectedProcessType;
  processCode: string;
  title: string | null;
  canonicalState: string | null;
  rawStateCode: string | null;
  rawStateLabel: string | null;
  buyerCode: string | null;
  buyerName: string | null;
  publishedAt: Date | null;
  closingAt: Date | null;
  sourcePriority: string | null;
  reconciliationStatus: string | null;
  lastSeenAt: Date;
};

export type MercadoPublicoListDetectedProcessesResult = {
  items: MercadoPublicoDetectedProcessItem[];
  total: number;
  page: number;
  limit: number;
};
