/**
 * MIME inference for files served by the dsh-file host gateway.
 *
 * Kept dependency-free and importable in Node tests (no decorators, no
 * cordis) so the mapping can be unit-tested directly.
 */
/** Infer a browser MIME type from a file extension (small common subset). */
export declare function mimeOf(name: string): string;
