/**
 * dsh-compact-model — DSH plugin.
 *
 * 控制 ACP 压缩(compaction / compact)使用的模型与 provider。
 *
 * 需求：设置 compact 的模型和 provider 时，只能选择“支持关闭推理”的模型。
 * 关闭推理意味着模型必须能把 reasoning_effort 置为 "off" —— 即模型在
 * `llm-pi-ai.providers[*].models[*].reasoningEfforts` 里要么是 `false`（根本不
 * 支持推理），要么是一个包含 `off` 键的映射（如 `{ off: null, high: high }`）。
 * 否则 ACP 压缩发送 `reasoning_effort:"off"` 会被 pi-ai 校验拒绝并报
 * "does not support reasoning effort off"。
 *
 * 工作方式：
 *   1. 注册 settings 命名空间 `dsh-compact-model`（字段 provider / model），
 *      用于持久化选择，并暴露给设置页。
 *   2. 提供一个 `/compact-model` 命令：列出所有满足“可关闭推理”的
 *      provider/model 组合供选择，并把选择写入该命名空间。
 *   3. 运行时生效：监听 `llm/stream` 瀑布流（waterfall），当
 *      `options.purpose === 'compaction'` 时把 provider/model 改写为所选组合。
 *      `ctx.llm.stream` 的实现是 `ctx.waterfall(this, "llm/stream", options,
 *      () => this.adapterStream(options, prepared))` —— listener 可改写
 *      `options`，随后 `adapterStream` 用改写后的 `options.provider` 解析
 *      adapter（`prepared?.registration ?? this.registration(options.provider)`）。
 *      对未 prepare 的调用（直接 ctx.llm.stream），改写 provider 会真正切换路由；
 *      对已 prepare 的调用，registration 已提前绑定，改写模型 id 仍生效。
 *
 * 枚举来源：`llm-pi-ai` settings 命名空间（`ctx.settings.get('llm-pi-ai')`）
 * 的 `providers` dict —— 每个 provider 的 `models[]` 数组。
 */

export const name = 'dsh-compact-model'
export const inject = ['llm', 'settings', 'commands']

/** 本插件自己的 settings 命名空间（小写 kebab-case）。 */
export const NAMESPACE = 'dsh-compact-model'

/** 读取 provider/model 的来源命名空间（llm-pi-ai 已注册）。 */
export const PROVIDERS_NAMESPACE = 'llm-pi-ai'

/**
 * 默认配置。provider/model 为空 = 不覆盖压缩所用模型（走模型自身默认）；
 * 其余为 @deepseek-ai/dsh-compaction-basic 引擎的默认调参值（与其内部默认一致）。
 */
export const configDefaults = Object.freeze({
  provider: '',
  model: '',
  thresholdRatio: 0.8,
  retainRatio: 0.16,
  maxTokens: 8192,
  compactionRetries: 1,
  maxOverflowRetries: 1,
  auto: true
})

/**
 * 判断一个模型是否“支持关闭推理”。
 *
 * 满足任一条件即返回 true：
 *   - `reasoningEfforts === false`：模型完全不支持推理（推理恒关）。
 *   - `reasoningEfforts` 是对象且包含 `off` 键：可将 effort 置为 "off"。
 *   - `reasoningEfforts === 'off'`：直接用字符串声明可关。
 *   - `reasoningEfforts` 是数组且包含 `'off'`：防御性处理。
 *
 * 采用“显式声明才合格”的保守策略：只有模型明确允许关闭推理才返回 true，
 * 避免给 pi-ai 发送它不接受的 `reasoning_effort:"off"`。
 *
 * @param reasoningEfforts - 模型的 reasoningEfforts 字段（false | 映射 | 字符串 | 数组 | undefined）。
 * @returns 是否可关闭推理。
 */
export function supportsDisablingReasoning(reasoningEfforts) {
  if (reasoningEfforts === false) return true
  if (reasoningEfforts === 'off') return true
  if (typeof reasoningEfforts === 'object' && reasoningEfforts !== null) {
    if (Array.isArray(reasoningEfforts)) return reasoningEfforts.includes('off')
    return Object.prototype.hasOwnProperty.call(reasoningEfforts, 'off')
  }
  return false
}

