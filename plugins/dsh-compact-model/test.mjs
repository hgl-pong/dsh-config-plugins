import test from 'node:test'
import assert from 'node:assert/strict'
import {
  supportsDisablingReasoning,
  listEligibleModels,
  isEligiblePair,
  applySelection,
  parseSelectionInput,
  buildEngineConfigOverrides,
  applyEngineConfig,
  configDefaults,
  NAMESPACE,
  PROVIDERS_NAMESPACE
} from './index.js'

test('exports stable identifiers', () => {
  assert.equal(NAMESPACE, 'dsh-compact-model')
  assert.equal(PROVIDERS_NAMESPACE, 'llm-pi-ai')
  assert.deepEqual(configDefaults, {
    provider: '',
    model: '',
    thresholdRatio: 0.8,
    retainRatio: 0.16,
    maxTokens: 8192,
    compactionRetries: 1,
    maxOverflowRetries: 1,
    auto: true
  })
})

test('supportsDisablingReasoning: false means reasoning can be off', () => {
  assert.equal(supportsDisablingReasoning(false), true)
})

test('supportsDisablingReasoning: map containing off is allowed', () => {
  assert.equal(supportsDisablingReasoning({ off: null, high: 'high' }), true)
  assert.equal(supportsDisablingReasoning({ off: false, low: 'low' }), true)
})

test('supportsDisablingReasoning: map without off is rejected', () => {
  assert.equal(supportsDisablingReasoning({ high: 'high', max: 'max' }), false)
  assert.equal(supportsDisablingReasoning({ low: 'low', medium: 'medium' }), false)
})

test('supportsDisablingReasoning: undefined / non-object rejected', () => {
  assert.equal(supportsDisablingReasoning(undefined), false)
  assert.equal(supportsDisablingReasoning(null), false)
  assert.equal(supportsDisablingReasoning('high'), false)
})

test('supportsDisablingReasoning: string "off" and array forms accepted', () => {
  assert.equal(supportsDisablingReasoning('off'), true)
  assert.equal(supportsDisablingReasoning(['off', 'high']), true)
  assert.equal(supportsDisablingReasoning(['high', 'max']), false)
})

test('listEligibleModels: only reasoning-off-capable models are listed', () => {
  const providers = {
    agnes: {
      displayName: 'Agnes AI',
      models: [
        { id: 'agnes-2.5-flash', reasoningEfforts: { off: null, high: 'high' } },
        { id: 'agnes-think-only', reasoningEfforts: { high: 'high' } }
      ]
    },
    router: {
      displayName: '9router',
      models: [
        { id: 'cbcn/deepseek-v4-flash', reasoningEfforts: { off: null, high: 'high' } },
        { id: 'plain-model', reasoningEfforts: false },
        { id: 'missing-reasoning' }
      ]
    }
  }
  const eligible = listEligibleModels(providers)
  const ids = eligible.map((item) => `${item.provider}/${item.model}`)
  assert.deepEqual(ids, [
    'agnes/agnes-2.5-flash',
    'router/cbcn/deepseek-v4-flash',
    'router/plain-model'
  ])
  // displayName is carried for UI
  assert.equal(eligible[0].displayName, 'Agnes AI')
})

test('listEligibleModels: handles missing/empty providers', () => {
  assert.deepEqual(listEligibleModels(undefined), [])
  assert.deepEqual(listEligibleModels({}), [])
  assert.deepEqual(listEligibleModels({ p: {} }), [])
})

test('isEligiblePair: accepts reasoning-off-capable pair', () => {
  const providers = {
    agnes: { models: [{ id: 'agnes-2.5-flash', reasoningEfforts: { off: null } }] }
  }
  assert.equal(isEligiblePair(providers, 'agnes', 'agnes-2.5-flash').ok, true)
})

test('isEligiblePair: rejects reasoning-only model', () => {
  const providers = {
    agnes: { models: [{ id: 'm', reasoningEfforts: { high: 'high' } }] }
  }
  const result = isEligiblePair(providers, 'agnes', 'm')
  assert.equal(result.ok, false)
  assert.match(result.reason, /不能用于压缩/)
})

test('applySelection: rewrites provider/model for compaction', () => {
  const options = { provider: 'deepseek', model: 'v4', purpose: 'compaction' }
  const out = applySelection(options, { provider: 'agnes', model: 'agnes-2.5-flash' })
  assert.equal(out.provider, 'agnes')
  assert.equal(out.model, 'agnes-2.5-flash')
})

test('applySelection: leaves non-compaction calls untouched', () => {
  const options = { provider: 'deepseek', model: 'v4', purpose: 'chat' }
  const out = applySelection(options, { provider: 'agnes', model: 'agnes-2.5-flash' })
  assert.equal(out.provider, 'deepseek')
  assert.equal(out.model, 'v4')
})

