// Middleware para manejo de errores

import { NextFunction, Request, Response } from "express";
import { isCelebrateError } from "celebrate";
import { AppError } from "./AppError";
import { StatusCodes } from "http-status-codes";
import { errorMessages } from "./errorMessages";

export class AppErrorHandler {
    public static errorHandler(error: Error, req: Request, res: Response, next: NextFunction) {
        let status = StatusCodes.INTERNAL_SERVER_ERROR;
        let message = "Error interno del servidor";

        //  Manejo de errores personalizados con AppError
        if (error instanceof AppError) {
            status = error.status;
            message = errorMessages[error.type] || error.type;
        }

        //  Manejo de errores de validación de celebrate
        if (isCelebrateError(error)) {
            const validationErrors = Array.from(error.details.values())
                .flatMap(detail => detail.details.map(d => d.message));

            return res.status(400).json({
                success: false,
                status: 400,
                message: errorMessages["ValidationError"],
                errors: validationErrors
            });
        }

        return res.status(status).json({
            success: false,
            status,
            message
        });
    }
}