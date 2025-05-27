import { Op, where } from "sequelize";
import { AppError } from "../middlewares/errors/AppError";
import { Post, PostLikes, User } from "../models";
import { existsPost, existsUser } from "../utils/modelExists";
import { PostAttributes, UserFilters } from "../types/custom";
import { sequelize } from "../config/database";
import { CreatePostAttributes } from "../types/custom";
import dbLogger from '../config/logger';

export class PostService {
    // Guarda la ruta de la carpeta media y las subcarpetas images y videos
    private readonly imageBasePath: string = '/media/images';
    private readonly videoBasePath: string = '/media/videos';

    // Método para crear un nuevo post
    public async createPost(user_id: string, description: string, media?: Express.Multer.File) {
        try {
            dbLogger.info(`[PostService] Creating post for user: ${user_id}`);

            const postData: CreatePostAttributes = {
                user_id,
                description
            }

            // Si hay un archivo multimedia, guardamos la ruta en la base de datos
            if (media) {
                const basePath = media.mimetype.startsWith('image/')
                    ? this.imageBasePath
                    : this.videoBasePath;

                const mediaUrl = `${basePath}/${media.filename}`;
                postData.media = mediaUrl;
            }

            const post = await Post.create(postData)

            if (!post) throw new AppError(500, 'PostNotCreated');

            return post;
        } catch (error) {
            if (error instanceof AppError) {
                dbLogger.error(`[PostService] Error creating post: ${error.message}`);
                throw error;
            }
            dbLogger.error(`[PostService] Unexpected error creating post: ${error}`);
            throw new AppError(500, 'InternalServerError');
        };
    };

