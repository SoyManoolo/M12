import { PostComments } from '../models';
import { User } from '../models';
import { AppError } from '../middlewares/errors/AppError';

export class CommentService {
    // Método para crear un nuevo comentario
    public async createComment(post_id: string, user_id: string, content: string): Promise<PostComments> {
        try {
            const comment = await PostComments.create({
                post_id,
                user_id,
                content
            })
            if (!comment) throw new AppError(400, '');

            return comment;
        } catch (error) {
            if (error instanceof AppError) throw error;

            throw new AppError(500, 'InternalServerError');
        }
    };

    // Método para editar un comentario
    public async getComments(post_id: string): Promise<PostComments[]> {
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

            if (!comments) throw new AppError(404, 'CommentsNotFound');

            return comments;
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            if (error instanceof AppError) throw error;

            throw new AppError(500, 'InternalServerError');        }
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