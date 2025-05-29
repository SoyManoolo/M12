import { ChatMessages, PostComments, User } from "../models";
import { AppError } from "../middlewares/errors/AppError";
import { Op } from "sequelize";
import { existsUser } from "../utils/modelExists";
import { CreateMessageAttributes, ChatMessagesCreationAttributes } from "../types/custom";
import dbLogger from "../config/logger";

export class ChatService {
    // Método para crear un nuevo mensaje
    public async createMessage(sender_id: string, receiver_id: string, content: string) {
        try {
            dbLogger.info(`[ChatService] Creando mensaje de ${sender_id} a ${receiver_id}`);

            // Verificar que el usuario remitente existe
            const sender: User | null = await existsUser({user_id: sender_id});
            if (!sender) {
                dbLogger.error(`[ChatService] Usuario remitente no encontrado: ${sender_id}`);
                throw new AppError(404, 'UserNotFound')};

            // Verificar que el usuario receptor existe
            const receiver: User | null = await existsUser({user_id: receiver_id});
            if (!receiver) {
                dbLogger.error(`[ChatService] Usuario receptor no encontrado: ${receiver_id}`);
                throw new AppError(404, 'UserNotFound')};

            // Validar contenido del mensaje
            if (!content.trim()) {
                dbLogger.error("[ChatService] Mensaje vacío");
                throw new AppError(400, 'EmptyMessage')
            };

            if (content.length > 1000) {
                dbLogger.error("[ChatService] Mensaje demasiado largo");
                throw new AppError(400, 'MessageTooLong')
            };

            // Crear el mensaje
            const messageData: ChatMessagesCreationAttributes = {
                sender_id,
                receiver_id,
                content,
            };

            const message: ChatMessages = await ChatMessages.create(messageData);

            // Verificar si el mensaje fue creado correctamente
            if (!message) throw new AppError(400, 'MessageNotCreated');

            return message;

        } catch (error) {
            if (error instanceof AppError) {
                dbLogger.error("[ChatService] Error al crear mensaje:", {error});
                throw error;
            }
            dbLogger.error("[ChatService] Error inesperado al crear mensaje:", {error});
            throw new AppError(500, 'InternalServerError');
        }
    }

