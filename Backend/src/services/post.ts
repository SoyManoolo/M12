import { Op } from "sequelize";
import { AppError } from "../middlewares/errors/AppError";
import { Post } from "../models";
import { existsPost } from "../utils/modelExists";

export class PostService {
    // Método para crear un nuevo post
    public async createPost(user_id: string, description: string) {
        try {
            const post = await Post.create({
                user_id,
                description
            })
            return post;
        } catch (error) {
            throw new AppError(500, 'InternalServerError');
        };
    };
    // Método para obtener los posts paginados
    public async getPosts(limit: number = 10, cursor?: string) {
        try {
            const queryOptions: any = {
                limit: limit + 1,
                order: [['createdAt', 'DESC']]
            };

            if (cursor) {
                const lastPost = await Post.findByPk(cursor);
                if (lastPost) {
                    queryOptions.where = {
                        createdAt: {
                            [Op.lt]: lastPost.dataValues.createdAt // Obtenemos posts más antiguos que el cursor
                        }
                    };
                }
            }

            const posts = await Post.findAll(queryOptions);

            if (!posts || posts.length === 0) throw new AppError(404, 'PostNotFound');

            const hasNextPage = posts.length > limit;

            const resultPosts = hasNextPage ? posts.slice(0, limit) : posts;

            const nextCursor = hasNextPage ? resultPosts[resultPosts.length - 1].dataValues.post_id : null;

            return {
                posts: resultPosts,
                hasNextPage,
                nextCursor
            };
        } catch (error) {
            throw new AppError(500, 'InternalServerError');
        };
    };

    // Método para actualizar un post
    public async updatePost(postId: string, description: string) {
        try {
            const post = await existsPost(postId);

            if (!post) throw new AppError(404, "");

            await post.update({ description });

            await post.reload();

            return post;

        } catch (error) {
            throw new AppError(500, 'InternalServerError');
        };
    };

    // Método para eliminar un post
    public async deletePost(postId: string) {
        try {
            const post = await existsPost(postId);

            if (!post) throw new AppError(404, "");

            await post.destroy();

            return post;
        } catch (error) {
            throw new AppError(500, 'InternalServerError');
        };
    };
}