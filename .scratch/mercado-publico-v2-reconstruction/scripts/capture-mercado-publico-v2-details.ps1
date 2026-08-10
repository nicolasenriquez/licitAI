param(
  [Parameter(Mandatory = $true)]
  [string]$SourcePath
)

$records = (Get-Content -LiteralPath $SourcePath -Raw | ConvertFrom-Json).results
$candidates = @(
  $records | Sort-Object @{ Expression = { $_.documentos.Count }; Descending = $true } | Select-Object -First 1
) + @(
  $records | Where-Object { $_.documentos.Count -eq 0 } | Select-Object -First 1
) + @(
  $records | Where-Object { $_.motivos.motivo_cancelacion -ne $null } | Select-Object -First 1
) + @(
  $records | Where-Object { $_.fechas.fecha_cierre -eq $null } | Select-Object -First 1
) + @(
  $records | Select-Object -First 1
)

$codes = [System.Collections.Generic.List[string]]::new()
foreach ($candidate in @($candidates) + @($records)) {
  if ($codes.Count -eq 5) {
    break
  }

  if ($null -ne $candidate -and -not $codes.Contains($candidate.codigo)) {
    $codes.Add($candidate.codigo)
  }
}

$nodeScript = @'
const { MercadoPublicoApiV2CompraAgilClientService } = require('/app/packages/twenty-server/dist/engine/core-modules/mercado-publico/drivers/api/mercado-publico-api-v2-compra-agil-client.service.js');
const { MercadoPublicoConfigService } = require('/app/packages/twenty-server/dist/engine/core-modules/mercado-publico/services/mercado-publico-config.service.js');
const { SecureHttpClientService } = require('/app/packages/twenty-server/dist/engine/core-modules/secure-http-client/secure-http-client.service.js');
const { Logger } = require('@nestjs/common');

const config = {
  get: (key) => key === 'MERCADO_PUBLICO_HTTP_TIMEOUT_MS'
    ? Number(process.env[key] ?? 15000)
    : key === 'OUTBOUND_HTTP_SAFE_MODE_ENABLED'
      ? false
      : process.env[key],
};
const sanitize = (value) => {
  if (Array.isArray(value)) return value.map(sanitize);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, nestedValue]) => [key, sanitize(nestedValue)]));
  if (typeof value === 'string') return /^\d{4}-\d{2}-\d{2}/.test(value) ? '2026-01-02T03:04:05Z' : '[string]';
  if (typeof value === 'number') return value === 0 ? 0 : Number.isInteger(value) ? 1 : 1.5;
  return value;
};
const main = async () => {
  Logger.overrideLogger([]);
  const client = new MercadoPublicoApiV2CompraAgilClientService(
    new MercadoPublicoConfigService(config),
    new SecureHttpClientService(config),
    { record429: async () => undefined },
  );
  const response = await client.getByCodigo(process.env.DETAIL_CODE);
  process.stdout.write(JSON.stringify({
    httpStatus: response.httpStatus,
    recordCount: response.compraAgil.length,
    errorSummary: response.errorSummary ?? null,
    record: response.compraAgil[0] ? sanitize(response.compraAgil[0]) : null,
  }));
};
main().catch(() => { process.stderr.write('detail capture failed\n'); process.exitCode = 1; });
'@

$encoded = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($nodeScript))
$captures = foreach ($code in $codes) {
  $script = "eval(Buffer.from('$encoded','base64').toString())"
  $line = & docker exec '-e' "DETAIL_CODE=$code" 'twenty-server-1' 'node' '-e' $script

  if ($LASTEXITCODE -ne 0) {
    throw 'detail capture failed'
  }

  $line | ConvertFrom-Json
}

$captures | ConvertTo-Json -Depth 100 -Compress
