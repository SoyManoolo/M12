import { Request, Response, NextFunction } from 'express';
import { NotificationService } from '../services/notification.service';
import dbLogger from '../config/logger';

export class NotificationController {
    private notificationService: NotificationService;

    constructor(notificationService: NotificationService) {
        this.notificationService = notificationService;
    }

    async getUserNotifications(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.user_id;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuario no autenticado'
                });
            }

            const result = await this.notificationService.getUserNotifications(userId);
            if (!result.success) {
                return res.status(500).json(result);
            }

            return res.json(result);
        } catch (error: unknown) {
            dbLogger.error('[NotificationController] Error getting user notifications:', error as object);
            next(error);
        }
    }

    async markNotificationAsRead(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.user_id;
            const { notificationId } = req.params;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuario no autenticado'
                });
            }

            const result = await this.notificationService.markNotificationAsRead(userId, notificationId);
            if (!result.success) {
                return res.status(400).json(result);
            }

            return res.json(result);
        } catch (error: unknown) {
            dbLogger.error('[NotificationController] Error marking notification as read:', error as object);
            next(error);
        }
    }

    async handleFriendRequest(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.user_id;
            const { requestId } = req.params;
            const { action } = req.body;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuario no autenticado'
                });
            }

            if (!['accept', 'reject'].includes(action)) {
                return res.status(400).json({
                    success: false,
                    message: 'Acción no válida. Debe ser "accept" o "reject"'
                });
            }

            const result = await this.notificationService.handleFriendRequest(userId, requestId, action as 'accept' | 'reject');
            if (!result.success) {
                return res.status(400).json(result);
            }

            return res.json(result);
        } catch (error: unknown) {
            dbLogger.error('[NotificationController] Error handling friend request:', error as object);
            next(error);
        }
    }
} 