# dsh-config-plugins

可迁移的 DeepSeek Harness (`dsh`) 插件配置与本地修复包。

## 一键安装

前置条件：Windows、Node.js、pnpm，以及已安装可执行的 `dsh`。

```powershell
git clone https://github.com/hgl-pong/dsh-config-plugins.git
cd dsh-config-plugins
.\install.cmd
```

安装完成后重启：

```powershell
dsh web --no-open
```

## 内容

- `plugins/dsh-local-sse-compat`：DeepSeek SSE 截断/空 payload 兼容和 compaction 专用请求调优。
  - `plugins/dsh-glm-coding-plan`：智谱 GLM Coding Plan + Agnes AI 双 provider（glm-5.3 系 off 自动降级为 low；agnes thinking 开关适配）。已整合原 dsh-agnes-provider。
- `plugins/dsh-web-search-9router`：用 9Router 替换内置 DeepSeek 联网搜索（`/v1/search`，支持 Tavily/Exa/Brave/Serper 等），不消耗模型额度。
- `plugins/dsh-compact-model`：控制 ACP 压缩（compact）使用的模型与 provider，只允许选择支持关闭推理（reasoning off）的模型（`/compact-model`）。
- `plugins/dsh-glm-coding-plan`：智谱 GLM Coding Plan provider（glm-5.3 / glm-5.3-flash / glm-5.2 / glm-5.1 / glm-5-turbo / glm-4.7，OpenAI 兼容端点）注册与思考档位适配（GLM-5.3 思考常开，off 自动降级为 low）。
- `patches/`：本地 pnpm 补丁——文件预览插件的路径拦截修复。
- `install.ps1`：完整插件安装清单、补丁应用和 DeepSeek `maxTokens: 65536` 配置修复。

### 清单内附带的开发体验插件

- `dsh-open-in-editor`：从 Web GUI 一键在 VS Code、Cursor、Windsurf、Trae、Kiro、CodeBuddy、Antigravity、VSCodium、Zed、Sublime Text、Lapce、Fleet、JetBrains IDE 或 Neovim 中打开工作区目录。
- `dsh-lsp`：LSP 语义工具（定义跳转 / 引用查找 / 诊断）。
- `dsh-sidechain`：`/side` 持续侧会话 + `/btw` 一次性侧问（不污染主会话）。
- `dsh-annotation`：选中文字 → 批注 → 随消息发送。
- `dsh-paste-input`：Ctrl+V 粘贴 / 拖拽文件输入。
- `dsh-input-history`：↑/↓ 召回历史输入。
- `dsh-tool-*`（json / regex / csv / time / calculator / encoding）：确定性工具，减少模型幻觉。

脚本可以重复运行；它只安装清单内插件，不会删除其他插件。

## 更新到最新

`install.cmd` 每次运行都会把环境带到最新：

- **dsh CLI 本体**：对比 npm 上的最新版本，落后时自动执行 `npm install -g @deepseek-ai/dsh@latest`。
- **全部插件**：一条 `pnpm update --latest` 批量更新——npm 源插件越过旧版本号升到最新，GitHub 源插件重新解析到分支最新提交。
- **固定不动的插件**（带本地 pnpm 补丁，升到其他版本会丢补丁，因此钉在补丁版本）：
  - `@wingsky-1/dsh-web-file-preview@0.1.13`
  - `dsh-workbench-plugin@0.1.31`
  - `dsh-change-review@0.3.0`
  - `@deepseek-ai/dsh-compaction-basic@0.0.1-rc.3`
- **本地插件**（`plugins/`、`vendor/` 下的 `link:` 依赖）：随本仓库文件即改即用，无需更新。

离线时更新步骤会跳过并保留已装版本，安装流程不受影响。若要升级上面 4 个带补丁的插件，需要先用 `pnpm patch` 重做补丁，并同步修改 `install.ps1` 里的 `$patchTable` 和对应版本号。

## 安全提示

文件预览插件面向本机 loopback 使用。不要在未配置认证的情况下把 DSH Web/API 端口暴露到不可信局域网或公网。
