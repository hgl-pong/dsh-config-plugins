# dsh-open-in-editor

从 Web GUI 工作区溢出菜单打开当前工作区目录。插件会自动探测可用编辑器，并在启动失败时继续尝试下一个候选。

支持的编辑器包括：

- VS Code / VS Code Insiders
- Cursor、Windsurf、Trae、Kiro、CodeBuddy、Antigravity
- VSCodium、Zed、Sublime Text、Lapce、Fleet
- IntelliJ IDEA、WebStorm、PyCharm、Neovim

默认编辑器优先级为上面的顺序。可在插件配置中设置 `editor` 为具体 ID，或设置 `command` 使用自定义命令：

```yaml
- id: dsh-open-in-editor
  config:
    editor: cursor
    args: []
```

也支持通过 `DSH_EDITOR` 环境变量选择编辑器。`editor: auto`（默认）会自动探测第一个可用编辑器。
