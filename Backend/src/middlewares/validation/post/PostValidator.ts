import { celebrate, Joi, Segments } from "celebrate";
import { Request, Response, NextFunction } from "express";

export class PostValidator {
    // Validator for creating a post
    public CreatePostValidator(req: Request, res: Response, next: NextFunction) {
        return celebrate({
            [Segments.BODY]: Joi.object({
                description: Joi.string().required(),
                imageUrl: Joi.string().uri().optional()
            })
        })(req, res, next);
    };

    // Validator for updating a post
    public UpdatePostValidator(req: Request, res: Response, next: NextFunction) {
        return celebrate({
            [Segments.PARAMS]: Joi.object({
                id: Joi.string().uuid().required()
            }),
            [Segments.BODY]: Joi.object({
                description: Joi.string().optional(),
                imageUrl: Joi.string().uri().optional()
            })
        })(req, res, next);
    };
};