import {
  type MercadoPublicoCompraAgilCallStage,
  type MercadoPublicoDetectedProcessSortDirection,
  type MercadoPublicoDetectedProcessSortKey,
  type MercadoPublicoDetectedProcessType,
} from 'src/engine/core-modules/mercado-publico/constants/detected-process-read.constants';

export type MercadoPublicoCompraAgilBusinessFilters = {
  search?: string;
  regionName?: string;
  closingFrom?: Date;
  closingTo?: Date;
  hasDocuments?: boolean;
  callStages?: MercadoPublicoCompraAgilCallStage[];
  amountMin?: number;
  amountMax?: number;
  buyerRut?: string;
};

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
} & MercadoPublicoCompraAgilBusinessFilters;

export type MercadoPublicoDetectedProcessItem = {
  processType: MercadoPublicoDetectedProcessType;
  processCode: string;
  title: string | null;
  canonicalState: string | null;
  rawStateCode: string | null;
  rawStateLabel: string | null;
  buyerCode: string | null;
  buyerName: string | null;
  buyerRut: string | null;
  purchaseUnitName: string | null;
  regionName: string | null;
  amountAvailableClp: number | null;
  callStage: MercadoPublicoCompraAgilCallStage | null;
  documentCount: number | null;
  offersReceivedCount: number | null;
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

export type MercadoPublicoCompraAgilAnalyticsSummary = {
  totalFound: number;
  closingNext24Hours: number;
  knownAmountAvailableClp: number | null;
  positiveDocumentCount: number;
};

export type MercadoPublicoCompraAgilClosingBucket = {
  date: string;
  count: number;
};

export type MercadoPublicoCompraAgilRegionBucket = {
  regionName: string;
  count: number;
};

export type MercadoPublicoCompraAgilBuyerBucket = {
  buyerKey: string;
  buyerName: string | null;
  count: number;
};

export type MercadoPublicoCompraAgilAmountBand = {
  band: string;
  count: number;
};

export type MercadoPublicoCompraAgilCallStageBucket = {
  callStage: MercadoPublicoCompraAgilCallStage;
  count: number;
};

export type MercadoPublicoCompraAgilDocumentAvailabilityBucket = {
  hasDocuments: boolean;
  count: number;
};

export type MercadoPublicoCompraAgilCoverage = {
  closingAt: number;
  regionName: number;
  buyerIdentity: number;
  amountAvailableClp: number;
  callStage: number;
  documentCount: number;
  offersReceivedCount: number;
};

export type MercadoPublicoCompraAgilAnalyticsMetadata = {
  filteredPopulation: number;
  calculatedAt: Date;
  timezone: string;
  completePopulation: boolean;
  coverage: MercadoPublicoCompraAgilCoverage;
};

export type MercadoPublicoCompraAgilAnalytics = {
  summary: MercadoPublicoCompraAgilAnalyticsSummary;
  closingByDay: MercadoPublicoCompraAgilClosingBucket[];
  regions: MercadoPublicoCompraAgilRegionBucket[];
  topBuyers: MercadoPublicoCompraAgilBuyerBucket[];
  amountBands: MercadoPublicoCompraAgilAmountBand[];
  callStages: MercadoPublicoCompraAgilCallStageBucket[];
  documentAvailability: MercadoPublicoCompraAgilDocumentAvailabilityBucket[];
  metadata: MercadoPublicoCompraAgilAnalyticsMetadata;
};
