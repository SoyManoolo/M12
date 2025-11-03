import express from "express";
import { Request, Response, NextFunction } from 'express';
import { ChatController } from "../controllers/chat";
import { ChatService } from "../services/chat";
import { AuthToken } from "../middlewares/validation/authentication/jwt";

const router = express.Router();
const chatService = new ChatService();
const chatController = new ChatController(chatService);

// Obtener lista de chats del usuario
router.get('/list', AuthToken.verifyToken, async (req: Request, res: Response, next: NextFunction) => {
    await chatController.getUserChats(req, res, next);
});

// Obtener mensajes entre dos usuarios
router.get('/', AuthToken.verifyToken, async (req: Request, res: Response, next: NextFunction) => {
    await chatController.getMessages(req, res, next);
});

// Crear un nuevo mensaje
router.post('/', AuthToken.verifyToken, async (req: Request, res: Response, next: NextFunction) => {
    await chatController.createMessage(req, res, next);
});

// Eliminar un mensaje
router.delete('/:message_id', AuthToken.verifyToken, async (req: Request, res: Response, next: NextFunction) => {
    await chatController.deleteMessage(req, res, next);
});

// Marcar mensaje como entregado
router.post('/:message_id/delivered', AuthToken.verifyToken, async (req: Request, res: Response, next: NextFunction) => {
    await chatController.markMessageAsDelivered(req, res, next);
});

// Marcar mensaje como leído
router.post('/:message_id/read', AuthToken.verifyToken, async (req: Request, res: Response, next: NextFunction) => {
    await chatController.markMessageAsRead(req, res, next);
});

export default router;