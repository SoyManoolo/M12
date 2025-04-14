import { PostComments } from '../models/PostComments';
import { User } from '../models/User';
import { AppError } from '../middlewares/errors/AppError';
import { Post } from '../models/Post';

export class CommentService {
    // Método para crear un nuevo comentario
    public async createComment(post_id: string, user_id: string, content: string) {

    };

    // Método para editar un comentario
    public async getComments(post_id: string) {
        try {
            const comments = await PostComments.findAll({
                where: {
                    post_id
                },
                include: [
                    {
                        model: User,
                        attributes: ['username']
                    }
                ]
            })
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError(500, 'InternalServerError');
        }
    };

    // Método para eliminar un comentario
    public async deleteComment(comment_id: string) {
        try {
            const comment = await PostComments.destroy(
                {
                    where: {
                        comment_id
                    }
                }
            );

            if (!comment) throw new AppError(404, 'CommentNotFound');
            return comment;

        } catch (error) {
            if (error instanceof AppError) throw error;

            throw new AppError(500, 'InternalServerError');
        };
    };
};