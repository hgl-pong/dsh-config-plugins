/**
 * Client half of the dsh-file plugin.
 *
 * Responsibilities:
 *  1. Mount the `fileManager` Typert Remote contribution so
 *     `ctx.remote.fileManager.*` becomes callable.
 *  2. Register a "文件" button into the sidebar footer action list.
 *  3. Toggle the file-manager panel: while open, we register a shadow entry
 *     into the `sidebar.workspaces` slot at priority -1 (the workspace
 *     browser's own entry sits at default priority 0, so ours wins the cell);
 *     closing disposes the entry and the workspace browser returns.
 *  4. Register the file EDITOR as a `conversation.view` tab ("文件"). The
 *     sidebar tree only browses; clicking a file loads it into the shared
 *     store and the editor renders IN the conversation center column's scroll
 *     body (beside chat / trajectory), never as a popup.
 *
 * The client bundle is built to the ModuleLoader handoff format
 * (`window.__ModuleLoader__.load({ id, factory })`) by build.mjs; this module
 * is the bundle's entry, exporting the cordis plugin surface.
 */
import type { Context } from '@deepseek-ai/cordis';
import { TYPERT_REMOTE, type FileManagerRemote } from './remote.ts';
import { FileManagerPanel, type FileManagerSessionHook } from './FileManagerPanel.tsx';
import { FileEditorView } from './FileEditorView.tsx';
import { isEditorViewActive, subscribeEditorViewActive } from './store.ts';
import styles from './styles.css';

// Inject the plugin stylesheet once (the bundle's css is text via esbuild).
const CSS_TAG = 'dsh-file/styles.css';
if (typeof document !== 'undefined' && document.querySelector(`style[data-plugin-css="${CSS_TAG}"]`) === null) {
  const tag = document.createElement('style');
  tag.dataset.plugin = 'dsh-file';
  tag.dataset.pluginCss = CSS_TAG;
  tag.textContent = styles;
  document.head.appendChild(tag);
}

/** Dictionary namespace owned by this plugin. */
const NS = 'dshFile';

const zh = {
  'toggle.label': '文件',
  'toggle.open': '打开文件管理器',
  'toggle.close': '关闭文件管理器',
  'view.label': '文件',
  'view.empty': '在左侧文件树中选择一个文件，即可在此编辑',
};

const en: Record<keyof typeof zh, string> = {
  'toggle.label': 'Files',
  'toggle.open': 'Open file manager',
  'toggle.close': 'Close file manager',
  'view.label': 'Files',
  'view.empty': 'Select a file in the sidebar tree to edit it here',
};

/** Required client services. */
export const inject = ['slots', 'locale', 'remote'];

/**
 * Client plugin body: mount the remote, register the footer button, the
 * sidebar tree panel toggle, and the center-column editor view.
 */
export function apply(ctx: Context) {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'dsh-file: dictionaries');
  const t = ctx.locale.bind(NS);

  // Mount the remote contribution (async; $mount installs namespace services).
  const mountRemote = ctx.effect(async () => {
    const dispose = await ctx.remote.$mount(TYPERT_REMOTE);
    return () => dispose();
  }, 'dsh-file: remote mount');

  // ── panel toggle state ───────────────────────────────────────────────────
  // While open, `disposePanel` holds the disposer of our sidebar.workspaces
  // shadow entry; closing runs it and the workspace browser resurfaces.
  let disposePanel: (() => void) | null = null;
  let open = false;

  const closePanel = () => {
    if (disposePanel === null) return;
    disposePanel();
    disposePanel = null;
    open = false;
    ctx.logger?.info?.('[dsh-file] file manager closed');
  };

  const openPanel = () => {
    if (disposePanel !== null) return;
    // Resolve the mounted namespace service through ctx.get (a bare property
    // read would require the `remote.fileManager` inject, which cannot be
    // declared because we mount the contribution inside our own apply).
    const remote = ctx.get('remote.fileManager') as unknown as FileManagerRemote;
    const face = {
      remote,
      onClose: closePanel,
    };
    // Register a shadow entry at priority -1: the sidebar.workspaces cell is
    // single, and the workspace browser registered at default priority 0, so
    // the lowest live entry (ours) renders while we stay registered. The
    // panel receives the slot's standard kit (useSessions / useWorkspaces)
    // so it can resolve the current conversation's workspace directory.
    disposePanel = ctx.slots.register({
      name: 'sidebar.workspaces',
      priority: -1,
      registrant: 'dsh-file',
    }, (props: { wide?: boolean; useSessions?: FileManagerSessionHook }) => (
      <FileManagerPanel {...face} useSessions={props.useSessions} onFileOpened={activateEditorView} />
    ));
    open = true;
    ctx.logger?.info?.('[dsh-file] file manager opened');
  };

  const togglePanel = () => (open ? closePanel() : openPanel());

  // ── sidebar visibility sync with the center "文件" view ───────────────────
  // When the "文件" conversation view becomes active, open the sidebar tree
  // panel automatically; when the view is switched away (e.g. "对话"), close
  // it again. openPanel/closePanel are idempotent, so this is safe to run on
  // every activation change. Manual footer-button toggles still win while the
  // view stays active.
  const syncSidebarWithView = () => {
    if (isEditorViewActive()) openPanel();
    else closePanel();
  };
  ctx.effect(() => subscribeEditorViewActive(syncSidebarWithView), 'dsh-file: view↔sidebar sync');

  // ── center-column editor view (conversation.view) ────────────────────────
  // A view tab beside chat / trajectory. The session header renders the tab;
  // the view area (inside the conversation scroll body) renders our editor
  // when active. Renders a hint until a file is opened from the sidebar tree.
  ctx.slots.inject('conversation.view', () => ctx.slots.register({
    name: 'conversation.view',
    id: 'dsh-file',
    order: 20,
    label: () => t('view.label'),
    locale: NS,
    registrant: 'dsh-file',
  }, () => {
    const remote = ctx.get('remote.fileManager') as unknown as FileManagerRemote | undefined;
    if (remote === undefined) return null;
    return <FileEditorView remote={remote} />;
  }));

  // ── footer button ────────────────────────────────────────────────────────
  ctx.slots.inject('sidebar.footer.action', () => ctx.slots.register({
    name: 'sidebar.footer.action',
    id: 'dsh-file-toggle',
    locale: NS,
    inject: () => ({
      onToggle: togglePanel,
      isOpen: () => open,
    }),
  }, FileToggleButton));

  /**
   * Bring the center-column "文件" view to the front after a file opens.
   * The conversation view tabs are owned by dsh-client-ui-conversation's
   * internal chat store with no public setView API, so we click the matching
   * session-header tab (role="tab") by its localized label — the same
   * gesture the user would make. Works identically on web and desktop.
   */
  const activateEditorView = () => {
    const label = t('view.label');
    for (const tab of Array.from(document.querySelectorAll<HTMLElement>('[role="tab"]'))) {
      if (tab.textContent?.trim() === label) {
        tab.click();
        return;
      }
    }
  };

  // On unload, close the panel (restores the workspace browser).
  ctx.effect(() => () => {
    closePanel();
  }, 'dsh-file: panel cleanup');

  // Keep the mount effect referenced so it isn't tree-shaken.
  void mountRemote;
}

