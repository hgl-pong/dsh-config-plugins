# dsh-agnes-provider

DSH 插件：注册 Agnes AI provider（`agnes-2.5-flash`）。

- **模型**：`agnes-2.5-flash`
- **Base URL**：`https://apihub.agnes-ai.com/v1`
- **API 风格**：OpenAI 兼容 Chat Completions（`openai-completions`）
- **上下文窗口**：`512K`，最大输出 `65.5K` tokens
- **输入**：文本 + 图像 URL，支持流式输出与工具调用
- **文档**：https://www.agnes-ai.com/zh-Hans/docs/agnes-25-flash

## 工作原理

与 `opencode-zen-compat` 相同的机制：

1. `cordis.patch.yml` 把自定义 provider `agnes` 注入到 `llm-pi-ai` 设置的
   **BASE 层**（composition base），而不是用户 `settings.yaml`。因此卸载本插件后
   provider 行会整体消失，安装/重装也能保持模型列表稳定。
2. `index.js` 提供一个 `llm/stream` 钩子，把 DSH 的 reasoning 请求翻译成 Agnes 的
   Thinking 开关（`chat_template_kwargs.enable_thinking`），只对 Agnes 路由生效。
3. `reasoningEfforts: { off: null, high: high }` 作为合法 effort 白名单，**必须包含
   `off`**，否则 ACP compaction 发送 `reasoning_effort:"off"` 会被 pi-ai 校验拒绝并报
   `does not support reasoning effort "off"`。off 时钩子把 `enable_thinking` 置为
   `false`（关闭思考），从而正常执行压缩而不报错。

## 配置

设置环境变量 `AGNES_API_KEY`（Agnes AI 账户 API Key）。

## 安装

在 `install.ps1` 的本地插件列表中加入本目录即可，或手动：

```powershell
dsh plugin --profile web add <本目录绝对路径>
```

## 测试

```powershell
node --test test.mjs
```
