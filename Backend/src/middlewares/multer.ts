import multer from 'multer';
import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { open, rename, rm } from 'node:fs/promises';
import path from 'node:path';
import type { Request, RequestHandler } from 'express';
import { AppError } from './errors/AppError';
import { mediaDirectory, mediaFormat, type MediaFormat } from '../utils/mediaFiles';

const stagingDirectory = path.join(mediaDirectory, '.staging');
for (const directory of [stagingDirectory, path.join(mediaDirectory, 'images'), path.join(mediaDirectory, 'videos')]) {
    mkdirSync(directory, { recursive: true });
}

interface UploadPaths {
    format: MediaFormat;
    stagedPath: string;
    destination: string;
    finalPath: string;
}

// Only the storage callback can register paths. Never use a path or filename from req.file for filesystem operations.
const uploadPaths = new WeakMap<Request, UploadPaths>();
const storage = multer.diskStorage({
    destination: stagingDirectory,
    filename: (req, file, callback) => {
        const format = mediaFormat(file.originalname);
        if (!format) {
            callback(new AppError(400, 'InvalidFileExtension'), '');
            return;
        }

        const filename = `media-${randomUUID()}${format.extension}`;
        const destination = path.join(mediaDirectory, format.folder);
        uploadPaths.set(req, {
            format,
            stagedPath: path.join(stagingDirectory, filename),
            destination,
            finalPath: path.join(destination, filename),
        });
        callback(null, filename);
    },
});

function uploadMedia(imagesOnly: boolean): RequestHandler {
    const parse = multer({
        storage,
        limits: { fileSize: 30 * 1024 * 1024 },
        fileFilter: (_req, file, callback) => {
            const format = mediaFormat(file.originalname);
            if (!format || format.mime !== file.mimetype || (imagesOnly && format.folder !== 'images')) {
                callback(new AppError(400, 'InvalidFileExtension'));
                return;
            }
            callback(null, true);
        },
    }).single('media');

    return (req, res, next) => {
        parse(req, res, async (error?: unknown) => {
            const file = req.file;
            if (error || !file) {
                next(error);
                return;
            }

            const upload = uploadPaths.get(req);
            if (!upload) {
                next(new Error('Missing upload paths'));
                return;
            }

            try {
                const header = Buffer.alloc(24);
                const handle = await open(upload.stagedPath, 'r');
                let bytesRead: number;
                try {
                    ({ bytesRead } = await handle.read(header));
                } finally {
                    await handle.close();
                }
                if (!upload.format.matches(header.subarray(0, bytesRead))) {
                    throw new AppError(400, 'InvalidFileExtension');
                }

                await rename(upload.stagedPath, upload.finalPath);
                file.destination = upload.destination;
                file.path = upload.finalPath;
            } catch (validationError) {
                try {
                    await rm(upload.stagedPath, { force: true });
                } catch (cleanupError) {
                    next(cleanupError);
                    return;
                }
                next(validationError);
                return;
            }
            next();
        });
    };
}

export const uploadPostMedia = uploadMedia(false);
export const uploadProfilePicture = uploadMedia(true);

export async function removeUploadedMedia(req: Request): Promise<void> {
    const upload = uploadPaths.get(req);
    if (upload) await rm(upload.finalPath, { force: true });
}
