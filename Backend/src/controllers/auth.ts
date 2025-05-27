import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth';
import i18n from '../config/i18n';
import dbLogger from '../config/logger';
import { AppError } from '../middlewares/errors/AppError';

export class AuthController {
    constructor(private readonly authService: AuthService) { }

    public async login(req: Request, res: Response, next: NextFunction) {
        try {
            dbLogger.info('[AuthController] Login request received');

            // Elegir el locale del header 'accept-language' o por defecto 'en' para el idioma de la respuesta
            const locale = req.headers['accept-language'] || 'en';
            i18n.setLocale(locale);

            // Extraer id y password del cuerpo de la solicitud
            const { id, password } = req.body;
            dbLogger.info(`[AuthController] Login attempt for ID: ${id}`);

            // Llamar al servicio de autenticación para iniciar sesión
            const token = await this.authService.login(id, password);

            res.status(200).json({
                success: true,
                status: 200,
                message: i18n.__('success.auth.login'),
                token
            });
        } catch (error) {
            next(error);
        };
    };

    public async register(req: Request, res: Response, next: NextFunction) {
        try {
            dbLogger.info('[AuthController] Register request received');

            // Elegir el locale del header 'accept-language' o por defecto 'en' para el idioma de la respuesta
            const locale = req.headers['accept-language'] || 'en';
            i18n.setLocale(locale);

            // Extraer email, username, name, surname y password del cuerpo de la solicitud
            dbLogger.info(`[AuthController] Register attempt for email: ${req.body.email}`);
            const { email, username, name, surname, password } = req.body;

            // Llamar al servicio de autenticación para registrar un nuevo usuario
            const token = await this.authService.register(email, username, name, surname, password);

            res.status(200).json({
                success: true,
                status: 200,
                message: i18n.__('success.auth.register'),
                token
            });
        } catch (error) {
            next(error);
        };
    };

    public async logout(req: Request, res: Response, next: NextFunction) {
        try {
            dbLogger.info('[AuthController] Logout request received');

            // Elegir el locale del header 'accept-language' o por defecto 'en' para el idioma de la respuesta
            const locale = req.headers['accept-language'] || 'en';
            i18n.setLocale(locale);

            // Extraer el token del encabezado Authorization
            const authHeader: string | undefined = req.headers['authorization'];
            if (!authHeader || typeof authHeader !== 'string') {
                throw new AppError(403, "MissingJWT");
            }

            // Verificar que el token tenga el formato correcto "Bearer token
            const token: string = authHeader.split(' ')[1];
            if (!token) {
                throw new AppError(403, "FormatJWT");
            }
            const response = await this.authService.logout(token);

            res.status(200).json({
                success: true,
                status: 200,
                message: i18n.__('success.auth.logout'),
                response
            });
        } catch (error) {
            next(error);
        };
    }
};