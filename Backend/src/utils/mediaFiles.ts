import path from 'node:path';

interface MediaFormat {
    folder: 'images' | 'videos';
    mime: string;
    matches: (header: Buffer) => boolean;
}

const hasPrefix = (header: Buffer, signature: string) => header.subarray(0, signature.length / 2).equals(Buffer.from(signature, 'hex'));
const hasTag = (header: Buffer, offset: number, tag: string) => header.toString('ascii', offset, offset + tag.length) === tag;

const jpeg: MediaFormat = { folder: 'images', mime: 'image/jpeg', matches: header => hasPrefix(header, 'ffd8ff') };
const isoVideo = (header: Buffer) => header.length >= 16 && header.readUInt32BE(0) >= 16 && hasTag(header, 4, 'ftyp');
const formats = new Map<string, MediaFormat>([
    ['.jpg', jpeg],
    ['.jpeg', jpeg],
    ['.png', { folder: 'images', mime: 'image/png', matches: header => hasPrefix(header, '89504e470d0a1a0a') }],
    ['.gif', { folder: 'images', mime: 'image/gif', matches: header => hasTag(header, 0, 'GIF87a') || hasTag(header, 0, 'GIF89a') }],
    ['.webp', { folder: 'images', mime: 'image/webp', matches: header => hasTag(header, 0, 'RIFF') && hasTag(header, 8, 'WEBP') }],
    ['.mp4', { folder: 'videos', mime: 'video/mp4', matches: isoVideo }],
    ['.mov', { folder: 'videos', mime: 'video/quicktime', matches: isoVideo }],
    ['.webm', { folder: 'videos', mime: 'video/webm', matches: header => hasPrefix(header, '1a45dfa3') }],
    ['.ogv', { folder: 'videos', mime: 'video/ogg', matches: header => hasTag(header, 0, 'OggS') }],
]);

export const mediaDirectory = path.join(process.cwd(), 'media');

export function mediaExtension(filename: string): string {
    return path.extname(filename).toLowerCase();
}

export function mediaFormat(filename: string): MediaFormat | undefined {
    return formats.get(mediaExtension(filename));
}

export function parseMediaPath(urlPath: string): { filename: string; format: MediaFormat } | undefined {
    const match = /^\/media\/(images|videos)\/([a-z\d_-]+\.[a-z\d]+)$/i.exec(urlPath);
    if (!match) return;
    const [, folder, filename] = match;
    const format = mediaFormat(filename);
    return format?.folder === folder ? { filename, format } : undefined;
}
