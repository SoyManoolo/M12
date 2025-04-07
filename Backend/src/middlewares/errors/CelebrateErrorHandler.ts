import { NextFunction, Request, Response } from "express";
import { isCelebrateError } from "celebrate";
import i18n from "../../config/i18n";

export const celebrateErrorHandler = (error: any, req: Request, res: Response, next: NextFunction) => {
    if (!isCelebrateError(error)) return next(error);

    const locale = req.headers['accept-language'] || 'es';
    i18n.setLocale(locale);

    const translateField = (fieldName: string): string => {
        try {
            const translated = i18n.__({ phrase: `errors.field.${fieldName}`, locale });
            return translated !== `errors.field.${fieldName}` ? translated : fieldName;
        } catch (error) {
            console.warn(`Translation error for field: ${fieldName}`, error);
            return fieldName;
        }
    };

    const getTranslatedMessage = (key: string, field?: string): string => {
        try {
            const message = i18n.__({ phrase: key, locale });
            return field ? message?.replace('{field}', field) : message;
        } catch (error) {
            console.warn(`Translation error for key: ${key}`, error);
            return field ? `The field ${field} is required` : 'Validation error occurred';
        }
    };

    try {
        const validationErrors = Array.from(error.details.values())
            .flatMap(detail => detail.details.map(d => {
                switch (d.type) {
                    case 'any.required': {
                        const fieldTranslated = translateField(d.context?.key || 'campo');
                        return getTranslatedMessage('errors.validation.fieldRequired', fieldTranslated);
                    }
                    case 'string.empty': {
                        const fieldTranslated = translateField(d.context?.key || 'campo');
                        return getTranslatedMessage('errors.validation.fieldEmpty', fieldTranslated);
                    }
                    case 'string.min': {
                        const fieldTranslated = translateField(d.context?.key || 'campo');
                        return getTranslatedMessage('errors.validation.stringMin', fieldTranslated);
                    }
                    case 'string.max': {
                        const fieldTranslated = translateField(d.context?.key || 'campo');
                        return getTranslatedMessage('errors.validation.stringMax', fieldTranslated);
                    }
                    case 'string.email': {
                        return getTranslatedMessage('errors.validation.invalidEmail');
                    }
                    default: {
                        console.warn(`Unhandled validation type: ${d.type}`);
                        return getTranslatedMessage('errors.validation.generic');
                    }
                }
            }).filter(Boolean));

        const validationErrorMsg = getTranslatedMessage('errors.validation.ValidationError');

        return res.status(400).json({
            success: false,
            status: 400,
            message: validationErrorMsg,
            errors: validationErrors
        });
    } catch (err) {
        console.error('Unexpected error in celebrate error handler:', err);
        return res.status(500).json({
            success: false,
            status: 500,
            message: getTranslatedMessage('errors.internal'),
            errors: ['Internal server error']
        });
    }
};