import { Request, Response, NextFunction } from 'express';
import i18n from '../config/i18n';
import { PostService } from '../services/post';
import { AppError } from '../middlewares/errors/AppError';

export class PostController {
    constructor(private readonly postService: PostService) {};

    public async createPost(req: Request, res: Response, next: NextFunction) {
        try {
            const locale = req.headers['accept-language'] || 'en';
            i18n.setLocale(locale);

            if (!req.user?.id) {
                throw new AppError(401, 'Unauthorized');
            }

            const user_id = req.user.id;
            const { description } = req.body;
            console.log(user_id, description);
            const newPost = await this.postService.createPost(user_id, description);

            res.status(200).json({
                success: true,
                status: 200,
                message: "hola",
                newPost
            });
        } catch (error) {
            next(error);
        };
    };

    public async getPosts(req:Request, res: Response, next: NextFunction) {
        try {
            const locale = req.headers['accept-language'] || 'en';
            i18n.setLocale(locale);
        } catch (error) {
            next(error);
        };
    };

    public async updatePost(req: Request, res: Response, next: NextFunction) {
        try {
            const locale = req.headers['accept-language'] || 'en';
            i18n.setLocale(locale);
        } catch (error) {
            next(error);
        };
    };

    public async deletePost(req: Request, res: Response, next: NextFunction) {
        try {
            const locale = req.headers['accept-language'] || 'en';
            i18n.setLocale(locale);
        } catch (error) {
            next(error);
        };
    };
};