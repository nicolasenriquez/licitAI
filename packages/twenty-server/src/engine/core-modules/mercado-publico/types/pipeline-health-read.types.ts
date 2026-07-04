import { type MercadoPublicoFreshness } from 'src/engine/core-modules/mercado-publico/constants/pipeline-health-read.constants';

export type MercadoPublicoPipelineHealthJobEntry = {
  jobName: string;
  latestStatus: string | null;
  lastSuccessAt: Date | null;
  lastFailureAt: Date | null;
  lagSinceLastSuccessMs: number | null;
  failureCount: number;
  freshness: MercadoPublicoFreshness | null;
  expectedCadenceMs: number | null;
};

export type MercadoPublicoPipelineHealth = {
  jobs: MercadoPublicoPipelineHealthJobEntry[];
  generatedAt: Date;
};
