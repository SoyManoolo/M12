// Middleware para generacion de tokern y validación

import jwt from "jsonwebtoken";
import { User } from "../../../models";
import { RefreshToken } from "../../../models";
import { Op } from "sequelize";
import { Request, Response, NextFunction } from "express";
import { AppError } from "../../errors/AppError";
import { env } from './../../../config/env'


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
        },
            AuthToken.secretKey,
            { expiresIn: 3600 }
        );
    };

    public static async verifyToken(req: Request, res: Response, next: NextFunction): Promise<void> {
        // Comprobamos si existe el token
        const authHeader: string | undefined = req.headers['authorization'];

        // Si no existe el token o no es un string devolvemos un error
        if (!authHeader || typeof authHeader !== 'string') throw new AppError(403, "MissingJWT");

        // Si existe el token lo extraemos
        const token: string = authHeader.split(' ')[1];

        // Si no existe el token devolvemos un error
        if (!token) throw new AppError(403, "FormatJWT");

        try {
            // Verificamos el token y lo guardamos en req.user
            const payload = jwt.verify(token, AuthToken.secretKey) as jwt.JwtPayload;
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

            if (!activeToken || !activeUser) throw new AppError(403, "FormatJWT");
            req.user = payload;

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
