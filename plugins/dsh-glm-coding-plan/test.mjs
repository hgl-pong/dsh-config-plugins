import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

import { GLM_PROVIDER, GLM_MODELS, isGlmCodingRoute } from './index.js'

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

test('provider metadata: id / env / protocol / endpoint', () => {
  assert.equal(GLM_PROVIDER.id, 'glm-coding-plan')
  assert.equal(GLM_PROVIDER.apiKeyEnv, 'GLM_CODING_PLAN_API_KEY')
  assert.equal(GLM_PROVIDER.api, 'openai-completions')
  assert.equal(GLM_PROVIDER.baseURL, 'https://open.bigmodel.cn/api/coding/paas/v4')
})

test('model list is exactly the six coding-plan models with verified facts', () => {
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

// GLM-5.3 系思考常开：off 必须降级为 low（compaction 发 off 不得变成 thinking disabled）。
// glm-5.2 及更早支持关闭：off 必须是 null。
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

test('route matcher targets only the glm-coding-plan route', () => {
  assert.equal(isGlmCodingRoute('glm-coding-plan'), true)
  assert.equal(isGlmCodingRoute('GLM-CODING-PLAN'), true)
  assert.equal(isGlmCodingRoute('glm-coding-plan-ext'), true)
  assert.equal(isGlmCodingRoute('glm-5.3'), false)
  assert.equal(isGlmCodingRoute('zai'), false)
  assert.equal(isGlmCodingRoute('deepseek'), false)
  assert.equal(isGlmCodingRoute('opencode-go-plus'), false)
  assert.equal(isGlmCodingRoute(undefined), false)
})

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

test('cordis.patch.yml lists exactly the same model ids as index.js', () => {
  const yamlIds = [...patch.matchAll(/^\s{8}- id: (\S+)$/gm)].map((m) => m[1])
  assert.deepEqual(yamlIds.sort(), [...GLM_MODELS].map((m) => m.id).sort())
})

test('cordis.patch.yml maps off to low for the 5.3 pair and null for the rest', () => {
  assert.equal((patch.match(/off: low/g) ?? []).length, 2, 'exactly glm-5.3 and glm-5.3-flash')
  assert.equal((patch.match(/off: null/g) ?? []).length, 4, 'glm-5.2/5.1/5-turbo/4.7')
})

test('cordis.patch.yml never sets the withheld zaiToolStream compat field', () => {
  // dsh-llm-pi-ai resolveModelCompat refuses fields its gate withholds;
  // zaiToolStream is "withhold" — writing it would reject the whole provider.
  assert.doesNotMatch(patch, /zaiToolStream/)
})

test('no secret literals in any shipped file', () => {
  for (const name of ['index.js', 'cordis.patch.yml', 'package.json', 'README.md', 'test.mjs']) {
    const text = read(name)
    assert.doesNotMatch(text, /sk-[A-Za-z0-9]{8,}/, `${name} contains a key literal`)
    assert.doesNotMatch(text, /Bearer\s+[A-Za-z0-9._-]{8,}/, `${name} contains a bearer token`)
  }
})

test('README documents endpoint, env var, and the off-to-low rationale', () => {
  assert.match(readme, /https:\/\/open\.bigmodel\.cn\/api\/coding\/paas\/v4/)
  assert.match(readme, /GLM_CODING_PLAN_API_KEY/)
  assert.match(readme, /off.*low|low.*off/)
})