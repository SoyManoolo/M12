import { Socket, Server } from "socket.io";
import { ChatService } from "../services/chat";
import { AppError } from "../middlewares/errors/AppError";
import jwt from "jsonwebtoken";
import { User } from "../models";

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
    /*
    socket.use(async (packet, next) => {
        try {
            const token = packet[1]?.token || packet[1]?.data?.token;
            if (!token) {
                throw new AppError(401, 'TokenRequired');
            }

            const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
            const user = await User.findByPk(decoded.id);
            
            if (!user) {
                throw new AppError(401, 'UserNotFound');
            }

            socket.data.user = user;
            next();
        } catch (error) {
            console.error("[SOCKET] Error de autenticación:", error);
            next(new Error('Authentication error'));
        }
    });
    */

    // Unirse a la sala del usuario
    socket.on("join-user", async (data) => {
        // Permitir tanto string como objeto { userId, token }
        const userId = typeof data === "string" ? data : data.userId;
        // Autenticación manual aquí
        const token = typeof data === "object" ? data.token : undefined;
        if (token) {
            try {
                const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
                const user = await User.findByPk(decoded.id);
                if (user) {
                    socket.data.user = user;
                }
            } catch (e) {
                console.error("[SOCKET] Error autenticando en join-user:", e);
            }
        }
        socket.join(userId);
        userStatus.set(userId, {
            isOnline: true,
            lastSeen: new Date(),
            typingTo: null
        });
        // Notificar a los contactos que el usuario está en línea
        io.emit("user-status-change", {
            userId,
            isOnline: true,
            lastSeen: new Date()
        });
    });

    // Manejar desconexión
    socket.on("disconnect", () => {
        const userId = socket.data.user?.user_id;
        if (userId) {
            userStatus.set(userId, {
                isOnline: false,
                lastSeen: new Date(),
                typingTo: null
            });
            
            // Notificar a los contactos que el usuario está desconectado
            io.emit("user-status-change", {
                userId,
                isOnline: false,
                lastSeen: new Date()
            });
        }
    });

    // Enviar mensaje
    socket.on("chat-message", async (data) => {
        try {
            console.log("[SOCKET] Evento 'chat-message' recibido:", data);
            const { receiver_id, content } = data.data;
            // Extraer sender_id del token
            const token = data.token;
            const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
            const sender_id = decoded.id;
            console.log("[SOCKET] Enviando mensaje de", sender_id, "a", receiver_id);

            const result = await chatService.createMessage(sender_id, receiver_id, content);
            console.log("[SOCKET] Mensaje creado:", result);

            // Notificar al remitente
            io.to(sender_id).emit("chat-message-sent", {
                success: true,
                message: result,
            });

            // Notificar al receptor
            io.to(receiver_id).emit("new-message", {
                message: result,
                sender_id
            });

            // Notificar a todos los usuarios en la sala del chat
            io.to(`${sender_id}-${receiver_id}`).emit("message-received", {
                message: result
            });

        } catch (error) {
            console.error("[SOCKET] Error en 'chat-message':", error);
            socket.emit("send-message-error", {
                success: false,
                message: error instanceof AppError ? error.message : "Error sending message",
            });
        }
    });

    // Marcar mensaje como entregado
    socket.on("message-delivered", async (data) => {
        try {
            console.log("[SOCKET] Evento 'message-delivered' recibido:", data);
            const { message_id } = data;
            console.log("[SOCKET] Marcando mensaje como entregado:", message_id);
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
        const { receiver_id, isTyping } = data;
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
    });

    // Eliminar mensaje
    socket.on("message-delete", async (data) => {
        try {
            const { message_id, receiver_id } = data;
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