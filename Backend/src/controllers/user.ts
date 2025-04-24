import { Request, Response, NextFunction } from 'express';
import i18n from '../config/i18n';
import { AppError } from '../middlewares/errors/AppError';
import { UserService } from '../services/user';

export class UserController {
    constructor(private userService: UserService) { }

    // Método para obtener un usuario
    public async getUser(req: Request, res: Response, next: NextFunction) {
        try {
            const locale = req.headers['accept-language'] || 'en';
            i18n.setLocale(locale);

            // Si hay un ID en los parámetros, buscar por UUID
            if (req.params.id) {
                const user = await this.userService.getUser({ user_id: req.params.id });
                return res.status(200).json({
                    success: true,
                    status: 200,
                    message: "hola",
                    data: user
                });
            }

            // Si no hay ID, buscar por username o devolver todos
            const filters = {
                username: req.query.username as string || undefined
            };

            const users = await this.userService.getUser(filters);

            return res.status(200).json({
                success: true,
                status: 200,
                message: "hola",
                data: users
            });
        } catch (error) {
            next(error);
            return; // Aseguramos que se retorne un valor en el catch
        }
    }

    // Método para editar un usuario
    public async updateUser(req: Request, res: Response, next: NextFunction) {
        try {
            const locale = req.headers['accept-language'] || 'en';
            i18n.setLocale(locale);

            const filters = {
                id: req.params.id,
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
                id: req.params.id,
                username: req.query.username as string
            };

            const user = await this.userService.deleteUser(filters);
        } catch (error) {
            next (error);
        }
    };

};