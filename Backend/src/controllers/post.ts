import { Request, Response, NextFunction } from 'express';
import i18n from '../config/i18n';
import { PostService } from '../services/post';

export class PostController {
    constructor(private readonly postService: PostService) {};

    public async createPost(req: Request, res: Response, next: NextFunction) {
        try {
            const locale = req.headers['accept-language'] || 'en';
            i18n.setLocale(locale);

            const { user_id, description } = req.body;
            const newPost = await this.postService.createPost(user_id, description);

            res.status(200).json({
                success: true,
                status: 200,
                message: i18n.__(''),
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