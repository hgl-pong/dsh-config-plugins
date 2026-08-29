# ADR-0002：cordis-plugin-include 同目标补丁浅覆盖的修复方式

日期：2026-08-29　|　状态：已采纳（T-03；用户明确「后续就是要走这个插件」）

## 背景（事实）

多个 provider 插件的 cordis 补丁指向同一目标 `llm-pi-ai`。`@deepseek-ai/cordis-plugin-include@1.0.6` 的 `applyEntryPatches` 对同 id 条目的合并是 `target[key] = value`（lib/index.js 100-103 行）——**整体替换，无深合并**。实际后果：`dsh --profile web --dump-config` 的组合 llm-pi-ai 条目里只剩 `opencode-go-plus`（zen 最后写），`agnes:` 与 `glm-coding-plan:` 均 0 命中。agnes 不可见是先于本 job 的既有缺陷。

## 选项与落选原因

1. **报上游等修**——落选：用户明确后续要走本插件，等不了。
2. **把 provider 写进用户 settings.yaml**——落选：违背 PRD「不动用户 settings.yaml」的设计承诺（-not-in-scope 护栏项），且失去「卸载即消失」性质。
3. **运行时注册 API**——落选：dsh-llm / dsh-llm-pi-ai 无 addProvider 类 API（已 grep 证实）。
4. **pnpm patch**——落选：`cordis-plugin-include` 不在 profile 的 pnpm 依赖里，它经 `profiles/node_modules` 符号链接解析到 dsh 安装闭包的真实文件，pnpm patch 够不着。
5. **✅ 安装级幂等修改（采纳）**：install.ps1 新增 `Ensure-PluginIncludeMergePatch`，按仓库既有先例（「DeepSeek maxTokens: 65536 配置修复」同为对安装产物的幂等修改）直接修改安装闭包里的 `lib/index.js`：同 id 补丁合并时，两侧均为普通对象的值递归深合并；数组与标量保持整体替换（保留「有意覆盖子树」的既有语义）。

## 合并策略

- 普通对象：递归深合并（provider 键各自共存）。
- 数组、标量、null：整体替换（不引入 concat 之类新语义，避免改变现有「有意覆盖列表」的补丁行为）。

## 代价与风险

- dsh CLI 升级会重写安装产物 → 补丁被抹；`Ensure-PluginIncludeMergePatch` 幂等且版本门禁 1.0.6，install.ps1 每次运行自动补回；版本漂移时 warn+skip（fail-safe）。
- 深合并改变组合语义 → 需按 DoD 用 `--dump-config` 回归（三家 provider 共存）+ 现有插件行为抽查；上游若修复可整体撤除本补丁。
