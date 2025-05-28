import { PostComments, Post, User } from '../models';
import { AppError } from '../middlewares/errors/AppError';
import dbLogger from '../config/logger';
import { existsPost } from '../utils/modelExists';

export class CommentService {
    // Método para crear un nuevo comentario
    public async createComment(post_id: string, user_id: string, content: string): Promise<PostComments> {
        try {
            dbLogger.info(`[CommentService] Creando comentario para el post: ${post_id} por el usuario: ${user_id}`);

            // Verificar si el post existe
            const post = await Post.findByPk(post_id);
            if (!post) {
                dbLogger.error('[CommentService] Post no encontrado:', {post_id});
                throw new AppError(404, 'PostNotFound');
            }

            console.log('[CommentService] Buscando usuario:', user_id);
            // Verificar si el usuario existe
            const user = await User.findByPk(user_id);
            if (!user) {
                dbLogger.error('[CommentService] Usuario no encontrado:', {user_id});
                throw new AppError(404, 'UserNotFound');
            }

            dbLogger.info('[CommentService] Creando comentario...');
            const comment = await PostComments.create({
                post_id,
                user_id,
                content
            });

            if (!comment) {
                dbLogger.error('[CommentService] Fallo al crear el comentario');
                throw new AppError(400, 'CommentCreationFailed');
            }

            dbLogger.info('[CommentService] Comentario creado, buscando con include de usuario...');
            // Retornar el comentario con la información del usuario
            const createdComment = await PostComments.findByPk(comment.getDataValue('comment_id'), {
                include: [{
                    model: User,
                    as: 'author',
                    attributes: ['user_id', 'username', 'profile_picture']
                }]
            });

            if (!createdComment) {
                dbLogger.error('[CommentService] No se encontró el comentario recién creado');
                throw new AppError(500, 'CommentNotFound');
            }

            dbLogger.info('[CommentService] Comentario final listo para devolver:', createdComment);
            return createdComment;
        } catch (error) {
            if (error instanceof AppError) {
                dbLogger.error("[CommentService] Error al crear comentario:", {error});
                throw error;
            }
            dbLogger.error("[CommentService] Error inesperado al crear comentario:", {error});
            throw new AppError(500, 'InternalServerError');
        }
    }

    // Método para obtener comentarios de un post
    public async getComments(post_id: string): Promise<PostComments[]> {
        try {
            dbLogger.info(`[CommentService] Obteniendo comentarios para el post: ${post_id}`);

            // Verificar si el post existe
            const post = await existsPost(post_id);
            if (!post) {
                dbLogger.error('[CommentService] Post no encontrado:', {post_id});
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
            if (error instanceof AppError) {
                dbLogger.error("[CommentService] Error al obtener comentarios:", {error});
                throw error;
            }
            dbLogger.error("[CommentService] Error inesperado al obtener comentarios:", {error});
            throw new AppError(500, 'InternalServerError');
        }
    }

    // Método para eliminar un comentario
    public async deleteComment(comment_id: string, user_id: string) {
        try {
            dbLogger.info(`[CommentService] Eliminando comentario con ID: ${comment_id} por el usuario: ${user_id}`);
            // Verificar si el comentario existe y pertenece al usuario
            const comment = await PostComments.findOne({
                where: {
                    comment_id,
                    user_id
                }
            });

            if (!comment) {
                dbLogger.error('[CommentService] Comentario no encontrado o no pertenece al usuario:', {comment_id, user_id});
                throw new AppError(404, 'CommentNotFound');
            }

            await comment.destroy();
            return true;
        } catch (error) {
            if (error instanceof AppError) {
                dbLogger.error("[CommentService] Error al eliminar comentario:", {error});
                throw error;
            }
            dbLogger.error("[CommentService] Error inesperado al eliminar comentario:", {error});
            throw new AppError(500, 'InternalServerError');
        }
    }
}