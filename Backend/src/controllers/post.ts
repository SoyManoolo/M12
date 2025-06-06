import { Request, Response, NextFunction } from 'express';
import i18n from '../config/i18n';
import { PostService } from '../services/post';
import { AppError } from '../middlewares/errors/AppError';
import dbLogger from '../config/logger';


export class PostController {

    constructor(private readonly postService: PostService) { };

    public async getPostsUser(req: Request, res: Response, next: NextFunction) {
        try {
            dbLogger.info(`[PostController] Request to get posts for user: ${req.params.id}`);
            // Guarda el idioma en la variable locale y lo asigna a i18n
            const locale = req.headers['accept-language'] || 'en';
            i18n.setLocale(locale);

            const filters = {
                user_id: req.params.id as string,
                username: req.query.username as string
            };

            const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
            const cursor = req.query.cursor as string | undefined;

            // Llama al servicio para obtener los posts
            const posts = await this.postService.getPostsUser(filters, limit, cursor);

            // Devuelve una respuesta JSON con los posts obtenidos (puede ser un array vacío)
            res.status(200).json({
                success: true,
                status: 200,
                message: "Posts obtenidos correctamente",
                data: posts || []
            })
        } catch (error) {
            next(error);
        };
    };

    // Metodo del controlador para crear un nuevo post
    public async createPost(req: Request, res: Response, next: NextFunction) {
        try {
            // Guarda el idioma en la variable locale y lo asigna a i18n
            const locale = req.headers['accept-language'] || 'en';
            i18n.setLocale(locale);

            // Verifica si el usuario está autenticado
            if (!req.user?.user_id) {
                throw new AppError(401, 'Unauthorized');
            };

            // Guarda toda la informacion del post
            const media = req.file || undefined;
            const user_id = req.user.user_id;
            const description = req.body.description;

            // Llama al servicio para crear el post
            const newPost = await this.postService.createPost(user_id, description, media);

            // Devuelve una respuesta JSON con el nuevo post creado
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

    public async getPosts(req: Request, res: Response, next: NextFunction) {
        try {
            // Guarda el idioma en la variable locale y lo asigna a i18n
            const locale = req.headers['accept-language'] || 'en';
            i18n.setLocale(locale);

            const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
            const cursor = req.query.cursor as string | undefined;

            // Llama al servicio para obtener los posts
            const posts = await this.postService.getPosts(limit, cursor);

            // Devuelve una respuesta JSON con los posts obtenidos (puede ser un array vacío)
            res.status(200).json({
                success: true,
                status: 200,
                message: "Posts obtenidos correctamente",
                data: posts || []
            })
        } catch (error) {
            next(error);
        };
    };

    public async updatePost(req: Request, res: Response, next: NextFunction) {
        try {
            // Guarda el idioma en la variable locale y lo asigna a i18n
            const locale = req.headers['accept-language'] || 'en';
            i18n.setLocale(locale);

            // Guarda la informacion a actualizar
            const postId = req.params.id;
            const { description } = req.body;

            // Llama al servicio para actualizar el post
            const updatedPost = await this.postService.updatePost(postId, description);

            // Si no se actualiza el post, lanza un error
            if (!updatedPost) throw new AppError(404, 'PostNotFound');

            // Devuelve una respuesta JSON con el post actualizado
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
            // Guarda el idioma en la variable locale y lo asigna a i18n
            const locale = req.headers['accept-language'] || 'en';
            i18n.setLocale(locale);

            // Guarda la informacion del post a eliminar
            const postId = req.params.id;

            // Llama al servicio para eliminar el post
            const deletedPost = await this.postService.deletePost(postId);

            // Si no se elimina el post, lanza un error
            if (!deletedPost) throw new AppError(404, 'PostNotFound');

            // Devuelve una respuesta JSON con el post eliminado
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

    public async likePost(req: Request, res: Response, next: NextFunction) {
        try {
            const locale = req.headers['accept-language'] || 'en';
            i18n.setLocale(locale);

            if (!req.user?.user_id) {
                throw new AppError(401, 'Unauthorized');
            };

            const postId = req.params.id;
            const userId = req.user.user_id;

            const result = await this.postService.likePost(postId, userId);

            res.status(200).json({
                success: true,
                status: 200,
                message: i18n.__('LikeAdded'),
                data: result
            });
        } catch (error) {
            next(error);
        };
    };

    public async unlikePost(req: Request, res: Response, next: NextFunction) {
        try {
            const locale = req.headers['accept-language'] || 'en';
            i18n.setLocale(locale);

            if (!req.user?.user_id) {
                throw new AppError(401, 'Unauthorized');
            };

            const postId = req.params.id;
            const userId = req.user.user_id;

            const result = await this.postService.unlikePost(postId, userId);

            res.status(200).json({
                success: true,
                status: 200,
                message: i18n.__('LikeRemoved'),
                data: result
            });
        } catch (error) {
            next(error);
        };
    };

    public async checkUserLike(req: Request, res: Response, next: NextFunction) {
        try {
            const locale = req.headers['accept-language'] || 'en';
            i18n.setLocale(locale);

            if (!req.user?.user_id) {
                throw new AppError(401, 'Unauthorized');
            };

            const postId = req.params.id;
            const userId = req.user.user_id;

            const result = await this.postService.checkUserLike(postId, userId);

            res.status(200).json({
                success: true,
                status: 200,
                data: result
            });
        } catch (error) {
            next(error);
        };
    };
};