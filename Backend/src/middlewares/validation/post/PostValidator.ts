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
            }).min(1)
        })(req, res, next);
    };

    public PostIdValidator(req: Request, res: Response, next: NextFunction) {
        return celebrate({
            [Segments.PARAMS]: Joi.object({ id: Joi.string().uuid().required() }),
            [Segments.QUERY]: Joi.object({
                limit: Joi.number().integer().min(1).max(50),
                cursor: Joi.string().uuid(),
                username: Joi.string().min(1).max(50)
            }).unknown(true)
        })(req, res, next);
    }
};
