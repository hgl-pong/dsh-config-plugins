import test from 'node:test'
import assert from 'node:assert/strict'
import { isAgnesRoute, tuneAgnesOptions } from './index.js'

test('targets Agnes routes only', () => {
  assert.equal(isAgnesRoute('agnes'), true)
  assert.equal(isAgnesRoute('agnes-2.5-flash'), true)
  assert.equal(isAgnesRoute('agnes-official'), true)
  assert.equal(isAgnesRoute('opencode-go-plus'), false)
  assert.equal(isAgnesRoute('deepseek-v4-flash'), false)
})

test('enables thinking for any non-off reasoning effort', () => {
  const opts = { provider: 'agnes', reasoningEffort: 'high' }
  tuneAgnesOptions(opts)
  assert.equal(opts.chatTemplateKwargs.enable_thinking, true)
  assert.equal(opts.chat_template_kwargs.enable_thinking, true)
})

test('disables thinking for off reasoning effort', () => {
  const opts = { provider: 'agnes', reasoningEffort: 'off' }
  tuneAgnesOptions(opts)
  assert.equal(opts.chatTemplateKwargs.enable_thinking, false)
})

// ACP compaction 会把 reasoningEffort 设为 "off"；模型 reasoningEfforts 白名单
// 必须含 off，否则 pi-ai 校验抛 "does not support reasoning effort off"。这里
// 验证钩子对该场景的产物：思考被关闭，且不改变 provider。
test('compaction (reasoning off) disables thinking without error', () => {
  const opts = { provider: 'agnes', purpose: 'compaction', reasoningEffort: 'off' }
  tuneAgnesOptions(opts)
  assert.equal(opts.chatTemplateKwargs.enable_thinking, false)
  assert.equal(opts.chat_template_kwargs.enable_thinking, false)
  assert.equal(opts.provider, 'agnes')
  assert.equal(opts.purpose, 'compaction')
})

test('keeps existing chat_template_kwargs intact', () => {
  const opts = { provider: 'agnes', reasoningEffort: 'high', chatTemplateKwargs: { foo: 1 } }
  tuneAgnesOptions(opts)
  assert.equal(opts.chatTemplateKwargs.enable_thinking, true)
  assert.equal(opts.chatTemplateKwargs.foo, 1)
})

test('leaves non-Agnes options untouched', () => {
  const opts = { provider: 'deepseek-v4-flash', reasoningEffort: 'max' }
  tuneAgnesOptions(opts)
  assert.deepEqual(opts, { provider: 'deepseek-v4-flash', reasoningEffort: 'max' })
})
