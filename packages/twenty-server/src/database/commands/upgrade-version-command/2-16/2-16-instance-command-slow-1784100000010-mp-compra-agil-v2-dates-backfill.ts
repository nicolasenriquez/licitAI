import { DataSource, QueryRunner } from 'typeorm';

import { extractV2CompraAgilListRecords } from 'src/engine/core-modules/mercado-publico/drivers/api/utils/extract-v2-compra-agil-list-records.util';
import { normalizeV2CompraAgilDate } from 'src/engine/core-modules/mercado-publico/drivers/api/utils/normalize-v2-compra-agil-date.util';
import { MercadoPublicoCanonicalRefreshService } from 'src/engine/core-modules/mercado-publico/services/mercado-publico-canonical-refresh.service';
import { RegisteredInstanceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-instance-command.decorator';
import { SlowInstanceCommand } from 'src/engine/core-modules/upgrade/interfaces/slow-instance-command.interface';

const RAW_PAYLOAD_BATCH_SIZE = 100;

type RawCompraAgilPayload = {
  id: string;
  raw_payload: unknown;
};

@RegisteredInstanceCommand('2.16.0', 1784100000010, { type: 'slow' })
export class MpCompraAgilV2DatesBackfillSlowInstanceCommand
  implements SlowInstanceCommand
{
  public async runDataMigration(dataSource: DataSource): Promise<void> {
    const canonicalRefreshService = new MercadoPublicoCanonicalRefreshService(
      dataSource,
    );

    for (let offset = 0; ; offset += RAW_PAYLOAD_BATCH_SIZE) {
      const rawPayloads = await dataSource.query<RawCompraAgilPayload[]>(
        `
          SELECT id, raw_payload
          FROM mp.raw_api_payload
          WHERE source = 'api-v2-compra-agil'
          ORDER BY id
          LIMIT $1 OFFSET $2
        `,
        [RAW_PAYLOAD_BATCH_SIZE, offset],
      );

      if (rawPayloads.length === 0) {
        return;
      }

      for (const rawPayload of rawPayloads) {
        for (const record of extractV2CompraAgilListRecords(
          rawPayload.raw_payload,
        )) {
          const fechaPublicacion = normalizeV2CompraAgilDate(
            record.fecha_publicacion,
          );
          const fechaCierre = normalizeV2CompraAgilDate(record.fecha_cierre);
          const fechaUltimoCambio = normalizeV2CompraAgilDate(
            record.fecha_ultimo_cambio,
          );

          await dataSource.query(
            `
              UPDATE mp.stg_api_v2_compra_agil
              SET
                raw_fecha_publicacion = $3,
                raw_fecha_cierre = $4,
                raw_fecha_ultimo_cambio = $5,
                fecha_publicacion = $6,
                fecha_cierre = $7,
                fecha_ultimo_cambio = $8,
                region = COALESCE($9, region)
              WHERE raw_api_payload_id = $1 AND codigo = $2
            `,
            [
              rawPayload.id,
              record.codigo,
              fechaPublicacion.raw,
              fechaCierre.raw,
              fechaUltimoCambio.raw,
              fechaPublicacion.value,
              fechaCierre.value,
              fechaUltimoCambio.value,
              record.region ?? null,
            ],
          );
        }

        await canonicalRefreshService.refreshV2CompraAgilFromApiSnapshot(
          rawPayload.id,
        );
      }
    }
  }

  public async up(_queryRunner: QueryRunner): Promise<void> {}

  public async down(_queryRunner: QueryRunner): Promise<void> {}
}
