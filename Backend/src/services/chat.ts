import { ChatMessages } from "../models";
import { AppError } from "../middlewares/errors/AppError";
import { Op } from "sequelize";
import { existCommentChat } from "../utils/modelExists";

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
    public async getMessages(sender_id: string, receiver_id: string, limit: number = 20, cursor?: string) {
        try {
            const queryOptions: any = {
                limit: limit + 1,
                order: [['createdAt', 'DESC']]
            };

            if (cursor) {
                const lastMessage = await ChatMessages.findByPk(cursor);
                if (lastMessage) {
                    queryOptions.where = {
                        createdAt: {
                            [Op.lt]: lastMessage.dataValues.createdAt // Obtenemos mensajes más antiguos que el cursor
                        }
                    };
                };
            };

            const messages = await ChatMessages.findAll({...queryOptions,
                where: {
                    [Op.or]: [
                        {
                            sender_id,
                            receiver_id
                        },
                        {
                            sender_id: receiver_id,
                            receiver_id: sender_id
                        }
                    ]
                }
            });

            if (!messages || messages.length === 0) throw new AppError(404, '');

            const hasNextPage: boolean = messages.length > limit;

            const resultMessages: ChatMessages[] = hasNextPage ? messages.slice(0, limit) : messages;

            const nextCursor = hasNextPage ? resultMessages[resultMessages.length - 1].dataValues.message_id : null;

            return {
                messages: resultMessages,
                hasNextPage,
                nextCursor
            };
        } catch(error) {
        if (error instanceof AppError) {
            throw error;
        }
        throw new AppError(500, 'InternalServerError');
    }
}

    // Método para editar un mensaje
    public async updateMessage(message_id: string, content: string) {
    try {
        const message = await ChatMessages.findByPk(message_id);

        if (!message) throw new AppError(404, 'MessageNotFound');

        if (message.dataValues.created_at < new Date(Date.now() - 1000 * 60 * 5)) {
            throw new AppError(403, '');
        }

        await message.update({ content });

        await message.reload();

        return { result: true, message_id };
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
        const messageExist = await existCommentChat(message_id);

        if (!messageExist) throw new AppError(404, 'MessageNotFound');

        await messageExist.destroy()

        return { result: true, message_id };

    } catch (error) {
        if (error instanceof AppError) {
            throw error;
        }
        throw new AppError(500, 'InternalServerError');
    }
}
}