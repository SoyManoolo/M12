import { Request, Response, NextFunction } from 'express';
import i18n from '../config/i18n';
import { ChatService } from '../services/chat';
import { AppError } from '../middlewares/errors/AppError';
import dbLogger from '../config/logger';

export class ChatController {
    constructor(private readonly chatService: ChatService) {};

    public async getUserChats(req: Request, res: Response, next: NextFunction) {
        try {
            dbLogger.info(`[ChatController] Request to get user chats: ${req.user?.user_id}`);

            // Elegir el locale del header 'accept-language' o por defecto 'en' para el idioma de la respuesta
            const locale = req.headers['accept-language'] || 'en';
            i18n.setLocale(locale);

            // Verificar si el usuario está autenticado
            if (!req.user?.user_id) {
                throw new AppError(401, 'Unauthorized');
            }

            // Obtener el ID del usuario autenticado
            const user_id = req.user.user_id;
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
            dbLogger.info(`[ChatController] Request to get messages for user: ${req.user?.user_id}`);

            // Elegir el locale del header 'accept-language' o por defecto 'en' para el idioma de la respuesta
            const locale = req.headers['accept-language'] || 'en';
            i18n.setLocale(locale);

            // Verificar si el usuario está autenticado
            if (!req.user?.user_id) {
                throw new AppError(401, 'Unauthorized');
            }

            // Obtener el ID del usuario autenticado y los parámetros de la consulta
            const sender_id = req.user.user_id;
            const { receiver_id } = req.query;
            const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
            const cursor = req.query.cursor as string | undefined;

            // Validar que se haya proporcionado el ID del receptor
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
            dbLogger.info(`[ChatController] Request to create message for user: ${req.user?.user_id}`);

            // Elegir el locale del header 'accept-language' o por defecto 'en' para el idioma de la respuesta
            const locale = req.headers['accept-language'] || 'en';
            i18n.setLocale(locale);

            // Verificar si el usuario está autenticado
            if (!req.user?.user_id) {
                throw new AppError(401, 'Unauthorized');
            }

            // Obtener el ID del usuario autenticado y los datos del mensaje
            const sender_id = req.user.user_id;
            const { receiver_id, content } = req.body;

            // Validar que se hayan proporcionado los campos necesarios
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
            dbLogger.info(`[ChatController] Request to delete message with ID: ${req.params.message_id} for user: ${req.user?.user_id}`);

            // Elegir el locale del header 'accept-language' o por defecto 'en' para el idioma de la respuesta
            const locale = req.headers['accept-language'] || 'en';
            i18n.setLocale(locale);

            // Verificar si el usuario está autenticado
            if (!req.user?.user_id) {
                throw new AppError(401, 'Unauthorized');
            }

            // Obtener el ID del mensaje a eliminar
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
            dbLogger.info(`[ChatController] Request to mark message as delivered with ID: ${req.params.message_id} for user: ${req.user?.user_id}`);

            // Elegir el locale del header 'accept-language' o por defecto 'en' para el idioma de la respuesta
            const locale = req.headers['accept-language'] || 'en';
            i18n.setLocale(locale);

            // Verificar si el usuario está autenticado
            if (!req.user?.user_id) {
                throw new AppError(401, 'Unauthorized');
            }

            // Obtener el ID del mensaje a marcar como entregado
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
            dbLogger.info(`[ChatController] Request to mark message as read with ID: ${req.params.message_id} for user: ${req.user?.user_id}`);

            // Elegir el locale del header 'accept-language' o por defecto 'en' para el idioma de la respuesta
            const locale = req.headers['accept-language'] || 'en';
            i18n.setLocale(locale);

            // Verificar si el usuario está autenticado
            if (!req.user?.user_id) {
                throw new AppError(401, 'Unauthorized');
            }

            // Obtener el ID del mensaje a marcar como leído
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