import { NextFunction, Request, Response } from "express";
import { isCelebrateError } from "celebrate";
import i18n from "../../config/i18n";

// Middleware que captura y procesa errores de Celebrate (Joi)

export const celebrateErrorHandler = (error: any, req: Request, res: Response, next: NextFunction) => {
    // Verifica si el error es un error de Celebrate; si no, pasa al siguiente manejador
    if (!isCelebrateError(error)) return next(error);

    // Obtiene el idioma preferido del cliente desde las cabeceras, o usa español por defecto
    const locale = req.headers['accept-language'] || 'es';
    i18n.setLocale(locale);

    /**
     * Función auxiliar que traduce nombres de campos usando el sistema i18n
     * @param fieldName - Nombre del campo a traducir
     * @returns El nombre traducido del campo si existe la traducción, o el nombre original
     */
    const translateField = (fieldName: string): string => {
        const translated = i18n.__({ phrase: `errors.field.${fieldName}`, locale });
        return translated !== `errors.field.${fieldName}` ? translated : fieldName;
    };

    /**
     * Extrae los errores de validación del objeto error de Celebrate
     * Actualmente solo maneja errores de tipo "any.required" (campo obligatorio)
     * y filtra cualquier resultado nulo
     */
    const validationErrors = Array.from(error.details.values())
        .flatMap(detail => detail.details.map(d => {
            if (d.type === 'any.required') {
                // Traduce el nombre del campo
                const fieldTranslated = translateField(d.context?.key || 'campo');
                // Obtiene el mensaje de error traducido y reemplaza el marcador de posición
                const message = i18n.__({ phrase: 'errors.validation.fieldRequired', locale });
                return message.replace('{field}', fieldTranslated);
            }
            return null;
        }).filter(Boolean));

    // Obtiene el mensaje general de error de validación traducido
    const validationErrorMsg = i18n.__({ phrase: 'errors.validation.ValidationError', locale });

    // Devuelve una respuesta con estado 400 y un objeto JSON estandarizado con los errores
    return res.status(400).json({
        success: false,
        status: 400,
        message: validationErrorMsg,
        errors: validationErrors
    });
};