import { User, VideoCalls } from "../models";
import { AppError } from "../middlewares/errors/AppError";
import { existsUser } from "../utils/modelExists";
import { Op } from "sequelize";
import { Server } from "socket.io";
import dbLogger from "../config/logger";

export class VideoCallService {
    private static waitingQueue: Map<string, string> = new Map();
    private static activeCalls: Map<string, { users: { id: string; socketId: string; }[]; startTime: Date; status: string; }> = new Map();

    private static instance: VideoCallService;

    private constructor() { }

    public static getInstance(): VideoCallService {
        if (!VideoCallService.instance) {
            VideoCallService.instance = new VideoCallService();
        }
        return VideoCallService.instance;
    }

    // Método para manejar la cola de espera
    public async QueueVideoCall(user_id: string, socket_id: string) {
        try {
            const user: User | null = await existsUser({ user_id });
            if (!user) {
                dbLogger.error(`[VideoCallService] User not found for ID: ${user_id}`);
                throw new AppError(404, 'UserNotFound')
            };

            if (VideoCallService.waitingQueue.has(user_id)) return false;

            VideoCallService.waitingQueue.set(user_id, socket_id);

            return true;
        } catch (error) {
            if (error instanceof AppError) {
                dbLogger.error("[VideoCallService] Error in QueueVideoCall:", { error });
                throw error;
            }
            dbLogger.error("[VideoCallService] Unexpected error in QueueVideoCall:", { error });
            throw new AppError(500, 'InternalServerError');
        };
    };

    // Método para empearejar usuarios
    public async initiateVideoCall(caller_id: string, friend_id: string) {
        try {
            const caller: User | null = await existsUser({ user_id: caller_id });
            const friend: User | null = await existsUser({ user_id: friend_id });
            if (!caller) {
                dbLogger.error(`[VideoCallService] Caller not found for ID: ${caller_id}`);
                throw new AppError(404, 'UserNotFound')
            };
            if (!friend) {
                dbLogger.error(`[VideoCallService] Friend not found for ID: ${friend_id}`);
                throw new AppError(404, 'UserNotFound')
            };

            // TODO: hacer verificacion de si son amigos y crear la llamada
        } catch (error) {
            if (error instanceof AppError) {
                dbLogger.error("[VideoCallService] Error in initiateVideoCall:", { error });
                throw error;
            }
            dbLogger.error("[VideoCallService] Unexpected error in initiateVideoCall:", { error });
            throw new AppError(500, 'InternalServerError');
        };
    };

    // Añadir este método a tu clase VideoCallService
    public static async performMatchingRound(io: Server) {
        try {
            dbLogger.info("[VideoCallService] Starting matching round...");
            // Si no hay suficientes usuarios en la cola, salir
            if (VideoCallService.waitingQueue.size < 2) return;

            // Crear un array de los usuarios en cola y mezclarlos aleatoriamente
            const queueEntries: [string, string][] = Array.from(VideoCallService.waitingQueue.entries());
            queueEntries.sort(() => Math.random() - 0.5);

            // Número de pares a procesar
            const pairsCount: number = Math.floor(queueEntries.length / 2);

            for (let i = 0; i < pairsCount; i++) {
                const [user1_id, socket_id1] = queueEntries[i * 2];
                const [user2_id, socket_id2] = queueEntries[i * 2 + 1];

                // Verificar que ambos usuarios sigan en la cola
                if (!VideoCallService.waitingQueue.has(user1_id) ||
                    !VideoCallService.waitingQueue.has(user2_id)) {
                    continue;
                }

                // Eliminar usuarios de la cola
                VideoCallService.waitingQueue.delete(user1_id);
                VideoCallService.waitingQueue.delete(user2_id);

                // Crear una nueva llamada en la base de datos
                const newVideoCall: VideoCalls = await VideoCalls.create({
                    user1_id: user1_id,
                    user2_id: user2_id
                });

                // Almacenar información en memoria
                VideoCallService.activeCalls.set(newVideoCall.dataValues.call_id, {
                    users: [
                        { id: user1_id, socketId: socket_id1 },
                        { id: user2_id, socketId: socket_id2 }
                    ],
                    startTime: new Date(),
                    status: 'connecting'
                });

                // Notificar a ambos usuarios del emparejamiento
                io.to(socket_id1).emit("match_found", {
                    call_id: newVideoCall.dataValues.call_id,
                    match: { id: user2_id, socketId: socket_id2 },
                    self: { id: user1_id, socketId: socket_id1 },
                    isInitiator: true
                });
                dbLogger.info(`[VideoCallService] Emitted match_found to ${socket_id1} for call ${newVideoCall.dataValues.call_id}`);

                io.to(socket_id2).emit("match_found", {
                    call_id: newVideoCall.dataValues.call_id,
                    match: { id: user1_id, socketId: socket_id1 },
                    self: { id: user2_id, socketId: socket_id2 },
                    isInitiator: false
                });
                dbLogger.info(`[VideoCallService] Emitted match_found to ${socket_id2} for call ${newVideoCall.dataValues.call_id}`);
            };

            return {
                matchedPairs: pairsCount,
                remainingUsers: VideoCallService.waitingQueue.size
            };
        } catch (error) {
            if (error instanceof AppError) {
                dbLogger.error("[VideoCallService] Error in performMatchingRound:", { error });
                throw error;
            }
            dbLogger.error("[VideoCallService] Unexpected error in performMatchingRound:", { error });
            throw new AppError(500, 'InternalServerError');
        };
    };

