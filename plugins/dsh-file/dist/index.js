var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
/**
 * Host half of the dsh-file plugin.
 *
 * Exposes a Typert Remote service (`fileManager`) that the browser client half
 * calls to list, read, write, create, rename, and delete files inside the
 * current conversation's workspace.
 *
 * IMPORTANT (SRC descriptor contract): the Typert gateway derives wire
 * parameter names from the method signature via Function.prototype.toString
 * — each method's parameter NAME is the wire field the client must send.
 * Methods therefore take FLAT parameters (e.g. `listDir(path: string)`, not
 * `listDir(input: {...})`), and the client's descriptors must mirror those
 * names exactly. No object-wrapping parameter.
 *
 * File operations use Node's fs directly (the plugin runs inside the host
 * process, so it shares the user's filesystem authority). All paths are
 * resolved against the workspace root pinned by configuration and rejected
 * when they escape it.
 */
import { Remote, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol';
import * as fs from 'node:fs/promises';
import * as nodePath from 'node:path';
import { mimeOf } from './mime.js';
/**
 * Resolve an untrusted client path against the workspace root.
 *
 * Accepts either a root-relative path ("/", "src/a.ts", "dist/x/y.txt") or
 * an absolute path that stays inside the root. The parent directory is
 * realpath-verified to block symlink escapes, and the final resolved path
 * must stay inside the root. ".." segments that would escape are rejected.
 */
export async function resolveInside(root, requested) {
    const rootReal = await fs.realpath(root);
    // Root-relative: strip a leading "/" and resolve "." / ".." segments.
    // Absolute: use as-is (the containment check below rejects escapes).
    const normalized = requested.replace(/\\/g, '/');
    const abs = nodePath.isAbsolute(normalized)
        ? nodePath.normalize(normalized)
        : nodePath.resolve(rootReal, normalized.replace(/^\/+/, ''));
    const parent = nodePath.dirname(abs);
    const parentReal = await fs.realpath(parent);
    const resolved = nodePath.join(parentReal, nodePath.basename(abs));
    const rel = nodePath.relative(rootReal, resolved);
    if (rel.startsWith('..') || nodePath.isAbsolute(rel)) {
        throw new Error(`path escapes the workspace root: ${requested}`);
    }
    return resolved;
}
/**
 * The file manager gateway: file-system RPC endpoints consumed by the
 * browser client half.
 *
 * Every `@Remote` method takes flat parameters whose names are the wire
 * fields the client sends (SRC descriptor contract).
 */
let FileManagerGateway = (() => {
    var _a;
    let _classSuper = TypertRemoteService;
    let _instanceExtraInitializers = [];
    let _readDataUrl_decorators;
    let _listDir_decorators;
    let _readText_decorators;
    let _writeText_decorators;
    let _createFile_decorators;
    let _createDirectory_decorators;
    let _rename_decorators;
    let _delete_decorators;
    let _stat_decorators;
    let _resolve_decorators;
    let _getRoot_decorators;
    let _setRoot_decorators;
    return _a = class FileManagerGateway extends _classSuper {
            constructor(ctx, config = {}) {
                super(ctx, 'fileManager');
                /** Workspace root served by the gateway; re-pinnable via the setRoot RPC (falls back to config/process.cwd()). */
                this.root = __runInitializers(this, _instanceExtraInitializers);
                this.root = nodePath.resolve(config.root ?? process.cwd());
                // Diagnostics: confirm the gateway is instantiated by the cordis loader.
                console.log(`[dsh-file] FileManagerGateway constructed, root=${this.root}`);
            }
            /** Whether a file-like name should be treated as text (heuristic). */
            static isTextName(name) {
                if (name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.gif')
                    || name.endsWith('.webp') || name.endsWith('.ico') || name.endsWith('.pdf') || name.endsWith('.zip')
                    || name.endsWith('.tar') || name.endsWith('.gz') || name.endsWith('.wasm') || name.endsWith('.mp3')
                    || name.endsWith('.mp4') || name.endsWith('.mov') || name.endsWith('.woff') || name.endsWith('.woff2')
                    || name.endsWith('.ttf') || name.endsWith('.eot') || name.endsWith('.otf'))
                    return false;
                return true;
            }
            /**
             * Read a file as a data URL (any type, binary included). The Markdown
             * preview uses this to display workspace-relative images that the web
             * server itself cannot serve.
             * @param path - target file path.
             */
            async readDataUrl(path) {
                const target = await resolveInside(this.root, path);
                const st = await fs.stat(target);
                if (!st.isFile())
                    throw new Error(`not a regular file: ${target}`);
                const MAX_BYTES = 5 * 1024 * 1024;
                if (st.size > MAX_BYTES)
                    throw new Error(`file too large to inline as data URL (${st.size} bytes > ${MAX_BYTES})`);
                const buf = await fs.readFile(target);
                const mime = mimeOf(target);
                return { path: target, mime, dataUrl: `data:${mime};base64,${buf.toString('base64')}` };
            }
            /**
             * List one directory level.
             * @param path - target directory path (absolute inside root, or relative to root).
             */
            async listDir(path) {
                const target = await resolveInside(this.root, path);
                const dirents = await fs.readdir(target, { withFileTypes: true });
                const entries = [];
                for (const dirent of dirents) {
                    const entry = {
                        name: dirent.name,
                        type: dirent.isDirectory() ? 'directory' : dirent.isFile() ? 'file' : 'other',
                    };
                    if (entry.type === 'file') {
                        try {
                            const st = await fs.stat(nodePath.join(target, dirent.name));
                            entry.size = st.size;
                            entry.mtimeMs = st.mtimeMs;
                        }
                        catch {
                            // Unreadable metadata: keep the entry without it.
                        }
                    }
                    entries.push(entry);
                }
                entries.sort((a, b) => {
                    if (a.type === 'directory' && b.type !== 'directory')
                        return -1;
                    if (a.type !== 'directory' && b.type === 'directory')
                        return 1;
                    return a.name.localeCompare(b.name);
                });
                return { path: target, entries };
            }
            /**
             * Read a text file (UTF-8). Binary files are rejected with a clear error.
             * @param path - target file path.
             */
            async readText(path) {
                const target = await resolveInside(this.root, path);
                if (!_a.isTextName(nodePath.basename(target))) {
                    throw new Error(`refusing to read binary file: ${target}`);
                }
                const st = await fs.stat(target);
                if (!st.isFile())
                    throw new Error(`not a regular file: ${target}`);
                const MAX_BYTES = 5 * 1024 * 1024;
                if (st.size > MAX_BYTES)
                    throw new Error(`file too large to open in the editor (${st.size} bytes > ${MAX_BYTES})`);
                const content = await fs.readFile(target, 'utf8');
                return { path: target, content, mtimeMs: st.mtimeMs, size: st.size };
            }
            /**
             * Write a text file (create or overwrite).
             * @param path - target file path.
             * @param content - new file content.
             */
            async writeText(path, content) {
                const target = await resolveInside(this.root, path);
                const exists = await fs.stat(target).then((s) => s.isFile()).catch(() => false);
                await fs.writeFile(target, content, 'utf8');
                return { path: target, operation: exists ? 'update' : 'create' };
            }
            /**
             * Create a new file at the target path (fails if it already exists).
             * @param path - target file path.
             */
            async createFile(path) {
                const target = await resolveInside(this.root, path);
                const handle = await fs.open(target, 'wx');
                await handle.close();
                return { path: target, operation: 'create' };
            }
            /**
             * Create a directory at the target path (recursive, idempotent).
             * @param path - target directory path.
             */
            async createDirectory(path) {
                const target = await resolveInside(this.root, path);
                await fs.mkdir(target, { recursive: true });
                return { path: target };
            }
            /**
             * Rename or move a file/directory.
             * @param from - source path.
             * @param to - destination path.
             */
            async rename(from, to) {
                const fromResolved = await resolveInside(this.root, from);
                const toResolved = await resolveInside(this.root, to);
                await fs.rename(fromResolved, toResolved);
                return { from: fromResolved, to: toResolved };
            }
            /**
             * Delete a file or empty directory. Non-empty directories are rejected
             * (the client walks children first).
             * @param path - target path.
             */
            async delete(path) {
                const target = await resolveInside(this.root, path);
                const st = await fs.lstat(target);
                if (st.isDirectory()) {
                    const children = await fs.readdir(target);
                    if (children.length > 0)
                        throw new Error(`directory not empty: ${target}`);
                    await fs.rmdir(target);
                }
                else {
                    await fs.unlink(target);
                }
                return { path: target };
            }
            /**
             * Stat one path: tells the client whether a name is a file or directory.
             * @param path - target path.
             */
            async stat(path) {
                const target = await resolveInside(this.root, path);
                const st = await fs.stat(target);
                return {
                    path: target,
                    type: st.isDirectory() ? 'directory' : st.isFile() ? 'file' : 'other',
                    size: st.isFile() ? st.size : undefined,
                    mtimeMs: st.mtimeMs,
                };
            }
            /** Resolve a path inside the root, returning the canonical form. */
            async resolve(path) {
                const target = await resolveInside(this.root, path);
                return { path: target };
            }
            /** Return the workspace root the gateway serves (the client's initial directory). */
            async getRoot() {
                return { path: this.root };
            }
            /**
             * Re-pin the workspace root the gateway serves. The browser calls this with
             * the CURRENT conversation's workspace directory (SessionHeader.cwd) when
             * the file manager opens, so the tree always reflects the session's
             * workspace instead of the process-launch directory. The path must exist
             * and be a directory; afterwards every operation resolves against it.
             * @param path - absolute workspace directory, or a path relative to the current root.
             */
            async setRoot(path) {
                const abs = nodePath.isAbsolute(path)
                    ? nodePath.normalize(path)
                    : nodePath.resolve(this.root, path);
                const st = await fs.stat(abs);
                if (!st.isDirectory())
                    throw new Error(`not a directory: ${abs}`);
                this.root = await fs.realpath(abs);
                return { path: this.root };
            }
        },
        (() => {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _readDataUrl_decorators = [Remote('readDataUrl')];
            _listDir_decorators = [Remote('listDir')];
            _readText_decorators = [Remote('readText')];
            _writeText_decorators = [Remote('writeText')];
            _createFile_decorators = [Remote('createFile')];
            _createDirectory_decorators = [Remote('createDirectory')];
            _rename_decorators = [Remote('rename')];
            _delete_decorators = [Remote('delete')];
            _stat_decorators = [Remote('stat')];
            _resolve_decorators = [Remote('resolve')];
            _getRoot_decorators = [Remote('getRoot')];
            _setRoot_decorators = [Remote('setRoot')];
            __esDecorate(_a, null, _readDataUrl_decorators, { kind: "method", name: "readDataUrl", static: false, private: false, access: { has: obj => "readDataUrl" in obj, get: obj => obj.readDataUrl }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _listDir_decorators, { kind: "method", name: "listDir", static: false, private: false, access: { has: obj => "listDir" in obj, get: obj => obj.listDir }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _readText_decorators, { kind: "method", name: "readText", static: false, private: false, access: { has: obj => "readText" in obj, get: obj => obj.readText }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _writeText_decorators, { kind: "method", name: "writeText", static: false, private: false, access: { has: obj => "writeText" in obj, get: obj => obj.writeText }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _createFile_decorators, { kind: "method", name: "createFile", static: false, private: false, access: { has: obj => "createFile" in obj, get: obj => obj.createFile }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _createDirectory_decorators, { kind: "method", name: "createDirectory", static: false, private: false, access: { has: obj => "createDirectory" in obj, get: obj => obj.createDirectory }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _rename_decorators, { kind: "method", name: "rename", static: false, private: false, access: { has: obj => "rename" in obj, get: obj => obj.rename }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _delete_decorators, { kind: "method", name: "delete", static: false, private: false, access: { has: obj => "delete" in obj, get: obj => obj.delete }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _stat_decorators, { kind: "method", name: "stat", static: false, private: false, access: { has: obj => "stat" in obj, get: obj => obj.stat }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _resolve_decorators, { kind: "method", name: "resolve", static: false, private: false, access: { has: obj => "resolve" in obj, get: obj => obj.resolve }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _getRoot_decorators, { kind: "method", name: "getRoot", static: false, private: false, access: { has: obj => "getRoot" in obj, get: obj => obj.getRoot }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _setRoot_decorators, { kind: "method", name: "setRoot", static: false, private: false, access: { has: obj => "setRoot" in obj, get: obj => obj.setRoot }, metadata: _metadata }, null, _instanceExtraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a.inject = [],
        _a;
})();
export { FileManagerGateway };
export default FileManagerGateway;