test('applySelection: empty selection leaves call untouched', () => {
  const options = { provider: 'deepseek', model: 'v4', purpose: 'compaction' }
  const out = applySelection(options, { provider: '', model: '' })
  assert.equal(out.provider, 'deepseek')
  assert.equal(out.model, 'v4')
})

test('parseSelectionInput preserves slashes in model ids', () => {
  assert.deepEqual(parseSelectionInput('router/cbcn/deepseek-v4-flash'), {
    provider: 'router',
    model: 'cbcn/deepseek-v4-flash'
  })
  assert.equal(parseSelectionInput('not-a-pair'), null)
})

test('buildEngineConfigOverrides: maps provider/model to summarization target', () => {
  const overrides = buildEngineConfigOverrides({ provider: 'agnes', model: 'agnes-2.5-flash' })
  assert.equal(overrides.summarizationProvider, 'agnes')
  assert.equal(overrides.summarizationModel, 'agnes-2.5-flash')
  assert.equal(overrides.thresholdRatio, configDefaults.thresholdRatio)
  assert.equal(overrides.retainRatio, configDefaults.retainRatio)
})

test('buildEngineConfigOverrides: applies tuning params and auto', () => {
  const overrides = buildEngineConfigOverrides({
    thresholdRatio: 0.5,
    retainRatio: 0.1,
    maxTokens: 4096,
    compactionRetries: 2,
    maxOverflowRetries: 3,
    auto: false
  })
  assert.equal(overrides.thresholdRatio, 0.5)
  assert.equal(overrides.retainRatio, 0.1)
  assert.equal(overrides.maxTokens, 4096)
  assert.equal(overrides.compactionRetries, 2)
  assert.equal(overrides.maxOverflowRetries, 3)
  assert.equal(overrides.auto, false)
})

test('buildEngineConfigOverrides: falls back when retainRatio >= thresholdRatio', () => {
  const overrides = buildEngineConfigOverrides({ thresholdRatio: 0.3, retainRatio: 0.5 })
  // 非法组合回退到默认安全值，避免引擎运行时报错
  assert.equal(overrides.thresholdRatio, configDefaults.thresholdRatio)
  assert.equal(overrides.retainRatio, configDefaults.retainRatio)
})

test('buildEngineConfigOverrides: empty provider/model yields no summarization pair', () => {
  const overrides = buildEngineConfigOverrides({ provider: '', model: '' })
  assert.equal(overrides.summarizationProvider, undefined)
  assert.equal(overrides.summarizationModel, undefined)
})

test('buildEngineConfigOverrides: rejects invalid numeric ranges', () => {
  const overrides = buildEngineConfigOverrides({
    thresholdRatio: 2,
    retainRatio: -1,
    maxTokens: 0,
    compactionRetries: 1.5,
    maxOverflowRetries: -2
  })
  assert.equal(overrides.thresholdRatio, configDefaults.thresholdRatio)
  assert.equal(overrides.retainRatio, configDefaults.retainRatio)
  assert.equal(overrides.maxTokens, configDefaults.maxTokens)
  assert.equal(overrides.compactionRetries, configDefaults.compactionRetries)
  assert.equal(overrides.maxOverflowRetries, configDefaults.maxOverflowRetries)
})

test('applyEngineConfig clears a previous summarization override', () => {
  const engine = { config: { summarizationProvider: 'old', summarizationModel: 'old-model' } }
  const ctx = { get: () => engine }
  assert.equal(applyEngineConfig(ctx, { provider: '', model: '' }), true)
  assert.equal(engine.config.summarizationProvider, '')
  assert.equal(engine.config.summarizationModel, '')
})

test('applyEngineConfig: merges overrides into compaction engine config', () => {
  const engine = { config: { thresholdRatio: 0.8, retainRatio: 0.16, maxTokens: 8192, modelPolicies: [] } }
  const ctx = { get: (name) => (name === 'compaction' ? engine : undefined) }
  const ok = applyEngineConfig(ctx, { provider: 'agnes', model: 'm', maxTokens: 2048 })
  assert.equal(ok, true)
  assert.equal(engine.config.summarizationProvider, 'agnes')
  assert.equal(engine.config.summarizationModel, 'm')
  assert.equal(engine.config.maxTokens, 2048)
  assert.equal(engine.config.thresholdRatio, 0.8)
  // modelPolicies 保留
  assert.deepEqual(engine.config.modelPolicies, [])
})

test('applyEngineConfig: no-op when compaction service is absent', () => {
  assert.equal(applyEngineConfig({ get: () => undefined }, { provider: 'agnes', model: 'm' }), false)
  assert.equal(applyEngineConfig({ get: () => ({}) }, { provider: 'agnes', model: 'm' }), false)
})
