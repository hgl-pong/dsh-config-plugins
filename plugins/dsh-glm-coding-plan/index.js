/**
 * dsh-glm-coding-plan — DSH plugin.
 *
 * Registers TWO providers by injecting them into the llm-pi-ai settings BASE
 * layer via cordis.patch.yml (ONE llm-pi-ai entry, ONE providers map — so the
 * two providers can never overwrite each other across plugin patches):
 *
 *   1. glm-coding-plan — Zhipu GLM Coding Plan (bigmodel.cn)
 *      Endpoint (official quick-start, OpenAI Chat Completion protocol):
 *        https://open.bigmodel.cn/api/coding/paas/v4
 *      Docs: https://docs.bigmodel.cn/cn/coding-plan/quick-start
 *
 *   2. agnes — Agnes AI (apihub.agnes-ai.com), merged in from the former
 *      dsh-agnes-provider plugin.
 *
 * Design notes (ADR-0001 / ADR-0002):
 *   - GLM thinking dispatch is left to pi-ai's native `zai` thinkingFormat
 *     (open.bigmodel.cn is also auto-detected as zai), so GLM routes need NO
 *     stream hook. glm-5.3 / glm-5.3-flash always think — their
 *     reasoningEfforts map `off` to `low` so compaction degrades instead of
 *     failing (the endpoint rejects thinking.type disabled).
 *   - Agnes enables "Thinking" via chat_template_kwargs.enable_thinking (a
 *     boolean), NOT reasoning_effort — a stream hook translates DSH's
 *     reasoningEffort into that boolean for Agnes routes only.
 */

export const name = 'dsh-glm-coding-plan'
export const inject = ['llm']

/** The GLM Coding Plan provider row injected by cordis.patch.yml. */
export const GLM_PROVIDER = Object.freeze({
  id: 'glm-coding-plan',
  displayName: 'GLM Coding Plan',
  apiKeyEnv: 'GLM_CODING_PLAN_API_KEY',
  api: 'openai-completions',
  baseURL: 'https://open.bigmodel.cn/api/coding/paas/v4',
})

/**
 * The GLM coding-plan model rows (must stay in sync with cordis.patch.yml —
 * test.mjs cross-checks the two).
 */
export const GLM_MODELS = Object.freeze([
  Object.freeze({
    id: 'glm-5.3',
    name: 'GLM-5.3',
    contextWindow: 1000000,
    maxTokens: 131072,
    input: Object.freeze(['text']),
    reasoningEfforts: Object.freeze({ off: 'low', low: 'low', medium: 'high', high: 'high', max: 'max' }),
    supportsReasoningEffort: true,
  }),
  Object.freeze({
    id: 'glm-5.3-flash',
    name: 'GLM-5.3-Flash',
    contextWindow: 1000000,
    maxTokens: 131072,
    input: Object.freeze(['text', 'image']),
    reasoningEfforts: Object.freeze({ off: 'low', low: 'low', medium: 'high', high: 'high', max: 'max' }),
    supportsReasoningEffort: true,
  }),
  Object.freeze({
    id: 'glm-5.2',
    name: 'GLM-5.2',
    contextWindow: 1000000,
    maxTokens: 131072,
    input: Object.freeze(['text']),
    reasoningEfforts: Object.freeze({ off: null, low: 'high', medium: 'high', high: 'high', max: 'max' }),
    supportsReasoningEffort: true,
  }),
  Object.freeze({
    id: 'glm-5.1',
    name: 'GLM-5.1',
    contextWindow: 200000,
    maxTokens: 131072,
    input: Object.freeze(['text']),
    reasoningEfforts: Object.freeze({ off: null, high: 'high' }),
    supportsReasoningEffort: false,
  }),
  Object.freeze({
    id: 'glm-5-turbo',
    name: 'GLM-5-Turbo',
    contextWindow: 200000,
    maxTokens: 131072,
    input: Object.freeze(['text']),
    reasoningEfforts: Object.freeze({ off: null, high: 'high' }),
    supportsReasoningEffort: false,
  }),
  Object.freeze({
    id: 'glm-4.7',
    name: 'GLM-4.7',
    contextWindow: 204800,
    maxTokens: 131072,
    input: Object.freeze(['text']),
    reasoningEfforts: Object.freeze({ off: null, high: 'high' }),
    supportsReasoningEffort: false,
  }),
])

/** Whether one provider route is the GLM Coding Plan route injected below. */
export function isGlmCodingRoute(provider) {
  return typeof provider === 'string' && /^glm-coding-plan(?:-|$)/i.test(provider)
}

/** The Agnes AI provider row injected by cordis.patch.yml. */
export const AGNES_PROVIDER = Object.freeze({
  id: 'agnes',
  displayName: 'Agnes AI',
  apiKeyEnv: 'AGNES_API_KEY',
  api: 'openai-completions',
  baseURL: 'https://apihub.agnes-ai.com/v1',
})

/** Whether one provider route talks to Agnes AI. */
export function isAgnesRoute(provider) {
  return typeof provider === 'string' && /^agnes(?:-|$)/i.test(provider)
}

/**
 * Translate DSH's reasoning request into Agnes' chat_template_kwargs.
 * Agnes enables "Thinking" via an on/off boolean, NOT reasoning_effort: any
 * non-"off" effort requests thinking; "off" (as compaction/ACP sends)
 * explicitly disables it. Returns the mutated options (same reference) or the
 * original when the route is not Agnes.
 */
export function tuneAgnesOptions(options) {
  if (!options || !isAgnesRoute(options?.provider)) return options
  try {
    const effort = options.reasoningEffort
    const enableThinking = effort != null && String(effort).toLowerCase() !== 'off'
    const camel = options.chatTemplateKwargs
    const snake = options.chat_template_kwargs
    const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value)
    let kwargs = {}
    if (isRecord(camel)) kwargs = camel
    else if (isRecord(snake)) kwargs = snake
    if (kwargs !== snake && isRecord(snake)) Object.assign(kwargs, snake)
    kwargs.enable_thinking = enableThinking
    options.chatTemplateKwargs = kwargs
    // Some DSH layers read the camelCase spelling; set both defensively.
    options.chat_template_kwargs = kwargs
  } catch {
    // never let a tuning failure break the request
  }
  return options
}

export function apply(ctx) {
  ctx.logger.info('dsh-glm-coding-plan: glm-coding-plan + agnes providers registered via base patch (agnes stream hook active)')
  ctx.on('llm/stream', (options, next) => {
    tuneAgnesOptions(options)
    return next()
  })
}