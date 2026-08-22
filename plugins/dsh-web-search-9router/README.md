# dsh-web-search-9router

用 [9Router](https://github.com/decolua/9router) 替换 DSH 内置的 DeepSeek 联网搜索 provider。

9Router 暴露 OpenAI 兼容的 `/v1/search` 聚合端点，底层可路由到 **Tavily / Exa / Brave / Serper /
SearXNG / Google PSE / Linkup / SearchAPI / You.com / Perplexity**，也支持 combo 自动降级。
搜索是一次独立的 HTTP 调用，**不消耗 DeepSeek 模型额度**，也不发起模型请求。

## 安装

插件本身放在 `plugins/dsh-web-search-9router`，通过仓库的 `install.ps1` 一键安装：

```powershell
.\install.ps1
dsh web --no-open
```

或手动安装：

```powershell
dsh plugin --profile web add F:\AITools\dsh-config-plugins\plugins\dsh-web-search-9router
```

## 配置

### 方式一：DSH 设置页（推荐）

插件注册了设置页（命名空间 `dsh-web-search-9router`），并自带浏览器半插件
（`client.js`，factory 形式的 client bundle），在 DSH Web 的
**设置 → 插件 → 插件配置** 里渲染一张“联网搜索（9Router）”卡片：

| 字段 | 说明 | 默认 |
|---|---|---|
| `baseURL` | 调用链接（9Router 服务地址）。留空使用默认；非空时须为合法的 `http(s)://` 地址，否则保存被拦截并提示 | `http://localhost:20128` |
| `apiKey` | API key（secret 字段：界面不回显，留空保存 = 保持现值；徽标显示是否已配置） | 空 |
| `searchProvider` | 默认搜索 provider/model。下拉选择已知 provider（tavily/exa/brave/serper/searxng/google-pse/linkup/searchapi/youcom/perplexity/combo），也保留自定义值 | `tavily` |

卡片遵循官方 staged-form 交互：编辑先暂存，保存时逐字段写入；覆盖过的字段
显示“已覆盖”徽标并可恢复默认。写入即生效（无需重启，`watch` 回调切换数据源），
保存成功会短暂显示“已保存”；`baseURL` 非空时会校验是否为合法 `http(s)` 地址，
非法值会阻止保存并给出提示；清除 API Key 时会出现二次确认提示，避免误删。

配置优先级：**设置页/entry 配置 > 环境变量 > 内置默认**。

### 方式二：环境变量（兜底）

通过环境变量配置（在启动 `dsh` 的 shell 里设置）：

| 变量 | 说明 | 默认 |
|---|---|---|
| `NINEROUTER_URL` | 9Router 服务地址 | `http://localhost:20128` |
| `NINEROUTER_KEY` | 鉴权 key（9Router 开启 auth 时必填） | 无 |
| `NINEROUTER_SEARCH_PROVIDER` | 默认搜索 provider/model | `tavily` |

可选 provider 值见 9Router `/v1/models/web` 返回的 id（如 `exa`、`brave`、`serper`、
`searxng`、`google-pse`、`linkup`、`searchapi`、`youcom`、`perplexity`、`combo` 等）。

## 工作原理

`cordis.patch.yml` 做三件事：

1. `insert:` 把本插件注册为一个 Loader 行，让 `index.js` 运行，并通过
   `ctx.web.registerSearchProvider()` 注册 provider（id = `9router`）。
2. 覆盖 `web` 行：`searchProvider: 9router`，固定使用本 provider。
3. 禁用 `web-search-deepseek` 行：避免内置 DeepSeek 搜索继续注册。

`index.js` 中的 `NineRouterSearchProvider` 实现 DSH 的 `WebSearchProvider` 接口：

- `available()`：纯本地检查 `NINEROUTER_URL` 是否可解析、provider 是否非空。
- `search(request, signal)`：`POST ${NINEROUTER_URL}/v1/search`，body 为
  `{ model, query, max_results? }`，带 `Authorization: Bearer $NINEROUTER_KEY`（如配置）。
  结果映射为 DSH 的 `WebSearchSource[]`（`url` / `title` / `snippet` / `publishedAt`），
  9Router 的可选 `answer` 映射为 `content`。

## 测试

```powershell
cd plugins\dsh-web-search-9router
node --test test.mjs
```

`index.js` 对 `@deepseek-ai/dsh-web` 的 `WebError` 采用惰性动态 import，因此本测试无需
安装 DSH 依赖即可独立运行；在 DSH 运行期该依赖必然存在，错误类型保持正确。

## 回滚

卸载本插件（`dsh plugin --profile web remove dsh-web-search-9router`）后，`web-search-deepseek`
行与 `web.searchProvider: deepseek-official` 会随 base 层恢复，回到内置 DeepSeek 搜索。
