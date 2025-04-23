import { Op } from "sequelize";
import { User, Post, PostComments } from "../models";
import dbLogger from "../config/logger";

const cleanUsers: number = Number(process.env.CLEAN_USERS) || 30;
const cleanPosts: number = Number(process.env.CLEAN_POSTS) || 15;
const cleanComments: number = Number(process.env.CLEAN_COMMENTS) || 7;

export async function cleanupOldData() {
    try {
        const userCutoffDate = new Date();
        userCutoffDate.setDate(userCutoffDate.getDate() - cleanUsers);

        const postCutoffDate = new Date();
        postCutoffDate.setDate(postCutoffDate.getDate() - cleanPosts);

        const commentCutoffDate = new Date();
        commentCutoffDate.setDate(commentCutoffDate.getDate() - cleanComments);

        const deletedComments = await PostComments.destroy({
            where: {
                deleted_at: {
                    [Op.lt]: commentCutoffDate,
                    [Op.ne]: null,
                }
            },
            force: true
        });

        const deletedPosts = await Post.destroy({
            where: {
                deleted_at: {
                    [Op.lt]: postCutoffDate,
                    [Op.ne]: null,
                }
            },
            force: true
        });

        const deletedUsers = await User.destroy({
            where: {
                deleted_at: {
                    [Op.lt]: userCutoffDate,
                    [Op.ne]: null,
                }
            },
            force: true
        });
    } catch (error) {
        dbLogger.error("Error en limpieza de datos", { error });
    };
};

if (require.main === module) {
    cleanupOldData();
}