/** The footer action button. */
function FileToggleButton(props: {
  wide?: boolean;
  t?: (key: string) => string;
  onToggle: () => void;
  isOpen: () => boolean;
}): JSX.Element {
  const { wide, t, onToggle, isOpen } = props;
  const label = t ? t('toggle.label') : '文件';
  const title = t ? (isOpen() ? t('toggle.close') : t('toggle.open')) : undefined;
  return (
    <button
      type="button"
      className="dshf-toggle"
      title={title}
      aria-label={label}
      onClick={onToggle}
      style={isOpen() ? { fontWeight: 700 } : undefined}
    >
      <FolderOpenIcon size={wide ? 14 : 16} />
      {wide ? <span className="dshf-toggle-label">{label}</span> : null}
    </button>
  );
}

/**
 * DSH 工作区打开图标（folder_open_16 outline），内联自
 * @deepseek-ai/dsh-client-ui-primitives 的 IconFolderOpenOutline16，
 * 避免给插件新增运行时依赖；fill=currentColor 随主题/激活态变色。
 */
function FolderOpenIcon(props: { size?: number }): JSX.Element {
  const size = props.size ?? 16;
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{ display: 'block' }}>
      <path
        d="M5.19629 1.57104C5.81144 1.5711 6.38623 1.8786 6.72754 2.39038L7.19922 3.09839C7.28454 3.22635 7.42824 3.30344 7.58203 3.30347H12.1699C13.5039 3.30348 14.5859 4.38548 14.5859 5.71948V6.62671C15.2694 7.02689 15.6605 7.85012 15.4385 8.68726L14.3848 12.658C14.1037 13.7164 13.1449 14.4527 12.0498 14.4529H2.91699C1.51651 14.4529 0.451662 13.2814 0.501954 11.9519V3.98706C0.501954 2.65305 1.58396 1.57104 2.91797 1.57104H5.19629ZM3.7793 7.75562C3.30994 7.75562 2.89883 8.07153 2.77832 8.52515L1.91602 11.7722C1.74167 12.4291 2.23734 13.073 2.91699 13.073H12.0498C12.5191 13.0728 12.9304 12.757 13.0508 12.3035L14.1045 8.33374C14.1819 8.04202 13.9619 7.756 13.6602 7.75562H3.7793ZM2.91797 2.9519C2.34625 2.9519 1.88281 3.41534 1.88281 3.98706V7.2937C2.33068 6.7269 3.02249 6.37476 3.7793 6.37476H13.2051V5.71948C13.2051 5.14777 12.7416 4.68434 12.1699 4.68433H7.58203C6.96675 4.6843 6.39209 4.37595 6.05078 3.86401L5.5791 3.15601C5.49379 3.02821 5.34995 2.95196 5.19629 2.9519H2.91797Z"
        fill="currentColor"
      />
    </svg>
  );
}
