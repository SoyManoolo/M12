import { celebrate, Joi, Segments } from "celebrate";
import { Request, Response, NextFunction } from "express";

// Validación de los datos de inicio de sesión
export function loginValidation(req: Request, res: Response, next: NextFunction) {
    return celebrate({
        [Segments.BODY]: Joi.object({
            
        })
    })(req, res, next);
};