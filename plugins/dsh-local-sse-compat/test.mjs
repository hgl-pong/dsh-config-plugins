import test from 'node:test'
import assert from 'node:assert/strict'
import { apply, isDeepSeekProvider, repairStream, tuneCompactionOptions } from './index.js'

async function collect(source) {
  const result = []
  for await (const chunk of repairStream(source)) result.push(chunk)
  return result
}

test('targets DeepSeek routes only', () => {
  assert.equal(isDeepSeekProvider('deepseek-vision'), true)
  assert.equal(isDeepSeekProvider('deepseek-official'), true)
  assert.equal(isDeepSeekProvider('opencode-go-plus'), false)
})

test('tunes compaction without changing normal requests', () => {
  const compaction = { purpose: 'compaction', reasoningEffort: 'max', maxTokens: 8192 }
  tuneCompactionOptions(compaction)
  assert.equal(compaction.reasoningEffort, 'off')
  assert.equal(compaction.maxTokens, 32768)

  const normal = { purpose: 'agent', reasoningEffort: 'max', maxTokens: 65536 }
  tuneCompactionOptions(normal)
  assert.deepEqual(normal, { purpose: 'agent', reasoningEffort: 'max', maxTokens: 65536 })
})

test('repairs a truncated text stream', async () => {
  const result = await collect((async function* () {
    yield { type: 'block-start', index: 0, blockType: 'text' }
    yield { type: 'text-delta', index: 0, text: 'partial' }
    throw Object.assign(new Error('SSE stream ended without [DONE]'), { code: 'STREAM_CLOSED' })
  })())
  assert.deepEqual(result.at(-2), { type: 'block-end', index: 0, block: { type: 'text', text: 'partial' } })
  assert.deepEqual(result.at(-1), { type: 'finish', reason: { kind: 'stop' } })
})

test('preserves unrelated stream failures', async () => {
  await assert.rejects(
    collect((async function* () {
      yield { type: 'block-start', index: 0, blockType: 'text' }
      yield { type: 'text-delta', index: 0, text: 'partial' }
      throw new Error('provider authentication failed')
    })()),
    /provider authentication failed/,
  )
})

test('recognizes recoverable finish errors in both failure and error shapes', async () => {
  const source = (async function* () {
    yield { type: 'block-start', index: 0, blockType: 'text' }
    yield { type: 'text-delta', index: 0, text: 'partial' }
    yield {
      type: 'finish',
      reason: { kind: 'error', error: { code: 'STREAM_CLOSED', message: 'SSE stream ended' } }
    }
  })()
  const result = []
  for await (const chunk of repairStream(source)) result.push(chunk)
  assert.equal(result.at(-1).reason.kind, 'stop')
})

test('does not tune non-DeepSeek streams', async () => {
  let seen
  const ctx = {
    on: (_event, listener) => { seen = listener }
  }
  apply(ctx)
  const options = { provider: 'agnes', purpose: 'compaction', reasoningEffort: 'high', maxTokens: 1024 }
  const next = () => (async function* () {})()
  seen(options, next)
  assert.equal(options.reasoningEffort, 'high')
  assert.equal(options.maxTokens, 1024)
})
