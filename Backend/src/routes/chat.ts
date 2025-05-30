import express from "express";
import { Request, Response, NextFunction } from 'express';
import { ChatController } from "../controllers/chat";
import { ChatService } from "../services/chat";
import { AuthToken } from "../middlewares/validation/authentication/jwt";
import dbLogger from "../config/logger";

const router = express.Router();
const chatService = new ChatService();
const chatController = new ChatController(chatService);

// Obtener lista de chats del usuario
router.get('/list', AuthToken.verifyToken, async (req: Request, res: Response, next: NextFunction) => {
    dbLogger.info(`[ChatRouter] Request to get user chats: ${req.user?.user_id}`);
    await chatController.getUserChats(req, res, next);
});

// Obtener mensajes entre dos usuarios
router.get('/', AuthToken.verifyToken, async (req: Request, res: Response, next: NextFunction) => {
    dbLogger.info(`[ChatRouter] Request to get messages for user: ${req.user?.user_id}`);
    await chatController.getMessages(req, res, next);
});

// Crear un nuevo mensaje
router.post('/', AuthToken.verifyToken, async (req: Request, res: Response, next: NextFunction) => {
    dbLogger.info(`[ChatRouter] Request to create message for user: ${req.user?.user_id}`);
    await chatController.createMessage(req, res, next);
});

// Eliminar un mensaje
router.delete('/:message_id', AuthToken.verifyToken, async (req: Request, res: Response, next: NextFunction) => {
    dbLogger.info(`[ChatRouter] Request to delete message with ID: ${req.params.message_id} for user: ${req.user?.user_id}`);
    await chatController.deleteMessage(req, res, next);
});

// Marcar mensaje como entregado
router.post('/:message_id/delivered', AuthToken.verifyToken, async (req: Request, res: Response, next: NextFunction) => {
    dbLogger.info(`[ChatRouter] Request to mark message as delivered with ID: ${req.params.message_id} for user: ${req.user?.user_id}`);
    await chatController.markMessageAsDelivered(req, res, next);
});

// Marcar mensaje como leído
router.post('/:message_id/read', AuthToken.verifyToken, async (req: Request, res: Response, next: NextFunction) => {
    dbLogger.info(`[ChatRouter] Request to mark message as read with ID: ${req.params.message_id} for user: ${req.user?.user_id}`);
    await chatController.markMessageAsRead(req, res, next);
});

export default router;