import express from "express";
import { Request, Response, NextFunction } from 'express';
import { NotificationController } from "../controllers/notification.controller";
import { NotificationService } from "../services/notification.service";
import { AuthToken } from "../middlewares/validation/authentication/jwt";
import dbLogger from "../config/logger";

const router = express.Router();
const notificationService = new NotificationService();
const notificationController = new NotificationController(notificationService);

// Obtener notificaciones del usuario
router.get('/', AuthToken.verifyToken, async (req: Request, res: Response, next: NextFunction) => {
    dbLogger.info(`[NotificationRouter] Request to get notifications for user: ${req.user?.user_id}`);
    await notificationController.getUserNotifications(req, res, next);
});

// Marcar notificación como leída
router.post('/:notificationId/read', AuthToken.verifyToken, async (req: Request, res: Response, next: NextFunction) => {
    dbLogger.info(`[NotificationRouter] Request to mark notification as read: ${req.params.notificationId} for user: ${req.user?.user_id}`);
    await notificationController.markNotificationAsRead(req, res, next);
});

// Manejar solicitud de amistad (aceptar/rechazar)
router.post('/friend-request/:requestId', AuthToken.verifyToken, async (req: Request, res: Response, next: NextFunction) => {
    dbLogger.info(`[NotificationRouter] Request to handle friend request: ${req.params.requestId} for user: ${req.user?.user_id}`);
    await notificationController.handleFriendRequest(req, res, next);
});

export default router;