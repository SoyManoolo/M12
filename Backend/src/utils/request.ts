import { AppError } from '../middlewares/errors/AppError';

export function getRequiredRouteParam(value: string | string[] | undefined, name: string): string {
    if (typeof value !== 'string' || value.length === 0) {
        throw new AppError(400, `Invalid route parameter: ${name}`);
    }

    return value;
}

export function getOptionalRouteParam(value: string | string[] | undefined): string | undefined {
    return typeof value === 'string' ? value : undefined;
}
