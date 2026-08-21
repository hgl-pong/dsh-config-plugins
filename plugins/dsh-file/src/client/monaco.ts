/**
 * Monaco Editor loader for the browser bundle.
 *
 * The client bundle cannot `require('monaco-editor')` — the ModuleLoader only
 * resolves platform seed words and other registered bundles. Instead we load
 * Monaco's official AMD loader from a CDN at runtime (the recommended
 * browser integration path), then `require(['vs/editor/editor.main'])` once.
 * If the CDN is unreachable, the editor pane falls back to a plain textarea.
 */

const MONACO_BASE = 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs';

declare global {
  interface Window {
    require?: {
      config(options: Record<string, unknown>): void;
      (deps: string[], cb?: (...args: unknown[]) => void, errback?: (err: unknown) => void): void;
    };
    monaco?: unknown;
  }
}

export type Monaco = typeof import('monaco-editor');

let loading: Promise<Monaco> | null = null;
let failed = false;

/** Load Monaco's AMD loader script once and resolve with the monaco namespace. */
function loadLoader(): Promise<void> {
  return new Promise((resolve, reject) => {
    const el = document.createElement('script');
    el.src = `${MONACO_BASE}/loader.js`;
    el.async = true;
    el.addEventListener('load', () => resolve());
    el.addEventListener('error', () => reject(new Error('failed to load monaco loader')));
    document.head.append(el);
  });
}

/**
 * Ensure Monaco is loaded and ready. Resolves with the `monaco` namespace.
 * Rejects if the CDN is unreachable; callers fall back to a textarea.
 */
export function ensureMonaco(): Promise<Monaco> {
  if (failed) return Promise.reject(new Error('monaco previously failed to load'));
  if (loading) return loading;
  loading = (async () => {
    try {
      await loadLoader();
      await new Promise<void>((resolve, reject) => {
        window.require!.config({ paths: { vs: MONACO_BASE } });
        window.require!(['vs/editor/editor.main'], () => resolve(), (err: unknown) => reject(err));
      });
      return window.monaco as Monaco;
    } catch (error) {
      failed = true;
      loading = null;
      throw error;
    }
  })();
  return loading;
}

/** Whether Monaco failed to load previously (for fallback messaging). */
export function monacoUnavailable(): boolean {
  return failed;
}
