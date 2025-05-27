import { celebrate, Joi, Segments } from "celebrate";
import { Request, Response, NextFunction } from "express";

export class UpdateValidation {
    public updateUserValidator(req: Request, res: Response, next: NextFunction) {
        return celebrate({
            [Segments.BODY]: Joi.object().keys({
                username: Joi.string().min(3).max(50),
                email: Joi.string().email(),
                password: Joi.string().min(6),
                bio: Joi.string(),
            }).min(1) // Requiere al menos un campo
        }) (req, res, next);
    };
};