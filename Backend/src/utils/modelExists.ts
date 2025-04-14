import { Op } from "sequelize";
import { AppError } from "../middlewares/errors/AppError";
import { User, Post } from "../models";

export async function existsUser(id: string) {
    try {
        const user = await User.findOne({
            where: {
                [Op.or]: [
                    { email: id },
                    { username: id }
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