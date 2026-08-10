const {
  MercadoPublicoApiV2CompraAgilClientService,
} = require('/app/packages/twenty-server/dist/engine/core-modules/mercado-publico/drivers/api/mercado-publico-api-v2-compra-agil-client.service.js');
const {
  MercadoPublicoConfigService,
} = require('/app/packages/twenty-server/dist/engine/core-modules/mercado-publico/services/mercado-publico-config.service.js');
const {
  SecureHttpClientService,
} = require('/app/packages/twenty-server/dist/engine/core-modules/secure-http-client/secure-http-client.service.js');
const { Logger } = require('@nestjs/common');

const config = {
  get: (key) =>
    key === 'MERCADO_PUBLICO_HTTP_TIMEOUT_MS'
      ? Number(process.env[key] ?? 15000)
      : key === 'OUTBOUND_HTTP_SAFE_MODE_ENABLED'
        ? false
        : process.env[key],
};

const main = async () => {
  Logger.overrideLogger([]);

  const client = new MercadoPublicoApiV2CompraAgilClientService(
    new MercadoPublicoConfigService(config),
    new SecureHttpClientService(config),
    { record429: async () => undefined },
  );
  const response = await client.getList({
    tamano_pagina: 50,
    numero_pagina: 1,
    publicado_desde: '2026-08-08T00:00:00Z',
    publicado_hasta: '2026-08-08T23:59:59Z',
    ordenar_por: 'FechaPublicacion',
  });
  const detailResults =
    response.httpStatus === 200
      ? await Promise.all(response.compraAgil.slice(0, 5).map(async ({ codigo }) => {
      const detail = await client.getByCodigo(codigo);

      return {
        httpStatus: detail.httpStatus,
        recordCount: detail.compraAgil.length,
        errorSummary: detail.errorSummary ?? null,
      };
    }))
      : [];
  process.stdout.write(
    JSON.stringify({
      httpStatus: response.httpStatus,
      recordCount: response.compraAgil.length,
      errorSummary: response.errorSummary ?? null,
      detailResults,
    }),
  );
};

main().catch((error) => {
  process.stderr.write(
    `list probe failed: ${error instanceof Error ? error.message : 'unknown'}\n`,
  );
  process.exitCode = 1;
});
