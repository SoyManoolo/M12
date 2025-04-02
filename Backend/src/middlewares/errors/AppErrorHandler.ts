import { NextFunction, Request, Response } from "express";
import { isCelebrateError } from "celebrate";
import { AppError } from "./AppError";
import i18n from "../../config/i18n";

export class AppErrorHandler {
    public static errorHandler(error: Error, req: Request, res: Response, next: NextFunction) {
        let status = 500;
        let message = "Internal Server Error";

        // Obtener el idioma de los headers o usar el predeterminado
        const lang = req.headers["accept-language"] || "es";
        i18n.setLocale(lang);

        // Manejo de errores personalizados con AppError
        if (error instanceof AppError) {
            status = error.status;

            // Intentar encontrar la traducción del error siguiendo una jerarquía
            // Primero buscamos en categorías específicas (user, registry, auth, etc.)
            const errorCategories = ['validation', 'jwt', 'user', 'registry', 'status', 'connection'];
            let translatedMessage = null;

            // Intentar encontrar la traducción en cada categoría
            for (const category of errorCategories) {
                const translation = i18n.__(`errors.${category}.${error.type}`);
                // Si la traducción existe y no es igual a la clave (lo que indicaría que no se encontró)
                if (translation && translation !== `errors.${category}.${error.type}`) {
                    translatedMessage = translation;
                    break;
                };
            };

            // Si no se encontró en categorías específicas, intentar directamente en errors
            if (!translatedMessage) {
                translatedMessage = i18n.__(`errors.${error.type}`);
                // Si aún no hay traducción, usar el tipo de error como fallback
                if (translatedMessage === `errors.${error.type}`) {
                    translatedMessage = error.type;
                };
            };
            message = translatedMessage;
        };

        // Manejo de errores de validación de celebrate
        if (isCelebrateError(error)) {
            const validationErrors = Array.from(error.details.values())
                .flatMap(detail => detail.details.map(d => {
                    // Intentar traducir cada mensaje de error de validación
                    const translatedMessage = i18n.__(`errors.validation.${d.message}`);
                    return translatedMessage !== `errors.validation.${d.message}` ? 
                           translatedMessage : d.message;
                }));

            return res.status(400).json({
                success: false,
                status: 400,
                message: i18n.__('errors.validation.ValidationError') || 'Validation Error',
                errors: validationErrors
            });
        };

        return res.status(status).json({
            success: false,
            status,
            message
        });
    };
};