/**
 * 从 llm-pi-ai 解析出的 providers 结构里，枚举所有“支持关闭推理”的
 * provider/model 组合。
 *
 * @param providers - `llm-pi-ai.providers` 的 dict（provider -> profile）。
 * @returns [{ provider, model, displayName }] 列表。
 */
export function listEligibleModels(providers) {
  const out = []
  if (typeof providers !== 'object' || providers === null) return out
  for (const [provider, profile] of Object.entries(providers)) {
    const models = Array.isArray(profile?.models) ? profile.models : []
    const displayName = typeof profile?.displayName === 'string' && profile.displayName.length > 0
      ? profile.displayName
      : provider
    for (const model of models) {
      if (typeof model !== 'object' || model === null) continue
      if (typeof model.id !== 'string' || model.id.length === 0) continue
      if (!supportsDisablingReasoning(model.reasoningEfforts)) continue
      out.push({ provider, model: model.id, displayName })
    }
  }
  return out
}

/**
 * 校验一个 provider/model 组合是否可被压缩使用（存在且支持关闭推理）。
 *
 * @param providers - `llm-pi-ai.providers` 的 dict。
 * @param provider - 目标 provider 名。
 * @param model - 目标模型 id。
 * @returns { ok: true } 或 { ok: false, reason: string }。
 */
export function isEligiblePair(providers, provider, model) {
  const hit = listEligibleModels(providers).find(
    (item) => item.provider === provider && item.model === model
  )
  if (hit) return { ok: true }
  return {
    ok: false,
    reason: `provider "${provider}" model "${model}" 不支持关闭推理（reasoningEfforts 未含 off 或为 false），不能用于压缩`
  }
}

/**
 * 运行时改写 compaction 请求的 provider/model（若已配置）。
 * 返回被改写的 options（同一引用）。
 *
 * @param options - llm/stream 的请求配置。
 * @param selection - 当前所选 { provider, model }，为空串表示不覆盖。
 */
export function applySelection(options, selection) {
  if (!options || typeof options !== 'object') return options
  if (options.purpose !== 'compaction') return options
  const provider = typeof selection?.provider === 'string' ? selection.provider.trim() : ''
  const model = typeof selection?.model === 'string' ? selection.model.trim() : ''
  if (provider.length === 0) return options
  if (model.length === 0) return options
  try {
    options.provider = provider
    options.model = model
  } catch {
    // never let a rewrite failure break the request
  }
  return options
}

/** Parse `/compact-model provider/model`, keeping slashes in the model id. */
export function parseSelectionInput(rawInput) {
  const text = typeof rawInput === 'string' ? rawInput.trim() : ''
  const match = /^([^\s/]+)\/([^\s]+)$/.exec(text)
  return match ? { provider: match[1], model: match[2] } : null
}

/**
 * 把本插件的 settings 值转换为压缩引擎（@deepseek-ai/dsh-compaction-basic）
 * config 的覆盖项。只有引擎真正读取的字段会被产出。
 *
 * provider/model 映射为引擎的 summarizationProvider/Model（压缩摘要调用所用
 * 路由）；其余为调参项。retainRatio 必须严格小于 thresholdRatio，否则引擎会在
 * 运行时报错——这里校验失败时回退到默认安全值。
 *
 * @param value - 当前 settings 值（含全部字段）。
 * @returns 供合并进 engine.config 的覆盖对象。
 */
