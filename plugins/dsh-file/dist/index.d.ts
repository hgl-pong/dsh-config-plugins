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
import { TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol';
import type { Context } from '@deepseek-ai/cordis';
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
export declare function resolveInside(root: string, requested: string): Promise<string>;
/**
 * The file manager gateway: file-system RPC endpoints consumed by the
 * browser client half.
 *
 * Every `@Remote` method takes flat parameters whose names are the wire
 * fields the client sends (SRC descriptor contract).
 */
export declare class FileManagerGateway extends TypertRemoteService {
    static inject: string[];
    /** Workspace root served by the gateway; re-pinnable via the setRoot RPC (falls back to config/process.cwd()). */
    private root;
    constructor(ctx: Context, config?: {
        root?: string;
    });
    /** Whether a file-like name should be treated as text (heuristic). */
    private static isTextName;
    /**
     * Read a file as a data URL (any type, binary included). The Markdown
     * preview uses this to display workspace-relative images that the web
     * server itself cannot serve.
     * @param path - target file path.
     */
    readDataUrl(path: string): Promise<{
        path: string;
        mime: string;
        dataUrl: string;
    }>;
    /**
     * List one directory level.
     * @param path - target directory path (absolute inside root, or relative to root).
     */
    listDir(path: string): Promise<ListDirResult>;
    /**
     * Read a text file (UTF-8). Binary files are rejected with a clear error.
     * @param path - target file path.
     */
    readText(path: string): Promise<ReadTextResult>;
    /**
     * Write a text file (create or overwrite).
     * @param path - target file path.
     * @param content - new file content.
     */
    writeText(path: string, content: string): Promise<WriteResult>;
    /**
     * Create a new file at the target path (fails if it already exists).
     * @param path - target file path.
     */
    createFile(path: string): Promise<WriteResult>;
    /**
     * Create a directory at the target path (recursive, idempotent).
     * @param path - target directory path.
     */
    createDirectory(path: string): Promise<{
        path: string;
    }>;
    /**
     * Rename or move a file/directory.
     * @param from - source path.
     * @param to - destination path.
     */
    rename(from: string, to: string): Promise<{
        from: string;
        to: string;
    }>;
    /**
     * Delete a file or empty directory. Non-empty directories are rejected
     * (the client walks children first).
     * @param path - target path.
     */
    delete(path: string): Promise<{
        path: string;
    }>;
    /**
     * Stat one path: tells the client whether a name is a file or directory.
     * @param path - target path.
     */
    stat(path: string): Promise<{
        path: string;
        type: 'file' | 'directory' | 'other';
        size?: number;
        mtimeMs?: number;
    }>;
    /** Resolve a path inside the root, returning the canonical form. */
    resolve(path: string): Promise<{
        path: string;
    }>;
    /** Return the workspace root the gateway serves (the client's initial directory). */
    getRoot(): Promise<{
        path: string;
    }>;
    /**
     * Re-pin the workspace root the gateway serves. The browser calls this with
     * the CURRENT conversation's workspace directory (SessionHeader.cwd) when
     * the file manager opens, so the tree always reflects the session's
     * workspace instead of the process-launch directory. The path must exist
     * and be a directory; afterwards every operation resolves against it.
     * @param path - absolute workspace directory, or a path relative to the current root.
     */
    setRoot(path: string): Promise<{
        path: string;
    }>;
}
export default FileManagerGateway;
