import { type MercadoPublicoCsvFileHealthFreshness } from 'src/engine/core-modules/mercado-publico/constants/csv-file-health-read.constants';

export type MercadoPublicoCsvFileHealthEntry = {
  sourceDataset: string;
  sourceModality: string | null;
  sourcePeriod: string;
  sourceFileName: string;
  fileChecksum: string;
  detectedEncoding: string | null;
  detectedDelimiter: string | null;
  schemaFingerprint: string | null;
  rowCount: number;
  parseStatus: string;
  parseErrorCount: number;
  parseSuccessCount: number;
  lastLoadedAt: Date | null;
  // ponytail: null until CSV cadence config exists. Upgrade: replace with 3-tier gate (healthy/degraded/stale) per design.md:316-319.
  freshness: MercadoPublicoCsvFileHealthFreshness | null;
};

export type MercadoPublicoCsvFileHealth = {
  files: MercadoPublicoCsvFileHealthEntry[];
  generatedAt: Date;
};
