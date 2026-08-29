import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

import { GLM_PROVIDER, GLM_MODELS, isGlmCodingRoute, AGNES_PROVIDER, isAgnesRoute, tuneAgnesOptions } from './index.js'

const here = dirname(fileURLToPath(import.meta.url))
const read = (name) => readFileSync(join(here, name), 'utf8')
const patch = read('cordis.patch.yml')
const pkg = JSON.parse(read('package.json'))
const readme = read('README.md')

// ---- 权威模型事实（PRD 模型表 + pi-ai 内置 zai 目录已验证形状 + 官方 5.3 模型页）----
const MODEL_FACTS = {
  'glm-5.3': {
    contextWindow: 1000000, maxTokens: 131072, input: ['text'],
    reasoningEfforts: { off: 'low', low: 'low', medium: 'high', high: 'high', max: 'max' },
    supportsReasoningEffort: true,
  },
  'glm-5.3-flash': {
    contextWindow: 1000000, maxTokens: 131072, input: ['text', 'image'],
    reasoningEfforts: { off: 'low', low: 'low', medium: 'high', high: 'high', max: 'max' },
    supportsReasoningEffort: true,
  },
  'glm-5.2': {
    contextWindow: 1000000, maxTokens: 131072, input: ['text'],
    reasoningEfforts: { off: null, low: 'high', medium: 'high', high: 'high', max: 'max' },
    supportsReasoningEffort: true,
  },
  'glm-5.1': {
    contextWindow: 200000, maxTokens: 131072, input: ['text'],
    reasoningEfforts: { off: null, high: 'high' },
    supportsReasoningEffort: false,
  },
  'glm-5-turbo': {
    contextWindow: 200000, maxTokens: 131072, input: ['text'],
    reasoningEfforts: { off: null, high: 'high' },
    supportsReasoningEffort: false,
  },
  'glm-4.7': {
    contextWindow: 204800, maxTokens: 131072, input: ['text'],
    reasoningEfforts: { off: null, high: 'high' },
    supportsReasoningEffort: false,
  },
}

test('glm provider metadata: id / env / protocol / endpoint', () => {
  assert.equal(GLM_PROVIDER.id, 'glm-coding-plan')
  assert.equal(GLM_PROVIDER.apiKeyEnv, 'GLM_CODING_PLAN_API_KEY')
  assert.equal(GLM_PROVIDER.api, 'openai-completions')
  assert.equal(GLM_PROVIDER.baseURL, 'https://open.bigmodel.cn/api/coding/paas/v4')
})

test('glm model list is exactly the six coding-plan models with verified facts', () => {
  assert.deepEqual([...GLM_MODELS].map((m) => m.id).sort(), Object.keys(MODEL_FACTS).sort())
  for (const model of GLM_MODELS) {
    const facts = MODEL_FACTS[model.id]
    assert.ok(facts, `unexpected model ${model.id}`)
    assert.equal(model.contextWindow, facts.contextWindow, `${model.id} contextWindow`)
    assert.equal(model.maxTokens, facts.maxTokens, `${model.id} maxTokens`)
    assert.deepEqual([...model.input], facts.input, `${model.id} input`)
    assert.deepEqual({ ...model.reasoningEfforts }, facts.reasoningEfforts, `${model.id} reasoningEfforts`)
    assert.equal(model.supportsReasoningEffort, facts.supportsReasoningEffort, `${model.id} supportsReasoningEffort`)
  }
})

test('compaction safety: off maps to low on 5.3 pair, null on the rest', () => {
  for (const id of ['glm-5.3', 'glm-5.3-flash']) {
    const row = GLM_MODELS.find((m) => m.id === id)
    assert.equal(row.reasoningEfforts.off, 'low', `${id} off must degrade to low`)
    assert.notEqual(row.reasoningEfforts.off, null)
  }
  for (const id of ['glm-5.2', 'glm-5.1', 'glm-5-turbo', 'glm-4.7']) {
    const row = GLM_MODELS.find((m) => m.id === id)
    assert.equal(row.reasoningEfforts.off, null, `${id} off must disable thinking`)
  }
})

