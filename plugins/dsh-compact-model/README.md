# dsh-compact-model

DSH 插件：控制 ACP 压缩（compaction / compact）使用的模型与 provider。

选择模型时**只能选择支持关闭推理的模型**，即该模型能把 `reasoning_effort` 置为
`off`（`llm-pi-ai.providers[*].models[*].reasoningEfforts` 为 `false`，或包含
`off` 键的映射，如 `{ off: null, high: high }`）。这样 ACP 压缩发出的
`reasoning_effort:"off"` 不会被 pi-ai 校验拒绝。

## 用法

- `/compact-model`：列出当前值 + 所有可用的（支持关闭推理的）provider/model 组合。
- `/compact-model provider/model`：直接设置压缩使用的 provider 与 model
  （设置前会校验该组合是否支持关闭推理，不满足则拒绝）。

也可以在本插件 settings 命名空间 `dsh-compact-model`（字段 `provider`、`model`）
里配置，供设置页读写。

Web 设置页由插件内置的 `client.js` 注册配置卡片，provider/model 从 `llm-pi-ai` 文件配置中读取，
只列出支持关闭推理的模型，并支持调参、保存和放弃修改。

## 工作原理

1. 从 `llm-pi-ai` settings 命名空间读取 provider/model 目录，过滤出所有
   **支持关闭推理** 的组合（`reasoningEfforts === false` 或含 `off`）。
2. 监听 `llm/stream`，当请求 `purpose === 'compaction'`（即 `dsh-compaction-basic`
   的摘要压缩调用）时，把 provider/model 改写为所选组合 —— 与
   `dsh-local-sse-compat` 对 compaction 请求调优使用同一挂钩点，无需重启即生效。
3. 选择通过 `/compact-model` 命令或 settings 命名空间写入并持久化。

## 安装

在 `install.ps1` 的本地插件列表中加入本目录即可，或手动：

```powershell
dsh plugin --profile web add <本目录绝对路径>
```

## 测试

```powershell
node --test test.mjs
```
