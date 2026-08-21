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
import type { Context } from '@deepseek-ai/cordis';
import * as fs from 'node:fs/promises';
import * as nodePath from 'node:path';
import { mimeOf } from './mime.js';

/** One directory entry in a listing. */
export interface FileEntry {
  name: string;
  type: 'file' | 'directory' | 'other';
  size?: number;
  /** Modified time in epoch ms, when the backend can report it. */
  mtimeMs?: number;
}

/** Result of listing one directory level. */
export interface ListDirResult {
  /** The canonical absolute path that was listed. */
  path: string;
  entries: FileEntry[];
}

/** Result of a text read. */
export interface ReadTextResult {
  path: string;
  content: string;
  /** Epoch ms of last modification, for change detection. */
  mtimeMs: number;
  /** Byte size. */
  size: number;
}

/** Result of a write. */
export interface WriteResult {
  path: string;
  operation: 'create' | 'update';
}

/**
 * Resolve an untrusted client path against the workspace root.
 *
 * Accepts either a root-relative path ("/", "src/a.ts", "dist/x/y.txt") or
 * an absolute path that stays inside the root. The parent directory is
 * realpath-verified to block symlink escapes, and the final resolved path
 * must stay inside the root. ".." segments that would escape are rejected.
 */
export async function resolveInside(root: string, requested: string): Promise<string> {
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
export class FileManagerGateway extends TypertRemoteService {
  static inject: string[] = [];

  /** Workspace root served by the gateway; re-pinnable via the setRoot RPC (falls back to config/process.cwd()). */
  private root: string;

  constructor(ctx: Context, config: { root?: string } = {}) {
    super(ctx, 'fileManager');
    this.root = nodePath.resolve(config.root ?? process.cwd());
    // Diagnostics: confirm the gateway is instantiated by the cordis loader.
    console.log(`[dsh-file] FileManagerGateway constructed, root=${this.root}`);
  }

  /** Whether a file-like name should be treated as text (heuristic). */
  private static isTextName(name: string): boolean {
    if (name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.gif')
      || name.endsWith('.webp') || name.endsWith('.ico') || name.endsWith('.pdf') || name.endsWith('.zip')
      || name.endsWith('.tar') || name.endsWith('.gz') || name.endsWith('.wasm') || name.endsWith('.mp3')
      || name.endsWith('.mp4') || name.endsWith('.mov') || name.endsWith('.woff') || name.endsWith('.woff2')
      || name.endsWith('.ttf') || name.endsWith('.eot') || name.endsWith('.otf')) return false;
    return true;
  }

  /**
   * Read a file as a data URL (any type, binary included). The Markdown
   * preview uses this to display workspace-relative images that the web
   * server itself cannot serve.
   * @param path - target file path.
   */
  @Remote('readDataUrl')
  async readDataUrl(path: string): Promise<{ path: string; mime: string; dataUrl: string }> {
    const target = await resolveInside(this.root, path);
    const st = await fs.stat(target);
    if (!st.isFile()) throw new Error(`not a regular file: ${target}`);
    const MAX_BYTES = 5 * 1024 * 1024;
    if (st.size > MAX_BYTES) throw new Error(`file too large to inline as data URL (${st.size} bytes > ${MAX_BYTES})`);
    const buf = await fs.readFile(target);
    const mime = mimeOf(target);
    return { path: target, mime, dataUrl: `data:${mime};base64,${buf.toString('base64')}` };
  }

  /**
   * List one directory level.
   * @param path - target directory path (absolute inside root, or relative to root).
   */
  @Remote('listDir')
  async listDir(path: string): Promise<ListDirResult> {
    const target = await resolveInside(this.root, path);
    const dirents = await fs.readdir(target, { withFileTypes: true });
    const entries: FileEntry[] = [];
    for (const dirent of dirents) {
      const entry: FileEntry = {
        name: dirent.name,
        type: dirent.isDirectory() ? 'directory' : dirent.isFile() ? 'file' : 'other',
      };
      if (entry.type === 'file') {
        try {
          const st = await fs.stat(nodePath.join(target, dirent.name));
          entry.size = st.size;
          entry.mtimeMs = st.mtimeMs;
        } catch {
          // Unreadable metadata: keep the entry without it.
        }
      }
      entries.push(entry);
    }
    entries.sort((a, b) => {
      if (a.type === 'directory' && b.type !== 'directory') return -1;
      if (a.type !== 'directory' && b.type === 'directory') return 1;
      return a.name.localeCompare(b.name);
    });
    return { path: target, entries };
  }

  /**
   * Read a text file (UTF-8). Binary files are rejected with a clear error.
   * @param path - target file path.
   */
  @Remote('readText')
  async readText(path: string): Promise<ReadTextResult> {
    const target = await resolveInside(this.root, path);
    if (!FileManagerGateway.isTextName(nodePath.basename(target))) {
      throw new Error(`refusing to read binary file: ${target}`);
    }
    const st = await fs.stat(target);
    if (!st.isFile()) throw new Error(`not a regular file: ${target}`);
    const MAX_BYTES = 5 * 1024 * 1024;
    if (st.size > MAX_BYTES) throw new Error(`file too large to open in the editor (${st.size} bytes > ${MAX_BYTES})`);
    const content = await fs.readFile(target, 'utf8');
    return { path: target, content, mtimeMs: st.mtimeMs, size: st.size };
  }

  /**
   * Write a text file (create or overwrite).
   * @param path - target file path.
   * @param content - new file content.
   */
  @Remote('writeText')
  async writeText(path: string, content: string): Promise<WriteResult> {
    const target = await resolveInside(this.root, path);
    const exists = await fs.stat(target).then((s) => s.isFile()).catch(() => false);
    await fs.writeFile(target, content, 'utf8');
    return { path: target, operation: exists ? 'update' : 'create' };
  }

  /**
   * Create a new file at the target path (fails if it already exists).
   * @param path - target file path.
   */
  @Remote('createFile')
  async createFile(path: string): Promise<WriteResult> {
    const target = await resolveInside(this.root, path);
    const handle = await fs.open(target, 'wx');
    await handle.close();
    return { path: target, operation: 'create' };
  }

  /**
   * Create a directory at the target path (recursive, idempotent).
   * @param path - target directory path.
   */
  @Remote('createDirectory')
  async createDirectory(path: string): Promise<{ path: string }> {
    const target = await resolveInside(this.root, path);
    await fs.mkdir(target, { recursive: true });
    return { path: target };
  }

  /**
   * Rename or move a file/directory.
   * @param from - source path.
   * @param to - destination path.
   */
  @Remote('rename')
  async rename(from: string, to: string): Promise<{ from: string; to: string }> {
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
  @Remote('delete')
  async delete(path: string): Promise<{ path: string }> {
    const target = await resolveInside(this.root, path);
    const st = await fs.lstat(target);
    if (st.isDirectory()) {
      const children = await fs.readdir(target);
      if (children.length > 0) throw new Error(`directory not empty: ${target}`);
      await fs.rmdir(target);
    } else {
      await fs.unlink(target);
    }
    return { path: target };
  }

  /**
   * Stat one path: tells the client whether a name is a file or directory.
   * @param path - target path.
   */
  @Remote('stat')
  async stat(path: string): Promise<{ path: string; type: 'file' | 'directory' | 'other'; size?: number; mtimeMs?: number }> {
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
  @Remote('resolve')
  async resolve(path: string): Promise<{ path: string }> {
    const target = await resolveInside(this.root, path);
    return { path: target };
  }

  /** Return the workspace root the gateway serves (the client's initial directory). */
  @Remote('getRoot')
  async getRoot(): Promise<{ path: string }> {
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
  @Remote('setRoot')
  async setRoot(path: string): Promise<{ path: string }> {
    const abs = nodePath.isAbsolute(path)
      ? nodePath.normalize(path)
      : nodePath.resolve(this.root, path);
    const st = await fs.stat(abs);
    if (!st.isDirectory()) throw new Error(`not a directory: ${abs}`);
    this.root = await fs.realpath(abs);
    return { path: this.root };
  }
}

export default FileManagerGateway;
