import { Op } from "sequelize";
import { AppError } from "../middlewares/errors/AppError";
import { User, Post } from "../models";
import { UserFilters } from "../types/custom";

export async function existsUser(filters: UserFilters) {
    try {
        const whereClause: any = {
            [Op.or]: []
        };

        if (filters.username) {
            whereClause[Op.or].push({ username: filters.username });
        }

        if (filters.email) {
            whereClause[Op.or].push({ email: filters.email });
        }

        // Si no hay condiciones, retornar null
        if (whereClause[Op.or].length === 0) {
            return null;
        }

        const user = await User.findOne({
            where: whereClause
        });
        return user;
    } catch (error) {
        console.error('Error en existsUser:', error);
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