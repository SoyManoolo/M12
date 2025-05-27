import { Request, Response, NextFunction } from 'express';
import i18n from '../config/i18n';
import { AppError } from '../middlewares/errors/AppError';
import { CommentService } from '../services/comment';

export class CommentController {
    constructor(private readonly commentService: CommentService) {};

    public async getComments(req: Request, res: Response, next: NextFunction) {
        try {
            const locale = req.headers['accept-language'] || 'en';
            i18n.setLocale(locale);

            const { postId } = req.params;
            const comments = await this.commentService.getComments(postId);

            if (!comments) {
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
            const locale = req.headers['accept-language'] || 'en';
            i18n.setLocale(locale);

            const { commentId } = req.params;
            const user_id = req.user?.user_id;

            if (!user_id) {
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
            const locale = req.headers['accept-language'] || 'en';
            i18n.setLocale(locale);

            const { post_id, content } = req.body;
            const user_id = req.user?.user_id;

            if (!user_id) {
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