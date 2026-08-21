[CmdletBinding()]
param(
  [switch]$BuildLocalEditor,
  [switch]$SkipSettings
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

function Require-Command([string]$name) {
  if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
    throw "Required command not found: $name"
  }
}

function Add-DshPlugin([string]$spec) {
  Write-Host "`n>>> dsh plugin --profile web add $spec" -ForegroundColor Cyan
  & dsh plugin --profile web add $spec
  if ($LASTEXITCODE -ne 0) { throw "Plugin installation failed: $spec" }
}

function Ensure-WorkspacePatch([string]$dshHome) {
  $profile = Join-Path $dshHome 'profiles\web'
  $workspaceFile = Join-Path $profile 'pnpm-workspace.yaml'
  $patchDir = Join-Path $profile 'patches'
  $patchName = '@wingsky-1__dsh-web-file-preview@0.1.9.patch'
  New-Item -ItemType Directory -Force $profile, $patchDir | Out-Null
  if (-not (Test-Path $workspaceFile)) {
    @('packages:', '  - .', 'allowBuilds:', '  node-pty: true', 'autoInstallPeers: false', '', 'nodeLinker: hoisted') |
      Set-Content -LiteralPath $workspaceFile -Encoding utf8
  }
  Copy-Item -LiteralPath (Join-Path $repoRoot "patches\$patchName") -Destination (Join-Path $patchDir $patchName) -Force
  $text = Get-Content -Raw -LiteralPath $workspaceFile
  if ($text -notmatch 'patchedDependencies:') { $text = $text.TrimEnd() + "`r`npatchedDependencies:`r`n" }
  if ($text -notmatch [regex]::Escape($patchName)) {
    $text = $text.TrimEnd() + "`r`n  '@wingsky-1/dsh-web-file-preview@0.1.9': patches/$patchName`r`n"
  }
  Set-Content -LiteralPath $workspaceFile -Value $text -Encoding utf8
}

function Ensure-ModelSettings([string]$dshHome) {
  $settingsFile = Join-Path $dshHome 'settings.yaml'
  if (-not (Test-Path $settingsFile)) { return }
  $text = Get-Content -Raw -LiteralPath $settingsFile
  if ($text -match '(?ms)- id: deepseek-v4-flash.*?\r?\n\s+maxTokens:\s*\d+') { return }
  $needle = '      contextWindow: 1000000'
  if ($text.Contains($needle)) {
    Set-Content -LiteralPath $settingsFile -Value $text.Replace($needle, "$needle`r`n      maxTokens: 65536") -Encoding utf8
    Write-Host 'Applied DeepSeek output cap: 65536 tokens.' -ForegroundColor Green
  }
}

Require-Command 'dsh'
Require-Command 'node'
Require-Command 'pnpm'

$dshHome = if ($env:DSH_HOME) { $env:DSH_HOME } else { Join-Path $HOME '.dsh' }
$dshHome = [IO.Path]::GetFullPath($dshHome)

Add-DshPlugin 'dsh-workbench-plugin@0.1.26'
Ensure-WorkspacePatch $dshHome
if (-not $SkipSettings) { Ensure-ModelSettings $dshHome }

$registryPlugins = @(
  'github:lsz-asd/dsh-plugin-session-delete',
  '@tt-a1i/archify-dsh@0.1.0',
  '@wingsky-1/dsh-web-file-preview@0.1.9',
  'github:aerince/dsh-active-context-pruning',
  'github:wsxwj123/dsh-plugins#path:/packages/dsh-appearance-gallery',
  'github:a179-sanae/dsh-auto-collapse',
  'github:cirelir/dsh-change-review',
  'dsh-context@0.19.2',
  'dsh-cost-meter@1.5.30',
  'dsh-crew@0.7.0',
  'dsh-extension-hub@0.2.18',
  'dsh-history@0.1.24',
  'dsh-myrules@0.1.1',
  'github:a903067276-rgb/dsh-plan-switch#main',
  'github:jinhuoooo/dsh-prompt-polish',
  'dsh-rewind-plugin@0.2.9',
  'dsh-skill-picker@0.2.0',
  'github:GptsApp/dsh-stylevault',
  'dsh-vision-router@1.7.3'
)
foreach ($plugin in $registryPlugins) { Add-DshPlugin $plugin }

$localEditor = Join-Path $repoRoot 'plugins\dsh-file'
if ($BuildLocalEditor) {
  Push-Location $localEditor
  try {
    npm ci --ignore-scripts
    node build.mjs
    npm test
  } finally { Pop-Location }
}
Add-DshPlugin $localEditor
Add-DshPlugin (Join-Path $repoRoot 'plugins\dsh-local-sse-compat')
Add-DshPlugin (Join-Path $repoRoot 'vendor\opencode-zen-compat')

Write-Host "`nInstallation complete. Restart with: dsh web --no-open" -ForegroundColor Green
