import { Socket, Server } from "socket.io";
import { ChatService } from "../services/chat";
import { AppError } from "../middlewares/errors/AppError";
import jwt, { JwtPayload } from "jsonwebtoken";
import { User } from "../models";

// Mapa para mantener un registro de los sockets de usuario
const userSockets = new Map<string, Socket>();

const chatService = new ChatService();
const JWT_SECRET = process.env.JWT_SECRET as string;

// Mapa para mantener el estado de los usuarios
const userStatus = new Map<string, {
    isOnline: boolean,
    lastSeen: Date,
    typingTo: string | null
}>();

export function chatEvents(socket: Socket, io: Server) {
    // Autenticación del socket
    socket.use(async (packet, next) => {
        try {
            // Extraer el token del paquete de manera más robusta
            let token: string | undefined;
            
            // Intentar obtener el token de diferentes ubicaciones posibles
            if (packet[0] === 'join-user' && typeof packet[1] === 'object') {
                // Para el evento join-user, el token viene en el objeto data
                token = packet[1].token;
            } else if (packet[0] === 'chat-message' && typeof packet[1] === 'object') {
                // Para el evento chat-message, el token viene en el objeto data
                token = packet[1].token;
            } else if (typeof packet[1] === 'object') {
                // Para otros eventos, intentar obtener el token de diferentes ubicaciones
                token = packet[1].token || 
                       (packet[1].data && packet[1].data.token) || 
                       (packet[1].auth && packet[1].auth.token);
            }

            // Si no hay token y no es un evento de desconexión, lanzar error
            if (!token && packet[0] !== 'disconnect') {
                console.error("[SOCKET] Token no encontrado en el paquete:", {
                    event: packet[0],
                    data: packet[1]
                });
                throw new AppError(401, 'TokenRequired');
            }

            // Si es un evento de desconexión, permitir continuar sin token
            if (packet[0] === 'disconnect') {
                return next();
            }

            // Verificar y decodificar el token
            if (!token) {
                throw new AppError(401, 'TokenRequired');
            }

            const decoded = jwt.verify(token, JWT_SECRET) as unknown as { user_id: string; username: string };
            console.log("[SOCKET] Token decodificado para evento", packet[0], ":", decoded);

            // Buscar el usuario en la base de datos
            const user = await User.findByPk(decoded.user_id);
            if (!user) {
                console.error("[SOCKET] Usuario no encontrado para el ID:", decoded.user_id);
                throw new AppError(401, 'UserNotFound');
            }

            // Guardar el usuario en el socket para uso posterior
            // Asegurarnos de que los datos del usuario estén disponibles directamente
            socket.data.user = {
                user_id: user.getDataValue('user_id'),
                name: user.getDataValue('name'),
                surname: user.getDataValue('surname'),
                username: user.getDataValue('username'),
                email: user.getDataValue('email'),
                profile_picture: user.getDataValue('profile_picture'),
                bio: user.getDataValue('bio'),
                email_verified: user.getDataValue('email_verified'),
                is_moderator: user.getDataValue('is_moderator'),
                active_video_call: user.getDataValue('active_video_call')
            };

            console.log("[SOCKET] Usuario autenticado para evento", packet[0], ":", socket.data.user);
            next();
        } catch (error) {
            console.error("[SOCKET] Error de autenticación para evento", packet[0], ":", error);
            if (error instanceof jwt.JsonWebTokenError) {
                next(new Error('InvalidToken'));
            } else if (error instanceof AppError) {
                next(error);
            } else {
                next(new Error('Authentication error'));
            }
        }
    });

    // Unirse a la sala del usuario
    socket.on("join-user", async (data: { userId: string; token: string }) => {
        try {
            console.log("[SOCKET][DEBUG] Evento recibido: join-user", [data]);
            const { userId, token } = data;

            // Verificar el token
            const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

            // Verificar que el ID del token coincide con el userId proporcionado
            if (decoded.user_id !== userId) {
                console.error("[SOCKET] Token ID no coincide con userId:", { tokenId: decoded.user_id, userId });
                socket.emit("error", {
                    type: 'InvalidToken',
                    message: 'El token no coincide con el usuario'
                });
                return;
            }

            // Verificar que el usuario existe
            const user = await User.findByPk(userId);
            if (!user) {
                socket.emit("error", {
                    type: 'UserNotFound',
                    message: 'Usuario no encontrado'
                });
                return;
            }

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
            console.error("[SOCKET] Error en join-user:", error);
            if (error instanceof jwt.JsonWebTokenError) {
                socket.emit("error", {
                    type: 'InvalidToken',
                    message: 'Token inválido'
                });
            } else {
                socket.emit("error", {
                    type: 'InternalServerError',
                    message: error instanceof Error ? error.message : 'Error interno del servidor'
                });
            }
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
    socket.on('chat-message', async (data: { data: { receiver_id: string; content: string }, token: string }) => {
        try {
            console.log('[SOCKET] Datos del socket:', {
                user: socket.data.user,
                id: socket.id,
                rooms: Array.from(socket.rooms)
            });

            if (!socket.data.user || !socket.data.user.user_id) {
                console.error('[SOCKET] Usuario no autenticado en el socket o user_id no disponible');
                throw new AppError(401, 'UserNotAuthenticated');
            }

            const sender = socket.data.user;
            console.log(`[SOCKET] Enviando mensaje de ${sender.user_id} a ${data.data.receiver_id}`);

            // Crear el mensaje
            const message = await chatService.createMessage(
                sender.user_id,
                data.data.receiver_id,
                data.data.content
            );

            // Emitir el mensaje a la sala del receptor
            io.to(data.data.receiver_id).emit('new-message', { message });

            // Emitir el mensaje a la sala del remitente también
            io.to(sender.user_id).emit('new-message', { message });

            // Emitir confirmación al remitente
            socket.emit('chat-message-sent', {
                success: true,
                message
            });

            // Emitir evento de entrega
            socket.emit('message-delivery-status', {
                message_id: message.id,
                status: 'delivered',
                delivered_at: new Date().toISOString()
            });

        } catch (error) {
            console.error('[SOCKET] Error en \'chat-message\':', error);

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
            console.log("[SOCKET] Evento 'message-delivered' recibido:", data);
            const { message_id } = data;
            console.log("[SOCKET] Marcando mensaje como entregado:", message_id);
            if (!socket.data.user) return;
            const message = await chatService.markMessageAsDelivered(message_id);
            console.log("[SOCKET] Mensaje marcado como entregado:", message);
            // Notificar al remitente que el mensaje fue entregado
            io.to(message.sender_id).emit("message-delivery-status", {
                message_id,
                status: 'delivered',
                delivered_at: message.delivered_at
            });
        } catch (error) {
            console.error("[SOCKET] Error en 'message-delivered':", error);
            socket.emit("delivery-status-error", {
                success: false,
                message: error instanceof AppError ? error.message : "Error updating delivery status",
            });
        }
    });

    // Marcar mensaje como leído
    socket.on("message-read", async (data) => {
        try {
            console.log("[SOCKET] Evento 'message-read' recibido:", data);
            const { message_id } = data;
            console.log("[SOCKET] Marcando mensaje como leído:", message_id);
            if (!socket.data.user) return;
            const message = await chatService.markMessageAsRead(message_id);
            console.log("[SOCKET] Mensaje marcado como leído:", message);
            // Notificar al remitente que el mensaje fue leído
            io.to(message.sender_id).emit("message-read-status", {
                message_id,
                status: 'read',
                read_at: message.read_at
            });
        } catch (error) {
            console.error("[SOCKET] Error en 'message-read':", error);
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
            console.error("[SOCKET] Error en typing:", error);
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

            const result = await chatService.deleteMessage(message_id);

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
        console.log(`[SOCKET][DEBUG] Evento recibido:`, event, args);
    });
}