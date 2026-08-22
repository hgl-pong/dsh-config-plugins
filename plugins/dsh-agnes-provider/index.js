/**
 * dsh-agnes-provider — DSH plugin.
 *
 * Registers the Agnes AI provider (agnes-2.5-flash) by injecting it into the
 * llm-pi-ai settings BASE layer via cordis.patch.yml, and adjusts the stream
 * request for Agnes' OpenAI-compatible Chat Completions API.
 *
 * Docs: https://www.agnes-ai.com/zh-Hans/docs/agnes-25-flash
 *
 * Why a stream hook is needed:
 *   - Agnes is OpenAI-compatible, so the `openai-completions` adapter works for
 *     plain text / image / tool-call / streaming out of the box.
 *   - Agnes enables "Thinking" via `chat_template_kwargs.enable_thinking`
 *     (a boolean), NOT the OpenAI `reasoning_effort` / `reasoning` top-level
 *     params that DSH normally sends for reasoning models. This hook translates
 *     DSH's reasoning request (options.reasoningEffort) into that boolean, and
 *     only touches Agnes routes. The stream itself is passed through unchanged.
 */

export const name = 'dsh-agnes-provider'
export const inject = ['llm']

/** The Agnes provider id injected by cordis.patch.yml. */
const AGNES_PROVIDER = 'agnes'

/** Default thinking budget suggestion from the Agnes docs (Anthropic format). */
export const THINKING_BUDGET = 2048

/** Whether one provider route talks to Agnes AI. */
export function isAgnesRoute(provider) {
  return typeof provider === 'string' && /^agnes(?:-|$)/i.test(provider)
}

/**
 * Translate DSH's reasoning request into Agnes' chat_template_kwargs.
 * Returns a mutated options object (same reference) or the original when the
 * route is not Agnes.
 */
export function tuneAgnesOptions(options) {
  if (!options || !isAgnesRoute(options?.provider)) return options
  try {
    const effort = options.reasoningEffort
    // Agnes only supports an on/off thinking toggle: any non-"off" effort
    // requests thinking, and "off" explicitly disables it.
    const enableThinking = effort != null && String(effort) !== 'off'
    options.chatTemplateKwargs = options.chatTemplateKwargs ?? {}
    options.chatTemplateKwargs.enable_thinking = enableThinking
    // Some DSH layers read the camelCase spelling; set both defensively.
    options.chat_template_kwargs = options.chatTemplateKwargs
  } catch {
    // never let a tuning failure break the request
  }
  return options
}

export function apply(ctx) {
  ctx.on('llm/stream', (options, next) => {
    tuneAgnesOptions(options)
    if (!isAgnesRoute(options?.provider)) return next()
    // OpenAI-compatible stream: pass through untouched after tuning.
    return next()
  })
}

