import test from 'node:test'
import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { remoteMethods } from '@deepseek-ai/dsh-typert-protocol'
import {
  EDITORS,
  TYPERT_MANIFEST,
  OpenInEditorRuntime,
  editorCandidates,
  isAbsolutePath,
  launchEditor,
  normalizeEditorId,
  resolveConfig,
  apply
} from './index.js'

test('normalizes editor aliases and resolves config precedence', () => {
  assert.equal(normalizeEditorId(' VS-Code '), 'vscode')
  assert.equal(normalizeEditorId('codium'), 'vscodium')
  assert.equal(normalizeEditorId('unknown'), 'unknown')
  assert.deepEqual(resolveConfig({ editor: 'cursor', command: '  my-editor  ', args: ['--reuse', 1] }), {
    editor: 'cursor',
    command: 'my-editor',
    args: ['--reuse']
  })
  assert.equal(resolveConfig({}, { DSH_EDITOR: 'zed' }).editor, 'zed')
  assert.equal(resolveConfig({ editor: 'auto' }, { DSH_EDITOR: 'zed' }).editor, 'zed')
  assert.equal(resolveConfig({ editor: 'cursor' }, { DSH_EDITOR: 'zed' }).editor, 'cursor')
  assert.equal(resolveConfig({ editor: 'auto' }, null).editor, 'auto')
})

test('automatic candidates include standard Windows locations and PATH commands', () => {
  const candidates = editorCandidates('vscode', {
    LOCALAPPDATA: 'C:\\Users\\alice\\AppData\\Local',
    ProgramFiles: 'C:\\Program Files',
    PATH: '"C:\\Tools\\bin";C:\\Other'
  }, 'win32')
  assert.ok(candidates.includes('C:\\Users\\alice\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe'))
  assert.ok(candidates.includes('C:\\Tools\\bin\\code.exe'))
  assert.ok(candidates.includes('code'))
  assert.ok(editorCandidates('vscode', { PATH: 'C:\\Program Files\\Microsoft VS Code\\bin' }, 'win32')
    .includes('C:\\Program Files\\Microsoft VS Code\\Code.exe'))
  assert.equal(new Set(candidates.map((item) => item.toLowerCase())).size, candidates.length)
  assert.ok(EDITORS.length >= 10)
  assert.deepEqual(editorCandidates('vscode', null, 'win32').slice(-2), ['code', 'code-insiders'])
})

test('editor selection can be restricted to one supported editor', () => {
  const candidates = editorCandidates('cursor', {}, 'linux')
  assert.deepEqual(candidates, ['cursor'])
  assert.deepEqual(editorCandidates('not-an-editor', {}, 'linux'), [])
})

test('absolute path validation handles Windows and POSIX paths', () => {
  assert.equal(isAbsolutePath('C:\\work\\repo', 'win32'), true)
  assert.equal(isAbsolutePath('\\\\server\\share\\repo', 'win32'), true)
  assert.equal(isAbsolutePath('relative\\repo', 'win32'), false)
  assert.equal(isAbsolutePath('/work/repo', 'linux'), true)
  assert.equal(isAbsolutePath('relative/repo', 'linux'), false)
})

function fakeChild() {
  const child = new EventEmitter()
  child.killed = false
  child.kill = () => { child.killed = true }
  child.unref = () => { child.unrefCalled = true }
  return child
}

test('launchEditor falls back after a missing executable', async () => {
  const calls = []
  const children = []
  const spawnProcess = (executable, args, options) => {
    calls.push({ executable, args, options })
    const child = fakeChild()
    children.push(child)
    queueMicrotask(() => {
      if (executable === 'missing') child.emit('error', Object.assign(new Error('not found'), { code: 'ENOENT' }))
      else child.emit('spawn')
    })
    return child
  }
  await launchEditor(['missing', 'cursor'], ['--reuse'], 'C:\\repo', undefined, spawnProcess)
  assert.deepEqual(calls.map(({ executable }) => executable), ['missing', 'cursor'])
  assert.deepEqual(calls.at(-1).args, ['--reuse', 'C:\\repo'])
  assert.equal(children.at(-1).unrefCalled, true)
})

test('launchEditor rejects when every candidate is missing', async () => {
  const spawnProcess = (executable) => {
    const child = fakeChild()
    queueMicrotask(() => child.emit('error', Object.assign(new Error(`${executable} missing`), { code: 'ENOENT' })))
    return child
  }
  await assert.rejects(
    launchEditor(['missing-a', 'missing-b'], [], '/repo', undefined, spawnProcess),
    /no supported editor could be launched/
  )
})

test('launchEditor aborts and kills the active child', async () => {
  const controller = new AbortController()
  let child
  const pending = launchEditor(['cursor'], [], '/repo', controller.signal, () => {
    child = fakeChild()
    return child
  })
  controller.abort()
  await assert.rejects(pending, /open request was aborted/)
  assert.equal(child.killed, true)
})

test('Typert manifest and host apply expose the expected Remote endpoint', () => {
  assert.equal(TYPERT_MANIFEST.package, 'dsh-open-in-editor')
  assert.equal(TYPERT_MANIFEST.model.services[0].key, 'openInEditor')
  assert.equal(TYPERT_MANIFEST.invocations[0].id, 'dsh-open-in-editor#openInEditor/open')

  let service
  let manifest
  const ctx = {
    reflect: { provide: (_name, value) => { service = value } },
    effect: (effect) => effect(),
    typert: { register: (value) => { manifest = value; return () => {} } }
  }
  apply(ctx, {})
  assert.ok(service instanceof OpenInEditorRuntime)
  assert.deepEqual(remoteMethods(service), [{ method: 'open', invocation: { kind: 'direct' } }])
  assert.equal(manifest, TYPERT_MANIFEST)
})
