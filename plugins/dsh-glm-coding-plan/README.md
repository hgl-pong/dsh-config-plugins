# dsh-glm-coding-plan

DSH 插件：把智谱 **GLM Coding Plan**（bigmodel.cn）注册为 llm-pi-ai 的自定义模型供应商。

通过 cordis base 层补丁注入，不写用户 `settings.yaml`；卸载插件即移除 provider，零残留。结构与 `plugins/dsh-agnes-provider` 同构。

## 接入端点与凭据

- 端点（OpenAI Chat Completion 协议）：`https://open.bigmodel.cn/api/coding/paas/v4`
  （官方文档：GLM Coding Plan 订阅用户调用 glm-5.3 目前仅支持该协议）
- 凭据：环境变量 `GLM_CODING_PLAN_API_KEY`。**Key 只走环境变量，绝不写进任何文件**；
  安装后需自行设置（系统环境变量或启动 dsh 的 shell）再重启 dsh web。
- 官方文档：<https://docs.bigmodel.cn/cn/coding-plan/quick-start>

## 模型（6 个）

| 模型 id | 上下文 | 最大输出 | 输入 | 思考档位 |
| --- | --- | --- | --- | --- |
| glm-5.3 | 1M | 128K | 文本 | 常开；off/low→low，medium/high→high，max→max |
| glm-5.3-flash | 1M | 128K | 文本+图像 | 同上 |
| glm-5.2 | 1M | 128K | 文本 | off 关闭；low/medium→high，max→max |
| glm-5.1 | 200K | 128K | 文本 | off 关闭；high |
| glm-5-turbo | 200K | 128K | 文本 | off 关闭；high |
| glm-4.7 | 200K | 128K | 文本 | off 关闭；high |

## 为什么 glm-5.3 系的 off 会映射成 low

GLM-5.3 / GLM-5.3-Flash **思考常开**，请求里发 `thinking: { type: "disabled" }` 会被端点直接拒绝。
DSH 的 compaction（ACP 压缩）会发 `reasoningEffort: "off"`，因此插件把 `off` 映射到 `low` 档
（即官方迁移建议「enabled + reasoning_effort: low」），压缩请求降级为轻量思考而不是报错。
详见 `docs/decisions/adr/0001-glm-coding-plan-thinking-dispatch.md`。

## 安装

由本仓库的 `install.ps1` 统一登记（本地 link 安装）：运行 `.\install.cmd` 后重启
`dsh web --no-open`，模型列表即出现「GLM Coding Plan」供应商。

## 卸载

```bash
dsh plugin --profile web remove dsh-glm-coding-plan
```

卸载后重启 dsh web。base 层补丁随之消失，不残留任何配置。

## 测试

```bash
cd plugins/dsh-glm-coding-plan
node --test test.mjs
```
