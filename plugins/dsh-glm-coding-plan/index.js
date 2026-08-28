/**
 * dsh-glm-coding-plan — DSH plugin.
 *
 * Registers the Zhipu GLM Coding Plan provider (bigmodel.cn) by injecting it
 * into the llm-pi-ai settings BASE layer via cordis.patch.yml.
 *
 *   Endpoint (official quick-start, OpenAI Chat Completion protocol):
 *     https://open.bigmodel.cn/api/coding/paas/v4
 *   Docs: https://docs.bigmodel.cn/cn/coding-plan/quick-start
 *
 * Design notes (ADR-0001: docs/decisions/adr/0001-glm-coding-plan-thinking-dispatch.md):
 *   - Thinking dispatch is left entirely to pi-ai's native `zai`
 *     thinkingFormat (the openai-completions adapter also auto-detects
 *     open.bigmodel.cn as a Z.ai-compatible endpoint), so this plugin ships
 *     NO stream hook. apply() only logs that the base patch is active.
 *   - glm-5.3 / glm-5.3-flash think with no off switch: the endpoint rejects
 *     `thinking: { type: "disabled" }`. Their reasoningEfforts map `off` to
 *     `low` so compaction (which requests "off") degrades to light thinking
 *     instead of a failed request. glm-5.2 and older models keep `off: null`.
 */

export const name = 'dsh-glm-coding-plan'
export const inject = ['llm']

/** The provider row injected by cordis.patch.yml. */
export const GLM_PROVIDER = Object.freeze({
  id: 'glm-coding-plan',
  displayName: 'GLM Coding Plan',
  apiKeyEnv: 'GLM_CODING_PLAN_API_KEY',
  api: 'openai-completions',
  baseURL: 'https://open.bigmodel.cn/api/coding/paas/v4',
})

/**
 * The coding-plan model rows (must stay in sync with cordis.patch.yml —
 * test.mjs cross-checks the two).
 *
 * reasoningEfforts:
 *   - glm-5.3 / glm-5.3-flash: off -> low (thinking is always on upstream;
 *     "off" must degrade to the lightest level, never to disabled).
 *   - glm-5.2: pi-ai catalog mapping (low/medium promote to high; max stays).
 *   - glm-5.1 / glm-5-turbo / glm-4.7: on/off only.
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

export function apply(ctx) {
  // 注册日志即可：思考分派由 pi-ai 原生 zai thinkingFormat 承担，无需流式钩子。
  ctx.logger.info('dsh-glm-coding-plan: glm-coding-plan provider registered via base patch (no stream hook)')
}
