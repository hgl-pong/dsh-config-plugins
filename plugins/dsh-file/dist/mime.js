/**
 * MIME inference for files served by the dsh-file host gateway.
 *
 * Kept dependency-free and importable in Node tests (no decorators, no
 * cordis) so the mapping can be unit-tested directly.
 */
/** Infer a browser MIME type from a file extension (small common subset). */
export function mimeOf(name) {
    const ext = name.split('.').pop()?.toLowerCase() ?? '';
    switch (ext) {
        case 'svg': return 'image/svg+xml';
        case 'png': return 'image/png';
        case 'jpg':
        case 'jpeg': return 'image/jpeg';
        case 'gif': return 'image/gif';
        case 'webp': return 'image/webp';
        case 'ico': return 'image/x-icon';
        case 'bmp': return 'image/bmp';
        case 'avif': return 'image/avif';
        case 'pdf': return 'application/pdf';
        case 'woff': return 'font/woff';
        case 'woff2': return 'font/woff2';
        case 'ttf': return 'font/ttf';
        case 'otf': return 'font/otf';
        case 'mp3': return 'audio/mpeg';
        case 'wav': return 'audio/wav';
        case 'mp4': return 'video/mp4';
        case 'webm': return 'video/webm';
        default: return 'application/octet-stream';
    }
}
