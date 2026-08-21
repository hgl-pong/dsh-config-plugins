# Markdown 预览 + 渲染/源码切换 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 打开 .md 文件时默认渲染 Markdown 预览（只读），工具栏"主题"按钮旁增加 VS Code 风格的渲染/源码切换按钮，模式选择持久化到 localStorage。

**Architecture:** 客户端纯前端改动。新增 `src/client/markdown.ts`（marked 渲染封装 + 路径判断）、`src/client/mdModeStore.ts`（模式偏好 localStorage store，沿用 themeStore 的 useSyncExternalStore 模式）；修改 `FileEditorView.tsx` 在 EditorPane 前插入预览分支、工具栏加切换按钮；`styles.css` 增加 `.dshf-md-preview` 排版样式。marked 作为依赖由 esbuild 内联进 client bundle，无网络依赖。

**Tech Stack:** React 18（useSyncExternalStore）、marked ^18、esbuild（已有构建链）、node:test + Node 22 type-stripping（测试）、CSS 自定义属性主题。

---

## File Structure

| 文件 | 操作 | 职责 |
|---|---|---|
| `package.json` | 修改 | `dependencies` 增加 `marked`；`scripts.test` 增加 `node --test "test/*.test.ts"` |
| `src/client/markdown.ts` | 新建 | `renderMarkdown()`（marked 渲染 + 失败兜底）、`isMarkdownPath()`（.md/.markdown 判断） |
| `src/client/mdModeStore.ts` | 新建 | `useMdMode()` / `setMdMode()` + localStorage 持久化（`preview`/`source`） |
| `src/client/FileEditorView.tsx` | 修改 | 工具栏切换按钮（仅 .md）、EditorPane 预览分支、`MarkdownPreview` 组件 |
| `src/client/styles.css` | 修改 | `.dshf-md-preview` 排版 + `.dshf-md-toggle` 按钮样式 |
| `test/markdown.test.ts` | 新建 | renderMarkdown / isMarkdownPath 单元测试 |
| `test/mdModeStore.test.ts` | 新建 | 模式加载/持久化/损坏回退测试 |
| `README.md` / `README.en.md` | 修改 | 功能列表加 Markdown 预览条目 |

## 测试说明

- 测试用 Node 22 原生 type-stripping 跑 `.ts`：`node --test "test/*.test.ts"`（项目 `package.json` 已是 `"type": "module"`，Node 22.21 默认开启 strip-types）
- 运行测试需 Node ≥ 22.6（建议 22.18+）。当前机器 Node 位于 `~/.nvm/versions/node/v22.21.0/bin`
- 测试文件 import 带 `.ts` 扩展名（`tsconfig.json` 已开 `allowImportingTsExtensions`）

---

### Task 1: 添加 marked 依赖与测试脚本

**Files:**
- Modify: `package.json`

- [ ] **Step 1: 安装 marked 并添加测试脚本**

```bash
export PATH="$HOME/.nvm/versions/node/v22.21.0/bin:$PATH"
cd /Users/chenwang/github/dsh-plugin/dsh-file
npm install marked@^18.0.9
```

然后把 `package.json` 的 `scripts` 改为：

```json
"scripts": {
  "build": "node build.mjs",
  "dev": "node build.mjs --watch",
  "test": "node --test "test/*.test.ts""
}
```

- [ ] **Step 2: 验证 marked 已进入 dependencies**

