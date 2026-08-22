import { spawn } from 'node:child_process'
import { isAbsolute as posixIsAbsolute, win32 } from 'node:path'
import { Remote, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol'

export const name = 'dsh-open-in-editor'
export const inject = ['typert']

export const configDefaults = Object.freeze({
  editor: 'auto',
  command: '',
  args: []
})

/** Ordered editor definitions used by automatic detection. */
export const EDITORS = Object.freeze([
  { id: 'vscode', label: 'VS Code', commands: ['code', 'code-insiders'], windows: [['Microsoft VS Code', 'Code.exe'], ['Microsoft VS Code Insiders', 'Code - Insiders.exe']] },
  { id: 'cursor', label: 'Cursor', commands: ['cursor'], windows: [['Cursor', 'Cursor.exe']] },
  { id: 'windsurf', label: 'Windsurf', commands: ['windsurf'], windows: [['Windsurf', 'Windsurf.exe']] },
  { id: 'trae', label: 'Trae', commands: ['trae'], windows: [['Trae', 'Trae.exe'], ['Trae CN', 'Trae.exe'], ['Trae CN', 'Trae CN.exe']] },
  { id: 'kiro', label: 'Kiro', commands: ['kiro'], windows: [['Kiro', 'Kiro.exe']] },
  { id: 'codebuddy', label: 'CodeBuddy', commands: ['codebuddy'], windows: [['CodeBuddy', 'CodeBuddy.exe']] },
  { id: 'antigravity', label: 'Antigravity', commands: ['antigravity'], windows: [['Antigravity', 'Antigravity.exe']] },
  { id: 'vscodium', label: 'VSCodium', commands: ['codium'], windows: [['VSCodium', 'VSCodium.exe']] },
  { id: 'zed', label: 'Zed', commands: ['zed'], windows: [['Zed', 'Zed.exe']] },
  { id: 'sublime', label: 'Sublime Text', commands: ['subl'], windows: [['Sublime Text', 'sublime_text.exe']] },
  { id: 'lapce', label: 'Lapce', commands: ['lapce'], windows: [['Lapce', 'lapce.exe']] },
  { id: 'fleet', label: 'Fleet', commands: ['fleet'], windows: [['JetBrains', 'Fleet.exe']] },
  { id: 'idea', label: 'IntelliJ IDEA', commands: ['idea'], windows: [] },
  { id: 'webstorm', label: 'WebStorm', commands: ['webstorm'], windows: [] },
  { id: 'pycharm', label: 'PyCharm', commands: ['pycharm'], windows: [] },
  { id: 'nvim', label: 'Neovim', commands: ['nvim'], windows: [] }
])

const editorAliases = new Map([
  ['auto', 'auto'],
  ['code', 'vscode'],
  ['vs-code', 'vscode'],
  ['visual-studio-code', 'vscode'],
  ['vscode-insiders', 'vscode'],
  ['codium', 'vscodium'],
  ['sublime-text', 'sublime'],
  ['intellij', 'idea'],
  ['intellij-idea', 'idea'],
  ['neovim', 'nvim']
])

const editorById = new Map(EDITORS.map((editor) => [editor.id, editor]))

export function normalizeEditorId(value) {
  const text = typeof value === 'string' ? value.trim().toLowerCase() : ''
  return editorAliases.get(text) ?? text
}

export function resolveConfig(config, env = process.env) {
  const input = config && typeof config === 'object' ? config : {}
  const environment = env && typeof env === 'object' ? env : process.env
  const envEditor = typeof environment.DSH_EDITOR === 'string' ? environment.DSH_EDITOR : ''
  const configuredEditor = normalizeEditorId(input.editor)
  const editor = (configuredEditor && configuredEditor !== 'auto')
    ? configuredEditor
    : (normalizeEditorId(envEditor) || configuredEditor || configDefaults.editor)
  const command = typeof input.command === 'string' ? input.command.trim() : ''
  const args = Array.isArray(input.args)
    ? input.args.filter((arg) => typeof arg === 'string')
    : [...configDefaults.args]
  return { editor, command, args }
}

function pathValue(env) {
  const value = env.PATH ?? env.Path ?? env.path ?? ''
  return typeof value === 'string' ? value : ''
}

function windowsRoots(env) {
  const localAppData = typeof env.LOCALAPPDATA === 'string' ? env.LOCALAPPDATA : undefined
  return [
    localAppData,
    localAppData === undefined ? undefined : win32.join(localAppData, 'Programs'),
    env.ProgramW6432,
    env.ProgramFiles ?? 'C:\\Program Files',
    env['ProgramFiles(x86)'],
    'D:\\Programs'
  ].filter((root) => typeof root === 'string' && root.length > 0)
}

function addUnique(list, candidate, caseInsensitive = false) {
  const key = caseInsensitive ? candidate.toLowerCase() : candidate
  if (!list.some((item) => (caseInsensitive ? item.toLowerCase() : item) === key)) list.push(candidate)
}

function windowsCandidates(editor, env) {
  const candidates = []
  for (const root of windowsRoots(env)) {
    for (const [directory, executable] of editor.windows) {
      addUnique(candidates, win32.join(root, directory, executable), true)
    }
  }
  for (const raw of pathValue(env).split(';')) {
    const entry = raw.trim().replace(/^"|"$/g, '')
    if (entry === '') continue
    for (const command of editor.commands) addUnique(candidates, win32.join(entry, command + '.exe'), true)
    if (win32.basename(entry).toLowerCase() === 'bin') {
      const root = win32.resolve(entry, '..')
      for (const [directory, executable] of editor.windows) {
        // PATH may point directly at an editor's own `bin` directory.
        addUnique(candidates, win32.join(root, executable), true)
        addUnique(candidates, win32.join(root, directory, executable), true)
      }
    }
  }
  return candidates
}

/** Return executable candidates in preference order for one configured editor. */
export function editorCandidates(editorId = 'auto', env = process.env, platform = process.platform) {
  const normalized = normalizeEditorId(editorId) || 'auto'
  const environment = env && typeof env === 'object' ? env : process.env
  const editors = normalized === 'auto'
    ? EDITORS
    : (editorById.has(normalized) ? [editorById.get(normalized)] : [])
  const candidates = []
  for (const editor of editors) {
    if (platform === 'win32') {
      for (const candidate of windowsCandidates(editor, environment)) addUnique(candidates, candidate, true)
    }
    for (const command of editor.commands) addUnique(candidates, command, platform === 'win32')
  }
  return candidates
}

export function isAbsolutePath(value, platform = process.platform) {
  if (typeof value !== 'string' || value.length === 0) return false
  return platform === 'win32' ? win32.isAbsolute(value) : posixIsAbsolute(value)
}

function missingExecutable(error) {
  return error?.code === 'ENOENT' || error?.code === 'ENOTDIR'
}

/** Spawn the first working editor candidate and resolve after it emits `spawn`. */
export function launchEditor(candidates, args, path, signal, spawnProcess = spawn) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted === true) {
      reject(new Error('dsh-open-in-editor: the open request was aborted'))
      return
    }
    if (!Array.isArray(candidates) || candidates.length === 0) {
      reject(new Error('dsh-open-in-editor: no editor candidates were configured'))
      return
    }

    let index = 0
    let settled = false
    let child
    const finish = (error) => {
      if (settled) return
      settled = true
      signal?.removeEventListener('abort', abort)
      if (error) reject(error)
      else resolve()
    }
    const abort = () => {
      child?.kill()
      finish(new Error('dsh-open-in-editor: the open request was aborted'))
    }
    const tryNext = (lastError) => {
      if (settled) return
      if (index >= candidates.length) {
        const detail = lastError?.message ? `: ${lastError.message}` : ''
        finish(new Error(`dsh-open-in-editor: no supported editor could be launched${detail}`))
        return
      }
      const executable = candidates[index++]
      try {
        child = spawnProcess(executable, [...args, path], {
          detached: true,
          stdio: 'ignore',
          windowsHide: false
        })
      } catch (error) {
        if (missingExecutable(error)) tryNext(error)
        else finish(error)
        return
      }
      child.once('error', (error) => {
        if (missingExecutable(error)) tryNext(error)
        else finish(error)
      })
      child.once('spawn', () => {
        child.unref()
        finish()
      })
    }
    signal?.addEventListener('abort', abort, { once: true })
    tryNext()
  })
}

