import express from "express";
import { Request, Response, NextFunction } from 'express';
import { ChatController } from "../controllers/chat";
import { ChatService } from "../services/chat";

const router = express.Router();
const chatService = new ChatService();
const chatController = new ChatController(chatService);

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    await chatController.getMessages(req, res, next);
});

export default router;