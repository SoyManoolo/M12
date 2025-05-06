import { Op, where } from "sequelize";
import { AppError } from "../middlewares/errors/AppError";
import { Post } from "../models";
import { existsPost, existsUser } from "../utils/modelExists";
import { UserFilters } from "../types/custom";

export class PostService {
    // Guarda la ruta de la carpeta media y las subcarpetas images y videos
    private readonly imageBasePath: string = '/media/images';
    private readonly videoBasePath: string = '/media/videos';
    // Método para crear un nuevo post
    public async createPost(user_id: string, description: string, media?: Express.Multer.File) {
        try {
            const postData: any = {
                user_id,
                description
            }

            if (media) {
                const basePath = media.mimetype.startsWith('image/')
                    ? this.imageBasePath
                    : this.videoBasePath;

                const mediaUrl = `${basePath}/${media.filename}`;
                postData.media = mediaUrl;
            }

            const post = await Post.create(postData)

            return post;
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError(500, 'InternalServerError');
        };
    };

    // Método para obtener los posts de un usuario
    public async getPostsUser(filters: UserFilters, limit: number = 10, cursor?: string) {
        try {
            if (Object.keys(filters).length === 0) {
                throw new AppError(400, "");
            };

            const user = await existsUser(filters);

            if (!user) throw new AppError(404, "");

            const user_id = user.dataValues.user_id;

            const queryOptions: any = {
                limit: limit + 1,
                where: {
                    user_id
                },
                order: [['created_at', 'DESC']]
            };

            if (cursor) {
                const lastPost = await Post.findByPk(cursor);
                if (lastPost) {
                    queryOptions.where = {
                        [Op.and]: [
                            { user_id },  // Mantener la condición de user_id
                            {
                                created_at: {
                                    [Op.lt]: lastPost.dataValues.created_at
                                }
                            }
                        ]
                    };
                }
            }

            const posts = await Post.findAll(queryOptions)

            // Si no hay posts, lanzamos un error
            if (!posts || posts.length === 0) throw new AppError(404, 'PostNotFound');

            // Si hay más posts, los paginamos
            const hasNextPage: boolean = posts.length > limit;

            // Si hay más posts, eliminamos el último post de la lista
            const resultPosts: Post[] = hasNextPage ? posts.slice(0, limit) : posts;

            // Obtenemos el cursor del último post
            const nextCursor = hasNextPage ? resultPosts[resultPosts.length - 1].dataValues.post_id : null;

            return {
                posts: resultPosts,
                hasNextPage,
                nextCursor
            };
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError(500, 'InternalServerError');
        };
    }

    // Método para obtener los posts paginados
    public async getPosts(limit: number = 10, cursor?: string) {
        try {
            const queryOptions: any = {
                limit: limit + 1,
                order: [['created_at', 'DESC']]
            };

            if (cursor) {
                const lastPost = await Post.findByPk(cursor);
                if (lastPost) {
                    queryOptions.where = {
                        created_at: {
                            [Op.lt]: lastPost.dataValues.created_at // Obtenemos posts más antiguos que el cursor
                        }
                    };
                }
            }

            const posts = await Post.findAll(queryOptions);

            // Si no hay posts, lanzamos un error
            if (!posts || posts.length === 0) throw new AppError(404, 'PostNotFound');

            // Si hay más posts, los paginamos
            const hasNextPage: boolean = posts.length > limit;

            // Si hay más posts, eliminamos el último post de la lista
            const resultPosts: Post[] = hasNextPage ? posts.slice(0, limit) : posts;

            // Obtenemos el cursor del último post
            const nextCursor = hasNextPage ? resultPosts[resultPosts.length - 1].dataValues.post_id : null;

            return {
                posts: resultPosts,
                hasNextPage,
                nextCursor
            };
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
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
            if (error instanceof AppError) {
                throw error;
            }
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
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError(500, 'InternalServerError');
        };
    };
}