    // Método para que usuarios se envien solicitud de amistad dentro de la llamada
    public async sendFriendRequest(user_id: string, user_id2: string) {
        try {
            const user: User | null = await existsUser({ user_id });
            const user2: User | null = await existsUser({ user_id: user_id2 });

            if (!user) {
                dbLogger.error(`[VideoCallService] User not found for ID: ${user_id}`);
                throw new AppError(404, 'UserNotFound')
            };
            if (!user2) {
                dbLogger.error(`[VideoCallService] User not found for ID: ${user_id2}`);
                throw new AppError(404, 'UserNotFound')
            };

            // TODO

            return user;
        } catch (error) {
            if (error instanceof AppError) {
                dbLogger.error("[VideoCallService] Error in sendFriendRequest:", { error });
                throw error;
            }
            dbLogger.error("[VideoCallService] Unexpected error in sendFriendRequest:", { error });
            throw new AppError(500, 'InternalServerError');
        };
    };


    // Método para dejar la cola de espera
    public async leaveQueue(user_id: string) {
        try {
            dbLogger.info(`[VideoCallService] User ${user_id} is leaving the waiting queue`);

            // Verificar que el usuario existe
            const user: User | null = await existsUser({ user_id });
            if (!user) {
                dbLogger.error(`[VideoCallService] User not found for ID: ${user_id}`);
                throw new AppError(404, 'UserNotFound')
            };

            if (!VideoCallService.waitingQueue.has(user_id)) return false;

            VideoCallService.waitingQueue.delete(user_id);

            return true;
        } catch (error) {
            if (error instanceof AppError) {
                dbLogger.error("[VideoCallService] Error in leaveQueue:", { error });
                throw error;
            }
            dbLogger.error("[VideoCallService] Unexpected error in leaveQueue:", { error });
            throw new AppError(500, 'InternalServerError');
        };
    }

    /**
     * Obtiene la información necesaria para enviar mensajes de señalización WebRTC al destinatario de una llamada
     * @param fromUserId ID del usuario que inicia la solicitud
     * @param toSocketId Socket ID del usuario destinatario
     * @returns Objeto con socketId y callId del destinatario
     */
    public async getCallRecipient(fromUserId: string, toSocketId: string) {
        try {
            dbLogger.info(`[VideoCallService] Getting call recipient data for user ${toSocketId} requested by ${fromUserId}`);

            // Registrar información de depuración para entender qué datos tenemos
            dbLogger.info(`[VideoCallService] Active calls: ${VideoCallService.activeCalls.size}`);

            // Buscar una llamada activa donde participe el usuario solicitante
            for (const [activeCallId, callData] of VideoCallService.activeCalls.entries()) {
                dbLogger.info(`[VideoCallService] Checking call ${activeCallId} with ${callData.users.length} users`);

                // Registrar información de cada participante en la llamada
                callData.users.forEach((user, index) => {
                    dbLogger.info(`[VideoCallService] Call ${activeCallId} - User ${index}: ID=${user.id}, SocketID=${user.socketId}`);
                });

                // Buscar por dos estrategias: ID de usuario y socketID
                const fromUserInCall = callData.users.find(u => u.id === fromUserId || u.socketId === toSocketId);

                if (fromUserInCall) {
                    dbLogger.info(`[VideoCallService] Found user ${fromUserId} in call ${activeCallId}`);

                    // Buscar al otro participante
                    const toUser = callData.users.find(u => u.id !== fromUserId && u.socketId === toSocketId);

                    if (toUser) {
                        dbLogger.info(`[VideoCallService] Found recipient ${toSocketId} in call ${activeCallId}`);
                        return {
                            socketId: toSocketId,
                            callId: activeCallId
                        };
                    } else {
                        // Si no encontramos exactamente al destinatario, asumimos que es el otro participante
                        const otherUser = callData.users.find(u => u.id !== fromUserId);
                        if (otherUser) {
                            dbLogger.info(`[VideoCallService] Assuming recipient is the other user in call: socketID=${otherUser.socketId}`);
                            return {
                                socketId: otherUser.socketId,
                                callId: activeCallId
                            };
                        }
                    }
                }
            }

            dbLogger.error(`[VideoCallService] No active call found between user ${fromUserId} and socket ${toSocketId}`);
            return null;
        } catch (error) {
            if (error instanceof AppError) {
                dbLogger.error("[VideoCallService] Error in getCallRecipient:", { error });
                throw error;
            }
            dbLogger.error("[VideoCallService] Error in getCallRecipient:", { error });
            throw new AppError(500, 'InternalServerError');
        }
    }

