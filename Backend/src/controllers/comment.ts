import { Request, Response, NextFunction } from 'express';
import i18n from '../config/i18n';
import { AppError } from '../middlewares/errors/AppError';
import { CommentService } from '../services/comment';
import dbLogger from '../config/logger';

export class CommentController {
    constructor(private readonly commentService: CommentService) {};

    public async getComments(req: Request, res: Response, next: NextFunction) {
        try {
            dbLogger.info('[CommentController] Get comments request received');

            // Elegir el locale del header 'accept-language' o por defecto 'en' para el idioma de la respuesta
            const locale = req.headers['accept-language'] || 'en';
            i18n.setLocale(locale);

            // Extraer postId de los parámetros de la solicitud
            const { postId } = req.params;
            const comments = await this.commentService.getComments(postId);

            // Si no hay comentarios, lanza un error
            if (!comments) {
                dbLogger.error(`[CommentController] No comments found for postId: ${postId}`);
                throw new AppError(404, 'CommentsNotFound');
            }

            res.status(200).json({
                success: true,
                status: 200,
                data: {
                    comments
                }
            });
        } catch (error) {
            next(error);
        };
    };

    public async deleteComment(req: Request, res: Response, next: NextFunction) {
        try {
            dbLogger.info('[CommentController] Delete comment request received');

            // Elegir el locale del header 'accept-language' o por defecto 'en' para el idioma de la respuesta
            const locale = req.headers['accept-language'] || 'en';
            i18n.setLocale(locale);

            // Extraer commentId de los parámetros de la solicitud y user_id del token
            const { commentId } = req.params;
            const user_id = req.user?.user_id;

            // Verificar si el usuario está autenticado
            if (!user_id) {
                dbLogger.error('[CommentController] Unauthorized access attempt');
                throw new AppError(401, 'Unauthorized');
            }

            await this.commentService.deleteComment(commentId, user_id);

            res.status(200).json({
                success: true,
                status: 200,
                message: i18n.__('CommentDeleted')
            });
        } catch (error) {
            next(error);
        };
    };

    public async createComment(req: Request, res: Response, next: NextFunction) {
        try {
            dbLogger.info('[CommentController] Create comment request received');

            // Elegir el locale del header 'accept-language' o por defecto 'en' para el idioma de la respuesta
            const locale = req.headers['accept-language'] || 'en';
            i18n.setLocale(locale);

            // Extraer post_id, content del cuerpo de la solicitud y user_id del token
            const { post_id, content } = req.body;
            const user_id = req.user?.user_id;

            // Verificar si el usuario está autenticado
            if (!user_id) {
                dbLogger.error('[CommentController] Unauthorized access attempt');
                throw new AppError(401, 'Unauthorized');
            }

            const comment = await this.commentService.createComment(post_id, user_id, content);

            res.status(201).json({
                success: true,
                status: 201,
                data: {
                    comment
                }
            });
        } catch (error) {
            next(error);
        }
    }
};