import { ChatMessages } from "../models/ChatMessages";
import { User } from "../models/User";
import { AppError } from "../middlewares/errors/AppError";

export class ChatService {
    // Método para crear un nuevo mensaje
    public async createMessage(sender_id: string, receiver_id: string, content: string) {
        try {
            const message = await ChatMessages.create({
                sender_id,
                receiver_id,
                content
            });

            if (!message) throw new AppError(400, 'MessageNotCreated');

            return message;

        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError(500, 'InternalServerError');
        }
    }

    // Método para obtener los mensajes de un chat
    public async getMessages(sender_id: string, receiver_id: string) {
        try {

        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError(500, 'InternalServerError');
        }
    }

    // Método para editar un mensaje
    public async updateMessage(message_id: string, content: string) {
        try {

        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError(500, 'InternalServerError');
        }
    }

    // Método para eliminar un mensaje
    public async deleteMessage(message_id: string) {
        try {
            const message = await ChatMessages.destroy(
                {
                    where: {
                        message_id
                    }
                }
            );

            if (!message) throw new AppError(404, 'MessageNotFound');

            return message;

        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError(500, 'InternalServerError');
        }
    }
}