test('glm route matcher targets only the glm-coding-plan route', () => {
  assert.equal(isGlmCodingRoute('glm-coding-plan'), true)
  assert.equal(isGlmCodingRoute('GLM-CODING-PLAN'), true)
  assert.equal(isGlmCodingRoute('glm-coding-plan-ext'), true)
  assert.equal(isGlmCodingRoute('glm-5.3'), false)
  assert.equal(isGlmCodingRoute('zai'), false)
  assert.equal(isGlmCodingRoute('deepseek'), false)
  assert.equal(isGlmCodingRoute('opencode-go-plus'), false)
  assert.equal(isGlmCodingRoute(undefined), false)
})

// ---- Agnes（已整合的原 dsh-agnes-provider 功能）----
test('agnes provider metadata: id / env / protocol / endpoint', () => {
  assert.equal(AGNES_PROVIDER.id, 'agnes')
  assert.equal(AGNES_PROVIDER.apiKeyEnv, 'AGNES_API_KEY')
  assert.equal(AGNES_PROVIDER.api, 'openai-completions')
  assert.equal(AGNES_PROVIDER.baseURL, 'https://apihub.agnes-ai.com/v1')
})

test('agnes route matcher targets agnes routes only', () => {
  assert.equal(isAgnesRoute('agnes'), true)
  assert.equal(isAgnesRoute('agnes-2.5-flash'), true)
  assert.equal(isAgnesRoute('agnes-official'), true)
  assert.equal(isAgnesRoute('opencode-go-plus'), false)
  assert.equal(isAgnesRoute('deepseek-v4-flash'), false)
  assert.equal(isAgnesRoute(undefined), false)
})

test('agnes thinking: enables for any non-off reasoning effort', () => {
  const opts = { provider: 'agnes', reasoningEffort: 'high' }
  tuneAgnesOptions(opts)
  assert.equal(opts.chatTemplateKwargs.enable_thinking, true)
  assert.equal(opts.chat_template_kwargs.enable_thinking, true)
})

test('agnes thinking: disables for off reasoning effort (compaction path)', () => {
  const opts = { provider: 'agnes', purpose: 'compaction', reasoningEffort: 'off' }
  tuneAgnesOptions(opts)
  assert.equal(opts.chatTemplateKwargs.enable_thinking, false)
  assert.equal(opts.chat_template_kwargs.enable_thinking, false)
  assert.equal(opts.provider, 'agnes')
  assert.equal(opts.purpose, 'compaction')
})

test('agnes keeps existing chat_template_kwargs intact', () => {
  const opts = { provider: 'agnes', reasoningEffort: 'high', chatTemplateKwargs: { foo: 1 } }
  tuneAgnesOptions(opts)
  assert.equal(opts.chatTemplateKwargs.enable_thinking, true)
  assert.equal(opts.chatTemplateKwargs.foo, 1)
})

test('agnes supports the snake-case kwargs shape and case-insensitive off', () => {
  const opts = { provider: 'agnes', reasoningEffort: 'OFF', chat_template_kwargs: { foo: 1 } }
  tuneAgnesOptions(opts)
  assert.equal(opts.chatTemplateKwargs.foo, 1)
  assert.equal(opts.chatTemplateKwargs.enable_thinking, false)
  assert.equal(opts.chat_template_kwargs, opts.chatTemplateKwargs)
})

test('agnes replaces malformed kwargs containers instead of throwing', () => {
  const opts = { provider: 'agnes', reasoningEffort: 'high', chatTemplateKwargs: 'invalid' }
  tuneAgnesOptions(opts)
  assert.equal(opts.chatTemplateKwargs.enable_thinking, true)
})

