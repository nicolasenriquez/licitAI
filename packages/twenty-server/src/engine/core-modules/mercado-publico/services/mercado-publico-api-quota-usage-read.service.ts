import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';

import { DataSource } from 'typeorm';

import { MercadoPublicoConfigService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-config.service';
import {
  type MercadoPublicoApiQuotaUsage,
  type MercadoPublicoApiQuotaUsageSourceEntry,
} from 'src/engine/core-modules/mercado-publico/types/api-quota-usage-read.types';

type GoldApiQuotaUsageRow = {
  source: string;
  used: number;
  reset_at: Date | null;
  last_429_at: Date | null;
};

@Injectable()
export class MercadoPublicoApiQuotaUsageReadService {
  constructor(
    @InjectDataSource()
    private readonly coreDataSource: DataSource,
    private readonly configService: MercadoPublicoConfigService,
  ) {}

  async getApiQuotaUsage(): Promise<MercadoPublicoApiQuotaUsage> {
    const rows = await this.coreDataSource.query<GoldApiQuotaUsageRow[]>(
      `SELECT source, used, reset_at, last_429_at
       FROM mp.gold_api_quota_usage
       ORDER BY source ASC`,
    );

    // ponytail: shared limit, split per-source when ChileCompra docs diverge
    const dailyLimit = this.configService.getSettings().apiDailyLimit;

    const sources: MercadoPublicoApiQuotaUsageSourceEntry[] = rows.map(
      (row): MercadoPublicoApiQuotaUsageSourceEntry => ({
        source: row.source,
        dailyLimit,
        used: row.used,
        remaining: Math.max(0, dailyLimit - row.used),
        resetAt: row.reset_at,
        last429At: row.last_429_at,
      }),
    );

    return { sources, generatedAt: new Date() };
  }
}
