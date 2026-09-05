import { Socket, Server } from "socket.io";
import { ChatService } from "../services/chat";
import { AppError } from "../middlewares/errors/AppError";
import dbLogger from "../config/logger";
import { socketAuthMiddleware } from "./middleware/socketAuth";

// Mapa para mantener un registro de los sockets de usuario
const userSockets = new Map<string, Socket>();

const chatService = new ChatService();

// Mapa para mantener el estado de los usuarios
const userStatus = new Map<string, {
    isOnline: boolean,
    lastSeen: Date,
    typingTo: string | null
}>();

export function chatEvents(socket: Socket, io: Server) {
    // Autenticación
    socketAuthMiddleware(socket)

    // Unirse a la sala del usuario
    socket.on("join-user", async (data: { userId: string; token: string }) => {
        try {
            dbLogger.debug("[SOCKET][DEBUG] Evento recibido: join-user", [data]);
            const { userId } = data;

            const user_id = socket.data.user_id;  // Ya verificado por el middleware

            // Verificar que el ID del token coincide con el userId proporcionado
            if (user_id !== userId) {
                dbLogger.error("[SOCKET] Token ID no coincide con userId:", {
                    tokenId: user_id,  // ← Usa user_id en lugar de decoded.user_id
                    userId
                });
                socket.emit("error", {
                    type: 'InvalidToken',
                    message: 'El token no coincide con el usuario'
                });
                return;
            }

            const user = socket.data.user;

            // Registrar el socket del usuario
            userSockets.set(userId, socket);

            // Unirse a la sala personal
            socket.join(userId);

            // Actualizar estado del usuario
            userStatus.set(userId, {
                isOnline: true,
                lastSeen: new Date(),
                typingTo: null
            });

            // Notificar a otros usuarios que este usuario está en línea
            socket.broadcast.emit("user-status", {
                userId,
                status: "online"
            });

            // Confirmar conexión exitosa
            socket.emit("connection-success", {
                userId,
                status: "connected"
            });

        } catch (error) {
            dbLogger.error("[SOCKET] Error en join-user:", { error });
            socket.emit("error", {
                type: error instanceof AppError ? error.type : 'InternalServerError',
                message: error instanceof AppError ? error.message : 'Error al unirse al chat'
            });
        }
    });

    // Manejar desconexión
    socket.on("disconnect", () => {

        // Encontrar y eliminar el socket del usuario
        for (const [userId, userSocket] of userSockets.entries()) {
            if (userSocket === socket) {
                userSockets.delete(userId);
                // Notificar a otros usuarios que este usuario está desconectado
                socket.broadcast.emit("user-status", {
                    userId,
                    status: "offline"
                });
                break;
            }
        }
    });

    // Enviar mensaje
    socket.on('chat-message', async (data: { data: { receiver_id: string; content: string; client_message_id?: string }, token: string }) => {
        try {
            dbLogger.debug('[SOCKET] Datos del socket:', {
                user: socket.data.user,
                id: socket.id,
                rooms: Array.from(socket.rooms)
            });

            if (!socket.data.user || !socket.data.user.user_id) {
                dbLogger.error('[SOCKET] Usuario no autenticado en el socket o user_id no disponible');
                throw new AppError(401, 'UserNotAuthenticated');
            }

            const sender = socket.data.user;
            dbLogger.info(`[SOCKET] Mensaje enviado`, {
                from: sender.user_id,
                to: data.data.receiver_id
            });

            // Crear el mensaje
            const message = await chatService.createMessage(
                sender.user_id,
                data.data.receiver_id,
                data.data.content
            );
            const messagePayload = {
                ...message.toJSON(),
                client_message_id: data.data.client_message_id
            };

            // Emitir el mensaje a la sala del receptor
            io.to(data.data.receiver_id).emit('new-message', { message: messagePayload });

            // Emitir el mensaje a la sala del remitente también
            io.to(sender.user_id).emit('new-message', { message: messagePayload });

            // Emitir confirmación al remitente
            socket.emit('chat-message-sent', {
                success: true,
                message: messagePayload,
                client_message_id: data.data.client_message_id
            });

            // Emitir evento de entrega
            socket.emit('message-delivery-status', {
                message_id: message.id,
                status: 'delivered',
                delivered_at: new Date().toISOString()
            });

        } catch (error) {
            dbLogger.error('[SOCKET] Error en \'chat-message\':', { error });

            // Solo emitir error si es un error de autenticación o si el mensaje no se pudo crear
            if (error instanceof AppError && error.type === 'UserNotAuthenticated') {
                socket.emit('error', {
                    type: 'UserNotAuthenticated',
                    message: 'Usuario no autenticado'
                });
            } else if (error instanceof Error && error.message.includes('Error al crear el mensaje')) {
                socket.emit('error', {
                    type: 'MessageCreationError',
                    message: 'No se pudo crear el mensaje'
                });
            }
            // No emitir error para otros casos ya que el mensaje se envió correctamente
        }
    });

    // Marcar mensaje como entregado
    socket.on("message-delivered", async (data) => {
        try {
            dbLogger.debug("[SOCKET] Evento 'message-delivered' recibido:", data);
            const { message_id } = data;
            dbLogger.debug("[SOCKET] Marcando mensaje como entregado:", message_id);
            if (!socket.data.user) return;
            const message = await chatService.markMessageAsDelivered(message_id, socket.data.user.user_id);
            dbLogger.debug("[SOCKET] Mensaje marcado como entregado:", message);
            // Notificar al remitente que el mensaje fue entregado
            io.to(message.sender_id).emit("message-delivery-status", {
                message_id,
                status: 'delivered',
                delivered_at: message.delivered_at
            });
        } catch (error) {
            dbLogger.error("[SOCKET] Error en 'message-delivered':", { error });
            socket.emit("delivery-status-error", {
                success: false,
                message: error instanceof AppError ? error.message : "Error updating delivery status",
            });
        }
    });

    // Marcar mensaje como leído
    socket.on("message-read", async (data) => {
        try {
            dbLogger.debug("[SOCKET] Evento 'message-read' recibido:", data);
            const { message_id } = data;
            dbLogger.debug("[SOCKET] Marcando mensaje como leído:", message_id);
            if (!socket.data.user) return;
            const message = await chatService.markMessageAsRead(message_id, socket.data.user.user_id);
            dbLogger.debug("[SOCKET] Mensaje marcado como leído:", message);
            // Notificar al remitente que el mensaje fue leído
            io.to(message.sender_id).emit("message-read-status", {
                message_id,
                status: 'read',
                read_at: message.read_at
            });
        } catch (error) {
            dbLogger.error("[SOCKET] Error en 'message-read':", { error });
            socket.emit("read-status-error", {
                success: false,
                message: error instanceof AppError ? error.message : "Error updating read status",
            });
        }
    });

    // Indicador de "escribiendo..."
    socket.on("typing", (data) => {
        try {
            const { receiver_id, isTyping, token } = data;

            if (!socket.data.user) {
                throw new AppError(401, 'UserNotAuthenticated');
            }

            const sender_id = socket.data.user.user_id;

            if (isTyping) {
                userStatus.set(sender_id, {
                    ...userStatus.get(sender_id)!,
                    typingTo: receiver_id
                });
            } else {
                userStatus.set(sender_id, {
                    ...userStatus.get(sender_id)!,
                    typingTo: null
                });
            }

            io.to(receiver_id).emit("user-typing", {
                userId: sender_id,
                isTyping
            });
        } catch (error) {
            dbLogger.error("[SOCKET] Error en typing:", { error });
            socket.emit("error", {
                type: error instanceof AppError ? error.type : 'InternalServerError',
                message: error instanceof Error ? error.message : 'Error interno del servidor'
            });
        }
    });

    // Eliminar mensaje
    socket.on("message-delete", async (data) => {
        try {
            const { message_id, receiver_id } = data;
            if (!socket.data.user) return;
            const sender_id = socket.data.user.user_id;

            const result = await chatService.deleteMessage(message_id, sender_id);

            // Notificar al remitente
            io.to(sender_id).emit("message-deleted", {
                success: true,
                message_id
            });

            // Notificar al receptor
            io.to(receiver_id).emit("message-deleted", {
                message_id
            });

        } catch (error) {
            socket.emit("delete-error", {
                success: false,
                message: error instanceof AppError ? error.message : "Error deleting message",
            });
        }
    });

    // Obtener estado de usuario
    socket.on("get-user-status", (userId: string) => {
        const status = userStatus.get(userId);
        if (status) {
            socket.emit("user-status", {
                userId,
                ...status
            });
        }
    });

    // Listener global para depuración de eventos
    socket.onAny((event, ...args) => {
        dbLogger.debug(`[SOCKET][DEBUG] Evento recibido:`, { event, args });
    });
}
