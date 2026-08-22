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

# --- version helpers: only skip a plugin when the already-installed version is
#     at (or above) the target/latest version. ---

$script:NpmLatestCache = @{}

function Get-NpmLatestVersion([string]$packageName) {
  # Query the npm registry for the latest published version of a package. Cached
  # per run so we only hit the network once per distinct package name.
  if (-not $packageName) { return $null }
  if ($script:NpmLatestCache.ContainsKey($packageName)) { return $script:NpmLatestCache[$packageName] }
  $result = $null
  try {
    $out = (& npm view $packageName version --silent 2>$null | Select-Object -First 1)
    if ($LASTEXITCODE -eq 0 -and $out) { $result = $out.ToString().Trim() }
  } catch { $result = $null }
  $script:NpmLatestCache[$packageName] = $result
  return $result
}

function Get-InstalledVersion([string]$dshHome, [string]$packageName) {
  # The actually-installed version, read from node_modules (a plain `dependencies`
  # spec may be a range or a git URL, so it cannot be trusted as the installed ver).
  if (-not $packageName) { return $null }
  $versionFile = Join-Path (Join-Path (Join-Path $dshHome 'profiles\web\node_modules') $packageName) 'package.json'
  if (-not (Test-Path -LiteralPath $versionFile)) { return $null }
  try {
    $pkg = Get-Content -Raw -LiteralPath $versionFile | ConvertFrom-Json
    return $pkg.version
  } catch { return $null }
}

function ConvertTo-VersionParts([string]$v) {
  # Parse the leading numeric components of a semver-ish string into ints.
  $m = [regex]::Match($v, '^\s*v?(\d+)(?:\.(\d+))?(?:\.(\d+))?(?:\.(\d+))?')
  if (-not $m.Success) { return @(0) }
  $parts = for ($i = 1; $i -le 4; $i++) {
    if ($m.Groups[$i].Success) { [int]$m.Groups[$i].Value } else { 0 }
  }
  return ,$parts
}

function Test-IsAtLeast([string]$installed, [string]$required) {
  # $true when $installed >= $required (numeric component-wise comparison).
  if (-not $installed) { return $false }
  if (-not $required) { return $true }
  $a = ConvertTo-VersionParts $installed
  $b = ConvertTo-VersionParts $required
  for ($i = 0; $i -lt $a.Count; $i++) {
    if ($a[$i] -gt $b[$i]) { return $true }
    if ($a[$i] -lt $b[$i]) { return $false }
  }
  return $true
}

function Get-TargetVersion([string]$bundleName, [string]$spec) {
  # Determine the version the plugin should be at before we skip a re-install:
  #   * if the spec pins an explicit version (name@1.2.3), that is the floor;
  #   * otherwise the latest published version on npm for the resolved package.
  # Returns $null when we cannot determine a target (e.g. offline or the package
  # is not published to npm) -> caller falls back to skip-if-installed.
  $pinned = $null
  if ($spec -match '^@?[^@]+@([0-9][^/]*)$') { $pinned = $Matches[1] }
  $latest = Get-NpmLatestVersion $bundleName
  if ($latest -and $pinned) {
    if (Test-IsAtLeast $latest $pinned) { return $latest } else { return $pinned }
  }
  if ($latest) { return $latest }
  return $pinned
}

function Add-DshPluginIfMissing([string]$bundleName, [string]$spec) {
  $installed = Get-InstalledBundleNames $dshHome
  if ($bundleName -and ($installed -contains $bundleName)) {
    # Only skip when the installed version is already up to date.
    $installedVer = Get-InstalledVersion $dshHome $bundleName
    $targetVer = Get-TargetVersion $bundleName $spec
    if ($targetVer -and $installedVer -and (Test-IsAtLeast $installedVer $targetVer)) {
      Write-Host "`n[skip] $bundleName already at latest ($installedVer)" -ForegroundColor DarkGray
      return
    }
    if (-not $targetVer) {
      # Cannot determine a target version (offline / not on npm). Fall back to
      # skipping when already installed, to avoid churn on local/git plugins.
      Write-Host "`n[skip] $bundleName already installed" -ForegroundColor DarkGray
      return
    }
    if ($installedVer) {
      Write-Host "`n[update] $bundleName ($installedVer -> target $targetVer)" -ForegroundColor Yellow
    } else {
      Write-Host "`n[update] $bundleName -> target $targetVer" -ForegroundColor Yellow
    }
  }
  Write-Host "`n>>> dsh plugin --profile web add $spec" -ForegroundColor Cyan
  & dsh plugin --profile web add $spec
  if ($LASTEXITCODE -ne 0) { throw "Plugin installation failed: $spec" }
}

