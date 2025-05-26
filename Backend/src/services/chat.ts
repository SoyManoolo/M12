import { ChatMessages, User } from "../models";
import { AppError } from "../middlewares/errors/AppError";
import { Op } from "sequelize";
import { existCommentChat } from "../utils/modelExists";
import { IChatMessages } from "../models/ChatMessages";

type CreateMessageAttributes = Pick<IChatMessages, 'sender_id' | 'receiver_id' | 'content'> & {
    is_delivered: boolean;
    delivered_at: null;
    read_at: null;
};

export class ChatService {
    // Método para crear un nuevo mensaje
    public async createMessage(sender_id: string, receiver_id: string, content: string) {
        try {
            // Verificar que el usuario receptor existe
            const receiver = await User.findByPk(receiver_id);
            if (!receiver) {
                throw new AppError(404, 'UserNotFound');
            }

            // Validar contenido del mensaje
            if (!content.trim()) {
                throw new AppError(400, 'EmptyMessage');
            }

            if (content.length > 1000) {
                throw new AppError(400, 'MessageTooLong');
            }

            const messageData: CreateMessageAttributes = {
                sender_id,
                receiver_id,
                content,
                is_delivered: false,
                delivered_at: null,
                read_at: null
            };

            const message = await ChatMessages.create(messageData);

            if (!message) throw new AppError(400, 'MessageNotCreated');

            return message;

        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError(500, 'InternalServerError');
        }
    }

    // Método para obtener la lista de chats de un usuario
    public async getUserChats(user_id: string) {
        try {
            // Obtener todos los chats donde el usuario es remitente o receptor
            const chats = await ChatMessages.findAll({
                where: {
                    [Op.or]: [
                        { sender_id: user_id },
                        { receiver_id: user_id }
                    ]
                },
                include: [
                    {
                        model: User,
                        as: 'sender',
                        attributes: ['user_id', 'username', 'name', 'surname', 'profile_picture']
                    },
                    {
                        model: User,
                        as: 'receiver',
                        attributes: ['user_id', 'username', 'name', 'surname', 'profile_picture']
                    }
                ],
                order: [['created_at', 'DESC']],
                group: [
                    'ChatMessages.sender_id',
                    'ChatMessages.receiver_id',
                    'sender.user_id',
                    'receiver.user_id'
                ]
            });

            if (!chats || chats.length === 0) {
                return [];
            }

            // Procesar los chats para obtener el último mensaje y la información del otro usuario
            const processedChats = await Promise.all(chats.map(async (chat: ChatMessages & { sender?: User, receiver?: User }) => {
                const otherUserId = chat.sender_id === user_id ? chat.receiver_id : chat.sender_id;
                const otherUser = chat.sender_id === user_id ? chat.receiver : chat.sender;

                if (!otherUser) {
                    // Si no hay usuario relacionado, salta este chat
                    return null;
                }

                // Obtener el último mensaje
                const lastMessage = await ChatMessages.findOne({
                    where: {
                        [Op.or]: [
                            {
                                sender_id: user_id,
                                receiver_id: otherUserId
                            },
                            {
                                sender_id: otherUserId,
                                receiver_id: user_id
                            }
                        ]
                    },
                    order: [['created_at', 'DESC']]
                });

                // Contar mensajes no leídos
                const unreadCount = await ChatMessages.count({
                    where: {
                        sender_id: otherUserId,
                        receiver_id: user_id,
                        read_at: null
                    }
                });

                return {
                    other_user: otherUser,
                    last_message: lastMessage,
                    unread_count: unreadCount
                };
            }));

            return processedChats.filter(Boolean);
        } catch (error) {
            console.error('Error en getUserChats:', error);
            return [];
        }
    }

    // Método para marcar mensajes como leídos
    public async markMessagesAsRead(sender_id: string, receiver_id: string) {
        try {
            await ChatMessages.update(
                { 
                    read_at: new Date(),
                    is_delivered: true,
                    delivered_at: new Date()
                },
                {
                    where: {
                        sender_id,
                        receiver_id,
                        read_at: null
                    }
                }
            );

            return { success: true };
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
                order: [['created_at', 'DESC']]
            };

            if (cursor) {
                const lastMessage = await ChatMessages.findByPk(cursor);
                if (lastMessage) {
                    queryOptions.where = {
                        created_at: {
                            [Op.lt]: lastMessage.created_at
                        }
                    };
                }
            }

            const messages = await ChatMessages.findAll({
                ...queryOptions,
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

            if (!messages || messages.length === 0) {
                return {
                    messages: [],
                    hasNextPage: false,
                    nextCursor: null
                };
            }

            const hasNextPage: boolean = messages.length > limit;
            const resultMessages = hasNextPage ? messages.slice(0, limit) : messages;
            const nextCursor = hasNextPage ? resultMessages[resultMessages.length - 1].id : null;

            return {
                messages: resultMessages,
                hasNextPage,
                nextCursor
            };
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
            const message = await ChatMessages.findByPk(message_id);

            if (!message) throw new AppError(404, 'MessageNotFound');

            const created_at = message.getDataValue('created_at');
            if (!created_at || created_at < new Date(Date.now() - 1000 * 60 * 5)) {
                throw new AppError(403, 'MessageTooOld');
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

    // Método para marcar mensaje como entregado
    public async markMessageAsDelivered(message_id: string) {
        try {
            const message = await ChatMessages.findByPk(message_id);
            if (!message) {
                throw new AppError(404, 'MessageNotFound');
            }

            await message.update({
                is_delivered: true,
                delivered_at: new Date()
            });

            return message;
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError(500, 'InternalServerError');
        }
    }

    // Método para marcar mensaje como leído
    public async markMessageAsRead(message_id: string) {
        try {
            const message = await ChatMessages.findByPk(message_id);
            if (!message) {
                throw new AppError(404, 'MessageNotFound');
            }

            await message.update({
                read_at: new Date(),
                is_delivered: true,
                delivered_at: message.delivered_at || new Date()
            });

            return message;
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            throw new AppError(500, 'InternalServerError');
        }
    }
}