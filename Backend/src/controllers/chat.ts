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
            const { receiver_id } = req.body;

            // Llama al servicio para obtener los mensajes del chat
            const messages = await this.chatService.getMessages(sender_id, receiver_id);

        } catch (error) {
            next(error);
        }
    }
}