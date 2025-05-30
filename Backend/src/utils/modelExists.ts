import { Op } from "sequelize";
import { AppError } from "../middlewares/errors/AppError";
import { User, Post, Friends, PostComments } from "../models";
import { UserFilters } from "../types/custom";

// Método para comprobar si existe un usuario
export async function existsUser(filters: UserFilters) {
    try {
        const orConditions = [];
        if (filters.user_id) {
            orConditions.push({ user_id: filters.user_id });
        }
        if (filters.email) {
            orConditions.push({ email: filters.email });
        }
        if (filters.username) {
            orConditions.push({ username: filters.username });
        }

        // Si no hay condiciones válidas, no buscar
        if (orConditions.length === 0) {
            console.warn("existsUser called with no valid filters.");
            return null;
        }

        const user = await User.findOne({
            where: {
                [Op.or]: orConditions
            }
        });
        return user;
    } catch (error) {
        if (error instanceof AppError) {
            throw error;
        }
        throw new AppError(500, 'InternalServerError');
    };
};

// Método para comprobar si existe un post
export async function existsPost(id: string) {
    try {
        const post = await Post.findOne({
            where: {
                post_id: id
            }
        });
        return post;
    } catch (error) {
        if (error instanceof AppError) {
            throw error;
        }
        throw new AppError(500, 'InternalServerError');
    };
};

// Método para comprobar si existe un comentario
export async function existCommentChat(id: string) {
    try {
        const comment = await PostComments.findOne({
            where: {
                comment_id: id
            }
        });
        return comment;
    } catch (error) {
        if (error instanceof AppError) {
            throw error;
        }
        throw new AppError(500, 'InternalServerError');
    };
}

// Método para comprobar si existe una amistad
export async function verifyFriendship(user1_id: string, user2_id: string): Promise<boolean> {
    try {
        const friendship = await Friends.findOne({
            where: {
                [Op.or]: [
                    { user1_id, user2_id },
                    { user1_id: user2_id, user2_id: user1_id }
                ]
            }
        });

        return !!friendship;
    } catch (error) {
        if (error instanceof AppError) {
            throw error;
        }
        throw new AppError(500, 'InternalServerError');
    }
}