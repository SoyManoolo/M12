import { readdir, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { mediaDirectory, parseMediaPath } from '../utils/mediaFiles';
import { Op } from "sequelize";
import { User, Post, PostComments } from "../models";
import dbLogger from "../config/logger";
import { env } from './../config/env'

const cleanUsers: number = env.CLEAN_USERS ?? 30;
const cleanPosts: number = env.CLEAN_POSTS ?? 15;
const cleanComments: number = env.CLEAN_COMMENTS ?? 7;

async function cleanupOrphanMedia() {
    const uploadGracePeriod = Date.now() - 60 * 60 * 1000;
    for (const folder of ['images', 'videos']) {
        const directory = path.join(mediaDirectory, folder);
        const entries = await readdir(directory, { withFileTypes: true }).catch((error: NodeJS.ErrnoException) => {
            if (error.code === 'ENOENT') return [];
            throw error;
        });
        for (const entry of entries) {
            if (!entry.isFile()) continue;
            const mediaUrl = `/media/${folder}/${entry.name}`;
            if (!parseMediaPath(mediaUrl)) continue;

            const filename = path.join(directory, entry.name);
            const info = await stat(filename).catch((error: NodeJS.ErrnoException) => {
                if (error.code === 'ENOENT') return undefined;
                throw error;
            });
            if (!info || info.mtimeMs >= uploadGracePeriod) continue;

            const post = await Post.findOne({ where: { media: mediaUrl }, attributes: ['post_id'], paranoid: false });
            if (post) continue;
            if (folder === 'images' && await User.findOne({
                where: { profile_picture: mediaUrl }, attributes: ['user_id'], paranoid: false,
            })) continue;

            await rm(filename, { force: true });
        }
    }
}


export async function cleanupOldData() {
    try {
        const userCutoffDate = new Date();
        userCutoffDate.setDate(userCutoffDate.getDate() - cleanUsers);

        const postCutoffDate = new Date();
        postCutoffDate.setDate(postCutoffDate.getDate() - cleanPosts);

        const commentCutoffDate = new Date();
        commentCutoffDate.setDate(commentCutoffDate.getDate() - cleanComments);

        await PostComments.destroy({
            where: {
                deleted_at: {
                    [Op.lt]: commentCutoffDate,
                    [Op.ne]: null,
                }
            },
            force: true
        });

        await Post.destroy({
            where: {
                deleted_at: {
                    [Op.lt]: postCutoffDate,
                    [Op.ne]: null,
                }
            },
            force: true
        });

        await User.destroy({
            where: {
                deleted_at: {
                    [Op.lt]: userCutoffDate,
                    [Op.ne]: null,
                }
            },
            force: true
        });
        await cleanupOrphanMedia();
    } catch (error) {
        dbLogger.error("Error en limpieza de datos", { error });
    };
};

if (require.main === module) {
    cleanupOldData();
}