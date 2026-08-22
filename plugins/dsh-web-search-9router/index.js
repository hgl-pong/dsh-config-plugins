/**
 * dsh-web-search-9router — DSH plugin.
 *
 * 用 9Router（https://github.com/decolua/9router）替换内置的 DeepSeek 联网搜索 provider。
 *
 * 9Router 暴露 OpenAI 兼容的 `/v1/search` 聚合端点，底层可路由到 Tavily / Exa / Brave /
 * Serper / SearXNG / Google PSE / Linkup / SearchAPI / You.com / Perplexity，也支持 combo
 * 自动降级。搜索是一次独立的 HTTP 调用，不消耗 DeepSeek 模型额度，也不产生模型请求。
 *
 * 通过 `ctx.web.registerSearchProvider(provider)` 把本 provider（id = "9router"）注册到
 * DSH 的 web 能力 seam；cordis.patch.yml 把 `web.searchProvider` 固定为 9router 并禁用
 * `web-search-deepseek`，从而完全替换内置 DeepSeek 搜索。
 *
 * 环境变量：
 *   NINEROUTER_URL               9Router 服务地址（默认 https://ninerouter.com）
 *   NINEROUTER_KEY               鉴权 key（9Router 开启 auth 时需要）
 *   NINEROUTER_SEARCH_PROVIDER   默认搜索 provider/model（默认 tavily）
 */

export const name = 'dsh-web-search-9router'
export const inject = ['web']

/** 本 provider 在 `web.searchProvider` 中使用的稳定 id。 */
export const PROVIDER_ID = '9router'

/** 9Router 默认服务地址。 */
export const DEFAULT_NINEROUTER_URL = 'https://ninerouter.com'
/** 默认搜索 provider / model（与 9Router 的 `/v1/models/web` 的 id 对齐，如 `tavily`）。 */
export const DEFAULT_SEARCH_PROVIDER = 'tavily'
/** 请求 9Router 时附带的 UA 标识。 */
export const USER_AGENT = 'dsh-web-search-9router/0.1.0'

/** 从环境变量读取配置（可注入 env 便于测试）。 */
export function resolveEnv(env = process.env) {
  const baseURL = (env.NINEROUTER_URL || DEFAULT_NINEROUTER_URL).replace(/\/+$/, '')
  const provider = env.NINEROUTER_SEARCH_PROVIDER || DEFAULT_SEARCH_PROVIDER
  const apiKey = env.NINEROUTER_KEY
  return { baseURL, provider, apiKey }
}

/**
 * 把 9Router `/v1/search` 的响应体映射为 DSH 归一化的 WebSearchResult。
 * 9Router 响应：
 *   { provider, query, results: [{ title, url, display_url, snippet, position,
 *       score, published_at, ... }], answer, usage, metrics, errors }
 * `answer` 是 9Router 可选生成的摘要文本，映射为 `content`；`results[]` 映射为 `sources[]`。
 * 由 web seam 负责最终的 maxResults 截断，因此这里 `truncated` 恒为 false。
 */
export function mapNineRouterResponse(payload) {
  const rawResults = Array.isArray(payload?.results) ? payload.results : []
  const sources = []
  for (const item of rawResults) {
    if (!item || typeof item.url !== 'string' || item.url.length === 0) continue
    sources.push({
      url: item.url,
      ...(typeof item.title === 'string' && item.title.length > 0 ? { title: item.title } : {}),
      ...(typeof item.snippet === 'string' && item.snippet.length > 0 ? { snippet: item.snippet } : {}),
      ...(typeof item.published_at === 'string' && item.published_at.length > 0 ? { publishedAt: item.published_at } : {})
    })
  }
  return {
    ...(typeof payload?.answer === 'string' && payload.answer.length > 0 ? { content: payload.answer } : {}),
    sources,
    truncated: false
  }
}

/**
 * 组装 /v1/search 的请求体。把 DSH 的 maxResults 透传给 9Router 的 max_results，
 * 作为成本/延迟优化；web seam 无论 provider 是否返回更多都会强制执行该上限。
 */
