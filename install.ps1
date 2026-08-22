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
  $patchKey = '@wingsky-1/dsh-web-file-preview@0.1.9'
  New-Item -ItemType Directory -Force $profile, $patchDir | Out-Null
  if (-not (Test-Path $workspaceFile)) {
    @('packages:', '  - .', 'nodeLinker: hoisted', 'autoInstallPeers: false', '', 'dangerouslyAllowAllBuilds: true') |
      Set-Content -LiteralPath $workspaceFile -Encoding utf8
  }
  Copy-Item -LiteralPath (Join-Path $repoRoot "patches\$patchName") -Destination (Join-Path $patchDir $patchName) -Force

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
    '@deepseek-ai/dsh-tool-encoding',
    'dsh-stall-guard'
  )

  # --- structured merge: parse the existing workspace file into (a) top-level
  #     scalar lines and (b) two name-keyed blocks, then rebuild in a fixed
  #     order. This avoids the previous string-append bug where an entry could
  #     be appended under the wrong block (e.g. under patchedDependencies). ---
  $lines = (Get-Content -Raw -LiteralPath $workspaceFile) -split "`r?`n"
  $patched = [ordered]@{}      # key -> value  (patchedDependencies block)
  $built = [System.Collections.Generic.List[string]]::new()  # onlyBuiltDependencies list
  $topLines = [System.Collections.Generic.List[string]]::new()
  $currentBlock = $null
  foreach ($ln in $lines) {
    $trimmed = $ln.TrimEnd()
    if ($trimmed -eq '' -or $trimmed -match '^\s*#') { continue }
    if ($trimmed -match '^patchedDependencies:\s*$') { $currentBlock = 'patched'; continue }
    if ($trimmed -match '^onlyBuiltDependencies:\s*$') { $currentBlock = 'built'; continue }
    if ($trimmed -match '^\S') { $currentBlock = $null }   # new top-level key
    if ($currentBlock -eq 'patched') {
      if ($trimmed -match '^\s*([^:]+?)\s*:\s*(.+?)\s*$') {
        $k = $Matches[1].Trim().Trim("'").Trim('"')
        $v = $Matches[2].Trim().Trim("'").Trim('"')
        $patched[$k] = $v
      }
    } elseif ($currentBlock -eq 'built') {
      if ($trimmed -match '^\s*-\s*(.+?)\s*$') {
        $built.Add($Matches[1].Trim().Trim("'").Trim('"')) > $null
      }
    } else {
      $topLines.Add($trimmed) > $null
    }
  }

  # seed/ensure the patched entry
  $patched[$patchKey] = "patches/$patchName"
  # ensure every allow-listed build package is present (preserve order)
  foreach ($pkg in $allowBuild) {
    if ($built -notcontains $pkg) { $built.Add($pkg) > $null }
  }

  # rebuild: top-level scalars, then patchedDependencies, then onlyBuiltDependencies
  $out = [System.Collections.Generic.List[string]]::new()
  foreach ($ln in $topLines) { $out.Add($ln) > $null }
  $out.Add('') > $null
  $out.Add('patchedDependencies:') > $null
  foreach ($kv in $patched.GetEnumerator()) {
    $out.Add("  '$($kv.Key)': $($kv.Value)") > $null
  }
  $out.Add('') > $null
  $out.Add('onlyBuiltDependencies:') > $null
  foreach ($pkg in $built) {
    $out.Add("  - `"$pkg`"") > $null
  }
  Set-Content -LiteralPath $workspaceFile -Value ($out -join "`r`n") -Encoding utf8
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

  # --- compaction backend (required by dsh-active-context-pruning's acp_compress;
  #     provides ctx.compaction.compactRegion. auto:true by default = real auto compaction) ---
  @('@deepseek-ai/dsh-compaction-basic', '@deepseek-ai/dsh-compaction-basic'),

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

  # --- agent monitoring (verified no conflict with the above; dsh-cost-meter
  #     already covers token/billing, so cost/quota panels are intentionally omitted) ---
  @('dsh-traffic-light', 'dsh-traffic-light'),                 # per-session status light (read-only UI)
  @('dsh-stall-guard', 'github:akira399/dsh-stall-guard'),     # watchdog: detects truly stalled turns
  @('dsh-trace-compare', 'dsh-trace-compare'),                 # agent trajectory visualizer (session logs)
  @('dsh-schedule', 'dsh-schedule')                            # cron + /status system/agent monitor page

  # === C++ dev-experience audit (verified against npm registry; DO NOT add blindly) ===
  # Reviewed candidates for improving the C++ workflow. None qualified for inclusion:
  # - dsh-terminal@0.1.1 : real PTY panel (xterm.js + node-pty), but OVERLAPS with the
  #     already-installed dsh-workbench-plugin@0.1.26, which already bundles node-pty +
  #     @xterm/xterm + file/Git/editor UI. Adding it is redundant (double native build).
  # - dsh-cpp / dsh-git / dsh-files : exist on npm but are empty placeholders
  #     ("name reserved; first release in development") — tarball ships only
  #     package.json + README, no code, no cordis patch. Skip until they ship real impl.
  # - dsh-theme / dsh-notify / dsh-voice : real & installable, but unrelated to C++ dev
  #     (themes / Windows toast / TTS-STT). Left out on purpose.
  # Net result: the active C++-relevant stack is already covered by dsh-lsp +
  # dsh-open-in-vscode + dsh-workbench-plugin + dsh-vision-router. Gaps that have NO
  # mature dsh plugin yet (cmake build+error feedback, clang-format/tidy, GTest/Catch2
  # runner, GDB frontend) must be solved via a local cordis patch, not an npm package.
)
foreach ($plugin in $registryPlugins) { Add-DshPluginIfMissing $plugin[0] $plugin[1] }

Add-DshPluginIfMissing 'dsh-local-sse-compat' (Join-Path $repoRoot 'plugins\dsh-local-sse-compat')
Add-DshPluginIfMissing 'dsh-agnes-provider' (Join-Path $repoRoot 'plugins\dsh-agnes-provider')
Add-DshPluginIfMissing 'dsh-web-search-9router' (Join-Path $repoRoot 'plugins\dsh-web-search-9router')
Add-DshPluginIfMissing 'opencode-zen-compat' (Join-Path $repoRoot 'vendor\opencode-zen-compat')

Write-Host "`nInstallation complete. Restart with: dsh web --no-open" -ForegroundColor Green
