import { Request, Response, NextFunction } from 'express';
import { celebrate, Joi, Segments } from 'celebrate';

// Modificar los mensajes devueltos por el middleware para que el manejo de errores lo maneje
export class CommentValidation {
    public validateComment = (req: Request, res: Response, next: NextFunction) => {
        return celebrate({
            [Segments.BODY]: Joi.object().keys({
                post_id: Joi.string().uuid().required().messages({
                    'string.base': 'PostId must be a string',
                    'string.uuid': 'PostId must be a valid UUID',
                    'any.required': 'PostId is required'
                }),
                content: Joi.string().max(1000).required().messages({
                    'string.base': 'Content must be a string',
                    'string.max': 'Content cannot exceed 1000 characters',
                    'any.required': 'Content is required',
                    'string.empty': 'Content cannot be empty'
                })
            })
        }) (req, res, next);
    };

    public validatePostId = celebrate({
        [Segments.PARAMS]: Joi.object({
            postId: Joi.string().uuid().required()
        })
    });

    public validateCommentId = celebrate({
        [Segments.PARAMS]: Joi.object({
            commentId: Joi.string().uuid().required()
        })
    });

    public validatePagination = celebrate({
        [Segments.QUERY]: Joi.object({
            offset: Joi.number().integer().min(0).default(0),
            limit: Joi.number().integer().min(1).max(25).default(10)
        }).unknown(true)
    });
}
