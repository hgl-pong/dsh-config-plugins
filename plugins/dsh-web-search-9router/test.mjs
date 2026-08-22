import test from 'node:test'
import assert from 'node:assert/strict'
import {
  PROVIDER_ID,
  DEFAULT_NINEROUTER_URL,
  DEFAULT_SEARCH_PROVIDER,
  resolveEnv,
  resolveOptions,
  mapNineRouterResponse,
  buildSearchBody,
  NineRouterSearchProvider
} from './index.js'

test('exports stable provider id', () => {
  assert.equal(PROVIDER_ID, '9router')
})

test('resolveEnv reads env with defaults and strips trailing slashes', () => {
  const env = resolveEnv({ NINEROUTER_URL: 'https://example.com/', NINEROUTER_KEY: 'k', NINEROUTER_SEARCH_PROVIDER: 'exa' })
  assert.equal(env.baseURL, 'https://example.com')
  assert.equal(env.apiKey, 'k')
  assert.equal(env.provider, 'exa')

  const def = resolveEnv({})
  assert.equal(def.baseURL, DEFAULT_NINEROUTER_URL)
  assert.equal(def.provider, DEFAULT_SEARCH_PROVIDER)
  assert.equal(def.apiKey, undefined)
})

test('resolveEnv tolerates malformed non-string environment values', () => {
  const env = resolveEnv({ NINEROUTER_URL: 42, NINEROUTER_KEY: null, NINEROUTER_SEARCH_PROVIDER: '  ' })
  assert.equal(env.baseURL, DEFAULT_NINEROUTER_URL)
  assert.equal(env.provider, DEFAULT_SEARCH_PROVIDER)
  assert.equal(env.apiKey, undefined)
})

test('resolveOptions prefers settings section over env and defaults', () => {
  const env = { NINEROUTER_URL: 'https://env.example/', NINEROUTER_KEY: 'env-key', NINEROUTER_SEARCH_PROVIDER: 'exa' }
  // 设置页/entry 值优先
  const fromSettings = resolveOptions({ baseURL: 'https://cfg.example/', searchProvider: 'brave', apiKey: 'cfg-key' }, env)
  assert.deepEqual(fromSettings, { baseURL: 'https://cfg.example', provider: 'brave', apiKey: 'cfg-key' })
  // section 为空时回退到环境变量
  const fromEnv = resolveOptions({}, env)
  assert.deepEqual(fromEnv, { baseURL: 'https://env.example', provider: 'exa', apiKey: 'env-key' })
  // 两者都为空时用内置默认
  const fromDefaults = resolveOptions({}, {})
  assert.equal(fromDefaults.baseURL, DEFAULT_NINEROUTER_URL)
  assert.equal(fromDefaults.provider, DEFAULT_SEARCH_PROVIDER)
})

test('mapNineRouterResponse maps results and answer', () => {
  const out = mapNineRouterResponse({
    answer: 'summary',
    results: [
      { title: 'T', url: 'https://a.example', snippet: 's', published_at: '2024-01-01' },
      { url: 'https://b.example', publishedAt: '2024-01-02' },
      { url: '' },
      null
    ]
  })
  assert.equal(out.content, 'summary')
  assert.equal(out.truncated, false)
  assert.equal(out.sources.length, 2)
  assert.deepEqual(out.sources[0], { url: 'https://a.example', title: 'T', snippet: 's', publishedAt: '2024-01-01' })
  assert.deepEqual(out.sources[1], { url: 'https://b.example', publishedAt: '2024-01-02' })
})

test('mapNineRouterResponse omits answer when absent and tolerates malformed payload', () => {
  const out = mapNineRouterResponse({})
  assert.equal('content' in out, false)
  assert.deepEqual(out.sources, [])
  assert.equal(out.truncated, false)
})

test('buildSearchBody passes maxResults through', () => {
  assert.deepEqual(buildSearchBody({ query: 'q', maxResults: 7 }, 'tavily'), { model: 'tavily', query: 'q', max_results: 7 })
  assert.deepEqual(buildSearchBody({ query: 'q' }, 'tavily'), { model: 'tavily', query: 'q' })
})

test('map-only 9Router answers are accepted by search', async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => ({
    ok: true,
    json: async () => ({ answer: 'answer', results: [] })
  })
  try {
    const provider = new NineRouterSearchProvider(() => ({ baseURL: 'http://x', provider: 'tavily' }))
    const result = await provider.search({ query: 'q' })
    assert.equal(result.content, 'answer')
    assert.deepEqual(result.sources, [])
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('search accepts an answer payload without a results field', async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => ({ ok: true, json: async () => ({ answer: 'answer' }) })
  try {
    const provider = new NineRouterSearchProvider(() => ({ baseURL: 'http://x', provider: 'tavily' }))
    const result = await provider.search({ query: 'q' })
    assert.equal(result.content, 'answer')
    assert.deepEqual(result.sources, [])
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('available() requires a parseable baseURL and provider', () => {
  assert.equal(new NineRouterSearchProvider(() => ({ baseURL: 'http://x', provider: 'tavily' })).available(), true)
  assert.equal(new NineRouterSearchProvider(() => ({ baseURL: 'not a url', provider: 'tavily' })).available(), false)
  assert.equal(new NineRouterSearchProvider(() => ({ baseURL: 'file:///tmp/x', provider: 'tavily' })).available(), false)
  assert.equal(new NineRouterSearchProvider(() => ({ baseURL: 'http://x', provider: '' })).available(), false)
})
