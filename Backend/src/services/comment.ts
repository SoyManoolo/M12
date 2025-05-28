import { PostComments, Post, User } from '../models';
import { AppError } from '../middlewares/errors/AppError';

export class CommentService {
    // Método para crear un nuevo comentario
    public async createComment(post_id: string, user_id: string, content: string): Promise<PostComments> {
        try {
            console.log('[CommentService] Buscando post:', post_id);
            // Verificar si el post existe
            const post = await Post.findByPk(post_id);
            if (!post) {
                console.error('[CommentService] Post no encontrado:', post_id);
                throw new AppError(404, 'PostNotFound');
            }

            console.log('[CommentService] Buscando usuario:', user_id);
            // Verificar si el usuario existe
            const user = await User.findByPk(user_id);
            if (!user) {
                console.error('[CommentService] Usuario no encontrado:', user_id);
                throw new AppError(404, 'UserNotFound');
            }

            console.log('[CommentService] Creando comentario...');
            const comment = await PostComments.create({
                post_id,
                user_id,
                content
            });

            if (!comment) {
                console.error('[CommentService] Fallo al crear el comentario');
                throw new AppError(400, 'CommentCreationFailed');
            }

            console.log('[CommentService] Comentario creado, buscando con include de usuario...');
            // Retornar el comentario con la información del usuario
            const createdComment = await PostComments.findByPk(comment.getDataValue('comment_id'), {
                include: [{
                    model: User,
                    as: 'author',
                    attributes: ['user_id', 'username', 'profile_picture']
                }]
            });

            if (!createdComment) {
                console.error('[CommentService] No se encontró el comentario recién creado');
                throw new AppError(500, 'CommentNotFound');
            }

            console.log('[CommentService] Comentario final listo para devolver:', createdComment);
            return createdComment;
        } catch (error) {
            console.error('[CommentService] Error inesperado:', error);
            if (error instanceof AppError) throw error;
            throw new AppError(500, 'InternalServerError');
        }
    }

    // Método para obtener comentarios de un post
    public async getComments(post_id: string): Promise<PostComments[]> {
        try {
            // Verificar si el post existe
            const post = await Post.findByPk(post_id);
            if (!post) {
                throw new AppError(404, 'PostNotFound');
            }

            const comments = await PostComments.findAll({
                where: {
                    post_id
                },
                include: [{
                    model: User,
                    as: 'author',
                    attributes: ['user_id', 'username', 'profile_picture']
                }],
                order: [['created_at', 'DESC']]
            });

            return comments;
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError(500, 'InternalServerError');
        }
    }

    // Método para eliminar un comentario
    public async deleteComment(comment_id: string, user_id: string) {
        try {
            // Verificar si el comentario existe y pertenece al usuario
            const comment = await PostComments.findOne({
                where: {
                    comment_id,
                    user_id
                }
            });

            if (!comment) {
                throw new AppError(404, 'CommentNotFound');
            }

            await comment.destroy();
            return true;
        } catch (error) {
            if (error instanceof AppError) throw error;
            throw new AppError(500, 'InternalServerError');
        }
    }
}