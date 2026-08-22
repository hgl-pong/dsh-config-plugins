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
 * 本插件提供一个 DSH 设置页（命名空间 dsh-web-search-9router），可配置：
 *   - baseURL        调用链接（9Router 服务地址）
 *   - apiKey         API key（secret 字段，设置页隐藏明文）
 *   - searchProvider 默认搜索 provider/model
 * 配置优先级：设置页/entry 配置 > 环境变量 > 内置默认。
 *
 * 环境变量（作为设置页的兜底）：
 *   NINEROUTER_URL               9Router 服务地址（默认 http://localhost:20128）
 *   NINEROUTER_KEY               鉴权 key（9Router 开启 auth 时需要）
 *   NINEROUTER_SEARCH_PROVIDER   默认搜索 provider/model（默认 tavily）
 */

export const name = 'dsh-web-search-9router'
export const inject = ['web']

/** 本 provider 在 `web.searchProvider` 中使用的稳定 id。 */
export const PROVIDER_ID = '9router'

/** 9Router 默认服务地址。 */
export const DEFAULT_NINEROUTER_URL = 'http://localhost:20128'
/** 默认搜索 provider / model（与 9Router 的 `/v1/models/web` 的 id 对齐，如 `tavily`）。 */
export const DEFAULT_SEARCH_PROVIDER = 'tavily'
/** 请求 9Router 时附带的 UA 标识。 */
export const USER_AGENT = 'dsh-web-search-9router/0.1.0'
/** 设置页命名空间（小写 kebab-case）。 */
export const NINEROUTER_SETTINGS_NAMESPACE = 'dsh-web-search-9router'

/** 内置默认值（仅在环境变量和设置均未提供时使用）。
 * apiKey 刻意缺席：role('secret') 字段带默认值会让 redactSecrets 的
 * `set: value !== undefined` 恒为 true，设置页就永远显示“已配置”。 */
export const configDefaults = Object.freeze({
  baseURL: DEFAULT_NINEROUTER_URL,
  searchProvider: DEFAULT_SEARCH_PROVIDER
})

function stringOrUndefined(value) {
  return typeof value === 'string' ? value : undefined
}

function stripTrailingSlashes(value) {
  return value.replace(/\/+$/, '')
}

/** 从环境变量读取配置（可注入 env 便于测试）。 */
export function resolveEnv(env = process.env) {
  const rawURL = stringOrUndefined(env?.NINEROUTER_URL)?.trim()
  const rawProvider = stringOrUndefined(env?.NINEROUTER_SEARCH_PROVIDER)?.trim()
  const rawKey = stringOrUndefined(env?.NINEROUTER_KEY)?.trim()
  const baseURL = stripTrailingSlashes(rawURL || DEFAULT_NINEROUTER_URL)
  const provider = rawProvider || DEFAULT_SEARCH_PROVIDER
  const apiKey = rawKey || undefined
  return { baseURL, provider, apiKey }
}

/**
 * 把一个设置 section（可能来自设置页/entry 配置）解析为 provider 的 options。
 * 优先级：section 显式值 > 环境变量 > 内置默认。所有值都会先归一化。
 * @param section - 当前权威的设置 section（base + 用户覆盖）。
 * @param env - 可注入的环境对象（便于测试）。
 */
export function resolveOptions(section, env = process.env) {
  const ambient = resolveEnv(env)
  const configuredURL = stringOrUndefined(section?.baseURL)?.trim()
  const configuredProvider = stringOrUndefined(section?.searchProvider)?.trim()
  const configuredKey = stringOrUndefined(section?.apiKey)?.trim()
  const baseURL = stripTrailingSlashes(configuredURL || ambient.baseURL)
  const provider = configuredProvider || ambient.provider
  const apiKey = configuredKey || ambient.apiKey
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
    if (!item || typeof item.url !== 'string' || item.url.trim().length === 0) continue
    const url = item.url.trim()
    const publishedAt = typeof item.published_at === 'string' ? item.published_at : item.publishedAt
    sources.push({
      url,
      ...(typeof item.title === 'string' && item.title.length > 0 ? { title: item.title } : {}),
      ...(typeof item.snippet === 'string' && item.snippet.length > 0 ? { snippet: item.snippet } : {}),
      ...(typeof publishedAt === 'string' && publishedAt.length > 0 ? { publishedAt } : {})
    })
  }
  return {
    ...(typeof payload?.answer === 'string' && payload.answer.trim().length > 0 ? { content: payload.answer } : {}),
    sources,
    truncated: false
  }
}

/**
 * 组装 /v1/search 的请求体。把 DSH 的 maxResults 透传给 9Router 的 max_results，
 * 作为成本/延迟优化；web seam 无论 provider 是否返回更多都会强制执行该上限。
 */
export function buildSearchBody(request, provider) {
  const input = request && typeof request === 'object' ? request : {}
  return {
    model: provider,
    query: typeof input.query === 'string' ? input.query : '',
    ...(Number.isInteger(input.maxResults) && input.maxResults > 0 ? { max_results: input.maxResults } : {})
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
    return isHttpURL(baseURL) &&
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
      if (signal?.aborted === true || isAbortError(error)) throw abortError(signal, error, WebError)
      throw new WebError(`9Router returned an unprocessable response body: ${String(error)}`, 'WEB_PROVIDER_ERROR', { cause: error })
    }
    const hasAnswer = typeof payload?.answer === 'string' && payload.answer.trim().length > 0
    if (!hasAnswer && (!Array.isArray(payload?.results) || payload.results.length === 0)) {
      throw new WebError('9Router returned no results for the query', 'WEB_PROVIDER_ERROR')
    }
    return mapNineRouterResponse(payload)
  }
}

export async function apply(ctx, config) {
  // Keep omitted settings absent so environment variables can remain the
  // documented fallback. Schema defaults are intentionally `undefined` below;
  // resolveOptions supplies the built-in defaults only after env resolution.
  const entry = { ...(config ?? {}) }
  let current = () => entry
  // 惰性挂载设置页：仅当 DSH 的 settings 服务与 schema 可用时安装；任何失败
  // （依赖缺失、settings 服务未挂载）都降级为 entry+环境变量，但不静默——
  // 记一条 warn，否则像“本地路径安装导致 peer 解析失败”这类问题无从发现。
  try {
    const { default: z } = await import('@deepseek-ai/schemastery')
    const Config = z.object({
      baseURL: z.string().default(undefined),
      searchProvider: z.string().default(undefined),
      // secret 字段不能带 default：redactSecrets 以 value !== undefined 判定
      // “已配置”，带默认值会让设置页永远显示已配置（官方 web-search-deepseek 同此约定）。
      apiKey: z.string().role('secret')
    })
    // 不 import dsh-settings 的 installSettingsSection（本地路径安装的符号链接
    // 插件解析不了它）；直接等价内联：settings 服务在手，register + watch 即可。
    ctx.inject(['settings'], (sctx) => {
      const scope = sctx.settings.register(NINEROUTER_SETTINGS_NAMESPACE, Config, { base: entry })
      current = () => scope.get()
      scope.watch(() => {})
    })
  } catch (error) {
    ctx.logger?.warn?.(`dsh-web-search-9router: settings section unavailable (${String(error)})`)
  }
  ctx.web.registerSearchProvider(new NineRouterSearchProvider(() => resolveOptions(current())))
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
  return error?.name === 'AbortError'
}

function isHttpURL(value) {
  if (typeof value !== 'string' || value.length === 0 || !URL.canParse(value)) return false
  const protocol = new URL(value).protocol
  return protocol === 'http:' || protocol === 'https:'
}
