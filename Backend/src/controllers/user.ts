import { Request, Response, NextFunction } from 'express';
import i18n from '../config/i18n';
import { UserService } from '../services/user';

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

};