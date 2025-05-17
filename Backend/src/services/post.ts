import { Op, where } from "sequelize";
import { AppError } from "../middlewares/errors/AppError";
import { Post, PostLikes, User } from "../models";
import { existsPost, existsUser } from "../utils/modelExists";
import { UserFilters } from "../types/custom";
import { sequelize } from "../config/database";
import FileManagementService from './FileManagementService';

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

            const post = await Post.create(postData);

            if (media) {
                // Guardar la imagen en el directorio del usuario
                const fileName = await FileManagementService.savePostImage(user_id, post.dataValues.post_id, media);
                await post.update({ media: fileName });
                
                // Registrar la acción en el log del post
                await FileManagementService.logPostAction(
                    user_id,
                    post.dataValues.post_id,
                    'CREATE',
                    `Post created with image: ${fileName}`
                );
            } else {
                // Registrar la acción en el log del post
                await FileManagementService.logPostAction(
                    user_id,
                    post.dataValues.post_id,
                    'CREATE',
                    'Post created without image'
                );
            }

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
            console.log(filters);
            const user = await existsUser(filters);

            if (!user) throw new AppError(404, "");

            const user_id = user.dataValues.user_id;

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
                            { user_id },
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

            if (!posts || posts.length === 0) throw new AppError(404, 'PostNotFound');

            const hasNextPage: boolean = posts.length > limit;
            const resultPosts: Post[] = hasNextPage ? posts.slice(0, limit) : posts;
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

            const posts = await Post.findAll(queryOptions);

            if (!posts || posts.length === 0) throw new AppError(404, 'PostNotFound');

            const postsWithLikes = posts.map(post => {
                const postData = post.toJSON();
                return postData;
            });

            const hasNextPage: boolean = postsWithLikes.length > limit;
            const resultPosts = hasNextPage ? postsWithLikes.slice(0, limit) : postsWithLikes;
            const nextCursor = hasNextPage ? resultPosts[resultPosts.length - 1].post_id : null;

            return {
                posts: resultPosts,
                hasNextPage,
                nextCursor
            };
        } catch (error: any) {
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError(500, 'InternalServerError');
        }
    }

    // Método para actualizar un post
    public async updatePost(postId: string, description: string) {
        try {
            const post = await existsPost(postId);

            if (!post) throw new AppError(404, "");

            await post.update({ description });

            // Registrar la acción en el log del post
            await FileManagementService.logPostAction(
                post.dataValues.user_id,
                postId,
                'UPDATE',
                'Post description updated'
            );

            return post;
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError(500, 'InternalServerError');
        }
    }

    // Método para eliminar un post
    public async deletePost(postId: string) {
        try {
            const post = await existsPost(postId);

            if (!post) throw new AppError(404, "");

            // Si el post tiene una imagen, la eliminamos
            if (post.dataValues.media) {
                await FileManagementService.deletePostImage(post.dataValues.user_id, post.dataValues.media);
            }

            // Registrar la acción en el log del post
            await FileManagementService.logPostAction(
                post.dataValues.user_id,
                postId,
                'DELETE',
                'Post deleted'
            );

            await post.destroy();

            return post;
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError(500, 'InternalServerError');
        }
    }
}