test('agnes leaves non-Agnes options untouched', () => {
  const opts = { provider: 'deepseek-v4-flash', reasoningEffort: 'max' }
  tuneAgnesOptions(opts)
  assert.deepEqual(opts, { provider: 'deepseek-v4-flash', reasoningEffort: 'max' })
})

// ---- 产物结构（cordis.patch.yml / package.json / README）----
test('package.json declares the bundle patch and zero deps', () => {
  assert.equal(pkg.name, 'dsh-glm-coding-plan')
  assert.equal(pkg.dsh?.bundle?.patch, './cordis.patch.yml')
  assert.equal(pkg.type, 'module')
  assert.equal(pkg.scripts?.test, 'node --test test.mjs')
  assert.deepEqual(Object.keys(pkg.dependencies ?? {}), [])
})

test('cordis.patch.yml registers the loader row and the llm-pi-ai provider', () => {
  assert.match(patch, /- insert:\s*\n\s*- id: dsh-glm-coding-plan\s*\n\s*name: dsh-glm-coding-plan/)
  assert.match(patch, /- id: llm-pi-ai\s*\n\s*name: '@deepseek-ai\/dsh-llm-pi-ai'/)
  assert.match(patch, /^\s{6}glm-coding-plan:\s*$/m)
  assert.match(patch, /apiKeyEnv: GLM_CODING_PLAN_API_KEY/)
  assert.match(patch, /api: openai-completions/)
  assert.match(patch, /baseURL: https:\/\/open\.bigmodel\.cn\/api\/coding\/paas\/v4/)
})

test('cordis.patch.yml hosts BOTH agnes and glm providers in ONE llm-pi-ai entry', () => {
  assert.match(patch, /^\s{6}agnes:\s*$/m)
  assert.match(patch, /apiKeyEnv: AGNES_API_KEY/)
  assert.match(patch, /baseURL: https:\/\/apihub\.agnes-ai\.com\/v1/)
  assert.match(patch, /compat: \{ thinkingFormat: chat-template, supportsReasoningEffort: false \}/)
})

test('cordis.patch.yml lists exactly the same glm model ids as index.js', () => {
  const yamlIds = [...patch.matchAll(/^\s{8}- id: (\S+)$/gm)].map((m) => m[1])
  const expected = [...GLM_MODELS].map((m) => m.id).concat(['agnes-2.5-flash']).sort()
  assert.deepEqual(yamlIds.sort(), expected)
})

test('cordis.patch.yml maps off to low for the 5.3 pair and null for the rest', () => {
  assert.equal((patch.match(/off: low/g) ?? []).length, 2, 'exactly glm-5.3 and glm-5.3-flash')
  assert.equal((patch.match(/off: null/g) ?? []).length, 5, 'glm-5.2/5.1/5-turbo/4.7 + agnes')
})

test('cordis.patch.yml never sets the withheld zaiToolStream compat field', () => {
  assert.doesNotMatch(patch, /zaiToolStream/)
})

test('no secret literals in any shipped file', () => {
  for (const name of ['index.js', 'cordis.patch.yml', 'package.json', 'README.md', 'test.mjs']) {
    const text = read(name)
    assert.doesNotMatch(text, /sk-[A-Za-z0-9]{8,}/, `${name} contains a key literal`)
    assert.doesNotMatch(text, /Bearer\s+[A-Za-z0-9._-]{8,}/, `${name} contains a bearer token`)
  }
})

test('README documents both providers, endpoints, env vars, and off-to-low rationale', () => {
  assert.match(readme, /https:\/\/open\.bigmodel\.cn\/api\/coding\/paas\/v4/)
  assert.match(readme, /GLM_CODING_PLAN_API_KEY/)
  assert.match(readme, /AGNES_API_KEY/)
  assert.match(readme, /apihub\.agnes-ai\.com/)
  assert.match(readme, /off.*low|low.*off/)
})