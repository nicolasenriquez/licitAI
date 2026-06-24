[CmdletBinding()]
param(
    [Parameter(Position = 0)]
    [ValidateSet('prepare', 'build', 'update', 'rebuild-all')]
    [string]$Command = 'build',

    [string[]]$Slices = @('core'),

    [switch]$IncludeChangeArtifacts,

    [ValidateSet('auto', 'gemini', 'kimi', 'claude', 'openai', 'deepseek', 'ollama')]
    [string]$Backend = 'auto',

    [string]$Model
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$stageRoot = Join-Path $repoRoot '.graphify-src'
$stageOutputRoot = Join-Path $stageRoot 'graphify-out'
$rootOutputRoot = Join-Path $repoRoot 'graphify-out'
$manifestPath = Join-Path $repoRoot 'graphify.sources.json'
$sliceStatePath = Join-Path $stageRoot '.selected-slices.json'
$minGraphifyVersion = [Version]'0.8.46'
$codeExtensions = @(
    '.c', '.cc', '.cpp', '.cs', '.cts', '.cxx', '.f', '.f03', '.f08', '.f90', '.f95',
    '.go', '.h', '.hpp', '.java', '.js', '.jsx', '.kt', '.kts', '.lua', '.mjs', '.mts',
    '.php', '.py', '.rb', '.rs', '.scala', '.swift', '.toc', '.ts', '.tsx'
)

function Write-Info {
    param([string]$Message)

    Write-Host "[graphify.ps1] $Message"
}

function Invoke-External {
    param(
        [Parameter(Mandatory = $true)]
        [string]$FilePath,

        [Parameter(ValueFromRemainingArguments = $true)]
        [string[]]$Arguments
    )

    & $FilePath @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "Command failed: $FilePath $($Arguments -join ' ')"
    }
}

