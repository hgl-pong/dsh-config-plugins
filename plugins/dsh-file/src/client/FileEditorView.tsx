/**
 * The file editor VIEW: renders inside the conversation center column
 * (`conversation.view` slot, in the session body scroll area) — not a popup.
 * The sidebar tree loads a file into the shared store; this view displays and
 * edits the active file in place.
 *
 * Theming: the view surface (background, text, chrome strips) follows the
 * editor theme (themeStore) — presets or custom colors/font size, applied to
 * both the Monaco editor and the surrounding chrome. The editor is Monaco
 * (uncontrolled, keyed by path); falls back to a plain textarea when the CDN
 * is unreachable.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type React from 'react';
import hljs from 'highlight.js/lib/core';
import bash from 'highlight.js/lib/languages/bash';
import cpp from 'highlight.js/lib/languages/cpp';
import plaintext from 'highlight.js/lib/languages/plaintext';
import type { FileManagerRemote } from './remote.ts';
import { unwrap } from './remote.ts';
import { ensureMonaco } from './monaco.ts';
import { useActivePath, useTabs, focusTab, closeTab, updateActiveContent, markSaved, closeEditor, setEditorViewActive, type OpenTab } from './store.ts';
import { isMarkdownPath, renderMarkdown } from './markdown.ts';
import { useMdMode, setMdMode, type MdViewMode } from './mdModeStore.ts';
import {
  useEditorTheme,
  themeChrome,
  setEditorTheme,
  resetEditorTheme,
  EDITOR_THEME_PRESETS,
  EDITOR_THEME_PRESET_ORDER,
  EDITOR_THEME_PRESET_LABELS,
  presetIdOf,
  exportThemeText,
  parseImportedTheme,
  isLightColor,
  mixColors,
  type EditorThemeSettings,
} from './themeStore.ts';

hljs.registerLanguage('bash', bash);
hljs.registerLanguage('cpp', cpp);
hljs.registerLanguage('plaintext', plaintext);

function fallbackLanguage(path: string): string {
  const filename = path.split(/[\\/]/).pop()?.toLowerCase() ?? '';
  if (filename === 'cmakelists.txt' || filename.endsWith('.cmake')) return 'bash';
  const ext = filename.split('.').pop() ?? '';
  if (['c', 'h'].includes(ext)) return 'cpp';
  if (['cpp', 'cc', 'cxx', 'hpp', 'hh', 'hxx', 'inl', 'ipp', 'tpp'].includes(ext)) return 'cpp';
  if (['sh', 'bash', 'zsh'].includes(ext)) return 'bash';
  return 'plaintext';
}

function highlightFallback(path: string, content: string): string {
  try {
    return hljs.highlight(content, { language: fallbackLanguage(path), ignoreIllegals: true }).value;
  } catch {
    return content.replace(/[&<>]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[character] ?? character));
  }
}

/** Simple classnames helper (no deps). */
function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

/** CSS custom properties the chrome styles read from. */
type ThemeVars = Record<string, string>;