    // Método para obtener los posts de un usuario
    public async getPostsUser(filters: UserFilters, limit: number = 10, cursor?: string) {
        try {
            if (Object.keys(filters).length === 0) {
                throw new AppError(400, "");
            };

            const user: User | null = await existsUser(filters);

            if (!user) throw new AppError(404, "");

            const user_id = user.user_id;

            const queryOptions: any = {
                limit: limit + 1,
                where: {
                    user_id
                },
                order: [['created_at', 'DESC']],
                include: [
                    {
                        model: User,
                        attributes: ['user_id', 'username', 'profile_picture', 'name'],
                        as: 'author'
                    }
                ],
                attributes: {
                    include: [
                        [
                            sequelize.literal(`(
                                SELECT COUNT(*)
                                FROM post_likes
                                WHERE post_likes.post_id = "Post".post_id
                            )`),
                            'likes_count'
                        ],
                        [
                            sequelize.literal(`(
                                SELECT COUNT(*)
                                FROM post_comments
                                WHERE post_comments.post_id = "Post".post_id
                                AND post_comments.deleted_at IS NULL
                            )`),
                            'comments_count'
                        ]
                    ]
                },
                subQuery: false
            };

            if (cursor) {
                const lastPost = await Post.findByPk(cursor);
                if (lastPost) {
                    queryOptions.where = {
                        [Op.and]: [
                            { user_id },  // Mantener la condición de user_id
                            {
                                created_at: {
                                    [Op.lt]: lastPost.getDataValue("created_at")
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
            const nextCursor: string | null = hasNextPage ? resultPosts[resultPosts.length - 1].dataValues.post_id : null;

            return {
                posts: resultPosts,
                hasNextPage,
                nextCursor
            };
        } catch (error) {
            if (error instanceof AppError) {
                dbLogger.error(`[PostService] Error getting posts by user: ${error.message}`);
                throw error;
            }
            dbLogger.error(`[PostService] Unexpected error getting posts by user: ${error}`);
            throw new AppError(500, 'InternalServerError');
        };
    }

    // Método para obtener los posts paginados
    public async getPosts(limit: number = 10, cursor?: string) {
        try {
            dbLogger.info('[PostService] Getting all posts');

            const queryOptions: any = {
                limit: limit + 1,
                order: [['created_at', 'DESC']],
                include: [
                    {
                        model: User,
                        attributes: ['user_id', 'username', 'profile_picture', 'name'],
                        as: 'author'
                    }
                ],
                attributes: {
                    include: [
                        [
                            sequelize.literal(`(
                                SELECT COUNT(*)
                                FROM post_likes
                                WHERE post_likes.post_id = "Post".post_id
                            )`),
                            'likes_count'
                        ],
                        [
                            sequelize.literal(`(
                                SELECT COUNT(*)
                                FROM post_comments
                                WHERE post_comments.post_id = "Post".post_id
                                AND post_comments.deleted_at IS NULL
                            )`),
                            'comments_count'
                        ]
                    ]
                },
                subQuery: false
            };

            if (cursor) {
                const lastPost = await Post.findByPk(cursor);
                if (lastPost) {
                    queryOptions.where = {
                        created_at: {
                            [Op.lt]: lastPost.dataValues.created_at
                        }
                    };
                };
            };

            const posts: Post[] = await Post.findAll(queryOptions);

            // Si no hay posts, lanzamos un error
            if (!posts || posts.length === 0) throw new AppError(404, 'PostNotFound');

            // Transformamos los posts para el formato esperado por el frontend
            const postsWithLikes = posts.map(post => {
                const postData = post.toJSON();
                return postData; // Ya incluye likes_count
            });

            // Paginación
            const hasNextPage: boolean = postsWithLikes.length > limit;
            const resultPosts: PostAttributes[] = hasNextPage ? postsWithLikes.slice(0, limit) : postsWithLikes;
            const nextCursor: string | null = hasNextPage ? resultPosts[resultPosts.length - 1].post_id : null;

            return {
                posts: resultPosts,
                hasNextPage,
                nextCursor
            };
        } catch (error: any) {
            if (error instanceof AppError) {
                dbLogger.error(`[PostService] Error getting posts: ${error.message}`);
                throw error;
            }
            dbLogger.error(`[PostService] Unexpected error getting posts: ${error}`);
            throw new AppError(500, 'InternalServerError');
        }
    }

    // Método para actualizar un post
    public async updatePost(postId: string, description: string) {
        try {
            dbLogger.info(`[PostService] Updating post with ID: ${postId}`);

            const post: Post | null = await existsPost(postId);

            if (!post) throw new AppError(404, "");

            await post.update({ description });

            await post.reload();

            return post;

        } catch (error) {
            if (error instanceof AppError) {
                dbLogger.error(`[PostService] Error updating post: ${error.message}`);
                throw error;
            }
            dbLogger.error(`[PostService] Unexpected error updating post: ${error}`);
            throw new AppError(500, 'InternalServerError');
        };
    };

    // Método para eliminar un post
    public async deletePost(postId: string) {
        try {
            dbLogger.info(`[PostService] Deleting post with ID: ${postId}`);

            const post: Post | null = await existsPost(postId);

            if (!post) throw new AppError(404, "");

            await post.destroy();

            return post;
        } catch (error) {
            if (error instanceof AppError) {
                dbLogger.error(`[PostService] Error deleting post: ${error.message}`);
                throw error;
            }
            dbLogger.error(`[PostService] Unexpected error deleting post: ${error}`);
            throw new AppError(500, 'InternalServerError');
        };
    };

    // Método para dar like a un post
    public async likePost(postId: string, userId: string) {
        try {
            dbLogger.info(`[PostService] Liking post with ID: ${postId} by user: ${userId}`);

            const post: Post | null = await existsPost(postId);
            if (!post) throw new AppError(404, 'PostNotFound');

            // Verificar si el usuario ya dio like
            const existingLike: PostLikes | null = await PostLikes.findOne({
                where: {
                    post_id: postId,
                    user_id: userId
                }
            });

            if (existingLike) {
                throw new AppError(400, 'PostAlreadyLiked');
            }

            // Crear el like
            await PostLikes.create({
                post_id: postId,
                user_id: userId
            });

            return { success: true, message: 'Like added successfully' };
        } catch (error) {
            if (error instanceof AppError) {
                dbLogger.error(`[PostService] Error liking post: ${error.message}`);
                throw error;
            }
            dbLogger.error(`[PostService] Unexpected error liking post: ${error}`);
            throw new AppError(500, 'InternalServerError');
        };
    };

    // Método para quitar like de un post
    public async unlikePost(postId: string, userId: string) {
        try {
            dbLogger.info(`[PostService] Unliking post with ID: ${postId} by user: ${userId}`);

            const post: Post | null = await existsPost(postId);
            if (!post) throw new AppError(404, 'PostNotFound');

            // Verificar si el usuario dio like
            const existingLike: PostLikes | null = await PostLikes.findOne({
                where: {
                    post_id: postId,
                    user_id: userId
                }
            });

            if (!existingLike) {
                throw new AppError(400, 'PostNotLiked');
            }

            // Eliminar el like
            await existingLike.destroy();

            return { success: true, message: 'Like removed successfully' };
        } catch (error) {
            if (error instanceof AppError) {
                dbLogger.error(`[PostService] Error unliking post: ${error.message}`);
                throw error;
            }
            dbLogger.error(`[PostService] Unexpected error unliking post: ${error}`);
            throw new AppError(500, 'InternalServerError');
        };
    };

    // Método para verificar si un usuario dio like a un post
    public async checkUserLike(postId: string, userId: string) {
        try {
            dbLogger.info(`[PostService] Checking user like for post with ID: ${postId} by user: ${userId}`);

            const post: Post | null = await existsPost(postId);
            if (!post) throw new AppError(404, 'PostNotFound');

            const like: PostLikes | null = await PostLikes.findOne({
                where: {
                    post_id: postId,
                    user_id: userId
                }
            });

            return { hasLiked: !!like };
        } catch (error) {
            if (error instanceof AppError) {
                dbLogger.error(`[PostService] Error checking user like for post: ${error.message}`);
                throw error;
            }
            dbLogger.error(`[PostService] Unexpected error checking user like for post: ${error}`);
            throw new AppError(500, 'InternalServerError');
        };
    };
};