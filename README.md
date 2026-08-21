# dsh-config-plugins

可迁移的 DeepSeek Harness (`dsh`) 插件配置与本地修复包。

## 一键安装

前置条件：Windows、Node.js、pnpm，以及已安装可执行的 `dsh`。

```powershell
git clone https://github.com/hgl-pong/dsh-config-plugins.git
cd dsh-config-plugins
.\install.cmd
```

默认使用仓库内已经构建好的 `dsh-file` 产物。需要重新构建时：

```powershell
.\install.ps1 -BuildLocalEditor
```

安装完成后重启：

```powershell
dsh web --no-open
```

## 内容

- `plugins/dsh-file`：Monaco 文件管理器，包含 C/C++、`CMakeLists.txt`、`.cmake` 的工程文件映射，以及 Monaco 失败时的本地高亮 fallback。
- `plugins/dsh-local-sse-compat`：DeepSeek SSE 截断/空 payload 兼容和 compaction 专用请求调优。
- `vendor/opencode-zen-compat`：原有 opencode Zen 兼容包的可迁移副本。
- `patches/`：文件预览插件的路径拦截修复补丁。
- `install.ps1`：完整插件安装清单、补丁应用和 DeepSeek `maxTokens: 65536` 配置修复。

脚本可以重复运行；它只安装清单内插件，不会删除其他插件。

## 安全提示

文件预览插件面向本机 loopback 使用。不要在未配置认证的情况下把 DSH Web/API 端口暴露到不可信局域网或公网。