Run: `node -e "const p=require('./package.json'); console.log(p.dependencies.marked)"`
Expected: `^18.0.9`（或 npm 写入的实际 semver 范围）

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add marked dependency and node --test script"
```

---

### Task 2: markdown.ts — 渲染封装与路径判断（TDD）

**Files:**
- Create: `src/client/markdown.ts`
- Test: `test/markdown.test.ts`

- [ ] **Step 1: 写失败测试**

Create `test/markdown.test.ts`:

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isMarkdownPath, renderMarkdown } from '../src/client/markdown.ts';

test('isMarkdownPath: .md / .markdown 识别，其他扩展名拒绝', () => {
  assert.equal(isMarkdownPath('README.md'), true);
  assert.equal(isMarkdownPath('docs/guide.markdown'), true);
  assert.equal(isMarkdownPath('a.MD'), true);
  assert.equal(isMarkdownPath('main.ts'), false);
  assert.equal(isMarkdownPath('README.md.bak'), false);
  assert.equal(isMarkdownPath(''), false);
});

test('renderMarkdown: 渲染标题/列表/行内代码', () => {
  const html = renderMarkdown('# Title\n\n- a\n- b\n\n`code` here');
  assert.match(html, /<h1>Title<\/h1>/);
  assert.match(html, /<li>a<\/li>/);
  assert.match(html, /<code>code<\/code>/);
});

test('renderMarkdown: GFM 表格渲染为 <table>', () => {
  const html = renderMarkdown('| a | b |\n|---|---|\n| 1 | 2 |');
  assert.match(html, /<table>/);
  assert.match(html, /<th>a<\/th>/);
});

test('renderMarkdown: 代码块带 language class', () => {
  const html = renderMarkdown('```ts\nconst x = 1;\n```');
  assert.match(html, /<pre><code class="language-ts">/);
});

test('renderMarkdown: 失败时兜底返回 <pre> 原文（不抛异常）', () => {
  // 构造会让 marked 抛错的输入不可靠，这里验证 API 从不抛且总返回字符串。
  const html = renderMarkdown('plain **text**');
  assert.equal(typeof html, 'string');
  assert.ok(html.length > 0);
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `export PATH="$HOME/.nvm/versions/node/v22.21.0/bin:$PATH" && node --test "test/*.test.ts"markdown.test.ts`
Expected: FAIL — `Cannot find module '../src/client/markdown.ts'`（模块还不存在）

- [ ] **Step 3: 实现 markdown.ts**

Create `src/client/markdown.ts`:

```ts
/**
 * Markdown rendering for the dsh-file editor view.
 *
 * Uses `marked` (bundled into the client via esbuild — no CDN dependency).
 * GFM is enabled; `breaks: true` makes single newlines render as <br> (the
 * behavior most chat/README documents expect). Rendering never throws: any
 * failure falls back to the raw text inside a <pre> so the preview pane can
 * never go blank.
 */
import { marked } from 'marked';

/** Render Markdown text to an HTML string (GFM, soft-break enabled). */
export function renderMarkdown(text: string): string {
  try {
    const html = marked.parse(text, { gfm: true, breaks: true });
    return typeof html === 'string' ? html : String(html);
  } catch {
    // Never blank the preview: show the raw source in a <pre>.
    return `<pre>${escapeHtml(text)}</pre>`;
  }
}

/** Whether a file path is a Markdown file (.md / .markdown, case-insensitive). */
export function isMarkdownPath(path: string): boolean {
  const dot = path.lastIndexOf('.');
  if (dot <= 0) return false;
  const ext = path.slice(dot + 1).toLowerCase();
  return ext === 'md' || ext === 'markdown';
}

