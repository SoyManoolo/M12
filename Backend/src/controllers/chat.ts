import { Request, Response, NextFunction } from 'express';
import i18n from '../config/i18n';
import { ChatService } from '../services/chat';
import { AppError } from '../middlewares/errors/AppError';

export class ChatController {
    constructor(private readonly chatService: ChatService) {};

    public async getUserChats(req: Request, res: Response, next: NextFunction) {
        try {
            const locale = req.headers['accept-language'] || 'en';
            i18n.setLocale(locale);

            if (!req.user?.id) {
                throw new AppError(401, 'Unauthorized');
            }

            const user_id = req.user.id;
            const chats = await this.chatService.getUserChats(user_id);

            res.status(200).json({
                success: true,
                data: chats
            });
        } catch (error) {
            next(error);
        }
    }

    public async getMessages(req: Request, res: Response, next: NextFunction) {
        try {
            const locale = req.headers['accept-language'] || 'en';
            i18n.setLocale(locale);

            if (!req.user?.id) {
                throw new AppError(401, 'Unauthorized');
            }

            const sender_id = req.user.id;
            const { receiver_id } = req.query;
            const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
            const cursor = req.query.cursor as string | undefined;

            if (!receiver_id) {
                throw new AppError(400, 'ReceiverIdRequired');
            }

            const messages = await this.chatService.getMessages(sender_id, receiver_id as string, limit, cursor);

            // Marcar mensajes como leídos
            await this.chatService.markMessagesAsRead(receiver_id as string, sender_id);

            res.status(200).json({
                success: true,
                data: messages
            });
        } catch (error) {
            next(error);
        }
    }

    public async createMessage(req: Request, res: Response, next: NextFunction) {
        try {
            const locale = req.headers['accept-language'] || 'en';
            i18n.setLocale(locale);

            if (!req.user?.id) {
                throw new AppError(401, 'Unauthorized');
            }

            const sender_id = req.user.id;
            const { receiver_id, content } = req.body;

            if (!receiver_id || !content) {
                throw new AppError(400, 'MissingRequiredFields');
            }

            const message = await this.chatService.createMessage(sender_id, receiver_id, content);

            res.status(201).json({
                success: true,
                data: message
            });
        } catch (error) {
            next(error);
        }
    }

    public async deleteMessage(req: Request, res: Response, next: NextFunction) {
        try {
            const locale = req.headers['accept-language'] || 'en';
            i18n.setLocale(locale);

            if (!req.user?.id) {
                throw new AppError(401, 'Unauthorized');
            }

            const { message_id } = req.params;

            const result = await this.chatService.deleteMessage(message_id);

            res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    public async markMessageAsDelivered(req: Request, res: Response, next: NextFunction) {
        try {
            const locale = req.headers['accept-language'] || 'en';
            i18n.setLocale(locale);

            if (!req.user?.id) {
                throw new AppError(401, 'Unauthorized');
            }

            const { message_id } = req.params;
            const message = await this.chatService.markMessageAsDelivered(message_id);

            res.status(200).json({
                success: true,
                data: message
            });
        } catch (error) {
            next(error);
        }
    }

    public async markMessageAsRead(req: Request, res: Response, next: NextFunction) {
        try {
            const locale = req.headers['accept-language'] || 'en';
            i18n.setLocale(locale);

            if (!req.user?.id) {
                throw new AppError(401, 'Unauthorized');
            }

            const { message_id } = req.params;
            const message = await this.chatService.markMessageAsRead(message_id);

            res.status(200).json({
                success: true,
                data: message
            });
        } catch (error) {
            next(error);
        }
    }
}