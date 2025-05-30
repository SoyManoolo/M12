import { celebrate, Joi, Segments } from "celebrate";
import { Request, Response, NextFunction } from "express";

export class UserValidator {
    // Para rutas con ID en el path
    public IdValidator(req: Request, res: Response, next: NextFunction) {
        return celebrate({
            [Segments.PARAMS]: Joi.object({
                id: Joi.string().uuid().required()
            })
        })(req, res, next);
    };

    // Para rutas con username en el query
    public UsernameValidator(req: Request, res: Response, next: NextFunction) {
        return celebrate({
            [Segments.QUERY]: Joi.object({
                username: Joi.string().required()
            }).unknown(true)
        })(req, res, next);
    };

    public updateUserValidator(req: Request, res: Response, next: NextFunction) {
        // Regex para contraseña segura: al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.#])[A-Za-z\d@$!%*?&.#]{8,}$/;

        return celebrate({
            [Segments.BODY]: Joi.object().keys({
                username: Joi.string().min(3).max(50),
                email: Joi.string().email(),
                name: Joi.string().min(1).max(100),
                surname: Joi.string().min(1).max(100),
                password: Joi.string().min(8).pattern(passwordRegex)
                    .message('La contraseña debe tener al menos 8 caracteres, incluir mayúsculas, minúsculas, números y caracteres especiales (@, $, !, %, *, ?, &, ., #)'),
                bio: Joi.string(),
            }).min(1) // Requiere al menos un campo
        })(req, res, next);
    }
}