/* Browser half-plugin for the dsh-compact-model settings card. */

window.__ModuleLoader__.load({
  id: 'dsh-compact-model',
  factory: (require) => {
    const React = require('react');
    const h = React.createElement;
    const { createSnapshotStore } = require('@deepseek-ai/dsh-client-runtime/client');

    const NAMESPACE = 'dsh-compact-model';
    const PROVIDERS_NAMESPACE = 'llm-pi-ai';
    const NS = 'plugin-config-compact-model';
    const DEFAULTS = {
      provider: '',
      model: '',
      thresholdRatio: 0.8,
      retainRatio: 0.16,
      maxTokens: 8192,
      compactionRetries: 1,
      maxOverflowRetries: 1,
      auto: true,
    };

    const zh = {
      title: '上下文压缩模型',
      description: '配置 ACP 上下文压缩使用的模型和运行参数。',
      provider: 'Provider',
      model: '模型',
      providerHint: '只显示已配置且存在关闭推理模型的 provider。',
      modelHint: '只显示已配置并支持关闭推理的模型。',
      providerChoose: '使用压缩请求自身的 provider',
      modelChoose: '选择支持关闭推理的模型',
      unsupported: '当前值不支持关闭推理',
      thresholdRatio: '压缩阈值比例',
      retainRatio: '保留比例',
      maxTokens: '摘要最大 Token',
      compactionRetries: '压缩重试次数',
      maxOverflowRetries: '上下文溢出重试次数',
      auto: '自动压缩',
      tuningHint: '保留比例必须小于压缩阈值比例。',
      save: '保存',
      saving: '保存中...',
      discard: '放弃修改',
      saved: '已保存',
      failed: '保存失败，请检查配置后重试。',
      unsaved: '未保存',
      unavailable: '本部署未提供该设置命名空间。',
      readOnly: '当前设置为只读。',
      expand: '展开设置',
      collapse: '收起设置',
    };
    const en = {
      title: 'Context compaction model',
      description: 'Configure the model and runtime budgets used for ACP compaction.',
      provider: 'Provider',
      model: 'Model',
      providerHint: 'Only providers with a configured reasoning-off model are listed.',
      modelHint: 'Only configured models that accept reasoning off are listed.',
      providerChoose: 'Use the compaction request provider',
      modelChoose: 'Choose a reasoning-off model',
      unsupported: 'current value is not eligible',
      thresholdRatio: 'Compaction threshold ratio',
      retainRatio: 'Retain ratio',
      maxTokens: 'Summary max tokens',
      compactionRetries: 'Compaction retries',
      maxOverflowRetries: 'Context overflow retries',
      auto: 'Automatic compaction',
      tuningHint: 'Retain ratio must be lower than the threshold ratio.',
      save: 'Save',
      saving: 'Saving...',
      discard: 'Discard',
      saved: 'Saved',
      failed: 'Save failed; check the values and try again.',
      unsaved: 'Unsaved',
      unavailable: 'This deployment does not serve this settings namespace.',
      readOnly: 'These settings are read-only.',
      expand: 'Show settings',
      collapse: 'Hide settings',
    };

    const FIELD_TYPES = {
      provider: 'text',
      model: 'text',
      thresholdRatio: 'number',
      retainRatio: 'number',
      maxTokens: 'integer',
      compactionRetries: 'integer',
      maxOverflowRetries: 'integer',
      auto: 'boolean',
    };

    function supportsDisablingReasoning(reasoningEfforts) {
      if (reasoningEfforts === false || reasoningEfforts === 'off') return true;
      if (Array.isArray(reasoningEfforts)) return reasoningEfforts.includes('off');
      if (typeof reasoningEfforts === 'object' && reasoningEfforts !== null) {
        return Object.prototype.hasOwnProperty.call(reasoningEfforts, 'off');
      }
      return false;
    }

    function listEligibleModels(providers) {
      const out = [];
      if (typeof providers !== 'object' || providers === null || Array.isArray(providers)) return out;
      for (const [provider, profile] of Object.entries(providers)) {
        const models = Array.isArray(profile?.models) ? profile.models : [];
        const displayName = typeof profile?.displayName === 'string' && profile.displayName.length > 0
          ? profile.displayName
          : provider;
        for (const model of models) {
          if (typeof model?.id !== 'string' || model.id.length === 0) continue;
          if (!supportsDisablingReasoning(model.reasoningEfforts)) continue;
          out.push({ provider, model: model.id, displayName });
        }
      }
      return out;
    }

    function parseValue(field, text) {
      const type = FIELD_TYPES[field];
      if (type === 'text') return text.trim();
      if (type === 'boolean') return text === true;
      const value = Number(text);
      if (!Number.isFinite(value)) return undefined;
      if (type === 'integer' && !Number.isInteger(value)) return undefined;
      if (field === 'thresholdRatio' && (value < 0.01 || value > 1)) return undefined;
      if (field === 'retainRatio' && (value < 0 || value > 0.99)) return undefined;
      if ((field === 'maxTokens' || field === 'compactionRetries' || field === 'maxOverflowRetries') && value < 0) return undefined;
      if (field === 'maxTokens' && value < 1) return undefined;
      return value;
    }

    function formatValue(field, value) {
      if (FIELD_TYPES[field] === 'boolean') return value === true;
      if (typeof value === 'number' && Number.isFinite(value)) return String(value);
      return typeof value === 'string' ? value : String(DEFAULTS[field]);
    }

    class CompactCardController {
      constructor(scope, settingsDescribe) {
        this.scope = scope;
        this.settingsDescribe = settingsDescribe;
        this.staged = new Map();
        this.listeners = new Set();
        this.saving = false;
        this.failed = false;
        this.saved = false;
        this.savedTimer = undefined;
        scope.subscribe(() => this.publish());
        settingsDescribe?.subscribe?.(() => this.publish());
        this.store = this.bind(() => this.project());
      }

      bind(project) {
        const store = createSnapshotStore(project());
        this.listeners.add(() => store.set(project()));
        return store;
      }

      snapshot() {
        return this.scope.getSnapshot();
      }

      currentValue(field) {
        const value = this.snapshot().value?.[field];
        return value === undefined ? DEFAULTS[field] : value;
      }

      eligibleModels() {
        const view = this.settingsDescribe?.getSnapshot?.().view;
        const namespace = Array.isArray(view?.namespaces)
          ? view.namespaces.find((item) => item?.ns === PROVIDERS_NAMESPACE)
          : undefined;
        return listEligibleModels(namespace?.value?.providers);
      }

      providerOptions() {
        const options = [];
        const seen = new Set();
        for (const item of this.eligibleModels()) {
          if (seen.has(item.provider)) continue;
          seen.add(item.provider);
          options.push({ value: item.provider, label: item.displayName });
        }
        return options;
      }

      modelOptions(provider) {
        if (typeof provider !== 'string' || provider.length === 0) return [];
        return this.eligibleModels()
          .filter((item) => item.provider === provider)
          .map((item) => ({ value: item.model, label: item.model }));
      }

      selectionInvalid() {
        const provider = this.field('provider').text.trim();
        const model = this.field('model').text.trim();
        if (provider === '' && model === '') return false;
        if (provider === '' || model === '') return true;
        return !this.eligibleModels().some((item) => item.provider === provider && item.model === model);
      }

      field(field) {
        const staged = this.staged.get(field);
        if (FIELD_TYPES[field] === 'boolean') {
          const value = staged === undefined ? this.currentValue(field) : staged.value;
          return { value: value === true, invalid: false };
        }
        const value = staged === undefined ? this.currentValue(field) : staged;
        const text = staged === undefined ? formatValue(field, value) : staged.text;
        return {
          text,
          invalid: staged !== undefined && parseValue(field, text) === undefined,
        };
      }

      edit(field, text) {
        this.staged.set(field, { text });
        this.failed = false;
        this.clearSaved();
        this.publish();
      }

      selectProvider(provider) {
        const nextProvider = typeof provider === 'string' ? provider : '';
        this.edit('provider', nextProvider);
        const models = this.modelOptions(nextProvider);
        const currentModel = this.field('model').text.trim();
        if (!models.some((item) => item.value === currentModel)) {
          this.edit('model', models[0]?.value ?? '');
        }
      }

      selectModel(model) {
        this.edit('model', typeof model === 'string' ? model : '');
      }

      toggleAuto(value) {
        this.staged.set('auto', { value: value === true });
        this.failed = false;
        this.clearSaved();
        this.publish();
      }

      plan() {
        const plan = [];
        for (const [field, staged] of this.staged) {
          const value = FIELD_TYPES[field] === 'boolean'
            ? staged.value === true
            : parseValue(field, staged.text);
          if (value === undefined) {
            plan.push({ field, value: undefined });
            continue;
          }
          if (value !== this.currentValue(field)) plan.push({ field, value });
        }
        return plan;
      }

      shell() {
        const snapshot = this.snapshot();
        const plan = this.plan();
        return {
          available: snapshot.status === 'ready',
          writable: snapshot.writable === true,
          dirty: plan.length > 0,
          invalid: plan.some((item) => item.value === undefined) || this.selectionInvalid(),
          saving: this.saving,
          failed: this.failed,
          saved: this.saved,
        };
      }

      async save() {
        const plan = this.plan();
        if (this.saving || plan.length === 0 || plan.some((item) => item.value === undefined)) return;
        this.saving = true;
        this.failed = false;
        this.clearSaved();
        this.publish();
        let landed = true;
        try {
          for (const item of plan) {
            const result = await this.scope.set(item.field, item.value);
            landed = result !== false && landed;
          }
        } catch {
          landed = false;
        }
        if (landed) {
          this.staged.clear();
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

      discard() {
        this.staged.clear();
        this.failed = false;
        this.clearSaved();
        this.publish();
      }

      project() {
        const state = { ...this.shell() };
        for (const field of Object.keys(FIELD_TYPES)) state[field] = this.field(field);
        if (this.selectionInvalid()) {
          state.provider.invalid = true;
          state.model.invalid = true;
        }
        state.providerOptions = this.providerOptions();
        state.modelOptions = this.modelOptions(state.provider.text.trim());
        return state;
      }

      actions() {
        return {
          edit: (field, text) => this.edit(field, text),
          selectProvider: (provider) => this.selectProvider(provider),
          selectModel: (model) => this.selectModel(model),
          toggleAuto: (value) => this.toggleAuto(value),
          save: () => this.save(),
          discard: () => this.discard(),
        };
      }

      publish() {
        for (const listener of this.listeners) listener();
      }

      clearSaved() {
        if (this.savedTimer !== undefined) {
          clearTimeout(this.savedTimer);
          this.savedTimer = undefined;
        }
        this.saved = false;
      }
    }

    const cardCss = `
      .ccm-card{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);border-radius:12px;list-style:none;transition:border-color .16s,background .16s}
      .ccm-card:hover,.ccm-card-open{border-color:var(--dsw-alias-label-dimmed)}
      .ccm-header{appearance:none;width:100%;font:inherit;color:inherit;text-align:left;cursor:pointer;background:0 0;border:0;border-radius:12px;align-items:center;gap:12px;padding:14px 16px;display:flex}
      .ccm-header:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-2px}
      .ccm-headtext{flex-direction:column;flex:1;gap:4px;min-width:0;display:flex}
      .ccm-title{margin:0;color:var(--dsw-alias-label-primary);font-size:15px;font-weight:600;line-height:1.4}
      .ccm-desc,.ccm-hint,.ccm-status{margin:0;color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:1.5}
      .ccm-badge{white-space:nowrap;background:var(--dsw-alias-bg-module-platform);color:var(--dsw-alias-label-secondary);border-radius:999px;padding:1px 8px;font-size:11px;line-height:17px}
      .ccm-chevron{color:var(--dsw-alias-label-tertiary);flex:none;transition:transform .16s}
      .ccm-chevron-open{transform:rotate(180deg)}
      .ccm-body{border-top:1px solid var(--dsw-alias-border-l2);margin:0 16px;padding-bottom:8px}
      .ccm-field{display:flex;flex-direction:column;gap:6px;padding:10px 0}
      .ccm-field+.ccm-field{border-top:1px solid var(--dsw-alias-border-l2)}
      .ccm-label{color:var(--dsw-alias-label-primary);font-size:13px;font-weight:500;line-height:1.5}
      .ccm-input{box-sizing:border-box;height:34px;width:100%;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-layer-3);padding:0 12px;font:inherit;font-size:13px;color:var(--dsw-alias-label-primary)}
      .ccm-input:focus-visible{border-color:var(--dsw-alias-brand-primary);outline:none}
      .ccm-input:disabled{color:var(--dsw-alias-label-tertiary);cursor:default}
      .ccm-invalid{border-color:var(--dsw-alias-label-error)}
      .ccm-check{display:flex;align-items:center;gap:8px;color:var(--dsw-alias-label-primary);font-size:13px}
      .ccm-check input{accent-color:var(--dsw-alias-brand-primary)}
      .ccm-footer{border-top:1px solid var(--dsw-alias-border-l2);display:flex;align-items:center;gap:8px;padding:12px 0 4px}
      .ccm-spacer{flex:1}
      .ccm-button{appearance:none;font:inherit;cursor:pointer;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;padding:5px 14px;font-size:13px;line-height:1.5}
      .ccm-button-save{background:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-label-primary);color:var(--dsw-alias-bg-layer-3)}
      .ccm-button:disabled{opacity:.4;cursor:default}
      .ccm-error{color:var(--dsw-alias-label-error)}
    `;

    function injectCss(css) {
      if (typeof document === 'undefined') return;
      if (document.querySelector('style[data-plugin-css="dsh-compact-model"]') !== null) return;
      const style = document.createElement('style');
      style.dataset.plugin = 'dsh-compact-model';
      style.dataset.pluginCss = 'dsh-compact-model';
      style.textContent = css;
      document.head.appendChild(style);
    }

    function CompactField({ state, label, hint, disabled, type, onEdit }) {
      return h('div', { className: 'ccm-field' },
        h('label', { className: 'ccm-label' }, label),
        h('input', {
          className: 'ccm-input' + (state.invalid ? ' ccm-invalid' : ''),
          type: type === 'integer' || type === 'number' ? 'number' : 'text',
          step: type === 'integer' ? '1' : '0.01',
          value: state.text,
          disabled,
          onChange: (event) => onEdit(event.target.value),
        }),
        h('p', { className: 'ccm-hint' }, hint)
      );
    }

    function CompactSelectField({ state, label, hint, disabled, options, placeholder, unsupported, onEdit }) {
      let choices = options;
      const hasSelectedOption = options.some((option) => option.value === state.text);
      if (!hasSelectedOption && state.text !== '') {
        choices = [{ value: state.text, label: `${state.text} (${unsupported})`, disabled: true }, ...options];
      }
      return h('div', { className: 'ccm-field' },
        h('label', { className: 'ccm-label' }, label),
        h('select', {
          className: 'ccm-input' + (state.invalid ? ' ccm-invalid' : ''),
          value: state.text,
          disabled,
          onChange: (event) => onEdit(event.target.value),
        },
          h('option', { value: '' }, placeholder),
          choices.map((option) => h('option', {
            key: option.value,
            value: option.value,
            disabled: option.disabled,
          }, option.label))
        ),
        h('p', { className: 'ccm-hint' }, hint)
      );
    }

    function CompactCard(props) {
      const {
        t,
        useCompactCard,
        edit,
        selectProvider,
        selectModel,
        toggleAuto,
        save,
        discard,
      } = props;
      const state = useCompactCard((snapshot) => snapshot);
      const [open, setOpen] = React.useState(false);
      const disabled = !state.writable;
      if (!state.available) {
        return h('li', { className: 'ccm-card' },
          h('div', { className: 'ccm-header' },
            h('div', { className: 'ccm-headtext' },
              h('h3', { className: 'ccm-title' }, t('title')),
              h('p', { className: 'ccm-desc' }, t('unavailable'))
            )
          )
        );
      }
      const fields = [
        ['thresholdRatio', t('thresholdRatio'), t('tuningHint')],
        ['retainRatio', t('retainRatio'), t('tuningHint')],
        ['maxTokens', t('maxTokens'), t('tuningHint')],
        ['compactionRetries', t('compactionRetries'), t('tuningHint')],
        ['maxOverflowRetries', t('maxOverflowRetries'), t('tuningHint')],
      ];
      return h('li', { className: 'ccm-card' + (open ? ' ccm-card-open' : '') },
        h('button', {
          type: 'button',
          className: 'ccm-header',
          'aria-expanded': String(open),
          'aria-label': `${open ? t('collapse') : t('expand')}: ${t('title')}`,
          onClick: () => setOpen((value) => !value),
        },
          h('div', { className: 'ccm-headtext' },
            h('h3', { className: 'ccm-title' }, t('title')),
            h('p', { className: 'ccm-desc' }, t('description'))
          ),
          state.dirty && !state.saving ? h('span', { className: 'ccm-badge' }, t('unsaved')) : null,
          h('svg', {
            className: 'ccm-chevron' + (open ? ' ccm-chevron-open' : ''),
            width: 14, height: 14, viewBox: '0 0 16 16', 'aria-hidden': 'true',
          }, h('path', {
            d: 'M3.5 6l4.5 4.5L12.5 6', fill: 'none', stroke: 'currentColor',
            strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round',
          }))
        ),
        open ? h('div', { className: 'ccm-body' },
          disabled ? h('p', { className: 'ccm-status' }, t('readOnly')) : null,
          h(CompactSelectField, {
            state: state.provider,
            label: t('provider'),
            hint: t('providerHint'),
            disabled,
            options: state.providerOptions,
            placeholder: t('providerChoose'),
            unsupported: t('unsupported'),
            onEdit: selectProvider,
          }),
          h(CompactSelectField, {
            state: state.model,
            label: t('model'),
            hint: t('modelHint'),
            disabled,
            options: state.modelOptions,
            placeholder: t('modelChoose'),
            unsupported: t('unsupported'),
            onEdit: selectModel,
          }),
          fields.map(([field, label, hint]) => h(CompactField, {
            key: field,
            state: state[field],
            label,
            hint,
            disabled,
            type: FIELD_TYPES[field],
            onEdit: (text) => edit(field, text),
          })),
          h('div', { className: 'ccm-field' },
            h('label', { className: 'ccm-check' },
              h('input', {
                type: 'checkbox',
                checked: state.auto.value,
                disabled,
                onChange: (event) => toggleAuto(event.target.checked),
              }),
              t('auto')
            ),
            h('p', { className: 'ccm-hint' }, t('tuningHint'))
          ),
          h('div', { className: 'ccm-footer' },
            state.failed ? h('p', { className: 'ccm-status ccm-error' }, t('failed'))
              : (state.saved ? h('p', { className: 'ccm-status' }, t('saved')) : h('span', { className: 'ccm-spacer' })),
            h('button', {
              type: 'button', className: 'ccm-button',
              disabled: !state.dirty || state.saving,
              onClick: discard,
            }, t('discard')),
            h('button', {
              type: 'button', className: 'ccm-button ccm-button-save',
              disabled: disabled || !state.dirty || state.invalid || state.saving,
              onClick: save,
            }, state.saving ? t('saving') : t('save'))
          )
        ) : null
      );
    }

    const inject = ['slots', 'settingsScope', 'locale'];

    function apply(ctx) {
      injectCss(cardCss);
      ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'dsh-compact-model: dictionaries');
      const controller = new CompactCardController(
        ctx.settingsScope.bind({ namespace: NAMESPACE }),
        ctx.settingsScope.describe?.()
      );
      ctx.slots.inject('settings.plugin.item', () => ctx.slots.register({
        name: 'settings.plugin.item',
        key: NAMESPACE,
        locale: NS,
        inject: () => ({ hooks: { compactCard: controller.store }, ...controller.actions() }),
      }, CompactCard));
    }

    return { apply, inject };
  },
});