export function buildEngineConfigOverrides(value) {
  const out = {}
  const provider = typeof value?.provider === 'string' ? value.provider.trim() : ''
  const model = typeof value?.model === 'string' ? value.model.trim() : ''
  if (provider.length > 0 && model.length > 0) {
    out.summarizationProvider = provider
    out.summarizationModel = model
  }
  function numberOrFallback(key, fallback, valid) {
    const candidate = value?.[key]
    return typeof candidate === 'number' && Number.isFinite(candidate) && valid(candidate)
      ? candidate
      : fallback
  }
  let thresholdRatio = numberOrFallback('thresholdRatio', configDefaults.thresholdRatio, (n) => n >= 0.01 && n <= 1)
  let retainRatio = numberOrFallback('retainRatio', configDefaults.retainRatio, (n) => n >= 0 && n <= 0.99)
  if (!(retainRatio < thresholdRatio)) {
    // 非法组合：引擎要求 retain < threshold。回退到默认安全值。
    thresholdRatio = configDefaults.thresholdRatio
    retainRatio = configDefaults.retainRatio
  }
  out.thresholdRatio = thresholdRatio
  out.retainRatio = retainRatio
  out.maxTokens = numberOrFallback('maxTokens', configDefaults.maxTokens, Number.isInteger)
  if (out.maxTokens < 1) out.maxTokens = configDefaults.maxTokens
  out.compactionRetries = numberOrFallback('compactionRetries', configDefaults.compactionRetries, (n) => Number.isInteger(n) && n >= 0)
  out.maxOverflowRetries = numberOrFallback('maxOverflowRetries', configDefaults.maxOverflowRetries, (n) => Number.isInteger(n) && n >= 0)
  if (typeof value?.auto === 'boolean') out.auto = value.auto
  return out
}

/**
 * 把当前 settings 应用到压缩引擎（ctx.compaction 服务，dsh-compaction-basic）。
 * 通过整体替换 engine.config（引擎在每个压缩事务动态读取该对象）实现运行时生效，
 * 与 ACP 插件 monkey-patch compaction.summarize 的做法同类。
 *
 * 引擎未加载（未安装 dsh-compaction-basic / 无 compaction 服务）时静默返回 false，
 * 不报错；settings 变更会再次尝试应用。
 *
 * @param ctx - cordis 上下文。
 * @param value - 当前 settings 值。
 * @returns 是否成功应用到引擎。
 */
export function applyEngineConfig(ctx, value) {
  try {
    const compaction = ctx?.get?.('compaction') ?? ctx?.compaction
    if (compaction == null || typeof compaction !== 'object' || compaction.config == null) {
      return false
    }
    const overrides = buildEngineConfigOverrides(value)
    // The compaction service resolves these fields as strings and calls
    // `.length`; an empty pair is its documented "inherit the request target"
    // sentinel. Set it here so clearing a selection does not retain stale keys.
    if (!Object.hasOwn(overrides, 'summarizationProvider')) {
      overrides.summarizationProvider = ''
      overrides.summarizationModel = ''
    }
    compaction.config = { ...compaction.config, ...overrides }
    return true
  } catch {
    return false
  }
}

