import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';

export const validateComment = (req: Request, res: Response, next: NextFunction) => {
    try {
        const { post_id, content } = req.body;

        if (!post_id) {
            throw new AppError(400, 'PostIdRequired');
        }

        if (!content) {
            throw new AppError(400, 'ContentRequired');
        }

        if (content.length > 1000) {
            throw new AppError(400, 'CommentTooLong');
        }

        if (content.trim().length === 0) {
            throw new AppError(400, 'EmptyComment');
        }

        next();
    } catch (error) {
        next(error);
    }
}; 