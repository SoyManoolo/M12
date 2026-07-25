import { Socket } from "socket.io";
import dbLogger from "../../config/logger";
import { AppError } from "../../middlewares/errors/AppError";
import jwt, { JwtPayload } from "jsonwebtoken";
import { env } from "./../../config/env";
import { User } from "../../models";

const JWT_SECRET = env.JWT_SECRET;

// Autenticación del socket
export const socketAuthMiddleware = (socket: Socket) => {
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
                dbLogger.error("[SOCKET] Token no encontrado en el paquete:", {
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
            dbLogger.debug("[SOCKET] Token decodificado para evento", { packet: packet[0], decoded });

            // Buscar el usuario en la base de datos
            const user = await User.findByPk(decoded.user_id);
            if (!user) {
                dbLogger.error("[SOCKET] Usuario no encontrado para el ID:", { decoded: decoded.user_id });
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

            socket.data.user_id = user.getDataValue('user_id');
            dbLogger.debug("[SOCKET] Usuario autenticado para evento", { packet: packet[0], user: socket.data.user });
            next();
        } catch (error) {
            dbLogger.error("[SOCKET] Error de autenticación para evento", { packet: packet[0], error });
            if (error instanceof jwt.JsonWebTokenError) {
                next(new Error('InvalidToken'));
            } else if (error instanceof AppError) {
                next(error);
            } else {
                next(new Error('Authentication error'));
            }
        }
    });
}