    /**
     * Obtiene el socketId de un usuario
     * @param userId ID del usuario
     * @returns socketId del usuario o undefined si no está conectado
     */
    public async getUserSocketId(userId: string) {
        try {
            // Buscar en las llamadas activas en memoria
            for (const callData of VideoCallService.activeCalls.values()) {
                const user = callData.users.find(u => u.id === userId);
                if (user) {
                    return user.socketId;
                }
            }

            // Buscar en la cola de espera
            if (VideoCallService.waitingQueue.has(userId)) {
                return VideoCallService.waitingQueue.get(userId);
            }

            return undefined;
        } catch (error) {
            dbLogger.error("[VideoCallService] Error in getUserSocketId:", { error });
            return undefined;
        }
    }

    /**
     * Obtiene información sobre la llamada activa de un usuario
     * @param userId ID del usuario
     * @returns Objeto con información de la llamada o null si no tiene llamada activa
     */
    public async getUserActiveCall(userId: string) {
        try {
            // Buscar en las llamadas activas en memoria
            for (const [callId, callData] of VideoCallService.activeCalls.entries()) {
                const userInCall = callData.users.find(u => u.id === userId);

                if (userInCall) {
                    // Crear un array con los IDs de ambos participantes
                    const participants = callData.users.map(u => u.id);

                    return {
                        callId,
                        participants,
                        startTime: callData.startTime,
                        status: callData.status
                    };
                }
            }

            return null;
        } catch (error) {
            dbLogger.error("[VideoCallService] Error in getUserActiveCall:", { error });
            return null;
        }
    }

    /**
     * Obtiene el nombre de usuario a partir de su ID
     * @param userId ID del usuario
     * @returns Nombre de usuario o string por defecto
     */
    public async getUserUsername(userId: string) {
        try {
            const user: User | null = await User.findByPk(userId);
            if (!user) {
                return "Usuario";
            }
            return user.dataValues.username || "Usuario";
        } catch (error) {
            dbLogger.error("[VideoCallService] Error in getUserUsername:", { error });
            return "Usuario";
        }
    }

    /**
     * Marca una llamada como conectada cuando se establece la conexión WebRTC
     * @param callId ID de la llamada
     * @returns true si se actualizó correctamente, false si no
     */
    public async markCallAsConnected(callId: string) {
        try {
            // Actualizar en la base de datos
            const call = await VideoCalls.findByPk(callId);
            if (!call) {
                return false;
            }

            await call.update({
                status: "connected",
            });

            // Actualizar en memoria
            if (VideoCallService.activeCalls.has(callId)) {
                const callData = VideoCallService.activeCalls.get(callId);
                if (!callData) return false;

                callData.status = "connected";
                VideoCallService.activeCalls.set(callId, callData);
                return true;
            }

            return false;
        } catch (error) {
            dbLogger.error("[VideoCallService] Error in markCallAsConnected:", { error });
            return false;
        }
    }

    /**
     * Actualiza el método endCall para usar el ID de la llamada en lugar del socket
     */
    public async endCall(user_id: string, call_id: string) {
        try {
            dbLogger.info(`[VideoCallService] User ${user_id} is ending the call with ID: ${call_id}`);

            // Verificar que el usuario existe
            const user: User | null = await existsUser({ user_id });
            if (!user) {
                dbLogger.error(`[VideoCallService] User not found for ID: ${user_id}`);
                throw new AppError(404, 'UserNotFound')
            };

            // Verificar que la llamada existe y el usuario es parte de ella
            const call: VideoCalls | null = await VideoCalls.findOne({
                where: {
                    call_id,
                    [Op.or]: [
                        { user1_id: user_id },
                        { user2_id: user_id },
                    ],
                },
            });

            if (!call) {
                dbLogger.error(`[VideoCallService] Call not found for ID: ${call_id} and user ID: ${user_id}`);
                throw new AppError(404, 'CallNotFound')
            };

            // Actualizar el estado de la llamada a "ended" y registrar la duración
            await call.update({
                ended_at: new Date(),
                status: "ended",
                call_duration: Math.floor(
                    (new Date().getTime() - new Date(call.dataValues.started_at).getTime()) / 1000
                )
            });

            VideoCallService.activeCalls.delete(call_id);

            return call;
        } catch (error) {
            if (error instanceof AppError) {
                dbLogger.error("[VideoCallService] Error in endCall:", { error });
                throw error;
            };
            dbLogger.error("[VideoCallService] Unexpected error in endCall:", { error });
            throw new AppError(500, 'InternalServerError');
        };
    }
};