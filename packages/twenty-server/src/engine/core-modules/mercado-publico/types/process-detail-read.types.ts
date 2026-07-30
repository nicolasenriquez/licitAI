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

export type MercadoPublicoCompraAgilSourceDetail = {
  sourcePath: string | null;
  state: { id: string | null; code: string | null; label: string | null };
  additionalDates: {
    lastChangedAt: string | null;
    firstCallClosingAt: string | null;
    secondCallClosingAt: string | null;
  };
  amounts: {
    currency: string | null;
    available: number | null;
    availableClp: number | null;
  };
  reasons: {
    deserted: string | null;
    selection: string | null;
    cancellation: string | null;
  };
  offersReceived: number | null;
  documents: { id: string; name: string | null }[];
  institution: {
    rut: string | null;
    regionName: string | null;
    purchaseUnit: string | null;
    buyerName: string | null;
  };
  call: { description: string | null; state: string | null };
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
  compraAgilSource: MercadoPublicoCompraAgilSourceDetail | null;
  sourcePriority: string | null;
  lastSeenAt: Date;
};