    // Método para obtener la lista de chats de un usuario
    public async getUserChats(user_id: string) {
        try {
            dbLogger.info(`[ChatService] Obteniendo chats para el usuario: ${user_id}`);

            // Verificar que el usuario existe
            const user: User | null = await existsUser({user_id});
            if (!user) {
                dbLogger.error(`[ChatService] Usuario no encontrado: ${user_id}`);
                throw new AppError(404, 'UserNotFound')
            };

            // Obtener todos los chats donde el usuario es remitente o receptor
            const chats: ChatMessages[] = await ChatMessages.findAll({
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
                    'ChatMessages.id',
                    'ChatMessages.sender_id',
                    'ChatMessages.receiver_id',
                    'ChatMessages.content',
                    'ChatMessages.is_delivered',
                    'ChatMessages.delivered_at',
                    'ChatMessages.read_at',
                    'ChatMessages.created_at',
                    'ChatMessages.updated_at',
                    'sender.user_id',
                    'receiver.user_id'
                ]
            });

            if (!chats || chats.length === 0) {
                return [];
            }

            // Procesar los chats para obtener el último mensaje y la información del otro usuario
            const processedChats = await Promise.all(chats.map(async (chat: ChatMessages & { sender?: User, receiver?: User }) => {
                const otherUserId: string = chat.sender_id === user_id ? chat.receiver_id : chat.sender_id;
                const otherUser: User | undefined = chat.sender_id === user_id ? chat.receiver : chat.sender;

                if (!otherUser) {
                    return null;
                }

                // Obtener el último mensaje
                const lastMessage: ChatMessages | null = await ChatMessages.findOne({
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
                const unreadCount: number = await ChatMessages.count({
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
            dbLogger.error('Error en getUserChats:', {error});
            return [];

        }
    }

    // Método para marcar mensajes como leídos
    public async markMessagesAsRead(sender_id: string, receiver_id: string) {
        try {
            dbLogger.info(`[ChatService] Marcando mensajes como leídos de ${sender_id} a ${receiver_id}`);

            // Verificar que el usuario remitente existe
            const sender: User | null = await existsUser({user_id: sender_id})

            if (!sender) throw new AppError(404, 'UserNotFound');

            // Verificar que el usuario receptor existe
            const receiver: User | null = await existsUser({user_id: receiver_id})

            if (!receiver) throw new AppError(404, 'UserNotFound');

            // Actualizar los mensajes no leídos
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
                dbLogger.error("[ChatService] Error al marcar mensajes como leídos:", {error});
                throw error;
            }
            dbLogger.error("[ChatService] Error inesperado al marcar mensajes como leídos:", {error});
            throw new AppError(500, 'InternalServerError');
        }
    }

    // Método para obtener los mensajes de un chat
    public async getMessages(sender_id: string, receiver_id: string, limit: number = 20, cursor?: string) {
        try {
            dbLogger.info(`[ChatService] Obteniendo mensajes entre ${sender_id} y ${receiver_id}`);

            // Verificar que el usuario remitente existe
            const sender: User | null = await existsUser({user_id: sender_id});
            if (!sender) {
                dbLogger.error(`[ChatService] Usuario remitente no encontrado: ${sender_id}`);
                throw new AppError(404, 'UserNotFound')
            };

            // Verificar que el usuario receptor existe
            const receiver: User | null = await existsUser({user_id: receiver_id});
            if (!receiver) {
                dbLogger.error(`[ChatService] Usuario receptor no encontrado: ${receiver_id}`);
                throw new AppError(404, 'UserNotFound')
            };

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

            const messages: ChatMessages[] = await ChatMessages.findAll({
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
            const resultMessages: ChatMessages[] = hasNextPage ? messages.slice(0, limit) : messages;
            const nextCursor: string | null = hasNextPage ? resultMessages[resultMessages.length - 1].id : null;

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
            const message: ChatMessages | null = await ChatMessages.findByPk(message_id);

            if (!message) throw new AppError(404, 'MessageNotFound');

            const created_at: Date | undefined = message.getDataValue('created_at');
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
            dbLogger.info(`[ChatService] Eliminando mensaje con ID: ${message_id}`);

            // Verificar que el mensaje existe
            const messageExist: ChatMessages | null = await ChatMessages.findByPk(message_id);

            if (!messageExist) {
                dbLogger.error(`[ChatService] Mensaje no encontrado: ${message_id}`);
                throw new AppError(404, 'MessageNotFound')};

            // Eliminar el mensaje
            await messageExist.destroy()

            return {
                result: true,
                message_id
            };

        } catch (error) {
            if (error instanceof AppError) {
                dbLogger.error("[ChatService] Error al eliminar mensaje:", {error});
                throw error;
            }
            dbLogger.error("[ChatService] Error inesperado al eliminar mensaje:", {error});
            throw new AppError(500, 'InternalServerError');
        }
    }

    // Método para marcar mensaje como entregado
    public async markMessageAsDelivered(message_id: string) {
        try {
            dbLogger.info(`[ChatService] Marcando mensaje como entregado con ID: ${message_id}`);

            // Verificar que el mensaje existe
            const message: ChatMessages | null = await ChatMessages.findByPk(message_id);
            if (!message) {
                dbLogger.error(`[ChatService] Mensaje no encontrado: ${message_id}`);
                throw new AppError(404, 'MessageNotFound');
            }

            // Actualizar el mensaje como entregado
            await message.update({
                is_delivered: true,
                delivered_at: new Date()
            });

            return message;
        } catch (error) {
            if (error instanceof AppError) {
                dbLogger.error("[ChatService] Error al marcar mensaje como entregado:", {error});
                throw error;
            }
            dbLogger.error("[ChatService] Error inesperado al marcar mensaje como entregado:", {error});
            throw new AppError(500, 'InternalServerError');
        }
    }

    // Método para marcar mensaje como leído
    public async markMessageAsRead(message_id: string) {
        try {
            dbLogger.info(`[ChatService] Marcando mensaje como leído con ID: ${message_id}`);

            // Verificar que el mensaje existe
            const message: ChatMessages | null = await ChatMessages.findByPk(message_id);
            if (!message) {
                dbLogger.error(`[ChatService] Mensaje no encontrado: ${message_id}`);
                throw new AppError(404, 'MessageNotFound');
            }

            // Actualizar el mensaje como leído
            await message.update({
                read_at: new Date(),
                is_delivered: true,
                delivered_at: message.delivered_at || new Date()
            });

            return message;
        } catch (error) {
            if (error instanceof AppError) {
                dbLogger.error("[ChatService] Error al marcar mensaje como leído:", {error});
                throw error;
            }
            dbLogger.error("[ChatService] Error inesperado al marcar mensaje como leído:", {error});
            throw new AppError(500, 'InternalServerError');
        }
    }
}