function Normalize-RelativePath {
    param([string]$Path)

    $normalized = $Path.Replace('/', '\')
    if ($normalized.StartsWith('.\')) {
        return $normalized.Substring(2)
    }

    return $normalized.TrimStart('\')
}

function Test-PathWithinRoot {
    param(
        [string]$CandidatePath,
        [string]$RootPath
    )

    $rootPrefix = $RootPath.TrimEnd('\') + '\'
    return $CandidatePath.StartsWith($rootPrefix, [System.StringComparison]::OrdinalIgnoreCase)
}

function Remove-SafePath {
    param([string]$Path)

    if (-not (Test-Path -LiteralPath $Path)) {
        return
    }

    $resolvedPath = [System.IO.Path]::GetFullPath((Resolve-Path -LiteralPath $Path).Path)
    if (-not (Test-PathWithinRoot -CandidatePath $resolvedPath -RootPath $repoRoot)) {
        throw "Refusing to delete path outside repo root: $resolvedPath"
    }

    Remove-Item -LiteralPath $resolvedPath -Recurse -Force
}

function Get-Manifest {
    if (-not (Test-Path -LiteralPath $manifestPath)) {
        throw "Missing graphify manifest: $manifestPath"
    }

    return Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
}

function Get-ProfileSlices {
    param(
        [pscustomobject]$Manifest,
        [string]$ProfileName
    )

    $profile = $Manifest.profiles.$ProfileName
    if (-not $profile) {
        throw "Unknown graphify profile: $ProfileName"
    }

    return @($profile)
}

function Resolve-SliceNames {
    param([pscustomobject]$Manifest)

    if ($Command -eq 'rebuild-all') {
        if ($IncludeChangeArtifacts) {
            return Get-ProfileSlices -Manifest $Manifest -ProfileName 'all-with-change-artifacts'
        }

        return Get-ProfileSlices -Manifest $Manifest -ProfileName 'all-stable'
    }

    $selectedSlices = @($Slices)
    if ($selectedSlices.Count -eq 0) {
        $selectedSlices = Get-ProfileSlices -Manifest $Manifest -ProfileName 'default'
    }

    if ($IncludeChangeArtifacts -and ($selectedSlices -notcontains 'change-artifacts')) {
        $selectedSlices += 'change-artifacts'
    }

    foreach ($sliceName in $selectedSlices) {
        if (-not $Manifest.slices.$sliceName) {
            throw "Unknown graphify slice: $sliceName"
        }
    }

    return $selectedSlices
}

function Resolve-ManifestPattern {
    param([string]$Pattern)

    $candidate = Join-Path $repoRoot $Pattern
    $hasWildcard = [System.Management.Automation.WildcardPattern]::ContainsWildcardCharacters($candidate)

    if ($hasWildcard) {
        return @(Get-ChildItem -Path $candidate -Force -ErrorAction SilentlyContinue)
    }

    if (Test-Path -LiteralPath $candidate) {
        return @((Get-Item -LiteralPath $candidate -Force))
    }

    return @()
}

function Get-RelativePathFromRepoRoot {
    param([string]$FullPath)

    $normalizedRoot = $repoRoot.TrimEnd('\') + '\'
    if (-not $FullPath.StartsWith($normalizedRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
        throw "Path is outside repo root: $FullPath"
    }

    return Normalize-RelativePath -Path $FullPath.Substring($normalizedRoot.Length)
}

function Resolve-Sources {
    param(
        [pscustomobject]$Manifest,
        [string[]]$SelectedSlices
    )

    $sourcesByPath = @{}

    foreach ($sliceName in $SelectedSlices) {
        $slice = $Manifest.slices.$sliceName
        foreach ($pattern in @($slice.include)) {
            foreach ($item in Resolve-ManifestPattern -Pattern $pattern) {
                $sourcePath = [System.IO.Path]::GetFullPath($item.FullName)
                $relativePath = Get-RelativePathFromRepoRoot -FullPath $sourcePath

                $sourcesByPath[$relativePath] = [pscustomobject]@{
                    RelativePath = $relativePath
                    SourcePath   = $sourcePath
                    Kind         = if ($item.PSIsContainer) { 'Directory' } else { 'File' }
                }
            }
        }
    }

    return @($sourcesByPath.Values | Sort-Object RelativePath)
}

function Ensure-ParentDirectory {
    param([string]$Path)

    $parentPath = Split-Path -Parent $Path
    if ($parentPath -and -not (Test-Path -LiteralPath $parentPath)) {
        New-Item -ItemType Directory -Path $parentPath -Force | Out-Null
    }
}

function Save-SliceState {
    param([string[]]$SelectedSlices)

    $json = @($SelectedSlices | Sort-Object | Select-Object -Unique) | ConvertTo-Json
    Set-Content -LiteralPath $sliceStatePath -Value $json -Encoding UTF8
}

function Get-SliceState {
    if (-not (Test-Path -LiteralPath $sliceStatePath)) {
        return @()
    }

    $rawState = Get-Content -LiteralPath $sliceStatePath -Raw | ConvertFrom-Json
    return @($rawState)
}

function Test-SameSliceState {
    param([string[]]$SelectedSlices)

    $current = @($SelectedSlices | Sort-Object | Select-Object -Unique)
    $previous = @(Get-SliceState | Sort-Object | Select-Object -Unique)

    if ($current.Count -ne $previous.Count) {
        return $false
    }

    for ($index = 0; $index -lt $current.Count; $index += 1) {
        if ($current[$index] -ne $previous[$index]) {
            return $false
        }
    }

    return $true
}

function Prepare-Staging {
    param(
        [string[]]$SelectedSlices,
        [switch]$PreserveGraphState
    )

    if (-not (Test-Path -LiteralPath $stageRoot)) {
        New-Item -ItemType Directory -Path $stageRoot -Force | Out-Null
    }

    foreach ($child in Get-ChildItem -LiteralPath $stageRoot -Force -ErrorAction SilentlyContinue) {
        if ($PreserveGraphState -and $child.Name -eq 'graphify-out') {
            continue
        }

        Remove-SafePath -Path $child.FullName
    }

    $sources = Resolve-Sources -Manifest (Get-Manifest) -SelectedSlices $SelectedSlices
    $directoryCount = 0
    $fileCount = 0

    foreach ($source in $sources) {
        $destinationPath = Join-Path $stageRoot $source.RelativePath
        Ensure-ParentDirectory -Path $destinationPath

        if ($source.Kind -eq 'Directory') {
            if (-not (Test-Path -LiteralPath $destinationPath)) {
                New-Item -ItemType Junction -Path $destinationPath -Target $source.SourcePath | Out-Null
            }

            $directoryCount += 1
            continue
        }

        if (Test-Path -LiteralPath $destinationPath) {
            Remove-Item -LiteralPath $destinationPath -Force
        }

        try {
            New-Item -ItemType HardLink -Path $destinationPath -Target $source.SourcePath -ErrorAction Stop | Out-Null
        } catch {
            Copy-Item -LiteralPath $source.SourcePath -Destination $destinationPath -Force
        }

        $fileCount += 1
    }

    Write-Info "Prepared .graphify-src with $directoryCount dirs and $fileCount files."

    return $sources
}

function Resolve-GraphifyBackend {
    if ($Backend -ne 'auto') {
        return $Backend
    }

    if ($env:GEMINI_API_KEY -or $env:GOOGLE_API_KEY) { return 'gemini' }
    if ($env:OPENAI_API_KEY -or $env:OPENAI_BASE_URL) { return 'openai' }
    if ($env:ANTHROPIC_API_KEY -or $env:ANTHROPIC_BASE_URL) { return 'claude' }
    if ($env:DEEPSEEK_API_KEY) { return 'deepseek' }
    if ($env:KIMI_API_KEY -or $env:MOONSHOT_API_KEY) { return 'kimi' }
    if ($env:OLLAMA_HOST) { return 'ollama' }

    return $null
}

function Assert-GraphifyReady {
    $graphifyCommand = Get-Command graphify -ErrorAction SilentlyContinue
    if (-not $graphifyCommand) {
        throw 'graphify CLI not found in PATH.'
    }

    $versionOutput = & graphify version
    if ($LASTEXITCODE -ne 0) {
        throw 'Unable to resolve graphify version.'
    }

    if ($versionOutput -notmatch '(\d+\.\d+\.\d+)') {
        throw "Unexpected graphify version output: $versionOutput"
    }

    $graphifyVersion = [Version]$Matches[1]
    if ($graphifyVersion -lt $minGraphifyVersion) {
        throw "graphify $graphifyVersion too old. Need $minGraphifyVersion or newer."
    }

    $probeDir = Join-Path $env:TEMP ('graphify-export-probe-' + [guid]::NewGuid().ToString())
    New-Item -ItemType Directory -Path $probeDir -Force | Out-Null

    try {
        Push-Location $probeDir
        $previousPreference = $ErrorActionPreference
        $ErrorActionPreference = 'Continue'
        $probeOutput = & graphify export wiki 2>&1
        $ErrorActionPreference = $previousPreference
        $probeText = ($probeOutput | Out-String)
        if ($probeText -notmatch 'graph not found') {
            throw "Installed graphify does not expose expected wiki export command. Output: $probeText"
        }
    } finally {
        $ErrorActionPreference = 'Stop'
        Pop-Location
        if (Test-Path -LiteralPath $probeDir) {
            Remove-Item -LiteralPath $probeDir -Recurse -Force
        }
    }
}

function Assert-SemanticBackendConfigured {
    $resolvedBackend = Resolve-GraphifyBackend
    if (-not $resolvedBackend) {
        throw 'No graphify backend configured. Set -Backend or one of: GEMINI_API_KEY/GOOGLE_API_KEY, OPENAI_API_KEY/OPENAI_BASE_URL, ANTHROPIC_API_KEY/ANTHROPIC_BASE_URL, DEEPSEEK_API_KEY, KIMI_API_KEY/MOONSHOT_API_KEY, or OLLAMA_HOST.'
    }

    return $resolvedBackend
}

function Invoke-GraphifyExtract {
    param([string]$ResolvedBackend)

    Remove-SafePath -Path $stageOutputRoot

    $arguments = @('extract', $stageRoot, '--out', $stageRoot, '--backend', $ResolvedBackend)
    if ($Model) {
        $arguments += @('--model', $Model)
    }

    Invoke-External graphify @arguments

    Push-Location $stageRoot
    try {
        Invoke-External graphify export wiki
    } finally {
        Pop-Location
    }
}

function Sync-StageOutputToRoot {
    if (-not (Test-Path -LiteralPath $stageOutputRoot)) {
        throw "Stage graphify output missing: $stageOutputRoot"
    }

    Remove-SafePath -Path $rootOutputRoot
    Copy-Item -LiteralPath $stageOutputRoot -Destination $rootOutputRoot -Recurse -Force
    Write-Info "Synced graphify-out to repo root."
}

function Get-GitChangedPaths {
    $statusLines = & git status --porcelain=v1
    if ($LASTEXITCODE -ne 0) {
        throw 'Unable to read git status.'
    }

    $paths = @()
    foreach ($line in $statusLines) {
        if ([string]::IsNullOrWhiteSpace($line) -or $line.Length -lt 4) {
            continue
        }

        $pathText = $line.Substring(3).Trim()
        if ($pathText -like '* -> *') {
            $pathText = ($pathText -split ' -> ')[-1].Trim()
        }

        if (-not [string]::IsNullOrWhiteSpace($pathText)) {
            $paths += (Normalize-RelativePath -Path $pathText)
        }
    }

    return @($paths | Sort-Object -Unique)
}

function Test-PathMatchesSource {
    param(
        [string]$ChangedPath,
        [pscustomobject[]]$Sources
    )

    foreach ($source in $Sources) {
        if ($source.Kind -eq 'File' -and $ChangedPath.Equals($source.RelativePath, [System.StringComparison]::OrdinalIgnoreCase)) {
            return $true
        }

        if ($source.Kind -eq 'Directory') {
            $prefix = $source.RelativePath.TrimEnd('\') + '\'
            if ($ChangedPath.StartsWith($prefix, [System.StringComparison]::OrdinalIgnoreCase)) {
                return $true
            }
        }
    }

    return $false
}

function Test-CodeFile {
    param([string]$RelativePath)

    return $codeExtensions -contains ([System.IO.Path]::GetExtension($RelativePath).ToLowerInvariant())
}

function Get-UpdateStrategy {
    param(
        [string[]]$SelectedSlices,
        [pscustomobject[]]$Sources
    )

    if (-not (Test-Path -LiteralPath $stageOutputRoot)) {
        return [pscustomobject]@{
            Mode   = 'FullRebuild'
            Reason = 'No existing staged graph. Run full extract.'
        }
    }

    if (-not (Test-SameSliceState -SelectedSlices $SelectedSlices)) {
        return [pscustomobject]@{
            Mode   = 'FullRebuild'
            Reason = 'Selected slices changed. Incremental update would diff against wrong corpus.'
        }
    }

    $changedPaths = Get-GitChangedPaths
    if ($changedPaths.Count -eq 0) {
        return [pscustomobject]@{
            Mode        = 'NoChanges'
            Reason      = 'Git worktree clean for selected sources.'
            ChangedPaths = @()
        }
    }

    $relevantPaths = @()
    foreach ($changedPath in $changedPaths) {
        if ($changedPath -eq 'graphify.sources.json') {
            return [pscustomobject]@{
                Mode   = 'FullRebuild'
                Reason = 'graphify.sources.json changed.'
            }
        }

        if (Test-PathMatchesSource -ChangedPath $changedPath -Sources $Sources) {
            $relevantPaths += $changedPath
        }
    }

    if ($relevantPaths.Count -eq 0) {
        return [pscustomobject]@{
            Mode        = 'NoChanges'
            Reason      = 'No selected source changes detected.'
            ChangedPaths = @()
        }
    }

    foreach ($relevantPath in $relevantPaths) {
        if (-not (Test-CodeFile -RelativePath $relevantPath)) {
            return [pscustomobject]@{
                Mode        = 'FullRebuild'
                Reason      = "Non-code change requires full extract: $relevantPath"
                ChangedPaths = $relevantPaths
            }
        }
    }

    return [pscustomobject]@{
        Mode        = 'IncrementalCode'
        Reason      = 'Only code files changed inside selected sources.'
        ChangedPaths = $relevantPaths
    }
}

function Invoke-CodeOnlyUpdate {
    Invoke-External graphify update $stageRoot

    Push-Location $stageRoot
    try {
        Invoke-External graphify export wiki
    } finally {
        Pop-Location
    }
}

$manifest = Get-Manifest
$selectedSlices = Resolve-SliceNames -Manifest $manifest
Write-Info "Slices: $($selectedSlices -join ', ')"

Assert-GraphifyReady

switch ($Command) {
    'prepare' {
        Prepare-Staging -SelectedSlices $selectedSlices | Out-Null
        break
    }

    'build' {
        $resolvedBackend = Assert-SemanticBackendConfigured
        Prepare-Staging -SelectedSlices $selectedSlices | Out-Null
        Invoke-GraphifyExtract -ResolvedBackend $resolvedBackend
        Save-SliceState -SelectedSlices $selectedSlices
        Sync-StageOutputToRoot
        break
    }

    'rebuild-all' {
        $resolvedBackend = Assert-SemanticBackendConfigured
        Prepare-Staging -SelectedSlices $selectedSlices | Out-Null
        Invoke-GraphifyExtract -ResolvedBackend $resolvedBackend
        Save-SliceState -SelectedSlices $selectedSlices
        Sync-StageOutputToRoot
        break
    }

    'update' {
        $sources = Prepare-Staging -SelectedSlices $selectedSlices -PreserveGraphState
        $strategy = Get-UpdateStrategy -SelectedSlices $selectedSlices -Sources $sources
        Write-Info "$($strategy.Mode): $($strategy.Reason)"

        if ($strategy.Mode -eq 'NoChanges') {
            if ((Test-Path -LiteralPath $stageOutputRoot) -and -not (Test-Path -LiteralPath $rootOutputRoot)) {
                Sync-StageOutputToRoot
            }

            break
        }

        if ($strategy.Mode -eq 'IncrementalCode') {
            Invoke-CodeOnlyUpdate
            Save-SliceState -SelectedSlices $selectedSlices
            Sync-StageOutputToRoot
            break
        }

        $resolvedBackend = Assert-SemanticBackendConfigured
        Prepare-Staging -SelectedSlices $selectedSlices | Out-Null
        Invoke-GraphifyExtract -ResolvedBackend $resolvedBackend
        Save-SliceState -SelectedSlices $selectedSlices
        Sync-StageOutputToRoot
        break
    }
}
