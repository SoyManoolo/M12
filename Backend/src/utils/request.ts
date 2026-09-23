import { AppError } from '../middlewares/errors/AppError';

export function getRequiredRouteParam(value: string | string[] | undefined, name: string): string {
    if (typeof value !== 'string' || value.length === 0) {
        throw new AppError(400, 'InvalidRouteParameter');
    }

    return value;
}

export function getOptionalRouteParam(value: string | string[] | undefined): string | undefined {
    return typeof value === 'string' ? value : undefined;
}

export function getAuthenticatedUserId(req: Express.Request): string {
    const userId = req.user?.user_id;
    if (typeof userId !== 'string' || userId.length === 0) {
        throw new AppError(401, 'Unauthorized');
    }
    return userId;
}