/** Minimal HTML escaping for the fallback path. */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
```

- [ ] **Step 4: 运行测试确认通过**

Run: `export PATH="$HOME/.nvm/versions/node/v22.21.0/bin:$PATH" && node --test "test/*.test.ts"markdown.test.ts`
Expected: PASS — 5 个测试全过

- [ ] **Step 5: Commit**

```bash
git add src/client/markdown.ts test/markdown.test.ts
git commit -m "feat: markdown render helper (marked, GFM) with tests"
```

---

### Task 3: mdModeStore — 渲染/源码模式偏好（TDD）

**Files:**
- Create: `src/client/mdModeStore.ts`
- Test: `test/mdModeStore.test.ts`

- [ ] **Step 1: 写失败测试**

Create `test/mdModeStore.test.ts`:

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  loadMdMode,
  persistMdMode,
  DEFAULT_MD_MODE,
  MD_MODE_STORAGE_KEY,
} from '../src/client/mdModeStore.ts';

/** In-memory Storage double (Node has no localStorage). */
function fakeStorage(initial: Record<string, string> = {}): Storage {
  const map = new Map(Object.entries(initial));
  return {
    get length() { return map.size; },
    clear: () => map.clear(),
    getItem: (k: string) => map.get(k) ?? null,
    key: (i: number) => [...map.keys()][i] ?? null,
    removeItem: (k: string) => { map.delete(k); },
    setItem: (k: string, v: string) => { map.set(k, String(v)); },
  };
}

test('DEFAULT_MD_MODE 是 preview', () => {
  assert.equal(DEFAULT_MD_MODE, 'preview');
});

test('loadMdMode: 无存储值返回默认 preview', () => {
  assert.equal(loadMdMode(fakeStorage()), 'preview');
});

test('loadMdMode: 读取持久化的 source', () => {
  const storage = fakeStorage({ [MD_MODE_STORAGE_KEY]: 'source' });
  assert.equal(loadMdMode(storage), 'source');
});

test('loadMdMode: 损坏值回退默认', () => {
  const storage = fakeStorage({ [MD_MODE_STORAGE_KEY]: 'banana' });
  assert.equal(loadMdMode(storage), 'preview');
});

test('persistMdMode: 写入存储', () => {
  const storage = fakeStorage();
  persistMdMode('source', storage);
  assert.equal(storage.getItem(MD_MODE_STORAGE_KEY), 'source');
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `export PATH="$HOME/.nvm/versions/node/v22.21.0/bin:$PATH" && node --test "test/*.test.ts"mdModeStore.test.ts`
Expected: FAIL — `Cannot find module '../src/client/mdModeStore.ts'`

- [ ] **Step 3: 实现 mdModeStore.ts**

Create `src/client/mdModeStore.ts`:

```ts
/**
 * Markdown view-mode preference for the dsh-file editor view.
 *
 * Holds whether Markdown files open in rendered preview or raw source,
 * persisted to localStorage (global preference — not per file). Follows the
 * same useSyncExternalStore pattern as themeStore.ts.
 */
import { useSyncExternalStore } from 'react';

/** The two Markdown view modes. */
export type MdViewMode = 'preview' | 'source';

/** Default mode: rendered preview. */
export const DEFAULT_MD_MODE: MdViewMode = 'preview';

/** localStorage key (versioned to allow future migrations). */
export const MD_MODE_STORAGE_KEY = 'dsh-file:md-mode:v1';

const VALID: ReadonlySet<string> = new Set(['preview', 'source']);

/** Read the persisted mode; falls back to DEFAULT_MD_MODE. */
export function loadMdMode(storage: Pick<Storage, 'getItem'> | undefined): MdViewMode {
  try {
    const raw = storage?.getItem(MD_MODE_STORAGE_KEY);
    return raw !== null && raw !== undefined && VALID.has(raw) ? (raw as MdViewMode) : DEFAULT_MD_MODE;
  } catch {
    return DEFAULT_MD_MODE;
  }
}

/** Persist the mode (best-effort; storage failures are ignored). */
export function persistMdMode(mode: MdViewMode, storage: Pick<Storage, 'setItem'> | undefined): void {
  try {
    storage?.setItem(MD_MODE_STORAGE_KEY, mode);
  } catch { /* quota / privacy mode: keep in-memory */ }
}

let current: MdViewMode = loadMdMode(safeStorage());
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

