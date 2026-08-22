/* Browser half-plugin for the multi-editor workspace menu action. */

window.__ModuleLoader__.load({
  id: 'dsh-open-in-editor',
  factory: (require) => {
    const React = require('react');
    const h = React.createElement;
    const NS = 'open-in-editor';
    const REMOTE = {
      package: 'dsh-open-in-editor',
      descriptors: [{
        id: 'dsh-open-in-editor#openInEditor/open',
        service: 'openInEditor',
        namespace: 'openInEditor',
        method: 'open',
        invocation: { kind: 'direct' },
        parameters: [{
          name: 'path',
          wire: 'path',
          source: 'json',
          codec: {
            mode: 'strict',
            typeSymbol: 'dsh-open-in-editor#Path',
            schema: { parse(value) {
              if (typeof value !== 'string' || value.length === 0) throw new TypeError('path must be a non-empty string');
              return value;
            } },
          },
        }],
        cancellation: { parameter: 'signal' },
        result: {
          mode: 'strict',
          typeSymbol: 'dsh-open-in-editor#OpenResult',
          schema: { parse(value) {
            if (!value || value.opened !== true) throw new TypeError('invalid open result');
            return { opened: true };
          } },
        },
      }],
    };

    const zh = {
      'menu.open.aria': '在{editor}中打开{name}',
      'menu.open': '在编辑器中打开',
    };
    const en = {
      'menu.open.aria': 'Open {name} in {editor}',
      'menu.open': 'Open in Editor',
    };

    const css = `
      .doe-row{display:flex;align-items:center;gap:8px;width:100%;min-height:40px;padding:8px 10px;border:0;border-radius:10px;background:transparent;cursor:pointer;font:inherit;font-size:14px;line-height:22px;color:var(--dsw-alias-label-primary);text-align:left}
      .doe-row:hover{background:var(--dsw-alias-interactive-bg-hover)}
      .doe-row:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-2px}
      .doe-icon{display:inline-flex;flex:none;width:16px;height:16px;align-items:center;justify-content:center;color:var(--dsw-alias-label-tertiary)}
      .doe-label{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    `;

    function adoptStyles() {
      if (typeof document === 'undefined') return;
      if (document.querySelector('style[data-plugin-css="dsh-open-in-editor"]') !== null) return;
      const style = document.createElement('style');
      style.dataset.plugin = 'dsh-open-in-editor';
      style.dataset.pluginCss = 'dsh-open-in-editor';
      style.textContent = css;
      document.head.appendChild(style);
    }

    function fmt(template, params) {
      return template.replace(/\{(\w+)\}/g, (_match, key) => params[key] ?? `{${key}}`);
    }

    function EditorIcon() {
      return h('svg', {
        width: 16,
        height: 16,
        viewBox: '0 0 16 16',
        fill: 'none',
        'aria-hidden': 'true',
      }, h('path', {
        d: 'M9.5 2.5h4v4M13.25 2.75L7.5 8.5M12 9.5v3a1 1 0 0 1-1 1H3.5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3',
        stroke: 'currentColor',
        strokeWidth: 1.25,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
      }));
    }

    function EditorMenuRow({ cwd, label, onClose, open, t, eagerPointerActivation = false }) {
      const activated = React.useRef(false);
      if (cwd === undefined) return null;
      const launch = () => {
        if (activated.current) return;
        activated.current = true;
        onClose();
        open(cwd).catch((error) => {
          console.error('[dsh-open-in-editor] open failed:', error);
        });
      };
      return h('button', {
        type: 'button',
        role: 'menuitem',
        className: 'doe-row',
        'aria-label': fmt(t('menu.open.aria'), { editor: 'Editor', name: label }),
        onClick: launch,
        onPointerDown: (event) => {
          if (eagerPointerActivation && event.button === 0) launch();
        },
      },
      h('span', { className: 'doe-icon' }, h(EditorIcon)),
      h('span', { className: 'doe-label' }, t('menu.open')));
    }

    function EditorRow(props) {
      return h(EditorMenuRow, props);
    }

    function workspaceForButton(button, workspaces, t) {
      const aria = button.getAttribute('aria-label');
      if (aria === null) return undefined;
      const matches = workspaces.getSnapshot().items.filter(
        (item) => t('actions.workspace.aria', { name: item.title }) === aria,
      );
      return matches.length === 1 ? matches[0] : undefined;
    }

    function isWorkspaceMenu(menu, t) {
      const labels = [...menu.querySelectorAll('[role="menuitem"]')].map((item) => item.textContent?.trim());
      return labels.includes(t('rename')) && labels.includes(t('delete.workspace'));
    }

    function installLegacyWorkspaceMenu(options) {
      let active;
      const unmount = () => {
        active?.root?.unmount();
        active?.mount?.remove();
        active?.menu?.removeAttribute('data-dsh-open-in-editor-legacy');
        active = undefined;
      };
      const close = () => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      };
      const mountIntoOpenMenu = () => {
        if (active === undefined || active.root !== undefined) return;
        const menus = [...document.querySelectorAll('[role="menu"]')].filter(
          (menu) => isWorkspaceMenu(menu, options.workspaceT),
        );
        const menu = menus.at(-1);
        if (menu === undefined || menu.hasAttribute('data-dsh-open-in-editor-legacy')) return;
        const viewport = menu.querySelector(':scope > [role="presentation"]') ?? menu;
        const mount = document.createElement('div');
        mount.setAttribute('role', 'presentation');
        mount.setAttribute('data-dsh-open-in-editor-legacy', '');
        viewport.appendChild(mount);
        menu.setAttribute('data-dsh-open-in-editor-legacy', '');
        const root = require('react-dom/client').createRoot(mount);
        active.root = root;
        active.menu = menu;
        active.mount = mount;
        root.render(h(EditorMenuRow, {
          cwd: active.workspace.path,
          label: active.workspace.title,
          onClose: close,
          open: options.open,
          t: options.rowT,
          eagerPointerActivation: true,
        }));
      };
      const observer = new MutationObserver(() => {
        if (active?.menu !== undefined && !active.menu.isConnected) unmount();
        mountIntoOpenMenu();
      });
      observer.observe(document.body, { childList: true, subtree: true });
      const onClick = (event) => {
        if (!(event.target instanceof Element)) return;
        const button = event.target.closest('button[aria-label]');
        if (button === null) return;
        const workspace = workspaceForButton(button, options.workspaces, options.workspaceT);
        if (workspace === undefined) return;
        unmount();
        active = { workspace, anchor: button.parentElement ?? button };
        queueMicrotask(mountIntoOpenMenu);
      };
      document.addEventListener('click', onClick, true);
      return () => {
        document.removeEventListener('click', onClick, true);
        observer.disconnect();
        unmount();
      };
    }

    const inject = ['slots', 'remote', 'locale', 'workspaces'];

    function apply(ctx) {
      adoptStyles();
      ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'dsh-open-in-editor: dictionaries');
      let openInEditor;
      ctx.effect(async () => {
        const dispose = await ctx.remote.$mount(REMOTE);
        openInEditor = ctx.reflect.get('remote.openInEditor');
        if (openInEditor === undefined) throw new Error('dsh-open-in-editor: Remote namespace did not mount');
        return () => {
          openInEditor = undefined;
          void dispose();
        };
      }, 'dsh-open-in-editor: remote');
      const open = async (path) => {
        if (openInEditor === undefined) throw new Error('dsh-open-in-editor: Remote is not mounted');
        const result = await openInEditor.open(path);
        if (!result.ok) throw new Error(`dsh-open-in-editor: ${result.error.code}: ${result.error.message}`);
      };
      ctx.slots.inject('sidebar.workspaces.row-menu', () => ctx.slots.register({
        name: 'sidebar.workspaces.row-menu',
        locale: NS,
        inject: () => ({ open }),
      }, EditorRow));
      ctx.effect(() => {
        let disposeLegacy;
        const reconcile = () => {
          const native = ctx.slots.spec('sidebar.workspaces.row-menu') !== undefined;
          if (native) {
            disposeLegacy?.();
            disposeLegacy = undefined;
          } else if (disposeLegacy === undefined) {
            disposeLegacy = installLegacyWorkspaceMenu({
              workspaces: ctx.workspaces.list,
              workspaceT: ctx.locale.bind('workspace'),
              rowT: ctx.locale.bind(NS),
              open,
            });
          }
        };
        const unsubscribe = ctx.slots.subscribe('sidebar.workspaces.row-menu', reconcile);
        reconcile();
        return () => {
          unsubscribe();
          disposeLegacy?.();
        };
      }, 'dsh-open-in-editor: workspace-menu compatibility');
    }

    return { apply, inject };
  },
});