function Ensure-WorkspacePatch([string]$dshHome) {
  $profile = Join-Path $dshHome 'profiles\web'
  $workspaceFile = Join-Path $profile 'pnpm-workspace.yaml'
  $patchDir = Join-Path $profile 'patches'
  # name@version -> repo-relative patch file. Each entry must have a matching
  # file under $repoRoot\patches and is copied into the profile's patches/ dir
  # AND registered in patchedDependencies below.
  $patchTable = [ordered]@{
    '@wingsky-1/dsh-web-file-preview@0.1.9' = 'patches/@wingsky-1__dsh-web-file-preview@0.1.9.patch'
    'dsh-open-in-vscode@0.1.6'              = 'patches/dsh-open-in-vscode@0.1.6.patch'
  }
  New-Item -ItemType Directory -Force $profile, $patchDir | Out-Null
  if (-not (Test-Path $workspaceFile)) {
    @('packages:', '  - .', 'nodeLinker: hoisted', 'autoInstallPeers: false', '', 'dangerouslyAllowAllBuilds: true') |
      Set-Content -LiteralPath $workspaceFile -Encoding utf8
  }
  foreach ($rel in $patchTable.Values) {
    Copy-Item -LiteralPath (Join-Path $repoRoot $rel) -Destination (Join-Path $patchDir ([IO.Path]::GetFileName($rel))) -Force
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

  # seed/ensure every patched entry
  foreach ($pkv in $patchTable.GetEnumerator()) {
    $patched[$pkv.Key] = $pkv.Value
  }
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

function Ensure-OpenInVscodePatched([string]$dshHome) {
  # dsh-open-in-vscode is installed from a git URL and is never on npm, so
  # Add-DshPluginIfMissing skips it whenever it is present. pnpm only applies a
  # patchedDependencies entry during an (re)install, so for an already-installed
  # plugin we must force a remove + re-add to apply the editor-detection patch.
  $pkgDir = Join-Path $dshHome 'profiles\web\node_modules\dsh-open-in-vscode'
  $indexFile = Join-Path $pkgDir 'lib\index.js'
  if (Test-Path -LiteralPath $indexFile) {
    $text = Get-Content -Raw -LiteralPath $indexFile
    if ($text.Contains('editorLocations') -and $text.Contains('CodeBuddy.exe')) {
      Write-Host 'dsh-open-in-vscode already patched for compatible editor detection.' -ForegroundColor DarkGray
      return
    }
  }
  Write-Host "`n[reinstall] dsh-open-in-vscode (apply compatible editor detection patch)" -ForegroundColor Yellow
  # Older installs used a tarball URL, while the patch is keyed by the
  # package's name@version. Temporarily unregister this entry so pnpm can
  # remove the old tarball before the pinned GitHub dependency is re-added.
  $workspaceFile = Join-Path $dshHome 'profiles\web\pnpm-workspace.yaml'
  $workspaceText = $null
  $patchWasRegistered = $false
  if (Test-Path -LiteralPath $workspaceFile) {
    $workspaceText = Get-Content -Raw -LiteralPath $workspaceFile
    $withoutEditorPatch = [regex]::Replace(
      $workspaceText,
      "(?m)^[ \t]*'dsh-open-in-vscode@0\.1\.6':[^\r\n]*(?:\r?\n|$)",
      ''
    )
    $patchWasRegistered = $withoutEditorPatch -ne $workspaceText
    if ($patchWasRegistered) {
      Set-Content -LiteralPath $workspaceFile -Value $withoutEditorPatch -Encoding utf8
    }
  }
  try {
    & dsh plugin --profile web remove dsh-open-in-vscode
    if ($LASTEXITCODE -ne 0) { throw 'Failed to remove dsh-open-in-vscode for re-patch' }
  } finally {
    if ($patchWasRegistered) {
      Set-Content -LiteralPath $workspaceFile -Value $workspaceText -Encoding utf8
    }
  }
  # Pin the re-add to the v0.1.6 tag so the `patchedDependencies` key
  # dsh-open-in-vscode@0.1.6 matches; an unpinned git spec could resolve to a
  # newer HEAD and the patch would not apply.
  & dsh plugin --profile web add github:omdsh-dev/dsh-open-in-vscode#v0.1.6
  if ($LASTEXITCODE -ne 0) { throw 'Failed to re-add dsh-open-in-vscode after re-patch' }
  if (Test-Path -LiteralPath $indexFile) {
    $newText = Get-Content -Raw -LiteralPath $indexFile
    if ($newText.Contains('editorLocations') -and $newText.Contains('CodeBuddy.exe')) {
      Write-Host 'dsh-open-in-vscode re-installed with compatible editor detection.' -ForegroundColor Green
    } else {
      Write-Host 'WARNING: dsh-open-in-vscode re-installed but the compatible editor detection patch did not apply.' -ForegroundColor Red
    }
  }
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

function Get-DshBuiltinPresetsDir {
  # Built-in agent presets ship inside the globally-installed dsh CLI package at
  # <npm root>/node_modules/@deepseek-ai/dsh/config/agent-presets (standard,
  # minimal, code, cordis). Returns the directory path, or $null when the package
  # cannot be located (e.g. dsh is installed via a non-npm mechanism).
  try {
    $npmRoot = (& npm root -g 2>$null | Select-Object -First 1)
  } catch { $npmRoot = $null }
  if (-not $npmRoot) { return $null }
  $pkg = Join-Path $npmRoot '@deepseek-ai\dsh'
  if (-not (Test-Path $pkg)) { return $null }
  return Join-Path $pkg 'config\agent-presets'
}

function Set-CompactionSummarization([string]$presetsDir) {
  # Injects `summarizationProvider`/`summarizationModel` into the compaction-basic
  # plugin row of every agent.cordis.yml under $presetsDir. Idempotent: skips
  # files that already carry the config keys. Uses a regex to locate the row so it
  # works regardless of CRLF vs LF line endings. Returns the names of modified presets.
  if (-not (Test-Path -LiteralPath $presetsDir)) { return @() }
  $done = @()
  foreach ($dir in Get-ChildItem -LiteralPath $presetsDir -Directory -ErrorAction SilentlyContinue) {
    $file = Join-Path $dir.FullName 'agent.cordis.yml'
    if (-not (Test-Path -LiteralPath $file)) { continue }
    $text = Get-Content -Raw -LiteralPath $file
    # idempotent: skip if the block already carries the config keys
    if ($text -match '(?m)^\s+config:\s*\r?\n\s+summarizationProvider:') { continue }
    # Locate the compaction-basic plugin row by its unique `name:` line, capturing
    # its indentation and the file's line-ending style.
    $m = [regex]::Match($text, '(?m)^([ \t]*)name: ''@deepseek-ai/dsh-compaction-basic''(\r?\n)')
    if (-not $m.Success) { continue }
    $nameIndent = $m.Groups[1].Value
    $eol = $m.Groups[2].Value
    $configIndent = $nameIndent + '  '
    $block = "${nameIndent}config:${eol}${configIndent}summarizationProvider: agnes${eol}${configIndent}summarizationModel: agnes-2.5-flash${eol}"
    $newText = $text.Insert($m.Index + $m.Length, $block)
    Set-Content -LiteralPath $file -Value $newText -Encoding utf8
    $done += $dir.Name
  }
  return $done
}

function Ensure-CompactionSummarizationConfig([string]$dshHome) {
  # `compaction-basic` reads its config from the plugin row's `config:` block in
  # each agent preset's `agent.cordis.yml` (NOT from settings.yaml — see
  # dsh-compaction-basic lib/index.js). So we inject the summarization model here
  # so ACP compaction uses agnes/agnes-2.5-flash instead of the default model.
  #
  # Applies to BOTH the built-in presets shipped in the dsh package (standard,
  # minimal, code, cordis) and the user's custom presets under $dshHome\.agent-presets.
  $userDone = @(Set-CompactionSummarization (Join-Path $dshHome '.agent-presets'))
  if ($userDone.Count -gt 0) {
    Write-Host ("Applied compaction-basic summarization model (agnes/agnes-2.5-flash) to agent presets: " + ($userDone -join ', ')) -ForegroundColor Green
  }

  $builtinDir = Get-DshBuiltinPresetsDir
  if (-not $builtinDir) { return }
  $builtinDone = @(Set-CompactionSummarization $builtinDir)
  if ($builtinDone.Count -gt 0) {
    Write-Host ("Applied compaction-basic summarization model (agnes/agnes-2.5-flash) to built-in presets: " + ($builtinDone -join ', ')) -ForegroundColor Green
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
Ensure-CompactionSummarizationConfig $dshHome

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

# dsh-open-in-vscode is installed from git and skipped by the loop above when
# present, so force a reinstall if its compatible-editor patch is not applied.
Ensure-OpenInVscodePatched $dshHome

Add-DshPluginIfMissing 'dsh-local-sse-compat' (Join-Path $repoRoot 'plugins\dsh-local-sse-compat')
Add-DshPluginIfMissing 'dsh-agnes-provider' (Join-Path $repoRoot 'plugins\dsh-agnes-provider')
Add-DshPluginIfMissing 'dsh-compact-model' (Join-Path $repoRoot 'plugins\dsh-compact-model')

# dsh-web-search-9router needs @deepseek-ai/schemastery resolvable from the plugin's
# REAL path (F:\...\plugins\dsh-web-search-9router): dsh profiles install local plugins
# as symlinks, and Node ESM resolution follows the real path, so the profile's hoisted
# node_modules is invisible to the plugin. Install the schema peer into the plugin dir.
$plugin9r = Join-Path $repoRoot 'plugins\dsh-web-search-9router'
if (-not (Test-Path (Join-Path $plugin9r 'node_modules\@deepseek-ai\schemastery'))) {
  Write-Host "`n>>> npm install (schemastery peer for dsh-web-search-9router)" -ForegroundColor Cyan
  Push-Location $plugin9r
  try { & npm install --no-save --no-package-lock --omit=dev '@deepseek-ai/schemastery@3.18.1'; if ($LASTEXITCODE -ne 0) { throw 'npm install failed for 9router schemastery peer' } }
  finally { Pop-Location }
}
Add-DshPluginIfMissing 'dsh-web-search-9router' $plugin9r

# dsh-compact-model needs @deepseek-ai/schemastery (and its transitive deps
# @deepseek-ai/cosmokit, @standard-schema/spec) resolvable from the plugin's REAL
# path — same symlink reason as 9router above. Without it the settings section
# (schema built via schemastery) fails to register and the plugin would not show
# up in the settings panel. Copy the full closure from the 9router node_modules
# (populated just above): a direct `npm install @deepseek-ai/schemastery` here
# won't work because schemastery is a peer of this package and
# @deepseek-ai/dsh-settings@^0.1.0 (also a peer) has no published registry
# version, so npm drops the package instead of fetching its dependency tree.
$pluginCm = Join-Path $repoRoot 'plugins\dsh-compact-model'
if (-not (Test-Path (Join-Path $pluginCm 'node_modules\@deepseek-ai\schemastery'))) {
  $cmNode = Join-Path $pluginCm 'node_modules'
  Write-Host "`n>>> copying schemastery (with deps) into dsh-compact-model" -ForegroundColor Cyan
  foreach ($rel in @('@deepseek-ai\schemastery', '@deepseek-ai\cosmokit', '@standard-schema\spec')) {
    $src = Join-Path $plugin9r ('node_modules\' + $rel)
    $dst = Join-Path $cmNode $rel
    if (Test-Path $src) {
      New-Item -ItemType Directory -Force -Path (Split-Path $dst) | Out-Null
      Copy-Item -Recurse -Force $src $dst
    } else {
      throw "schemastery dependency $rel not found in dsh-web-search-9router node_modules"
    }
  }
}
Add-DshPluginIfMissing 'opencode-zen-compat' (Join-Path $repoRoot 'vendor\opencode-zen-compat')

Write-Host "`nInstallation complete. Restart with: dsh web --no-open" -ForegroundColor Green
