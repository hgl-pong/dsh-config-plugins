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
- `plugins/dsh-agnes-provider`：Agnes AI provider（`agnes-2.5-flash`，OpenAI 兼容）注册与 Thinking 开关适配。
- `plugins/dsh-web-search-9router`：用 9Router 替换内置 DeepSeek 联网搜索（`/v1/search`，支持 Tavily/Exa/Brave/Serper 等），不消耗模型额度。
- `plugins/dsh-compact-model`：控制 ACP 压缩（compact）使用的模型与 provider，只允许选择支持关闭推理（reasoning off）的模型（`/compact-model`）。
- `vendor/opencode-zen-compat`：原有 opencode Zen 兼容包的可迁移副本。
- `patches/`：本地 pnpm 补丁——文件预览插件的路径拦截修复，以及 `dsh-open-in-vscode` 的编辑器识别增强（即使未安装 VS Code，也能扫描 Trae、Cursor、Windsurf、Kiro、CodeBuddy、Antigravity、VSCodium、Zed 等兼容编辑器）。
- `install.ps1`：完整插件安装清单、补丁应用和 DeepSeek `maxTokens: 65536` 配置修复。

### 清单内附带的开发体验插件

- `dsh-open-in-vscode`：从 Web GUI 一键在 VS Code 打开工作区目录。
- `dsh-lsp`：LSP 语义工具（定义跳转 / 引用查找 / 诊断）。
- `dsh-sidechain`：`/side` 持续侧会话 + `/btw` 一次性侧问（不污染主会话）。
- `dsh-annotation`：选中文字 → 批注 → 随消息发送。
- `dsh-paste-input`：Ctrl+V 粘贴 / 拖拽文件输入。
- `dsh-input-history`：↑/↓ 召回历史输入。
- `dsh-tool-*`（json / regex / csv / time / calculator / encoding）：确定性工具，减少模型幻觉。

脚本可以重复运行；它只安装清单内插件，不会删除其他插件。

## 安全提示

文件预览插件面向本机 loopback 使用。不要在未配置认证的情况下把 DSH Web/API 端口暴露到不可信局域网或公网。