export async function apply(ctx, config) {
  const entry = { ...configDefaults, ...(config ?? {}) }
  let current = () => entry
  // 持有 settings 命名空间 scope，用于命令回写持久化（可选）。
  let scopeHandle = null

  // 注册本插件 settings 命名空间。无法 import dsh-settings 时（本地路径符号链接
  // 插件可能解析不到它），退化为 entry，但不静默 —— 记一条 warn。
  try {
    const { default: z } = await import('@deepseek-ai/schemastery')
    const Config = z.object({
      provider: z.string().default(''),
      model: z.string().default(''),
      thresholdRatio: z.number().step(0.01).min(0.01).max(1).default(0.8),
      retainRatio: z.number().step(0.01).min(0).max(0.99).default(0.16),
      maxTokens: z.number().step(1).min(1).default(8192),
      compactionRetries: z.number().step(1).min(0).default(1),
      maxOverflowRetries: z.number().step(1).min(0).default(1),
      auto: z.boolean().default(true)
    })
    ctx.inject(['settings'], (sctx) => {
      const scope = sctx.settings.register(NAMESPACE, Config, { base: entry })
      scopeHandle = scope
      current = () => scope.get()
      // settings 变更时把调参应用到压缩引擎（若已加载），并保留 provider/model 改写逻辑。
      scope.watch(() => applyEngineConfig(ctx, current()))
    })
    // 启动阶段尽量应用一次（compaction 服务若已就绪）。
    applyEngineConfig(ctx, current())
  } catch (error) {
    ctx.logger?.warn?.(`dsh-compact-model: settings section unavailable (${String(error)})`)
  }

  // 读取当前 provider/model 选择。
  const selection = () => {
    const value = current()
    return {
      provider: typeof value?.provider === 'string' ? value.provider : '',
      model: typeof value?.model === 'string' ? value.model : ''
    }
  }

  // 读取 llm-pi-ai 的 providers（用于枚举与校验）。llm-pi-ai 未加载/未注册时
  // 返回空对象，命令会给出“无可选模型”提示而非崩溃。
  const providersOf = () => {
    try {
      const section = ctx.settings.get(PROVIDERS_NAMESPACE)
      return (section && typeof section === 'object' ? section.providers : undefined) ?? {}
    } catch {
      return {}
    }
  }

  // 持久化 + 立即生效的写入口。优先写 settings 命名空间（scope），scope 不可用
  // 或写入失败时退化为直接改 entry（composition base）。命令只改 provider/model，
  // 因此先保留其余字段（阈值、retain、maxTokens 等），避免覆盖掉面板里的调参。
  function persist(provider, model) {
    const base = { ...configDefaults, ...current() }
    const next = { ...base, provider, model }
    if (scopeHandle && typeof scopeHandle.update === 'function') {
      try {
        scopeHandle.update(next)
        return true
      } catch {
        // 落到 entry 兜底
      }
    }
    try {
      Object.assign(entry, next)
      return true
    } catch {
      return false
    }
  }

  // 运行时：压缩请求改写为所选模型。
  ctx.on('llm/stream', (options, next) => {
    applySelection(options, selection())
    return next()
  })

  // /compact-model 命令：交互选择（或直接指定 provider/model）。
  ctx.inject(['commands'], (cctx) => {
    cctx.commands.register({
      name: 'compact-model',
      description: '查看 / 设置 ACP 压缩使用的 provider 与 model（仅支持关闭推理的模型）',
      handler: ({ rawInput }) => {
        const providers = providersOf()
        const eligible = listEligibleModels(providers)
        const sel = selection()

        // 形如 "provider/model" 的直接设置
        // Model ids commonly contain slashes (for example `org/model`), so
        // split only at the provider/model separator.
        const direct = parseSelectionInput(rawInput)
        if (direct) {
          const { provider, model } = direct
          const check = isEligiblePair(providers, provider, model)
          if (!check.ok) return { kind: 'error', text: check.reason }
          const wrote = persist(provider, model)
          if (!wrote) return { kind: 'error', text: '无法写入压缩 provider/model 配置。' }
          return {
            kind: 'success',
            text: `已将压缩 provider/model 设为 ${provider}/${model}（仅支持关闭推理的模型）。`
          }
        }

        // 无参数：展示当前值 + 可选项
        const full = current()
        const currentLine = sel.provider || sel.model
          ? `当前：${sel.provider || '?'}/${sel.model || '?'}`
          : '当前：未设置（压缩走模型自身默认）'
        const tuningLine = [
          `thresholdRatio=${full.thresholdRatio ?? configDefaults.thresholdRatio}`,
          `retainRatio=${full.retainRatio ?? configDefaults.retainRatio}`,
          `maxTokens=${full.maxTokens ?? configDefaults.maxTokens}`,
          `compactionRetries=${full.compactionRetries ?? configDefaults.compactionRetries}`,
          `maxOverflowRetries=${full.maxOverflowRetries ?? configDefaults.maxOverflowRetries}`,
          `auto=${full.auto ?? configDefaults.auto}`
        ].join('  ')
        if (eligible.length === 0) {
          return {
            kind: 'success',
            text: `${currentLine}\n调参：${tuningLine}\n没有可选的模型（需要模型 reasoningEfforts 含 off 或为 false）。`
          }
        }
        const lines = eligible.map(
          (item, index) => `  ${index + 1}. ${item.provider}/${item.model}  (${item.displayName})`
        )
        return {
          kind: 'success',
          text: `${currentLine}\n调参：${tuningLine}\n可用模型（仅支持关闭推理）：\n${lines.join('\n')}\n\n使用 /compact-model provider/model 直接设置模型；其余调参请在设置面板 dsh-compact-model 中修改。`
        }
      }
    })
  })
}
