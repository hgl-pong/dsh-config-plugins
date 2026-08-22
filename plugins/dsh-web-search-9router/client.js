/**
 * dsh-web-search-9router — 浏览器半插件（client bundle，factory 形式）。
 *
 * 设置页的“插件 → 插件配置”标签只渲染在 `settings.plugin.item` slot 里注册了
 * 卡片的命名空间（“A served namespace no card claims renders nothing”）。
 * 宿主半插件（index.js）只注册了命名空间 `dsh-web-search-9router`，本文件补上
 * 浏览器半：注册一张卡片，让该命名空间出现在设置页上。
 *
 * 卡片遵循官方 ui-settings-plugins 的 staged-form 模式：
 *   - 普通字段（baseURL / searchProvider）显示生效值（user 层 > base 层 > schema
 *     默认），编辑先暂存，保存时逐字段写入 settings namespace；
 *   - apiKey 是 role('secret') 字段：wire 端 redactSecrets 会把字面量从所有
 *     响应里剥掉，只回 secrets 边车 [{path, set}]，因此输入框恒为空白（write-only），
 *     留空保存 = 保持现值，填写保存 = 覆盖；卡片用边车的 `set` 显示“已配置”徽标。
 *
 * 注入的 hooks:{ x: store } 会被渲染器转成组件的 useX selector prop
 * （store 契约 = { getSnapshot, subscribe }）。
 */

