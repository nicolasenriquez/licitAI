$ErrorActionPreference = 'Stop'

$repositoryRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$requiredFiles = @(
  'justfile',
  'AGENTS.md',
  'docs/operations/command-surface.md',
  'docs/operations/local-development.md',
  'packages/twenty-utils/setup-dev-env.sh'
)
$requiredClaims = @(
  @{ Path = 'justfile'; Pattern = 'runtime-check' },
  @{ Path = 'justfile'; Pattern = 'ALLOW_EXTRA_CONTAINERS' },
  @{ Path = 'docs/operations/command-surface.md'; Pattern = 'First runtime command' },
  @{ Path = 'docs/operations/local-development.md'; Pattern = 'never starts, stops, removes, rebuilds, or creates' },
  @{ Path = 'packages/twenty-utils/setup-dev-env.sh'; Pattern = 'read-only' }
)

$failures = [System.Collections.Generic.List[string]]::new()
foreach ($relativePath in $requiredFiles) {
  if (-not (Test-Path -LiteralPath (Join-Path $repositoryRoot $relativePath))) {
    $failures.Add("Missing required file: $relativePath")
  }
}

foreach ($claim in $requiredClaims) {
  $fullPath = Join-Path $repositoryRoot $claim.Path
  if ((Test-Path -LiteralPath $fullPath) -and
      -not (Select-String -LiteralPath $fullPath -SimpleMatch -Quiet $claim.Pattern)) {
    $failures.Add("Missing Docker-first claim '$($claim.Pattern)' in $($claim.Path)")
  }
}

if ($failures.Count -gt 0) {
  $failures | ForEach-Object { Write-Error $_ }
  exit 1
}

Write-Output 'Docker-first command and documentation contract is present.'
