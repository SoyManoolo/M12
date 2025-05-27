import { celebrate, Joi, Segments } from "celebrate";
import { Request, Response, NextFunction } from "express";

export class AuthValidation {
    // Validación de los datos de inicio de sesión
    public loginValidation(req: Request, res: Response, next: NextFunction) {
        return celebrate({
            [Segments.BODY]: Joi.object({
                id: Joi.string()
                    .required()
                    .messages({
                        'string.empty': 'errors.validation.MissingIdentifier',
                        'any.required': 'errors.validation.MissingIdentifier'
                    }),
                password: Joi.string()
                    .required()
                    .messages({
                        'string.empty': 'errors.validation.MissingPassword',
                        'any.required': 'errors.validation.MissingPassword'
                    })
            })
        })(req, res, next);
    };

    // Validación de los datos de registro
    public registerValidation(req: Request, res: Response, next: NextFunction) {
        // Regex para contraseña segura: al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.#])[A-Za-z\d@$!%*?&.#]{8,}$/;

        return celebrate({
            [Segments.BODY]: Joi.object({
                email: Joi.string()
                    .email()
                    .required()
                    .messages({
                        'string.empty': 'errors.validation.MissingEmail',
                        'any.required': 'errors.validation.MissingEmail'
                    }),
                username: Joi.string()
                    .required()
                    .messages({
                        'string.empty': 'errors.validation.MissingUsername',
                        'any.required': 'errors.validation.MissingUsername'
                    }),
                name: Joi.string()
                    .required()
                    .messages({
                        'string.empty': 'errors.validation.MissingName',
                        'any.required': 'errors.validation.MissingName'
                    }),
                surname: Joi.string()
                    .required()
                    .messages({
                        'string.empty': 'errors.validation.MissingSurname',
                        'any.required': 'errors.validation.MissingSurname'
                    }),
                password: Joi.string()
                    .pattern(passwordRegex)
                    .required()
                    .messages({
                        'string.empty': 'errors.validation.MissingPassword',
                        'any.required': 'errors.validation.MissingPassword',
                        'string.pattern.base': 'errors.validation.InsecurePassword'
                    })
            })
        })(req, res, next);
    }
}