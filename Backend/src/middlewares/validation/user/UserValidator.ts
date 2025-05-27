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
};