import { Request, Response, NextFunction } from 'express';
import i18n from '../config/i18n';
import { ChatService } from '../services/chat';
import { AppError } from '../middlewares/errors/AppError';

export class ChatController {
    constructor(private readonly chatService: ChatService) {};

    public async getMessages(req: Request, res: Response, next: NextFunction) {
        try {
            // Guarda el idioma en la variable locale y lo asigna a i18n
            const locale = req.headers['accept-language'] || 'en';
            i18n.setLocale(locale);

            // Verifica si el usuario está autenticado
            if (!req.user?.id) {
                throw new AppError(401, 'Unauthorized');
            }

            // Guarda la informacion de los usuarios del chat
            const sender_id = req.user.id;
            const { receiver_id } = req.query;
            const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
            const cursor = req.query.cursor as string | undefined;

            if (!receiver_id) {
                throw new AppError(400, 'ReceiverIdRequired');
            }

            // Llama al servicio para obtener los mensajes del chat
            const messages = await this.chatService.getMessages(sender_id, receiver_id as string, limit, cursor);

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
}