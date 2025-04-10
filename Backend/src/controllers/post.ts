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

            const media = req.file;
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

            const posts = await this.postService.getPosts();
            if (!posts) {
                throw new AppError(404, 'PostNotFound');
            }

            res.status(200).json({
                success: true,
                status: 200,
                message: "hola",
                data: posts
            })
        } catch (error) {
            next(error);
        };
    };

    public async updatePost(req: Request, res: Response, next: NextFunction) {
        try {
            const locale = req.headers['accept-language'] || 'en';
            i18n.setLocale(locale);

            const postId = req.params.id;
            const { description } = req.body;
            const updatedPost = await this.postService.updatePost(postId, description);

            if (!updatedPost) throw new AppError(404, 'PostNotFound');

            res.status(200).json({
                success: true,
                status: 200,
                message: "hola",
                data: updatedPost
            });

        } catch (error) {
            next(error);
        };
    };

    public async deletePost(req: Request, res: Response, next: NextFunction) {
        try {
            const locale = req.headers['accept-language'] || 'en';
            i18n.setLocale(locale);

            const postId = req.params.id;
            const deletedPost = await this.postService.deletePost(postId);

            if (!deletedPost) throw new AppError(404, 'PostNotFound');

            res.status(200).json({
                success: true,
                status: 200,
                message: "hola",
                data: deletedPost
            });

        } catch (error) {
            next(error);
        };
    };
};