import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth';
import i18n from '../config/i18n';

export class AuthController {
    constructor(private readonly authService: AuthService) { }

    public async login(req: Request, res: Response, next: NextFunction) {
        try {
            const locale = req.headers['accept-language'] || 'en';
            i18n.setLocale(locale);
            const { identifier, password } = req.body;
            const token = await this.authService.login(identifier, password);

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
            const locale = req.headers['accept-language'] || 'en';
            i18n.setLocale(locale);
            const { email, username, name, surname, password } = req.body;

            const token = await this.authService.register(email, username, name, surname, password);

            res.status(200).json({
                success: true,
                status: 200,
                message: i18n.__('success.auth.register'),
                token
            });
        } catch (error) {
            next(error);
        }
    }
}