export function buildSearchBody(request, provider) {
  return {
    model: provider,
    query: request.query,
    ...(Number.isInteger(request.maxResults) && request.maxResults > 0 ? { max_results: request.maxResults } : {})
  }
}

/** 9Router 搜索 provider。 */
export class NineRouterSearchProvider {
  constructor(resolveOptions) {
    this.resolveOptions = resolveOptions
    this.id = PROVIDER_ID
  }

  /** 纯本地可用性检查：必须有可解析的 baseURL 和搜索 provider。 */
  available() {
    const { baseURL, provider } = this.resolveOptions()
    return typeof baseURL === 'string' && baseURL.length > 0 && URL.canParse(baseURL) &&
      typeof provider === 'string' && provider.length > 0
  }

  async search(request, signal) {
    const { baseURL, provider, apiKey } = this.resolveOptions()
    const WebError = await getWebError()
    const endpoint = `${baseURL}/v1/search`
    const body = buildSearchBody(request, provider)

    const headers = { 'content-type': 'application/json', 'accept': 'application/json', 'user-agent': USER_AGENT }
    if (typeof apiKey === 'string' && apiKey.length > 0) {
      headers.authorization = `Bearer ${apiKey}`
    }

    let response
    try {
      response = await fetch(endpoint, {
        method: 'POST',
        redirect: 'error',
        headers,
        body: JSON.stringify(body),
        ...(signal !== undefined ? { signal } : {})
      })
    } catch (error) {
      if (signal?.aborted === true || isAbortError(error)) throw abortError(signal, error, WebError)
      throw new WebError(`9Router search request failed: ${String(error)}`, 'WEB_PROVIDER_ERROR', { cause: error })
    }

    if (!response.ok) {
      let message = `9Router API error (HTTP ${response.status})`
      try {
        const parsed = await response.json()
        const detail = typeof parsed?.error === 'string' ? parsed.error
          : (typeof parsed?.error?.message === 'string' ? parsed.error.message
            : (typeof parsed?.message === 'string' ? parsed.message : undefined))
        if (typeof detail === 'string' && detail.length > 0) message = detail
      } catch { /* ignore body parse failure on error path */ }
      throw new WebError(message, 'WEB_PROVIDER_ERROR')
    }

    let payload
    try {
      payload = await response.json()
    } catch (error) {
      throw new WebError(`9Router returned an unprocessable response body: ${String(error)}`, 'WEB_PROVIDER_ERROR', { cause: error })
    }
    if (!Array.isArray(payload?.results) || payload.results.length === 0) {
      throw new WebError('9Router returned no results for the query', 'WEB_PROVIDER_ERROR')
    }
    return mapNineRouterResponse(payload)
  }
}

export function apply(ctx) {
  ctx.web.registerSearchProvider(new NineRouterSearchProvider(() => resolveEnv()))
}

// ── 内部工具 ────────────────────────────────────────────────────────────────

/**
 * 惰性解析 DSH 的 WebError，缓存单例。动态 import 让本模块在没有
 * `@deepseek-ai/dsh-web` 的环境（例如独立跑 test.mjs）也能加载，仅在实际
 * 搜索出错时才解析该依赖；DSH 运行时该包必然存在。
 */
let webErrorPromise
function getWebError() {
  webErrorPromise ??= import('@deepseek-ai/dsh-web').then((mod) => mod.WebError).catch((error) => {
    // 依赖缺失时退化为带 code 的普通 Error，避免搜索崩溃。
    return class WebErrorFallback extends Error {
      constructor(message, code, options) {
        super(message, options)
        this.name = 'WebError'
        this.code = code
        if (options?.cause !== undefined) this.cause = options.cause
      }
    }
  })
  return webErrorPromise
}

function abortError(signal, fallback, WebError) {
  return new WebError('9Router search aborted', 'WEB_ABORTED', { cause: signal?.aborted === true ? signal.reason : fallback })
}

function isAbortError(error) {
  return typeof DOMException !== 'undefined' && error instanceof DOMException && error.name === 'AbortError'
}
