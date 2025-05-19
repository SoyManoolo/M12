import { Request, Response, NextFunction } from 'express';
import i18n from '../config/i18n';
import { UserService } from '../services/user';
import { AppError } from '../middlewares/errors/AppError';

export class UserController {
    constructor(private userService: UserService) { }

    public async getUsers(req: Request, res: Response, next: NextFunction) {
        try {
            const locale = req.headers['accept-language'] || 'en';
            i18n.setLocale(locale);

            const users = await this.userService.getUsers();

            res.status(200).json({
                success: true,
                status: 200,
                message: "hola",
                data: users
            });
        } catch (error) {
            next(error);
        };
    }

    // Método para obtener un usuario
    public async getUser(req: Request, res: Response, next: NextFunction) {
        try {
            const locale = req.headers['accept-language'] || 'en';
            i18n.setLocale(locale);

            const filters = {
                user_id: req.params.id,
                username: req.query.username as string
            };

            const user = await this.userService.getUser(filters);

            res.status(200).json({
                success: true,
                status: 200,
                message: "hola",
                data: user
            });
        } catch (error) {
            next (error);
        };
    };

    // Método para editar un usuario
    public async updateUser(req: Request, res: Response, next: NextFunction) {
        try {
            const locale = req.headers['accept-language'] || 'en';
            i18n.setLocale(locale);

            const filters = {
                user_id: req.params.id,
                username: req.query.username as string
            };

            const updateData = req.body;

            const user = await this.userService.updateUser(filters, updateData);

            res.status(200).json({
                success: true,
                status: 200,
                message: "hola",
                data: user
            });
        } catch (error) {
            next (error);
        }
    };

    // Método para eliminar un usuario
    public async deleteUser(req: Request, res: Response, next: NextFunction) {
        try {
            const locale = req.headers['accept-language'] || 'en';
            i18n.setLocale(locale);

            const filters = {
                user_id: req.params.id,
                username: req.query.username as string
            };

            const user = await this.userService.deleteUser(filters);
        } catch (error) {
            next (error);
        }
    };

    // Método para actualizar la foto de perfil
    public async updateProfilePicture(req: Request, res: Response, next: NextFunction) {
        try {
            const locale = req.headers['accept-language'] || 'en';
            i18n.setLocale(locale);

            if (!req.file) {
                throw new AppError(400, 'NoFileUploaded');
            }

            const userId = req.params.id;
            const user = await this.userService.updateProfilePicture(userId, req.file);

            res.status(200).json({
                success: true,
                status: 200,
                message: i18n.__('success.user.profilePictureUpdated'),
                data: user
            });
        } catch (error) {
            next(error);
        }
    }

    // Método para eliminar la foto de perfil
    public async deleteProfilePicture(req: Request, res: Response, next: NextFunction) {
        try {
            const locale = req.headers['accept-language'] || 'en';
            i18n.setLocale(locale);

            const userId = req.params.id;
            const user = await this.userService.deleteProfilePicture(userId);

            res.status(200).json({
                success: true,
                status: 200,
                message: i18n.__('success.user.profilePictureDeleted'),
                data: user
            });
        } catch (error) {
            next(error);
        }
    }

};