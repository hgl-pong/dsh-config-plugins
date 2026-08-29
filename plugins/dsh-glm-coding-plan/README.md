# dsh-glm-coding-plan

DSH 插件：把 **GLM Coding Plan**（智谱 bigmodel.cn）和 **Agnes AI** 两个 provider 一起注册进 llm-pi-ai。

两个 provider 在**同一条 llm-pi-ai base 补丁**的同一个 `providers` 映射里——从根上避免多插件补丁互相覆盖的问题（此前 dsh-agnes-provider 正是被后装的 opencode-zen-compat 覆盖而失效）。不写用户 `settings.yaml`；卸载插件即移除两个 provider，零残留。

## Providers

| | GLM Coding Plan | Agnes AI |
| --- | --- | --- |
| id | `glm-coding-plan` | `agnes` |
| 端点 | `https://open.bigmodel.cn/api/coding/paas/v4` | `https://apihub.agnes-ai.com/v1` |
| 凭据 | `GLM_CODING_PLAN_API_KEY` | `AGNES_API_KEY` |
| 模型 | glm-5.3 / glm-5.3-flash / glm-5.2 / glm-5.1 / glm-5-turbo / glm-4.7 | agnes-2.5-flash |

两个 key 均只走环境变量，绝不写进任何文件；安装后自行设置再重启 dsh web。

- GLM 官方文档：<https://docs.bigmodel.cn/cn/coding-plan/quick-start>
- GLM Coding Plan 订阅用户调用 glm-5.3 目前仅支持 OpenAI Chat Completion 协议。

## 为什么 glm-5.3 系的 off 会映射成 low

GLM-5.3 / GLM-5.3-Flash **思考常开**，请求里发 `thinking: { type: "disabled" }` 会被端点直接拒绝。DSH 的 compaction（ACP 压缩）会发 `reasoningEffort: "off"`，因此把 `off` 映射到 `low` 档（即官方迁移建议「enabled + reasoning_effort: low」），压缩请求降级为轻量思考而不是报错。详见 `docs/decisions/adr/0001-glm-coding-plan-thinking-dispatch.md`。

Agnes 的 thinking 是 on/off 布尔（`chat_template_kwargs.enable_thinking`，由插件的流钩子翻译），`off` 正常关闭。

## 安装

由本仓库的 `install.ps1` 统一登记（本地 link 安装）：运行 `.\install.cmd` 后重启 `dsh web --no-open`。

## 卸载

```bash
dsh plugin --profile web remove dsh-glm-coding-plan
```

## 测试

```bash
cd plugins/dsh-glm-coding-plan
node --test test.mjs
```