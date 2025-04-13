import { Request, Response, NextFunction } from 'express';
import i18n from '../config/i18n';
import { AppError } from '../middlewares/errors/AppError';
import { UserService } from '../services/user';

export class UserController {
    constructor(private userService: UserService) { }

    // Método para obtener todos los usuarios
    public async getUsers(req: Request, res: Response, next: NextFunction) {
        try {
            const locale = req.headers['accept-language'] || 'en';
            i18n.setLocale(locale);

        } catch (error) {
            next (error);
        }
    }

    // Método para obtener un usuario
    public async getUser(req: Request, res: Response, next: NextFunction) {
        try {
            const locale = req.headers['accept-language'] || 'en';
            i18n.setLocale(locale);

            const { userId } = req.params;
            const user = await this.userService.getUser(userId);
        } catch (error) {
            next (error);
        }
    }

    // Método para editar un usuario
    public async updateUser(req: Request, res: Response, next: NextFunction) {
        try {
            const locale = req.headers['accept-language'] || 'en';
            i18n.setLocale(locale);

            const { userId } = req.params
        } catch (error) {
            next (error);
        }
    }

    // Método para eliminar un usuario
    public async deleteUser(req: Request, res: Response, next: NextFunction) {
        try {
            const locale = req.headers['accept-language'] || 'en';
            i18n.setLocale(locale);

            const { userId } = req.params
            const user = await this.userService.deleteUser(userId);
        } catch (error) {
            next (error);
        }
    }

}