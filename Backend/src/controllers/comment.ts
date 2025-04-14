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
        } catch (error) {
            next(error);
        };
    };

    public async deleteComment(req: Request, res: Response, next: NextFunction) {
        try {
            const locale = req.headers['accept-language'] || 'en';
            i18n.setLocale(locale);

            const { commentId } = req.params;
            const comment = await this.commentService.deleteComment(commentId);
        } catch (error) {
            next(error);
        };
    };
};