import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';

import { DataSource } from 'typeorm';

@Injectable()
export class MercadoPublicoQuotaTrackerService {
  private readonly logger = new Logger(
    MercadoPublicoQuotaTrackerService.name,
  );

  constructor(
    @InjectDataSource()
    private readonly coreDataSource: DataSource,
  ) {}

  async record429(
    source: string,
    quotaTimezone: string,
  ): Promise<void> {
    try {
      await this.coreDataSource.query(
        `
          INSERT INTO mp.gold_api_quota_usage (
            source,
            used,
            last_429_at,
            reset_at,
            updated_at
          )
          VALUES (
            $1,
            1,
            now(),
            (date_trunc('day', now() AT TIME ZONE $2) + interval '1 day') AT TIME ZONE $2,
            now()
          )
          ON CONFLICT (source) DO UPDATE
          SET used = CASE
                WHEN mp.gold_api_quota_usage.reset_at <= now() THEN 1
                ELSE mp.gold_api_quota_usage.used + 1
              END,
              last_429_at = now(),
              reset_at = EXCLUDED.reset_at,
              updated_at = now()
        `,
        [source, quotaTimezone],
      );
    } catch (error) {
      // ponytail: quota tracking is observability, not a hard dependency
      this.logger.warn(
        `Failed to record 429 for ${source}: ${(error as Error).message}`,
      );
    }
  }
}