window.__ModuleLoader__.load({
  id: 'dsh-web-search-9router',
  factory: (require) => {
    const React = require('react');
    const h = React.createElement;
    const { createSnapshotStore } = require('@deepseek-ai/dsh-client-runtime/client');

    /** 宿主半插件（index.js）注册的设置命名空间。 */
    const NAMESPACE = 'dsh-web-search-9router';
    /** 本卡片的 locale 命名空间。 */
    const NS = 'plugin-config-9router';

    /** 9Router `/v1/models/web` 已知的 provider id（也允许输入自定义值）。 */
    const PROVIDERS = [
      'tavily', 'exa', 'brave', 'serper', 'searxng',
      'google-pse', 'linkup', 'searchapi', 'youcom',
      'perplexity', 'combo',
    ];

    // ── 文案 ────────────────────────────────────────────────────────────────

    const zh = {
      title: '联网搜索（9Router）',
      description: '用 9Router 的 /v1/search 替换内置 DeepSeek 联网搜索。',
      baseUrl: '调用链接',
      baseUrlHint: '9Router 服务地址，留空使用默认 https://ninerouter.com。',
      searchProvider: '搜索 provider',
      searchProviderHint: 'tavily / exa / brave / serper / searxng / google-pse / linkup / searchapi / youcom / perplexity / combo。',
      apiKey: 'API Key',
      apiKeyHint: '写入设置文件但界面不回显。留空保存表示保持当前值。',
      apiKeySet: '已配置密钥。',
      apiKeyUnset: '未配置密钥；9Router 开启鉴权时搜索会失败。',
      overridden: '已覆盖',
      reset: '恢复默认',
      save: '保存',
      saving: '保存中…',
      discard: '放弃修改',
      unsaved: '未保存',
      saveFailed: '部署未接受这些值，已保留供修改。',
      unavailable: '本部署未提供该命名空间。',
      readOnly: '本部署的设置为只读。',
      clear: '清除',
      providerChoose: '选择 provider',
      baseUrlInvalid: '请输入合法的 http(s) 地址，或留空使用默认。',
      saved: '已保存',
      clearSecretNotice: '保存后当前密钥将被清除。',
      expand: '展开设置',
      collapse: '收起设置',
    };
    const en = {
      title: 'Web search (9Router)',
      description: 'Replaces the built-in DeepSeek web search with 9Router /v1/search.',
      baseUrl: 'Endpoint',
      baseUrlHint: '9Router service URL; leave blank for the default https://ninerouter.com.',
      searchProvider: 'Search provider',
      searchProviderHint: 'tavily / exa / brave / serper / searxng / google-pse / linkup / searchapi / youcom / perplexity / combo.',
      apiKey: 'API key',
      apiKeyHint: 'Stored but never echoed back. Leave blank to keep the current key.',
      apiKeySet: 'A key is configured.',
      apiKeyUnset: 'No key configured; search fails if 9Router requires auth.',
      overridden: 'Overridden',
      reset: 'Reset to default',
      save: 'Save',
      saving: 'Saving…',
      discard: 'Discard',
      unsaved: 'Unsaved',
      saveFailed: 'The deployment did not accept these values; they were left for you to correct.',
      unavailable: 'This deployment does not serve this namespace.',
      readOnly: 'This deployment stores settings read-only.',
      clear: 'Clear',
      providerChoose: 'Select provider',
      baseUrlInvalid: 'Enter a valid http(s) URL, or leave blank to use the default.',
      saved: 'Saved',
      clearSecretNotice: 'The current key will be removed on save.',
      expand: 'Show settings',
      collapse: 'Hide settings',
    };

    // ── staged form（对照官方 CardForm 的最小实现）────────────────────────────

    /** 文本字段规格：空草稿 = 清除该字段（回退到 base/默认）。 */
    function textField(field) {
      return {
        field,
        format: (value) => (typeof value === 'string' ? value : ''),
        parse: (text) => {
          const trimmed = text.trim();
          return trimmed === '' ? { kind: 'clear' } : { kind: 'set', value: trimmed };
        },
      };
    }

    /** 文本字段规格 + URL 校验：空草稿 = 清除，非空必须是合法 http(s) 地址。 */
    function urlField(field) {
      return {
        field,
        format: (value) => (typeof value === 'string' ? value : ''),
        parse: (text) => {
          const trimmed = text.trim();
          if (trimmed === '') return { kind: 'clear' };
          let parsed;
          try {
            parsed = new URL(trimmed);
          } catch {
            return undefined; // 非法 URL：阻止保存，进入 invalid 态
          }
          if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return undefined;
          return { kind: 'set', value: trimmed };
        },
      };
    }

    /**
     * 一张卡片的暂存表单：scope（settings 命名空间作用域）+ specs（可编辑的
     * 普通字段）。apiKey 单独走 secret 分支（write-only，不入 specs）。
     */
    class CardForm {
      constructor(scope, specs, options = {}) {
        this.scope = scope;
        this.specs = new Map(specs.map((spec) => [spec.field, spec]));
        this.staged = new Map();      // field -> { text, clear }
        this.listeners = new Set();
        this.saving = false;
        this.failed = false;
        this.saved = false;           // 保存成功的短暂正向反馈
        this.savedTimer = undefined;
        this.secretStaged = '';       // apiKey 草稿（独立于普通字段）
        // 读取 secret 字段“已配置”的确认回调。secret 字面量会被 wire 端的
        // redactSecrets 从响应里剥掉，绝不能像普通字段那样用字面量回读校验，
        // 只能通过 describe 视图的 secrets 边车确认写入是否落盘。
        this.confirmSecret = options.confirmSecret;
        scope.subscribe(() => this.publish());
      }

      /** 把投影发布成快照 store 给组件的 useX hook。 */
      bind(project) {
        const store = createSnapshotStore(project());
        this.listeners.add(() => store.set(project()));
        return store;
      }

      /** 卡片级状态：可用性 + 保存动作是否可执行。 */
      shell() {
        const snapshot = this.scope.getSnapshot();
        const plan = this.plan();
        return {
          available: snapshot.status === 'ready',
          writable: snapshot.writable === true,
          dirty: plan.length > 0,
          invalid: plan.some((item) => item.run === undefined),
          saving: this.saving,
          failed: this.failed,
          saved: this.saved,
        };
      }

      /** 一个普通控件的 {text, overridden, invalid}。 */
      field(name) {
        const staged = this.staged.get(name);
        const spec = this.specs.get(name);
        if (staged === undefined) {
          return {
            text: spec.format(this.sectionValue(name)),
            overridden: this.stored(name),
            invalid: false,
          };
        }
        const write = staged.clear ? { kind: 'clear' } : spec.parse(staged.text);
        return {
          text: staged.text,
          overridden: write?.kind === 'set',
          invalid: write === undefined,
        };
      }

      /** secret 控件：恒不回显，只报草稿、是否已有值，以及是否将清除。 */
      secretField() {
        return { text: this.secretStaged, overridden: false, invalid: false, willClear: this.secretClear };
      }

      actions() {
        return {
          edit: (field, text) => {
            if (field === 'apiKey') {
              this.secretStaged = text;
              // 用户在清除后又输入新密钥：取消清除意图，改走“覆盖”语义。
              if (text !== '') this.secretClear = false;
            } else {
              this.staged.set(field, { text, clear: false });
            }
            this.failed = false;
            this.clearSavedTimer();
            this.publish();
          },
          resetField: (field) => {
            const spec = this.specs.get(field);
            if (spec === undefined) return;
            this.staged.set(field, {
              text: spec.format(this.baseValue(field)),
              clear: true,
            });
            this.failed = false;
            this.clearSavedTimer();
            this.publish();
          },
          clearSecret: () => {
            this.secretClear = true;
            this.secretStaged = '';
            this.failed = false;
            this.clearSavedTimer();
            this.publish();
          },
          save: () => this.save(),
          discard: () => {
            if (this.staged.size === 0 && this.secretStaged === '' && !this.secretClear && !this.failed) return;
            this.staged.clear();
            this.secretStaged = '';
            this.secretClear = false;
            this.failed = false;
            this.clearSavedTimer();
            this.publish();
          },
        };
      }

      /** 保存会执行的写入序列；parse 失败的字段携带 run:undefined 阻止保存。 */
      plan() {
        const plan = [];
        for (const [field, staged] of this.staged) {
          const spec = this.specs.get(field);
          if (staged.clear) {
            if (this.stored(field)) plan.push({ field, run: () => this.clear(field) });
            continue;
          }
          if (staged.text === spec.format(this.sectionValue(field))) continue;
          const write = spec.parse(staged.text);
          if (write === undefined) plan.push({ field, run: undefined });
          else if (write.kind === 'clear') plan.push({ field, run: () => this.clear(field) });
          else plan.push({ field, run: () => this.store(field, write.value) });
        }
        if (this.secretClear) plan.push({ field: 'apiKey', run: () => this.clearSecretValue() });
        else if (this.secretStaged.trim() !== '') {
          const value = this.secretStaged.trim();
          plan.push({ field: 'apiKey', run: () => this.storeSecretValue(value) });
        }
        return plan;
      }

      async save() {
        const plan = this.plan();
        const writes = plan.flatMap((item) => (item.run === undefined ? [] : [item.run]));
        if (plan.length === 0 || this.saving || writes.length !== plan.length) return;
        this.saving = true;
        this.failed = false;
        this.clearSavedTimer();
        this.publish();
        let landed = true;
        for (const write of writes) landed = (await write()) && landed;
        if (landed) {
          this.staged.clear();
          this.secretStaged = '';
          this.secretClear = false;
          // 短暂的正向反馈：2s 后自动熄灭，期间任何再次编辑会重置该状态。
          this.saved = true;
          this.savedTimer = setTimeout(() => {
            this.saved = false;
            this.publish();
          }, 2000);
        }
        this.saving = false;
        this.failed = !landed;
        this.publish();
      }

      /** 写入即视为已落盘：scope.set resolve 即代表 wire 提交成功。 */
      async store(field, value) {
        await this.scope.set(field, value);
        return true;
      }

      async clear(field) {
        await this.scope.unset(field);
        return true;
      }

      /**
       * 写入 apiKey。secret 字面量会被 redactSecrets 从 user 层剥掉，字面量回读
       * 恒为失败，故以 `scope.set` resolve 作为落盘依据（与普通字段一致）。
       */
      async storeSecretValue(value) {
        await this.scope.set('apiKey', value);
        return true;
      }

      async clearSecretValue() {
        await this.scope.unset('apiKey');
        return true;
      }

      secretClear = false;

      snapshotOf() { return this.scope.getSnapshot(); }
      sectionValue(field) { return this.snapshotOf().value?.[field]; }
      baseValue(field) { return this.snapshotOf().base?.[field]; }
      userLayer() { return this.snapshotOf().user; }
      stored(field) {
        const user = this.userLayer();
        return user !== undefined && Object.hasOwn(user, field);
      }
      publish() { for (const listener of this.listeners) listener(); }
      clearSavedTimer() {
        if (this.savedTimer !== undefined) {
          clearTimeout(this.savedTimer);
          this.savedTimer = undefined;
        }
        if (this.saved) {
          this.saved = false;
        }
      }
    }

    /**
     * 桥接 `dsh-web-search-9router` scope 到卡片表单；从 describe 视图的
     * secrets 边车读取 apiKey 是否已配置（字面量永远不会出现在响应里）。
     */
    class NineRouterCardController {
      constructor(scope) {
        this.scope = scope;
        this.form = new CardForm(scope, [urlField('baseURL'), textField('searchProvider')], {
          confirmSecret: () => this.secretConfigured(),
        });
        this.store = this.form.bind(() => this.projection());
      }

      /** 从 describe 视图的 secrets 边车读取 apiKey 是否已配置（字面量永不出现在响应里）。 */
      secretConfigured() {
        const snapshot = this.scope.getSnapshot();
        const secret = (snapshot.view?.secrets ?? []).find(
          (item) => Array.isArray(item.path) && item.path[0] === 'apiKey'
        );
        return secret?.set === true;
      }

      projection() {
        return {
          ...this.form.shell(),
          baseURL: this.form.field('baseURL'),
          searchProvider: this.form.field('searchProvider'),
          apiKey: this.form.secretField(),
          apiKeyConfigured: this.secretConfigured(),
        };
      }

      inject() {
        return { hooks: { nineRouterCard: this.store }, ...this.form.actions() };
      }
    }

    // ── 组件 ────────────────────────────────────────────────────────────────

    const fieldCss = `
      .n9r-field{display:flex;flex-direction:column;gap:6px;padding:12px 0}
      .n9r-field+.n9r-field{border-top:1px solid var(--dsw-alias-border-l2)}
      .n9r-head{display:flex;align-items:center;gap:8px}
      .n9r-label{flex:1;min-width:0;font-size:13px;font-weight:500;line-height:1.5;color:var(--dsw-alias-label-primary)}
      .n9r-badges{display:inline-flex;align-items:center;gap:8px}
      .n9r-badge{white-space:nowrap;border-radius:999px;padding:1px 8px;font-size:11px;font-weight:500;line-height:17px;color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-bg-module-platform)}
      .n9r-badge-muted{white-space:nowrap;border-radius:999px;padding:1px 8px;font-size:11px;line-height:17px;color:var(--dsw-alias-label-tertiary)}
      .n9r-reset{border:none;background:none;padding:0;font:inherit;font-size:12px;line-height:1.5;color:var(--dsw-alias-label-secondary);cursor:pointer}
      .n9r-reset:hover:not(:disabled){color:var(--dsw-alias-label-primary)}
      .n9r-reset:disabled{cursor:default}
      .n9r-input{box-sizing:border-box;height:34px;width:100%;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-layer-3);padding:0 12px;font:inherit;font-size:13px;line-height:1.5;color:var(--dsw-alias-label-primary)}
      .n9r-input:focus-visible{border-color:var(--dsw-alias-brand-primary);outline:none}
      .n9r-input:disabled{color:var(--dsw-alias-label-tertiary);cursor:default}
      .n9r-input[data-invalid=true]{border-color:var(--dsw-alias-label-error)}
      select.n9r-input{appearance:none;-webkit-appearance:none;-moz-appearance:none;cursor:pointer;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' fill='none' stroke='%23999' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 12px center;padding-right:32px}
      select.n9r-input:disabled{background-image:none;cursor:default}
      .n9r-hint{margin:0;font-size:12px;line-height:1.5;color:var(--dsw-alias-label-tertiary)}
      .n9r-invalid{margin:0;font-size:12px;line-height:1.5;color:var(--dsw-alias-label-error)}
    `;

    const cardCss = `
      .n9r-card{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);border-radius:12px;list-style:none;transition:border-color .16s,background .16s}
      .n9r-card:hover{border-color:var(--dsw-alias-label-dimmed)}
      .n9r-card-open{background:var(--dsw-alias-bg-layer-2);border-color:var(--dsw-alias-label-dimmed)}
      .n9r-header{appearance:none;width:100%;font:inherit;color:inherit;text-align:left;cursor:pointer;background:0 0;border:0;border-radius:12px;align-items:center;gap:12px;padding:14px 16px;display:flex}
      .n9r-header:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-2px}
      .n9r-headtext{flex-direction:column;flex:1;gap:4px;min-width:0;display:flex}
      .n9r-name{margin:0;color:var(--dsw-alias-label-primary);font-size:15px;font-weight:600;line-height:1.4}
      .n9r-desc{margin:0;color:var(--dsw-alias-label-tertiary);font-size:13px;line-height:1.5}
      .n9r-badge-unsaved{white-space:nowrap;background:var(--dsw-alias-bg-module-platform);color:var(--dsw-alias-label-secondary);border-radius:999px;flex:none;padding:1px 8px;font-size:11px;font-weight:500;line-height:17px}
      .n9r-chev{color:var(--dsw-alias-label-tertiary);flex:none;transition:transform .16s}
      .n9r-chev-open{transform:rotate(180deg)}
      .n9r-body{border-top:1px solid var(--dsw-alias-border-l2);margin:0 16px;padding-bottom:8px}
      .n9r-readonly{margin:12px 0 0;color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:1.5}
      .n9r-footer{border-top:1px solid var(--dsw-alias-border-l2);justify-content:flex-end;align-items:center;gap:8px;padding:12px 0 4px;display:flex}
      .n9r-failed{min-width:0;color:var(--dsw-alias-label-error);flex:1;margin:0;font-size:12px;line-height:1.5}
      .n9r-saved{min-width:0;color:var(--dsw-alias-label-secondary);flex:1;margin:0;font-size:12px;line-height:1.5}
      .n9r-spacer{flex:1}
      .n9r-btn{appearance:none;font:inherit;cursor:pointer;border:1px solid #0000;border-radius:8px;padding:5px 14px;font-size:13px;line-height:1.5}
      .n9r-btn-discard{border-color:var(--dsw-alias-border-l2);color:var(--dsw-alias-label-secondary);background:0 0}
      .n9r-btn-discard:hover:not(:disabled){color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-label-dimmed)}
      .n9r-btn-save{background:var(--dsw-alias-label-primary);color:var(--dsw-alias-bg-layer-3)}
      .n9r-btn:disabled{opacity:.4;cursor:default}
      .n9r-btn:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}
    `;

    function injectCss(css, tag) {
      if (typeof document === 'undefined') return;
      if (document.querySelector(`style[data-plugin-css="${tag}"]`) !== null) return;
      const style = document.createElement('style');
      style.dataset.plugin = 'dsh-web-search-9router';
      style.dataset.pluginCss = tag;
      style.textContent = css;
      document.head.appendChild(style);
    }
    injectCss(fieldCss, 'dsh-web-search-9router/fields');
    injectCss(cardCss, 'dsh-web-search-9router/card');

    /** 普通文本控件（对照官方 ValueField）。 */
    function ValueField({ id, label, hint, invalidText, state, disabled, copy, onEdit, onReset }) {
      return h('div', { className: 'n9r-field' },
        h('div', { className: 'n9r-head' },
          h('label', { className: 'n9r-label', htmlFor: id }, label),
          state.overridden ? h('span', { className: 'n9r-badges' },
            h('span', { className: 'n9r-badge' }, copy.overridden),
            h('button', {
              type: 'button',
              className: 'n9r-reset',
              disabled,
              onClick: onReset,
            }, copy.reset)
          ) : null
        ),
        h('input', {
          id,
          type: 'text',
          className: 'n9r-input',
          'data-invalid': state.invalid ? 'true' : undefined,
          'aria-invalid': state.invalid ? 'true' : undefined,
          value: state.text,
          disabled,
          onChange: (event) => onEdit(event.target.value),
        }),
        state.invalid
          ? h('p', { className: 'n9r-invalid' }, invalidText ?? hint)
          : h('p', { className: 'n9r-hint' }, hint)
      );
    }

    /** provider 下拉控件：列出已知 provider，并保留当前自定义值。 */
    function SelectField({ id, label, hint, state, options, disabled, copy, onEdit, onReset }) {
      const choices = options.includes(state.text) || state.text === ''
        ? options
        : [state.text, ...options];
      return h('div', { className: 'n9r-field' },
        h('div', { className: 'n9r-head' },
          h('label', { className: 'n9r-label', htmlFor: id }, label),
          state.overridden ? h('span', { className: 'n9r-badges' },
            h('span', { className: 'n9r-badge' }, copy.overridden),
            h('button', {
              type: 'button',
              className: 'n9r-reset',
              disabled,
              onClick: onReset,
            }, copy.reset)
          ) : null
        ),
        h('select', {
          id,
          className: 'n9r-input',
          'aria-invalid': state.invalid ? 'true' : undefined,
          value: state.text,
          disabled,
          onChange: (event) => onEdit(event.target.value),
        },
          h('option', { key: '__placeholder', value: '' }, copy.providerChoose),
          choices.map((opt) => h('option', { key: opt, value: opt }, opt))
        ),
        h('p', { className: 'n9r-hint' }, hint)
      );
    }

    /** write-only 密钥控件：不回显，留空保存 = 保持现值。 */
    function SecretField({ id, label, hint, clearNotice, state, configuredLabel, unconfiguredLabel, disabled, copy, onEdit, onClear, configured }) {
      return h('div', { className: 'n9r-field' },
        h('div', { className: 'n9r-head' },
          h('label', { className: 'n9r-label', htmlFor: id }, label),
          h('span', { className: 'n9r-badges' },
            configured
              ? h('span', { className: 'n9r-badge' }, configuredLabel)
              : h('span', { className: 'n9r-badge-muted' }, unconfiguredLabel),
            configured && !disabled
              ? h('button', {
                  type: 'button',
                  className: 'n9r-reset',
                  onClick: onClear,
                }, copy.clear)
              : null
          )
        ),
        h('input', {
          id,
          type: 'password',
          className: 'n9r-input',
          value: state.text,
          disabled,
          placeholder: '',
          autoComplete: 'off',
          onChange: (event) => onEdit(event.target.value),
        }),
        state.willClear
          ? h('p', { className: 'n9r-invalid' }, clearNotice)
          : h('p', { className: 'n9r-hint' }, hint)
      );
    }

    /** 卡片外壳：折叠头 + 表单体 + 保存/放弃。 */
    function NineRouterCard(props) {
      const { t, useNineRouterCard, edit, resetField, clearSecret, save, discard } = props;
      const state = useNineRouterCard((snapshot) => snapshot);
      const [open, setOpen] = React.useState(false);
      const disabled = !state.writable;
      const copy = {
        overridden: t('overridden'),
        reset: t('reset'),
        clear: t('clear'),
      };
      if (!state.available) {
        return h('li', { className: 'n9r-card' },
          h('div', { className: 'n9r-header' },
            h('div', { className: 'n9r-headtext' },
              h('h3', { className: 'n9r-name' }, t('title')),
              h('p', { className: 'n9r-desc' }, t('unavailable'))
            )
          )
        );
      }
      return h('li', { className: 'n9r-card' + (open ? ' n9r-card-open' : '') },
        h('button', {
          type: 'button',
          className: 'n9r-header',
          'aria-expanded': String(open),
          'aria-label': `${open ? t('collapse') : t('expand')}: ${t('title')}`,
          onClick: () => setOpen((value) => !value),
        },
          h('div', { className: 'n9r-headtext' },
            h('h3', { className: 'n9r-name' }, t('title')),
            h('p', { className: 'n9r-desc' }, t('description'))
          ),
          state.dirty && !state.saving ? h('span', { className: 'n9r-badge-unsaved' }, t('unsaved')) : null,
          h('svg', {
            className: 'n9r-chev' + (open ? ' n9r-chev-open' : ''),
            width: 14, height: 14, viewBox: '0 0 16 16',
            'aria-hidden': 'true',
          }, h('path', {
            d: 'M3.5 6l4.5 4.5L12.5 6',
            fill: 'none',
            stroke: 'currentColor',
            strokeWidth: 1.5,
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
          }))
        ),
        open ? h('div', { className: 'n9r-body' },
          disabled ? h('p', { className: 'n9r-readonly' }, t('readOnly')) : null,
          h(SecretField, {
            id: 'plugin-config-9router-key',
            label: t('apiKey'),
            hint: t('apiKeyHint'),
            clearNotice: t('clearSecretNotice'),
            configuredLabel: t('apiKeySet'),
            unconfiguredLabel: t('apiKeyUnset'),
            state: state.apiKey,
            configured: state.apiKeyConfigured,
            disabled,
            copy,
            onEdit: (text) => edit('apiKey', text),
            onClear: clearSecret,
          }),
          h(ValueField, {
            id: 'plugin-config-9router-base-url',
            label: t('baseUrl'),
            hint: t('baseUrlHint'),
            invalidText: t('baseUrlInvalid'),
            state: state.baseURL,
            disabled,
            copy,
            onEdit: (text) => edit('baseURL', text),
            onReset: () => resetField('baseURL'),
          }),
          h(SelectField, {
            id: 'plugin-config-9router-provider',
            label: t('searchProvider'),
            hint: t('searchProviderHint'),
            state: state.searchProvider,
            options: PROVIDERS,
            disabled,
            copy,
            onEdit: (text) => edit('searchProvider', text),
            onReset: () => resetField('searchProvider'),
          }),
          h('div', { className: 'n9r-footer' },
            state.failed
              ? h('p', { className: 'n9r-failed' }, t('saveFailed'))
              : (state.saved ? h('span', { className: 'n9r-saved' }, t('saved')) : h('div', { className: 'n9r-spacer' })),
            h('button', {
              type: 'button',
              className: 'n9r-btn n9r-btn-discard',
              disabled: !state.dirty || state.saving,
              onClick: discard,
            }, t('discard')),
            h('button', {
              type: 'button',
              className: 'n9r-btn n9r-btn-save',
              disabled: disabled || !state.dirty || state.invalid || state.saving,
              onClick: save,
            }, state.saving ? t('saving') : t('save'))
          )
        ) : null
      );
    }

    // ── 插件入口 ──────────────────────────────────────────────────────────────

    /** 需要的服务：slot 注册、settings 作用域绑定、文案。 */
    const inject = ['slots', 'settingsScope', 'locale'];

    function apply(ctx) {
      ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'dsh-web-search-9router: dictionaries');
      const controller = new NineRouterCardController(
        ctx.settingsScope.bind({ namespace: NAMESPACE })
      );
      ctx.slots.inject('settings.plugin.item', () => ctx.slots.register({
        name: 'settings.plugin.item',
        key: NAMESPACE,
        locale: NS,
        inject: () => controller.inject(),
      }, NineRouterCard));
    }

    return { apply, inject };
  },
});
