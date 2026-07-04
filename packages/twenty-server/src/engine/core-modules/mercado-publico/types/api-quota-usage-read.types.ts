export type MercadoPublicoApiQuotaUsageSourceEntry = {
  source: string;
  dailyLimit: number;
  used: number;
  remaining: number;
  resetAt: Date | null;
  last429At: Date | null;
};

export type MercadoPublicoApiQuotaUsage = {
  sources: MercadoPublicoApiQuotaUsageSourceEntry[];
  generatedAt: Date;
};
