export const name = 'dsh-local-sse-compat'
export const inject = ['llm']

export function tuneCompactionOptions(options) {
  if (options?.purpose !== 'compaction') return options
  try {
    options.reasoningEffort = 'off'
    options.maxTokens = Math.max(Number.isInteger(options.maxTokens) ? options.maxTokens : 0, 32768)
  } catch {}
  return options
}

function isDeepSeekProvider(provider) {
  return typeof provider === 'string' && /^deepseek(?:-|$)/i.test(provider)
}

function isRecoverable(error) {
  const code = error?.code
  const message = String(error?.message ?? error ?? '')
  return code === 'STREAM_CLOSED'
    || code === 'MALFORMED_RESPONSE'
    || /SSE (?:stream|payload).*?(?:DONE|ended|malformed)/i.test(message)
}

function isRecoverableFinish(reason) {
  if (reason?.kind !== 'error') return false
  const code = String(reason.failure?.code ?? '')
  const message = String(reason.failure?.message ?? '')
  return code === 'STREAM_CLOSED'
    || code === 'MALFORMED_RESPONSE'
    || /SSE (?:stream|payload).*?(?:DONE|ended|malformed)/i.test(message)
}

function closeBlock(state) {
  if (state.blockType === 'text') return { type: 'text', text: state.text }
  if (state.blockType === 'reasoning') return { type: 'reasoning', text: state.text }
  return {
    type: 'tool-call',
    id: state.id ?? '',
    name: state.name ?? '',
    arguments: state.text,
  }
}

async function* repairStream(stream) {
  const open = new Map()
  let sawContent = false

  try {
    for await (const chunk of stream) {
      if (chunk?.type === 'block-start') {
        open.set(chunk.index, { blockType: chunk.blockType, text: '' })
      } else if (chunk?.type === 'text-delta' || chunk?.type === 'reasoning-delta') {
        const state = open.get(chunk.index)
        if (state) state.text += chunk.text ?? ''
        sawContent ||= String(chunk.text ?? '') !== ''
      } else if (chunk?.type === 'tool-call-delta') {
        const state = open.get(chunk.index)
        if (state) {
          state.id = chunk.id
          if (chunk.name !== undefined) state.name = chunk.name
          state.text += chunk.argumentsDelta ?? ''
        }
        sawContent ||= chunk.name !== undefined || String(chunk.argumentsDelta ?? '') !== ''
      } else if (chunk?.type === 'block-end') {
        open.delete(chunk.index)
      } else if (chunk?.type === 'finish' && isRecoverableFinish(chunk.reason) && sawContent) {
        for (const [index, state] of open) yield { type: 'block-end', index, block: closeBlock(state) }
        open.clear()
        yield { ...chunk, reason: { kind: 'stop' } }
        return
      }
      yield chunk
    }
  } catch (error) {
    if (!isRecoverable(error) || !sawContent) throw error
    for (const [index, state] of open) yield { type: 'block-end', index, block: closeBlock(state) }
    yield { type: 'finish', reason: { kind: 'stop' } }
  }
}

export function apply(ctx) {
  ctx.on('llm/stream', (options, next) => {
    tuneCompactionOptions(options)
    if (!isDeepSeekProvider(options?.provider)) return next()
    return repairStream(next())
  })
}

export { isDeepSeekProvider, isRecoverable, repairStream }
