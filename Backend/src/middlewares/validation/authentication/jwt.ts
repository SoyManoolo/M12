// Middleware para generacion de tokern y validación

import jwt from "jsonwebtoken";
import { User } from "../../../models";
import { Request, Response, NextFunction } from "express";
import { AppError } from "../../errors/AppError";


export class AuthToken {

    private static secretKey: string = process.env.JWT_SECRET as string;

    // Comprobamos si existe la clave secreta
    static {
        if (!this.secretKey) {
            throw new AppError(404, "MissingJwtSecret");
        };
    };

    public generateToken(user: User): string {
        // Generamos un token con el id y el dni del usuario
        return jwt.sign({
            id: user.dataValues.user_id,
        },
            AuthToken.secretKey,
            { expiresIn: 3600 }
        );
    };

    public static verifyToken(req: Request, res: Response, next: NextFunction): void {
        // Comprobamos si existe el token
        const authHeader = req.headers['authorization'];

        // Si no existe el token o no es un string devolvemos un error
        if (!authHeader || typeof authHeader !== 'string') throw new AppError(403, "MissingJWT");

        // Si existe el token lo extraemos
        const token = authHeader.split(' ')[1];

        // Si no existe el token devolvemos un error
        if (!token) throw new AppError(403, "FormatJWT");

        try {
            // Verificamos el token y lo guardamos en req.user
            req.user = jwt.verify(token, AuthToken.secretKey) as jwt.JwtPayload;

            // Pasamos al siguiente middleware
            next();
        } catch (error) {
            throw new AppError(403, "FormatJWT");
        };
    };

    public static async isModerator(req: Request, res: Response, next: NextFunction) {
        try {
            // Verifica si el token ha sido validado
            if (!req.user || !req.user.id) throw new AppError(403, "Missing authentication. Please provide a valid token");

            // Busca el usuario en la base de datos
            const user = await User.findOne({ where: { user_id: req.user.id } });

            // Si el usuario no existe o no es admin, lanza error
            if (!user || !user.dataValues.is_moderator !== true) throw new AppError(403, "NoAdmin");

            // Pasa al siguiente middleware si el usuario es admin
            next();
        } catch (error) {
            next(new AppError(403, "Error verifying admin privileges"));
        };
    };
};