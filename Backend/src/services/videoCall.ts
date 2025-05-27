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
                    self: { id: user1_id, socketId: socket_id1 }
                });

                io.to(socket_id2).emit("match_found", {
                    call_id: newVideoCall.dataValues.call_id,
                    match: { id: user1_id, socketId: socket_id1 },
                    self: { id: user2_id, socketId: socket_id2 }
                });
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

    // Método para terminar la llamada
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

    public async updateCallStatus(call_id: string, user_id: string, status: string) {
        try {
            dbLogger.info(`[VideoCallService] User ${user_id} is updating the call status for call ID: ${call_id} to ${status}`);

            // Verificar que el usuario es parte de esta llamada
            const call: VideoCalls | null = await VideoCalls.findOne({
                where: {
                    call_id,
                    [Op.or]: [
                        { user1_id: user_id },
                        { user2_id: user_id }
                    ]
                }
            });

            if (!call) {
                dbLogger.error(`[VideoCallService] Call not found for ID: ${call_id} and user ID: ${user_id}`);
                throw new AppError(404, 'CallNotFound')
            };

            // Actualizar el estado de la llamada en la base de datos
            await call.update({ status });

            // También actualizar en la memoria
            if (VideoCallService.activeCalls.has(call_id)) {
                const callData = VideoCallService.activeCalls.get(call_id);
                if (!callData) {
                    dbLogger.error(`[VideoCallService] Call data not found in memory for call ID: ${call_id}`);
                    throw new AppError(404, 'CallNotFound')
                };

                callData.status = status;
                VideoCallService.activeCalls.set(call_id, callData);
            }

            return true;
        } catch (error) {
            if (error instanceof AppError) {
                dbLogger.error("[VideoCallService] Error in updateCallStatus:", { error });
                throw error;
            }
            dbLogger.error("[VideoCallService] Unexpected error in updateCallStatus:", { error });
            throw new AppError(500, 'InternalServerError');
        }
    }
};