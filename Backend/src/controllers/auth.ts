import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth';
import i18n from '../config/i18n';
import dbLogger from '../config/logger';
import { AppError } from '../middlewares/errors/AppError';
import { randomBytes } from 'node:crypto';

export class AuthController {
    constructor(private readonly authService: AuthService) { }

    private setSessionCookies(res: Response, token: string, refreshToken: string) {
        res.cookie('session', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 60 * 60 * 1000,
            path: '/',
        });
        res.cookie('session_refresh', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 30 * 24 * 60 * 60 * 1000,
            path: '/',
        });
    }

    private getSessionToken(req: Request): string | undefined {
        const cookieToken = req.headers.cookie
            ?.split(';')
            .map(value => value.trim())
            .find(value => value.startsWith('session='))
            ?.slice('session='.length);
        const authorization = req.headers.authorization;
        const bearerToken = authorization?.startsWith('Bearer ')
            ? authorization.slice('Bearer '.length).trim()
            : undefined;

        return cookieToken ? decodeURIComponent(cookieToken) : bearerToken;
    }

    public startGoogleAuth(_req: Request, res: Response) {
        const clientId = process.env.GOOGLE_CLIENT_ID;
        const callbackUrl = process.env.GOOGLE_CALLBACK_URL;
        const frontendUrl = process.env.FRONTEND_URL?.replace(/\/$/, '');
        if (!clientId || !callbackUrl || !frontendUrl) {
            return res.redirect(`${frontendUrl || 'https://friendsgofrontend.vercel.app'}/login?error=google_unavailable`);
        }

        const state = randomBytes(32).toString('base64url');
        res.cookie('google_oauth_state', state, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 10 * 60 * 1000,
            path: '/auth/google',
        });
        const authorizationUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
        authorizationUrl.search = new URLSearchParams({
            client_id: clientId,
            redirect_uri: callbackUrl,
            response_type: 'code',
            scope: 'openid email profile',
            state,
            prompt: 'select_account',
        }).toString();
        return res.redirect(authorizationUrl.toString());
    }

    public async completeGoogleAuth(req: Request, res: Response) {
        const frontendUrl = process.env.FRONTEND_URL?.replace(/\/$/, '') || 'https://friendsgofrontend.vercel.app';
        const clearState = () => res.clearCookie('google_oauth_state', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/auth/google',
        });

        try {
            const stateCookie = req.headers.cookie?.split(';').map(value => value.trim())
                .find(value => value.startsWith('google_oauth_state='))
                ?.slice('google_oauth_state='.length);
            const state = typeof req.query.state === 'string' ? req.query.state : '';
            const code = typeof req.query.code === 'string' ? req.query.code : '';
            clearState();
            if (!stateCookie || decodeURIComponent(stateCookie) !== state || !code) throw new AppError(400, 'InvalidGoogleOAuthState');

            const clientId = process.env.GOOGLE_CLIENT_ID;
            const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
            const callbackUrl = process.env.GOOGLE_CALLBACK_URL;
            if (!clientId || !clientSecret || !callbackUrl) throw new AppError(503, 'GoogleOAuthUnavailable');

            const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    code,
                    client_id: clientId,
                    client_secret: clientSecret,
                    redirect_uri: callbackUrl,
                    grant_type: 'authorization_code',
                }),
            });
            if (!tokenResponse.ok) throw new AppError(401, 'GoogleAuthenticationFailed');
            const tokenData = await tokenResponse.json() as { access_token?: string };
            if (!tokenData.access_token) throw new AppError(401, 'GoogleAuthenticationFailed');

            const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                headers: { Authorization: `Bearer ${tokenData.access_token}` },
            });
            if (!profileResponse.ok) throw new AppError(401, 'GoogleAuthenticationFailed');
            const profile = await profileResponse.json() as { email?: string; verified_email?: boolean; given_name?: string; family_name?: string; name?: string; picture?: string };
            if (!profile.email || profile.verified_email !== true) throw new AppError(401, 'GoogleEmailNotVerified');

            const name = profile.given_name || profile.name?.split(' ')[0] || profile.email.split('@')[0];
            const surname = profile.family_name || profile.name?.split(' ').slice(1).join(' ') || 'FriendsGo';
            const session = await this.authService.loginWithGoogle({
                email: profile.email,
                name,
                surname,
                picture: profile.picture,
            });
            this.setSessionCookies(res, session.accessToken, session.refreshToken);
            return res.redirect(`${frontendUrl}/inicio`);
        } catch (error) {
            clearState();
            dbLogger.warn('[AuthController] Google OAuth callback failed', { error });
            return res.redirect(`${frontendUrl}/login?error=google_login_failed`);
        }
    }

    public async forgotPassword(req: Request, res: Response, next: NextFunction) {
        try {
            await this.authService.requestPasswordReset(req.body.email);
            res.status(200).json({
                success: true,
                message: 'Si existe una cuenta con ese correo, recibirá un enlace para restablecer la contraseña.',
            });
        } catch (error) {
            next(error);
        }
    }

    public async resetPassword(req: Request, res: Response, next: NextFunction) {
        try {
            const { token, password } = req.body;
            await this.authService.resetPassword(token, password);
            res.status(200).json({ success: true, message: 'La contraseña se ha actualizado. Inicia sesión de nuevo.' });
        } catch (error) {
            next(error);
        }
    }

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
            const session = await this.authService.login(id, password);

            this.setSessionCookies(res, session.accessToken, session.refreshToken);

            res.status(200).json({
                success: true,
                status: 200,
                message: i18n.__('success.auth.login')
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
            const session = await this.authService.register(email, username, name, surname, password);

            this.setSessionCookies(res, session.accessToken, session.refreshToken);

            res.status(200).json({
                success: true,
                status: 200,
                message: i18n.__('success.auth.register')
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

            const token = req.authenticatedAccessToken ?? this.getSessionToken(req);
            if (!token) {
                throw new AppError(403, 'MissingJWT');
            }
            const refreshToken = req.headers.cookie
                ?.split(';').map(value => value.trim())
                .find(value => value.startsWith('session_refresh='))
                ?.slice('session_refresh='.length);
            const response = await this.authService.logout(token, refreshToken ? decodeURIComponent(refreshToken) : undefined);

            res.clearCookie('session', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
                path: '/',
            });
            res.clearCookie('session_refresh', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
                path: '/',
            });

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
