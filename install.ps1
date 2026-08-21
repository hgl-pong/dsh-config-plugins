[CmdletBinding()]
param(
  [switch]$SkipSettings
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

function Require-Command([string]$name) {
  if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
    throw "Required command not found: $name"
  }
}

function Get-InstalledBundleNames([string]$dshHome) {
  # The authoritative "already installed" list is the package.json `dependencies`
  # keys (every installed plugin is a dependency). `dsh.profile.bundles` only
  # lists plugins that also export a cordis patch layer, so it misses pure
  # client-side plugins (e.g. dsh-paste-input) — use dependencies, not bundles.
  $pkgFile = Join-Path $dshHome 'profiles\web\package.json'
  if (-not (Test-Path $pkgFile)) { return @() }
  $pkg = Get-Content -Raw -LiteralPath $pkgFile | ConvertFrom-Json
  return @($pkg.dependencies.PSObject.Properties.Name)
}

function Add-DshPluginIfMissing([string]$bundleName, [string]$spec) {
  $installed = Get-InstalledBundleNames $dshHome
  if ($bundleName -and ($installed -contains $bundleName)) {
    Write-Host "`n[skip] $bundleName already installed" -ForegroundColor DarkGray
    return
  }
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
    @('packages:', '  - .', 'nodeLinker: hoisted', 'autoInstallPeers: false', '', 'dangerouslyAllowAllBuilds: true') |
      Set-Content -LiteralPath $workspaceFile -Encoding utf8
  }
  Copy-Item -LiteralPath (Join-Path $repoRoot "patches\$patchName") -Destination (Join-Path $patchDir $patchName) -Force
  $text = Get-Content -Raw -LiteralPath $workspaceFile
  if ($text -notmatch 'patchedDependencies:') { $text = $text.TrimEnd() + "`r`npatchedDependencies:`r`n" }
  if ($text -notmatch [regex]::Escape($patchName)) {
    $text = $text.TrimEnd() + "`r`n  '@wingsky-1/dsh-web-file-preview@0.1.9': patches/$patchName`r`n"
  }

  # pnpm 10 blocks `prepare` scripts of git-hosted plugins unless their package
  # names are allowlisted. Write every git dependency's resolved package name
  # here so re-running the installer is fully non-interactive.
  $allowBuild = @(
    '@deepseek-ai/dsh-lsp',
    '@dsh-external/dsh-sidechain',
    '@omdsh-dev/dsh-annotation',
    '@dsh-community/dsh-paste-input',
    '@deepseek-ai/dsh-tool-json',
    '@deepseek-ai/dsh-tool-regex',
    '@deepseek-ai/dsh-tool-csv',
    '@deepseek-ai/dsh-tool-time',
    '@deepseek-ai/dsh-tool-calculator',
    '@deepseek-ai/dsh-tool-encoding'
  )
  if ($text -notmatch 'onlyBuiltDependencies:') {
    $text = $text.TrimEnd() + "`r`nonlyBuiltDependencies:`r`n"
  }
  foreach ($pkg in $allowBuild) {
    if ($text -notmatch [regex]::Escape("  - `"$pkg`"")) {
      $text = $text.TrimEnd() + "`r`n  - `"$pkg`""
    }
  }
  Set-Content -LiteralPath $workspaceFile -Value $text.TrimEnd() -Encoding utf8
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

# Install the patched package FIRST so its patch is not "unused" during later installs.
Add-DshPluginIfMissing '@wingsky-1/dsh-web-file-preview' '@wingsky-1/dsh-web-file-preview@0.1.9'
Ensure-WorkspacePatch $dshHome
Add-DshPluginIfMissing 'dsh-workbench-plugin' 'dsh-workbench-plugin'
if (-not $SkipSettings) { Ensure-ModelSettings $dshHome }

# Each entry: @(bundleName, spec). bundleName is the resolved package name as
# recorded in `dsh.profile.bundles`; it is used to skip already-installed plugins.
$registryPlugins = @(
  @('@huanlin/dsh-plugin-session-delete', 'github:lsz-asd/dsh-plugin-session-delete'),
  @('@tt-a1i/archify-dsh', '@tt-a1i/archify-dsh'),
  @('dsh-active-context-pruning', 'github:aerince/dsh-active-context-pruning'),
  @('dsh-appearance-gallery', 'github:wsxwj123/dsh-plugins#path:/packages/dsh-appearance-gallery'),
  @('dsh-auto-collapse', 'github:a179-sanae/dsh-auto-collapse'),
  @('dsh-change-review', 'github:cirelir/dsh-change-review'),
  @('dsh-context', 'dsh-context'),
  @('dsh-cost-meter', 'dsh-cost-meter'),
  @('dsh-crew', 'dsh-crew'),
  @('dsh-extension-hub', 'dsh-extension-hub'),
  @('dsh-history', 'dsh-history'),
  @('dsh-myrules', 'dsh-myrules'),
  @('dsh-plan-switch', 'github:a903067276-rgb/dsh-plan-switch#main'),
  @('dsh-prompt-polish', 'github:jinhuoooo/dsh-prompt-polish'),
  @('dsh-rewind-plugin', 'dsh-rewind-plugin'),
  @('dsh-skill-picker', 'dsh-skill-picker'),
  @('dsh-stylevault', 'github:GptsApp/dsh-stylevault'),
  @('dsh-vision-router', 'dsh-vision-router'),

  # --- developer-experience additions (verified, no conflict with the above) ---
  @('dsh-open-in-vscode', 'github:omdsh-dev/dsh-open-in-vscode'),
  @('@deepseek-ai/dsh-lsp', 'github:omdsh-dev/dsh-lsp'),
  @('@dsh-external/dsh-sidechain', 'github:Buyi-wsgzg/dsh-sidechain'),
  @('@omdsh-dev/dsh-annotation', 'github:omdsh-dev/dsh-annotation'),
  @('@dsh-community/dsh-paste-input', 'github:omdsh-dev/dsh-paste-input'),
  @('dsh-input-history', 'dsh-input-history'),

  # --- deterministic tools (reduce model hallucination) ---
  @('@deepseek-ai/dsh-tool-json', 'github:omdsh-dev/dsh-tool-json'),
  @('@deepseek-ai/dsh-tool-regex', 'github:omdsh-dev/dsh-tool-regex'),
  @('@deepseek-ai/dsh-tool-csv', 'github:omdsh-dev/dsh-tool-csv'),
  @('@deepseek-ai/dsh-tool-time', 'github:omdsh-dev/dsh-tool-time'),
  @('@deepseek-ai/dsh-tool-calculator', 'github:omdsh-dev/dsh-tool-calculator'),
  @('@deepseek-ai/dsh-tool-encoding', 'github:omdsh-dev/dsh-tool-encoding')
)
foreach ($plugin in $registryPlugins) { Add-DshPluginIfMissing $plugin[0] $plugin[1] }

Add-DshPluginIfMissing 'dsh-local-sse-compat' (Join-Path $repoRoot 'plugins\dsh-local-sse-compat')
Add-DshPluginIfMissing 'opencode-zen-compat' (Join-Path $repoRoot 'vendor\opencode-zen-compat')

Write-Host "`nInstallation complete. Restart with: dsh web --no-open" -ForegroundColor Green
