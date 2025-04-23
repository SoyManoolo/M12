import { Op } from "sequelize";
import { AppError } from "../middlewares/errors/AppError";
import { User, Post } from "../models";
import { UserFilters } from "../types/custom";

export async function existsUser(filters: UserFilters) {
    try {
        const user = await User.findOne({
            where: {
                [Op.or]: [
                    { user_id: filters.userId},
                    { email: filters.email },
                    { username: filters.username }
                ]
            }
        });
        return user;
    } catch (error) {
        throw new AppError(500, 'DatabaseError');
    };
};

export async function existsPost(id: string) {
    try {
        const post = await Post.findOne({
            where: {
                post_id: id
            }
        });
        return post;
    } catch (error) {
        throw new AppError(500, 'DatabaseError');
    };
};

export async function existCommentChat(id: string) {
    try {
        const comment = await Post.findOne({
            where: {
                comment_id: id
            }
        });
        return comment;
    } catch (error) {
        throw new AppError(500, 'DatabaseError');
    };
}