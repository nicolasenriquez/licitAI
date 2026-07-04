import { type MercadoPublicoDetectedProcessType } from 'src/engine/core-modules/mercado-publico/constants/detected-process-read.constants';

export type MercadoPublicoProcessDetailItem = {
  code: string;
  name: string | null;
  quantity: string | null;
  amount: number | null;
};

export type MercadoPublicoProcessDetailAdjudication = {
  supplierCode: string;
  quantity: string | null;
  amount: number | null;
};

export type MercadoPublicoProcessDetailRelatedOc = {
  code: string;
  canonicalState: string | null;
  matchType: string;
  matchConfidence: string;
};

export type MercadoPublicoProcessDetailSourceLineageEntry = {
  source: string;
  rowCount: number;
  lastSeenAt: Date | null;
};

export type MercadoPublicoProcessDetailReconciliationSummary = {
  exact: number;
  candidate: number;
  unmatched: number;
  manualReviewRequired: number;
};

export type MercadoPublicoDetectedProcessDetail = {
  processType: MercadoPublicoDetectedProcessType;
  processCode: string;
  title: string | null;
  canonicalState: string | null;
  rawState: {
    code: string | null;
    label: string | null;
  };
  buyer: {
    code: string | null;
    name: string | null;
  };
  dates: {
    publishedAt: Date | null;
    closingAt: Date | null;
  };
  items: MercadoPublicoProcessDetailItem[];
  adjudications: MercadoPublicoProcessDetailAdjudication[] | null;
  relatedOcs: MercadoPublicoProcessDetailRelatedOc[];
  sourceLineage: MercadoPublicoProcessDetailSourceLineageEntry[];
  reconciliationSummary: MercadoPublicoProcessDetailReconciliationSummary;
  sourcePriority: string | null;
  lastSeenAt: Date;
};
