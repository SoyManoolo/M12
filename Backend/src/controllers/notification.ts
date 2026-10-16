import { Request, Response, NextFunction } from 'express';
import { notificationService } from '../services/notification';
import { getAuthenticatedUserId, getRequiredRouteParam } from '../utils/request';
import { AppError } from '../middlewares/errors/AppError';

function notificationId(value: string | string[] | undefined): string {
    const id = getRequiredRouteParam(value, 'notification_id');
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
        throw new AppError(400, 'InvalidRouteParameter');
    }
    return id;
}

export const notificationController = {
    async list(req: Request, res: Response, next: NextFunction) {
        try {
            res.json({ success: true, data: await notificationService.list(getAuthenticatedUserId(req)) });
        } catch (error) { next(error); }
    },
    async markRead(req: Request<{ notification_id?: string }>, res: Response, next: NextFunction) {
        try {
            await notificationService.markRead(getAuthenticatedUserId(req), notificationId(req.params.notification_id));
            res.json({ success: true });
        } catch (error) { next(error); }
    },
    async markAllRead(req: Request, res: Response, next: NextFunction) {
        try {
            await notificationService.markAllRead(getAuthenticatedUserId(req));
            res.json({ success: true });
        } catch (error) { next(error); }
    },
    async remove(req: Request<{ notification_id?: string }>, res: Response, next: NextFunction) {
        try {
            await notificationService.remove(getAuthenticatedUserId(req), notificationId(req.params.notification_id));
            res.status(204).send();
        } catch (error) { next(error); }
    }
};