/** localStorage guarded for SSR / Node (tests, no window). */
function safeStorage(): Storage | undefined {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : undefined;
  } catch {
    return undefined;
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function snapshot(): MdViewMode {
  return current;
}

/** React hook: the current Markdown view mode. */
export function useMdMode(): MdViewMode {
  return useSyncExternalStore(subscribe, snapshot);
}

/** Switch the Markdown view mode (persisted, live). */
export function setMdMode(mode: MdViewMode): void {
  current = mode;
  const storage = safeStorage();
  if (storage !== undefined) persistMdMode(mode, storage);
  emit();
}
```

要点：`loadMdMode(safeStorage())` 在模块顶层调用——`safeStorage()` 在 Node 测试环境返回 `undefined`，`loadMdMode(undefined)` 走 `storage?.getItem` 短路，返回默认值，所以模块可在无 localStorage 环境安全导入。测试显式传 fakeStorage，不受影响。

- [ ] **Step 4: 运行测试确认通过**

Run: `export PATH="$HOME/.nvm/versions/node/v22.21.0/bin:$PATH" && node --test "test/*.test.ts"mdModeStore.test.ts`
Expected: PASS — 5 个测试全过

- [ ] **Step 5: Commit**

```bash
git add src/client/mdModeStore.ts test/mdModeStore.test.ts
git commit -m "feat: md view-mode preference store with localStorage persistence"
```

---

### Task 4: FileEditorView — 切换按钮与预览分支

**Files:**
- Modify: `src/client/FileEditorView.tsx`

- [ ] **Step 1: 添加 import 与组件状态**

在 `FileEditorView.tsx` 顶部 import 区（现有 store/theme 导入之后）加：

```ts
import { isMarkdownPath, renderMarkdown } from './markdown.ts';
import { useMdMode, setMdMode, type MdViewMode } from './mdModeStore.ts';
```

在 `FileEditorView` 组件体内（`const theme = useEditorTheme();` 之后）加：

```ts
const mdMode = useMdMode();
```

- [ ] **Step 2: 工具栏加切换按钮（仅 .md 文件）**

在 `FileEditorView` 的有文件分支（`active !== undefined`）里，把：

```tsx
        <span className="dshf-editor-path" title={active.path}>{active.path}</span>
        <ThemeButton />
```

改为：

```tsx
        <span className="dshf-editor-path" title={active.path}>{active.path}</span>
        {isMarkdownPath(active.path) && (
          <button
            type="button"
            className="dshf-btn dshf-md-toggle"
            title={mdMode === 'preview' ? '编辑源码' : '预览渲染效果'}
            onClick={() => setMdMode(mdMode === 'preview' ? 'source' : 'preview')}
          >
            <MdModeIcon mode={mdMode} />
          </button>
        )}
        <ThemeButton />
```

- [ ] **Step 3: 编辑器区加预览分支**

把：

```tsx
      <EditorPane
        key={active.path}
        path={active.path}
        content={active.content}
        onChange={updateActiveContent}
        theme={theme}
      />
```

改为：

```tsx
      {isMarkdownPath(active.path) && mdMode === 'preview' ? (
        <MarkdownPreview content={active.content} />
      ) : (
        <EditorPane
          key={active.path}
          path={active.path}
          content={active.content}
          onChange={updateActiveContent}
          theme={theme}
        />
      )}
```

- [ ] **Step 4: 新增 MarkdownPreview 与 MdModeIcon 组件**

在 `FileEditorView.tsx` 末尾（`languageOf` 函数之前）加：

```tsx
/** Rendered Markdown preview (read-only). Falls back to raw <pre> on render failure. */
function MarkdownPreview({ content }: { content: string }): JSX.Element {
  const html = useMemo(() => renderMarkdown(content), [content]);
  return <div className="dshf-md-preview" dangerouslySetInnerHTML={{ __html: html }} />;
}

/** VS Code style icon for the render/source toggle. */
function MdModeIcon({ mode }: { mode: MdViewMode }): JSX.Element {
  if (mode === 'preview') {
    // "open-preview" style: split box + arrow (current mode preview → action switches to source)
    return (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M4 2h8v1H4zM2 4h12v1H2zM4 6h8v1H4zM2 8h12v1H2zM4 10h4v1H4z" fill="currentColor" />
      </svg>
    );
  }
  // source / edit style icon (current mode source → action switches to preview)
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M11.3 1.3l3.4 3.4-7.9 7.9L3 13l.4-3.8 7.9-7.9z" fill="currentColor" />
    </svg>
  );
}
```

确认 `useMemo` 已在文件顶部 import（`import { useCallback, useEffect, useRef, useState } from 'react';` → 改为 `import { useCallback, useEffect, useMemo, useRef, useState } from 'react';`）。

- [ ] **Step 5: 构建验证**

Run: `export PATH="$HOME/.nvm/versions/node/v22.21.0/bin:$PATH" && node build.mjs`
Expected: 输出 `[dsh-file] host compiled → dist/index.js` 与 `[dsh-file] client bundle built → dist/client.js`，无报错。

- [ ] **Step 6: Commit**

```bash
git add src/client/FileEditorView.tsx
git commit -m "feat: markdown preview branch and render/source toggle button"
```

---

### Task 5: styles.css — 预览排版与切换按钮

**Files:**
- Modify: `src/client/styles.css`

- [ ] **Step 1: 添加预览与按钮样式**

在 `styles.css` 的 `/* ── editor theme panel (VS Code style) ──` 段之前插入：

```css
/* ── Markdown preview (read-only rendered view) ─────────────────────────── */