const pathSchema = {
  parse(value) {
    if (typeof value !== 'string' || value.length === 0) throw new TypeError('path must be a non-empty string')
    return value
  }
}

const openResultSchema = {
  parse(value) {
    if (!value || value.opened !== true) throw new TypeError('invalid open result')
    return { opened: true }
  }
}

export const TYPERT_MANIFEST = {
  package: 'dsh-open-in-editor',
  face: 'host',
  schemas: [],
  model: {
    services: [{
      key: 'openInEditor',
      exportName: 'OpenInEditorRuntime',
      description: 'Open one workspace directory in a detected editor.',
      tags: [],
      members: [{
        kind: 'method',
        name: 'open',
        signature: 'open(path: string, signal?: AbortSignal): Promise<{ opened: true }>'
      }],
      types: []
    }],
    events: [],
    objects: []
  },
  invocations: [{
    id: 'dsh-open-in-editor#openInEditor/open',
    service: 'openInEditor',
    namespace: 'openInEditor',
    method: 'open',
    invocation: { kind: 'direct' },
    parameters: [{
      name: 'path',
      wire: 'path',
      source: 'json',
      codec: { mode: 'strict', typeSymbol: 'dsh-open-in-editor#Path', schema: pathSchema }
    }],
    cancellation: { parameter: 'signal' },
    result: {
      mode: 'strict',
      typeSymbol: 'dsh-open-in-editor#OpenResult',
      schema: openResultSchema
    }
  }]
}

export class OpenInEditorRuntime extends TypertRemoteService {
  constructor(ctx, config) {
    super(ctx, 'openInEditor')
    this.config = config
  }

  async open(path, signal) {
    const platform = process.platform
    if (!isAbsolutePath(path, platform)) {
      throw new Error(`dsh-open-in-editor: refusing a relative path "${path}"`)
    }
    const candidates = this.config.command
      ? [this.config.command]
      : editorCandidates(this.config.editor, process.env, platform)
    await launchEditor(candidates, this.config.args, path, signal)
    return { opened: true }
  }
}

const remoteMarks = []
function markRemote(proto, method) {
  const context = {
    kind: 'method',
    name: method,
    private: false,
    static: false,
    addInitializer(fn) {
      remoteMarks.push({ proto, method, fn })
    }
  }
  Remote(method)(proto[method], context)
}

function runRemoteMarks(instance) {
  const proto = Object.getPrototypeOf(instance)
  for (const mark of remoteMarks) {
    if (mark.proto === proto) mark.fn.call(instance)
  }
}

markRemote(OpenInEditorRuntime.prototype, 'open')

export function apply(ctx, config) {
  const resolved = resolveConfig(config)
  const runtime = new OpenInEditorRuntime(ctx, resolved)
  runRemoteMarks(runtime)
  ctx.effect(() => {
    const dispose = ctx.typert.register(TYPERT_MANIFEST)
    return () => { void dispose() }
  }, 'dsh-open-in-editor: typert manifest')
}
