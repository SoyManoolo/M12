// Middleware para generacion de tokern y validación

import jwt from "jsonwebtoken";
import { User, RefreshToken, SessionRefreshToken } from "../../../models";
import { Op } from "sequelize";
import { Request, Response, NextFunction } from "express";
import { AppError } from "../../errors/AppError";
import { env } from './../../../config/env'
import { ALLOWED_ORIGINS } from '../../../config/cors';
import { createHash } from 'node:crypto';
import { randomUUID } from 'node:crypto';


export class AuthToken {

    private static secretKey: string = env.JWT_SECRET as string;

    // Comprobamos si existe la clave secreta
    static {
        if (!this.secretKey) {
            throw new AppError(404, "MissingJwtSecret");
        };
    };

    public generateToken(user: User): string {
        // Generamos un token con el id y el dni del usuario
        return jwt.sign({
            user_id: user.getDataValue("user_id"),
            username: user.getDataValue("username"),
            jti: randomUUID(),
        },
            AuthToken.secretKey,
            { expiresIn: 3600 }
        );
    };

    private static cookieOptions(maxAge: number) {
        return {
            httpOnly: true,
            secure: env.NODE_ENV === 'production',
            sameSite: env.NODE_ENV === 'production' ? 'none' as const : 'lax' as const,
            maxAge,
            path: '/',
        };
    }

    private static readCookie(req: Request, name: string): string | undefined {
        const value = req.headers.cookie?.split(';').map(cookie => cookie.trim())
            .find(cookie => cookie.startsWith(`${name}=`))?.slice(name.length + 1);
        return value ? decodeURIComponent(value) : undefined;
    }

    private static async renewSession(refreshToken: string, previousAccessToken: string | undefined, res: Response): Promise<string | null> {
        const tokenHash = createHash('sha256').update(refreshToken).digest('hex');
        const stored = await SessionRefreshToken.findOne({ where: { token_hash: tokenHash, expires_at: { [Op.gt]: new Date() } } });
        if (!stored) return null;
        const user = await User.findByPk(stored.user_id);
        if (!user) return null;

        const accessToken = new AuthToken().generateToken(user);
        const now = Date.now();
        if (previousAccessToken) {
            await RefreshToken.destroy({ where: { token: previousAccessToken, user_id: user.user_id } });
        }
        await RefreshToken.create({ token: accessToken, user_id: user.user_id, expires_at: new Date(now + 60 * 60 * 1000) });
        if (stored.expires_at.getTime() < now + 15 * 24 * 60 * 60 * 1000) {
            await stored.update({ expires_at: new Date(now + 30 * 24 * 60 * 60 * 1000) });
        }
        res.cookie('session', accessToken, this.cookieOptions(60 * 60 * 1000));
        res.cookie('session_refresh', refreshToken, this.cookieOptions(30 * 24 * 60 * 60 * 1000));
        return accessToken;
    }

    public static async verifyToken(req: Request, res: Response, next: NextFunction): Promise<void> {
        // La cookie HttpOnly es la fuente principal. Conservamos Bearer como
        // compatibilidad para clientes antiguos y llamadas no navegadas.
        const cookieToken = this.readCookie(req, 'session');
        const refreshToken = this.readCookie(req, 'session_refresh');
        const authHeader: string | undefined = req.headers['authorization'];
        const bearerToken = authHeader?.startsWith('Bearer ')
            ? authHeader.slice('Bearer '.length).trim()
            : undefined;
        let token = cookieToken ?? bearerToken;

        // En producción la cookie puede viajar entre el frontend y la API.
        // Las mutaciones autenticadas con cookie exigen un Origin permitido para
        // impedir que una página externa aproveche esa sesión (CSRF).
        if ((cookieToken || refreshToken) && !['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
            const origin = req.headers.origin;
            if (!origin || !ALLOWED_ORIGINS.includes(origin)) {
                throw new AppError(403, 'Forbidden');
            }
        }

        // Si no existe el token devolvemos un error
        if (!token && refreshToken) token = await this.renewSession(refreshToken, undefined, res) ?? undefined;
        if (!token) throw new AppError(403, "FormatJWT");

        try {
            // Verificamos el token y lo guardamos en req.user
            let payload: jwt.JwtPayload;
            try {
                payload = jwt.verify(token, AuthToken.secretKey) as jwt.JwtPayload;
            } catch (error) {
                if (!cookieToken || !refreshToken) throw error;
                token = await this.renewSession(refreshToken, cookieToken, res) ?? '';
                if (!token) throw error;
                payload = jwt.verify(token, AuthToken.secretKey) as jwt.JwtPayload;
            }
            if (!payload.user_id) throw new AppError(403, "FormatJWT");

            const [activeToken, activeUser] = await Promise.all([
                RefreshToken.findOne({
                    where: {
                        token,
                        user_id: payload.user_id,
                        expires_at: { [Op.gt]: new Date() }
                    }
                }),
                User.findByPk(payload.user_id)
            ]);

            if ((!activeToken || !activeUser) && cookieToken && refreshToken) {
                token = await this.renewSession(refreshToken, cookieToken, res) ?? '';
                if (token) {
                    payload = jwt.verify(token, AuthToken.secretKey) as jwt.JwtPayload;
                }
            }
            const renewedActiveToken = token ? await RefreshToken.findOne({ where: { token, expires_at: { [Op.gt]: new Date() } } }) : null;
            const renewedActiveUser = payload.user_id ? await User.findByPk(payload.user_id) : null;
            if (!renewedActiveToken || !renewedActiveUser) throw new AppError(403, "FormatJWT");

            if (cookieToken && refreshToken && payload.exp && payload.exp * 1000 - Date.now() < 15 * 60 * 1000) {
                token = await this.renewSession(refreshToken, token, res) ?? token;
                payload = jwt.verify(token, AuthToken.secretKey) as jwt.JwtPayload;
            }
            req.user = payload;
            req.authenticatedAccessToken = token;

            // Pasamos al siguiente middleware
            next();
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            };
            throw new AppError(403, "FormatJWT");
        };
    };

    public static async isModerator(req: Request, res: Response, next: NextFunction) {
        try {
            // Verifica si el token ha sido validado
            if (!req.user || !req.user.user_id) throw new AppError(403, 'MissingAuthentication');

            // Busca el usuario en la base de datos
            const user = await User.findOne({ where: { user_id: req.user.user_id } });

            // Si el usuario no existe o no es admin, lanza error
            if (!user || !user.is_moderator) throw new AppError(403, "NoAdmin");

            // Pasa al siguiente middleware si el usuario es admin
            next();
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            };
            next(new AppError(403, 'AdminPrivilegeVerificationFailed'));
        };
    };
};