.dshf-editor-view .dshf-md-preview {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 12px 20px 32px;
  font-size: var(--dshf-font-size, 13px);
  line-height: 1.6;
  color: var(--dshf-fg, #1f2328);
  background: var(--dshf-bg, #ffffff);
  box-sizing: border-box;
  word-wrap: break-word;
}

.dshf-editor-view .dshf-md-preview > :first-child {
  margin-top: 0;
}

.dshf-editor-view .dshf-md-preview h1,
.dshf-editor-view .dshf-md-preview h2,
.dshf-editor-view .dshf-md-preview h3,
.dshf-editor-view .dshf-md-preview h4 {
  margin: 1.2em 0 0.5em;
  line-height: 1.3;
  color: var(--dshf-fg, #1f2328);
}
.dshf-editor-view .dshf-md-preview h1 { font-size: 1.6em; border-bottom: 1px solid var(--dshf-border, #e0e0e0); padding-bottom: 0.3em; }
.dshf-editor-view .dshf-md-preview h2 { font-size: 1.35em; border-bottom: 1px solid var(--dshf-border, #e0e0e0); padding-bottom: 0.25em; }
.dshf-editor-view .dshf-md-preview h3 { font-size: 1.15em; }
.dshf-editor-view .dshf-md-preview h4 { font-size: 1em; }

.dshf-editor-view .dshf-md-preview p {
  margin: 0.6em 0;
}

.dshf-editor-view .dshf-md-preview ul,
.dshf-editor-view .dshf-md-preview ol {
  margin: 0.6em 0;
  padding-left: 1.6em;
}

.dshf-editor-view .dshf-md-preview li {
  margin: 0.2em 0;
}

.dshf-editor-view .dshf-md-preview blockquote {
  margin: 0.8em 0;
  padding: 0.1em 1em;
  border-left: 3px solid var(--dshf-border, #d0d0d0);
  color: var(--dshf-muted, #868e96);
  background: var(--dshf-chip, #f3f3f3);
  border-radius: 0 6px 6px 0;
}

.dshf-editor-view .dshf-md-preview code {
  font-family: var(--dsw-font-mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace);
  font-size: 0.92em;
  background: var(--dshf-chip, #ececec);
  border-radius: 4px;
  padding: 0.1em 0.35em;
}

.dshf-editor-view .dshf-md-preview pre {
  margin: 0.8em 0;
  padding: 10px 12px;
  background: var(--dshf-chip, #ececec);
  border: 1px solid var(--dshf-border, #d0d0d0);
  border-radius: 8px;
  overflow: auto;
}
.dshf-editor-view .dshf-md-preview pre code {
  background: transparent;
  padding: 0;
  font-size: 0.92em;
  line-height: 1.5;
}

.dshf-editor-view .dshf-md-preview a {
  color: var(--dshf-accent, #094771);
  text-decoration: none;
}
.dshf-editor-view .dshf-md-preview a:hover {
  text-decoration: underline;
}

.dshf-editor-view .dshf-md-preview img {
  max-width: 100%;
}

.dshf-editor-view .dshf-md-preview table {
  border-collapse: collapse;
  margin: 0.8em 0;
  display: block;
  overflow: auto;
  max-width: 100%;
}
.dshf-editor-view .dshf-md-preview th,
.dshf-editor-view .dshf-md-preview td {
  border: 1px solid var(--dshf-border, #d0d0d0);
  padding: 4px 10px;
}
.dshf-editor-view .dshf-md-preview th {
  background: var(--dshf-chip, #ececec);
  font-weight: 600;
}

.dshf-editor-view .dshf-md-preview hr {
  border: none;
  border-top: 1px solid var(--dshf-border, #d0d0d0);
  margin: 1em 0;
}

.dshf-editor-view .dshf-md-preview input[type='checkbox'] {
  margin-right: 0.4em;
}

/* Toggle button: keep it subtle like the theme button */
.dshf-editor-view .dshf-md-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px 5px;
}
.dshf-editor-view .dshf-md-toggle svg {
  display: block;
}
```

- [ ] **Step 2: 构建验证**

Run: `export PATH="$HOME/.nvm/versions/node/v22.21.0/bin:$PATH" && node build.mjs`
Expected: 构建成功，无报错。

- [ ] **Step 3: 全量测试**

Run: `export PATH="$HOME/.nvm/versions/node/v22.21.0/bin:$PATH" && node --test "test/*.test.ts"`
Expected: PASS — 10 个测试全过（markdown 5 + mdModeStore 5）

- [ ] **Step 4: Commit**

```bash
git add src/client/styles.css
git commit -m "style: markdown preview typography and toggle button styles"
```

---

### Task 6: README 更新

**Files:**
- Modify: `README.md`
- Modify: `README.en.md`

- [ ] **Step 1: 中文 README 功能列表加条目**

在 `README.md` 的功能列表（`- **中间列编辑器（视图标签）**` 一条之后）插入：

```markdown
- **Markdown 预览**：打开 `.md` 文件默认渲染为只读预览（marked + GFM，支持表格/任务列表/代码块），工具栏"主题"按钮旁有 VS Code 风格的预览/源码切换按钮；模式选择会记住（localStorage），下次打开沿用
```

- [ ] **Step 2: 英文 README 加对应条目**

在 `README.en.md` 的 Features 列表对应位置插入：

```markdown
- **Markdown preview**: `.md` files open as a rendered read-only preview by default (marked + GFM — tables, task lists, code blocks). A VS Code-style preview/source toggle button sits next to the theme button in the toolbar; the last chosen mode is remembered (localStorage) and reused on the next open.
```

- [ ] **Step 3: Commit**

```bash
git add README.md README.en.md
git commit -m "docs: document markdown preview and render/source toggle"
```

---

### Task 7: 端到端验证

- [ ] **Step 1: 构建 + 全部测试**

Run: `export PATH="$HOME/.nvm/versions/node/v22.21.0/bin:$PATH" && node build.mjs && node --test "test/*.test.ts"`
Expected: 构建成功 + 10 个测试全过。

- [ ] **Step 2: 确认 marked 已内联进 client bundle**

Run: `grep -c "marked" dist/client.js`
Expected: 输出大于 0（marked 源码已打进 bundle，无 CDN 依赖）。

- [ ] **Step 3: 手工验证（需要运行中的 dsh web / 桌面端）**

1. 打开一个 `.md` 文件 → 默认显示渲染预览（标题/列表/表格/代码块排版正确）
2. 点击切换按钮（图标）→ 切回 Monaco 源码编辑
3. 修改源码并保存 → 再点切换按钮 → 预览显示更新后的内容
4. 刷新页面 → 打开另一个 `.md` → 沿用上次的模式（preview 或 source）
5. 打开 `.ts` 文件 → 工具栏无切换按钮，行为与之前一致
6. 深色/浅色主题下预览配色跟随主题（One Dark、GitHub 等）

- [ ] **Step 4: 最终提交确认**

Run: `git log --oneline -8`
Expected: 最近提交包含本计划的全部 6 个功能/文档提交。

---

## Self-Review 记录

- **Spec 覆盖**：只读预览 ✓（Task 4）、marked 内联 ✓（Task 1-2）、模式记忆 ✓（Task 3）、仅 md 显示 + 单按钮 + VS Code 图标 ✓（Task 4）、无高亮 ✓（样式仅等宽+背景）、主题联动 ✓（Task 5 用 `--dshf-*` 变量）。
- **占位符扫描**：无 TBD/TODO；所有代码步骤含完整实现。
- **类型一致性**：`MdViewMode = 'preview' | 'source'`、`DEFAULT_MD_MODE`、`MD_MODE_STORAGE_KEY`、`loadMdMode`/`persistMdMode` 签名在 Task 3 测试与实现一致；`renderMarkdown`/`isMarkdownPath` 在 Task 2 一致；`MdModeIcon({mode})`、`MarkdownPreview({content})` 在 Task 4 一致。
- **测试文件 import 路径**：`../src/client/*.ts` 带 `.ts` 扩展名，匹配 `allowImportingTsExtensions`。