export function FileEditorView({ remote, t }: { remote: FileManagerRemote; t?: (key: string) => string }): JSX.Element {
  const tabs = useTabs();
  const activePath = useActivePath();
  const active = activePath === null ? undefined : tabs.find((t) => t.path === activePath);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const theme = useEditorTheme();
  const chrome = themeChrome(theme);
  const mdMode = useMdMode();

  // While the "文件" view is the active conversation view, request the
  // sidebar tree panel to open; switching to another view closes it again.
  useEffect(() => {
    setEditorViewActive(true);
    return () => setEditorViewActive(false);
  }, []);

  const saveActive = useCallback(async () => {
    if (active === undefined || !active.dirty) return;
    setBusy(true);
    try {
      await unwrap(await remote.writeText(active.path, active.content));
      markSaved(active.path);
      setNotice(`已保存 ${active.path.split('/').pop()}`);
    } catch (error) {
      setNotice(`保存失败: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setBusy(false);
    }
  }, [active, remote]);

  const saveRef = useRef(saveActive);
  saveRef.current = saveActive;

  // Ctrl/Cmd+S saves (in the page, no popup).
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        void saveRef.current();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const themeVars: ThemeVars = {
    '--dshf-bg': theme.background,
    '--dshf-fg': theme.foreground,
    '--dshf-chrome': chrome.chrome,
    '--dshf-border': chrome.border,
    '--dshf-muted': chrome.muted,
    '--dshf-chip': chrome.chip,
    '--dshf-dirty': chrome.dirty,
    '--dshf-accent': '#094771',
    '--dshf-font-size': `${theme.fontSize}px`,
  };

  // No file open yet: idle hint instead of an empty pane.
  if (active === undefined) {
    return (
      <div className="dshf-editor-view" style={themeVars as React.CSSProperties}>
        <div className="dshf-editor-toolbar">
          <span className="dshf-title">{t ? t('view.label') : '文件'}</span>
          <span className="dshf-spacer" />
          <ThemeButton />
        </div>
        <div className="dshf-empty">{t ? t('view.empty') : '在左侧文件树中选择一个文件，即可在此编辑'}</div>
      </div>
    );
  }

  return (
    <div className="dshf-editor-view" style={themeVars as React.CSSProperties}>
      <div className="dshf-editor-toolbar">
        <span className={cx('dshf-tabname', active.dirty && 'dshf-dirty')} title={active.path}>
          {active.dirty ? '● ' : ''}{active.path.split('/').pop()}
        </span>
        <span className="dshf-spacer" />
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
        <button
          type="button"
          className="dshf-btn"
          title="保存 (Ctrl+S)"
          disabled={!active.dirty || busy}
          onClick={() => void saveActive()}
        >保存</button>
        <button
          type="button"
          className="dshf-btn"
          title="关闭当前文件"
          disabled={tabs.length <= 1}
          onClick={closeEditor}
        >✕</button>
      </div>
      <div className={cx('dshf-status', 'dshf-status-top')}>
        {tabs.length > 0 && (
          <span className="dshf-tabs-strip">
            {tabs.map((t) => (
              <span
                key={t.path}
                className={cx('dshf-tab-chip', t.path === activePath && 'dshf-tab-chip-active')}
                title={t.path}
              >
                <button
                  type="button"
                  className="dshf-tab-chip-name"
                  onClick={() => focusTab(t.path)}
                >{t.path.split('/').pop()}</button>
                <button
                  type="button"
                  className="dshf-tab-chip-close"
                  aria-label={`关闭 ${t.path.split('/').pop()}`}
                  title="关闭"
                  onClick={() => closeTab(t.path)}
                >✕</button>
              </span>
            ))}
          </span>
        )}
        <span className="dshf-status-meta">
          <span className="dshf-status-busy">{busy ? '…' : ''}</span>
          <span className={cx('dshf-status-notice', notice === null && 'dshf-hidden')}>{notice ?? ''}</span>
        </span>
      </div>
      {isMarkdownPath(active.path) && mdMode === 'preview' ? (
        <MarkdownPreview content={active.content} path={active.path} remote={remote} />
      ) : (
        <EditorPane
          key={active.path}
          path={active.path}
          content={active.content}
          onChange={updateActiveContent}
          theme={theme}
        />
      )}
    </div>
  );
}

/** VS Code style theme button: opens a panel to pick presets / custom colors. */
function ThemeButton(): JSX.Element {
  const [open, setOpen] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const theme = useEditorTheme();
  const presetId = presetIdOf(theme);

  /** Download the current theme as a JSON file (VS Code style payload). */
  const handleExport = () => {
    const name = presetId !== undefined
      ? `dsh-file · ${EDITOR_THEME_PRESET_LABELS[presetId] ?? presetId}`
      : 'dsh-file · 自定义';
    const text = exportThemeText(theme, name);
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dsh-file-theme-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  /** Read a picked theme JSON and apply it. */
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-importing the same file later
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = parseImportedTheme(String(reader.result ?? ''));
        setEditorTheme({ background: imported.background, foreground: imported.foreground, fontSize: imported.fontSize });
        setImportError(null);
      } catch (error) {
        setImportError(error instanceof Error ? error.message : String(error));
      }
    };
    reader.onerror = () => setImportError('读取文件失败');
    reader.readAsText(file);
  };

  return (
    <span className="dshf-theme-wrap">
      <button
        type="button"
        className="dshf-btn"
        title="编辑器主题设置"
        onClick={() => setOpen((v) => !v)}
      >主题</button>
      {open && (
        <div className="dshf-theme-panel" role="dialog" aria-label="编辑器主题">
          <label className="dshf-theme-row">
            <span className="dshf-theme-label">预设</span>
            <select
              className="dshf-theme-select"
              value={presetId ?? 'custom'}
              onChange={(e) => {
                const preset = EDITOR_THEME_PRESETS[e.target.value];
                if (preset) setEditorTheme(preset);
              }}
            >
              <option value="custom" disabled>自定义</option>
              {EDITOR_THEME_PRESET_ORDER.map((id) => (
                <option key={id} value={id}>{EDITOR_THEME_PRESET_LABELS[id] ?? id}</option>
              ))}
            </select>
          </label>
          <label className="dshf-theme-row">
            <span className="dshf-theme-label">背景</span>
            <input
              type="color"
              value={theme.background}
              onChange={(e) => setEditorTheme({ background: e.target.value })}
            />
            <code className="dshf-theme-hex">{theme.background}</code>
          </label>
          <label className="dshf-theme-row">
            <span className="dshf-theme-label">文字</span>
            <input
              type="color"
              value={theme.foreground}
              onChange={(e) => setEditorTheme({ foreground: e.target.value })}
            />
            <code className="dshf-theme-hex">{theme.foreground}</code>
          </label>
          <label className="dshf-theme-row">
            <span className="dshf-theme-label">字号</span>
            <input
              type="number"
              className="dshf-theme-fontsize"
              min={10}
              max={28}
              value={theme.fontSize}
              onChange={(e) => {
                const n = Number(e.target.value);
                if (Number.isFinite(n) && n > 0) setEditorTheme({ fontSize: n });
              }}
            />
            <span className="dshf-theme-unit">px</span>
          </label>
          {importError !== null && <div className="dshf-theme-error">{importError}</div>}
          <div className="dshf-theme-row dshf-theme-actions">
            <button type="button" className="dshf-btn" title="将当前主题保存为 JSON 文件" onClick={handleExport}>导出主题</button>
            <button type="button" className="dshf-btn" title="从 JSON 文件导入主题" onClick={() => fileRef.current?.click()}>导入主题</button>
            <input
              ref={fileRef}
              type="file"
              accept=".json,application/json"
              className="dshf-hidden-input"
              onChange={handleImportFile}
            />
            <button type="button" className="dshf-btn" title="恢复默认浅色主题" onClick={() => resetEditorTheme()}>重置</button>
          </div>
        </div>
      )}
    </span>
  );
}

/** Monaco editor pane (uncontrolled; every change reports up via onChange). */
function EditorPane({ path, content, onChange, theme }: {
  path: string;
  content: string;
  onChange: (content: string) => void;
  theme: EditorThemeSettings;
}): JSX.Element {
  const [mode, setMode] = useState<'loading' | 'monaco' | 'textarea' | 'highlight'>('loading');
  const [monacoLib, setMonacoLib] = useState<unknown>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<{ dispose(): void; getValue(): string; onDidChangeModelContent(fn: () => void): void; updateOptions?(opts: Record<string, unknown>): void } | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const initialRef = useRef(content);
  initialRef.current = content;

  // Stage 1: load Monaco (async); fall back to a textarea when unreachable.
  useEffect(() => {
    let disposed = false;
    setMode('loading');
    ensureMonaco().then((monaco) => {
      if (disposed) return;
      setMonacoLib(monaco);
      setMode('monaco');
    }).catch(() => {
      if (!disposed) setMode('highlight');
    });
    return () => {
      disposed = true;
      setMonacoLib(null);
    };
  }, [path]);

  // Stage 2: create the Monaco editor once the lib AND the host node exist.
  useEffect(() => {
    if (mode !== 'monaco' || monacoLib === null || hostRef.current === null) return;
    const initial = initialRef.current;
    const monacoAny = monacoLib as unknown as {
      editor: {
        create(el: HTMLElement, options: Record<string, unknown>): { dispose(): void; getValue(): string; onDidChangeModelContent(fn: () => void): void; updateOptions(opts: Record<string, unknown>): void };
      };
    };
    const editor = monacoAny.editor.create(hostRef.current, {
      value: initial,
      language: languageOf(path),
      automaticLayout: true,
      fontSize: theme.fontSize,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      tabSize: 2,
    });
    editor.onDidChangeModelContent(() => onChangeRef.current(editor.getValue()));
    editorRef.current = editor;
    return () => {
      editor.dispose();
      editorRef.current = null;
    };
    // Create the editor once per path; theme is applied by the theme effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, monacoLib, path]);

  // Stage 3: apply the theme (background / text / font size) live.
  useEffect(() => {
    if (mode !== 'monaco' || monacoLib === null) return;
    const monacoAny = monacoLib as unknown as {
      editor: {
        defineTheme(name: string, data: Record<string, unknown>): void;
        setTheme(name: string): void;
      };
    };
    try {
      // Selection / line-highlight colors need guaranteed contrast with the
      // text. Instead of blending the foreground toward the background (which
      // washes out on light themes), use VS Code's proven light/dark values
      // selected by the background's luminance.
      const light = isLightColor(theme.background);
      monacoAny.editor.defineTheme('dshf-editor', {
        base: light ? 'vs' : 'vs-dark',
        inherit: true,
        rules: [],
        colors: {
          'editor.background': theme.background,
          'editor.foreground': theme.foreground,
          'editorLineNumber.foreground': mixColors(theme.foreground, theme.background, 0.45),
          'editorLineNumber.activeForeground': theme.foreground,
          'editorCursor.foreground': theme.foreground,
          'editor.selectionBackground': light ? '#add6ff' : '#264f78',
          'editor.inactiveSelectionBackground': light ? '#e5ebf1' : '#3a3d41',
          'editor.lineHighlightBackground': light ? '#e3edf7' : '#282a2d',
          'editorWidget.background': mixColors(theme.background, light ? '#000000' : '#ffffff', 0.08),
          'editorWidget.border': mixColors(theme.background, light ? '#000000' : '#ffffff', 0.2),
          'scrollbarSlider.background': mixColors(theme.foreground, theme.background, 0.2),
          'scrollbarSlider.hoverBackground': mixColors(theme.foreground, theme.background, 0.3),
        },
      });
      monacoAny.editor.setTheme('dshf-editor');
    } catch { /* theme application is best-effort */ }
    editorRef.current?.updateOptions?.({ fontSize: theme.fontSize });
  }, [mode, monacoLib, theme.background, theme.foreground, theme.fontSize]);

  if (mode === 'loading') {
    return <div className="dshf-empty">编辑器加载中…</div>;
  }

  if (mode === 'monaco') {
    return <div ref={hostRef} className="dshf-monaco" />;
  }

  if (mode === 'highlight') {
    return <pre className="dshf-highlight-fallback" dangerouslySetInnerHTML={{ __html: highlightFallback(path, content) }} />;
  }

  return (
    <textarea
      className="dshf-textarea"
      value={content}
      onChange={(e) => onChange(e.target.value)}
      spellCheck={false}
    />
  );
}

/**
 * Rendered Markdown preview (read-only). Falls back to raw <pre> on render
 * failure.
 *
 * Two URL concerns are handled here:
 *  1. Relative image srcs (`![alt](docs/x.png)`) resolve against the OPEN
 *     FILE's directory (the workspace), not the page URL — the web server
 *     cannot serve them, so each is fetched through the host `readDataUrl`
 *     RPC and replaced with an inline data URL.
 *  2. Anchor clicks are intercepted: http(s) links open in a new tab, while
 *     relative / hash links never navigate — navigation would drop the
 *     desktop shell's `dsh-desktop-mode` query marker and crash the page.
 */
function MarkdownPreview({ content, path, remote }: {
  content: string;
  path: string;
  remote: FileManagerRemote;
}): JSX.Element {
  const html = useMemo(() => renderMarkdown(content), [content]);
  const rootRef = useRef<HTMLDivElement>(null);
  const remoteRef = useRef(remote);
  remoteRef.current = remote;

  // Resolve workspace-relative images into data URLs after each render.
  useEffect(() => {
    const root = rootRef.current;
    if (root === null) return;
    const dir = path.slice(0, path.lastIndexOf('/') + 1); // trailing slash
    const imgs = root.querySelectorAll<HTMLImageElement>('img[src]');
    let cancelled = false;
    for (const img of imgs) {
      const src = img.getAttribute('src') ?? '';
      if (/^(?:https?:|data:|blob:)/i.test(src)) continue; // absolute / already inlined
      if (src.startsWith('#')) continue; // hash-only src: no file to read
      const target = src.startsWith('/') ? src.slice(1) : `${dir}${src}`;
      void remoteRef.current.readDataUrl(target)
        .then((result) => unwrap(result))
        .then(({ dataUrl }) => {
          if (cancelled) return;
          img.setAttribute('src', dataUrl);
        })
        .catch(() => {
          // Keep the broken relative src (shows the alt text / broken image).
        });
    }
    return () => {
      cancelled = true;
    };
  }, [html, path]);

  // Intercept link clicks: never navigate the host page.
  const onPreviewClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const anchor = (e.target as HTMLElement).closest('a');
    if (anchor === null) return;
    const href = anchor.getAttribute('href') ?? '';
    e.preventDefault();
    if (/^https?:\/\//i.test(href)) {
      window.open(href, '_blank', 'noopener,noreferrer');
    }
    // Relative / hash links: intentionally do nothing (no navigation).
  }, []);

  return (
    <div
      ref={rootRef}
      className="dshf-md-preview"
      onClick={onPreviewClick}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
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

/** Map a file path to a Monaco language id (small built-in subset). */
function languageOf(path: string): string {
  const filename = path.split(/[\\/]/).pop()?.toLowerCase() ?? '';
  if (filename === 'cmakelists.txt' || filename.endsWith('.cmake')) return 'shell';
  const ext = path.split('.').pop()?.toLowerCase() ?? '';
  switch (ext) {
    case 'ts': case 'tsx': case 'mts': case 'cts': return 'typescript';
    case 'js': case 'jsx': case 'mjs': case 'cjs': return 'javascript';
    case 'json': return 'json';
    case 'md': case 'markdown': return 'markdown';
    case 'html': case 'htm': return 'html';
    case 'css': return 'css';
    case 'scss': return 'scss';
    case 'less': return 'less';
    case 'py': return 'python';
    case 'rb': return 'ruby';
    case 'go': return 'go';
    case 'rs': return 'rust';
    case 'java': return 'java';
    case 'c': case 'h': return 'c';
    case 'cpp': case 'cc': case 'cxx': case 'hpp': case 'hh': case 'hxx': case 'inl': case 'ipp': case 'tpp': return 'cpp';
    case 'cs': return 'csharp';
    case 'sh': case 'bash': return 'shell';
    case 'yml': case 'yaml': return 'yaml';
    case 'xml': case 'svg': return 'xml';
    case 'sql': return 'sql';
    case 'php': return 'php';
    case 'vue': return 'html';
    case 'svelte': return 'html';
    default: return 'plaintext';
  }
}

export type { OpenTab };
