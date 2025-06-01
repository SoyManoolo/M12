import { Request, Response, NextFunction } from 'express';
import i18n from '../config/i18n';
import { UserService } from '../services/user';
import { AppError } from '../middlewares/errors/AppError';
import dbLogger from '../config/logger';

export class UserController {
    constructor(private userService: UserService) { }

    public async getUsers(req: Request, res: Response, next: NextFunction) {
        try {
            dbLogger.info('[UserController] Get users request received');

            // Elegir el locale del header 'accept-language' o por defecto 'en' para el idioma de la respuesta
            const locale = req.headers['accept-language'] || 'en';
            i18n.setLocale(locale);

            const users = await this.userService.getUsers();

            res.status(200).json({
                success: true,
                status: 200,
                message: "usuarios obtenidos correctamente",
                data: users
            });
        } catch (error) {
            next(error);
        };
    }

    // Método para obtener un usuario
    public async getUser(req: Request, res: Response, next: NextFunction) {
        try {
            dbLogger.info('[UserController] Get user request received');

            // Elegir el locale del header 'accept-language' o por defecto 'en' para el idioma de la respuesta
            const locale = req.headers['accept-language'] || 'en';
            i18n.setLocale(locale);

            // Verifica si el usuario está autenticado
            const filters = {
                user_id: req.params.id,
                username: req.query.username as string
            };

            const user = await this.userService.getUser(filters);

            res.status(200).json({
                success: true,
                status: 200,
                message: "usuario obtenido correctamente",
                data: user
            });
        } catch (error) {
            next(error);
        };
    };

    // Método para editar un usuario
    public async updateUser(req: Request, res: Response, next: NextFunction) {
        try {
            dbLogger.info('[UserController] Update user request received');

            // Elegir el locale del header 'accept-language' o por defecto 'en' para el idioma de la respuesta
            const locale = req.headers['accept-language'] || 'en';
            i18n.setLocale(locale);

            // Verifica si el usuario está autenticado
            if (!req.user?.user_id) {
                dbLogger.error('[UserController] Unauthorized access attempt');
                throw new AppError(401, 'Unauthorized');
            }

            // Recupera el ID del usuario desde los parámetros de la solicitud o el username desde la query
            const filters = {
                user_id: req.params.id,
                username: req.query.username as string
            };

            // Recupera los datos a actualizar desde el cuerpo de la solicitud
            const updateData = req.body;

            const user = await this.userService.updateUser(filters, updateData);

            res.status(200).json({
                success: true,
                status: 200,
                message: "hola",
                data: user
            });
        } catch (error) {
            next(error);
        }
    };

    // Método para eliminar un usuario
    public async deleteUser(req: Request, res: Response, next: NextFunction) {
        try {
            dbLogger.info('[UserController] Delete user request received');

            // Elegir el locale del header 'accept-language' o por defecto 'en' para el idioma de la respuesta
            const locale = req.headers['accept-language'] || 'en';
            i18n.setLocale(locale);

            // Verifica si el usuario está autenticado
            const filters = {
                user_id: req.params.id,
                username: req.query.username as string
            };

            const user = await this.userService.deleteUser(filters);

            res.status(200).json({
                success: true,
                status: 200,
                message: i18n.__('success.user.delete'),
                data: user
            });
        } catch (error) {
            next(error);
        }
    };

    // Método para subir una foto de perfil
    public async uploadProfilePicture(req: Request, res: Response, next: NextFunction) {
        try {
            const locale = req.headers['accept-language'] || 'en';
            i18n.setLocale(locale);

            // Verifica si el usuario está autenticado
            if (!req.user?.user_id) {
                dbLogger.error('[UserController] Unauthorized access attempt');
                throw new AppError(401, 'Unauthorized');
            };

            // Recupera el ID del usuario desde los parámetros de la solicitud o el username desde la query
            const filters = {
                user_id: req.params.id,
                username: req.query.username as string
            };

            // Verifica si se ha subido un archivo
            const file = req.file;

            // Verifica si se ha subido un archivo
            if (!file) {
                throw new AppError(400, 'FileNotFound');
            };

            const user = await this.userService.updateProfilePicture(filters, file)

            res.status(200).json({
                success: true,
                status: 200,
                message: "hola",
                data: user
            });
        } catch (error) {
            next(error);
        }
    }

    // Método para subir una foto de perfil
    public async deleteProfilePicture(req: Request, res: Response, next: NextFunction) {
        try {
            dbLogger.info('[UserController] Delete profile picture request received');

            // Elegir el locale del header 'accept-language' o por defecto 'en' para el idioma de la respuesta
            const locale = req.headers['accept-language'] || 'en';
            i18n.setLocale(locale);

            // Verifica si el usuario está autenticado
            if (!req.user?.user_id) {
                dbLogger.error('[UserController] Unauthorized access attempt');
                throw new AppError(401, 'Unauthorized');
            };

            // Recupera el ID del usuario desde los parámetros de la solicitud o el username desde la query
            const filters = {
                user_id: req.params.id,
                username: req.query.username as string
            };

            const user = await this.userService.deleteProfilePicture(filters)

            res.status(200).json({
                success: true,
                status: 200,
                message: "hola",
                data: user
            });
        } catch (error) {
            next(error);
        }
    }

    // Nuevo método para manejar la búsqueda flexible de usuarios
    public async searchUsers(req: Request, res: Response, next: NextFunction) {
        try {
            dbLogger.info('[UserController] Search users request received');

            // Obtener el término de búsqueda del query param
            const searchTerm = req.query.term as string;

            if (!searchTerm || searchTerm.trim() === '') {
                // Si no hay término de búsqueda, devolver lista vacía o quizás los usuarios iniciales paginados
                // Por ahora, devolvemos vacío
                return res.status(200).json({
                    success: true,
                    status: 200,
                    message: "", // Mensaje vacío o indicando que no hay término de búsqueda
                    data: []
                });
            }

            // Elegir el locale del header 'accept-language' o por defecto 'en'
            const locale = req.headers['accept-language'] || 'en';
            i18n.setLocale(locale);

            // Llamar al servicio para realizar la búsqueda
            const users = await this.userService.searchUsers(searchTerm);

            return res.status(200).json({
                success: true,
                status: 200,
                message: "usuarios encontrados",
                data: users
            });
        } catch (error) {
            next(error);
            return res.status(500).json({
                success: false,
                status: 500,
                message: "Error al buscar usuarios",
                data: null
            });
        }
    }
};