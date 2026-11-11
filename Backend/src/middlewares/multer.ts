import multer from 'multer';
import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { open, rename, rm } from 'node:fs/promises';
import path from 'node:path';
import type { RequestHandler } from 'express';
import { AppError } from './errors/AppError';
import { mediaDirectory, mediaExtension, mediaFormat } from '../utils/mediaFiles';

const stagingDirectory = path.join(mediaDirectory, '.staging');
for (const directory of [stagingDirectory, path.join(mediaDirectory, 'images'), path.join(mediaDirectory, 'videos')]) {
    mkdirSync(directory, { recursive: true });
}

const storage = multer.diskStorage({
    destination: stagingDirectory,
    filename: (_req, file, callback) => {
        callback(null, `media-${randomUUID()}${mediaExtension(file.originalname)}`);
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

            try {
                const format = mediaFormat(file.filename);
                const header = Buffer.alloc(24);
                const handle = await open(file.path, 'r');
                let bytesRead: number;
                try {
                    ({ bytesRead } = await handle.read(header));
                } finally {
                    await handle.close();
                }
                if (!format?.matches(header.subarray(0, bytesRead))) {
                    throw new AppError(400, 'InvalidFileExtension');
                }

                const destination = path.join(mediaDirectory, format.folder);
                const newPath = path.join(destination, file.filename);
                await rename(file.path, newPath);
                file.destination = destination;
                file.path = newPath;
            } catch (validationError) {
                try {
                    await rm(file.path, { force: true });
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
