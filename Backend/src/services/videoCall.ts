import { Friends, User, UserBlocks, VideoCalls } from "../models";
import { AppError } from "../middlewares/errors/AppError";
import { existsUser } from "../utils/modelExists";
import { Op } from "sequelize";
import { Server } from "socket.io";
import dbLogger from "../config/logger";
import { randomUUID } from "crypto";

type FriendCallInvitation = {
    inviteId: string;
    callerId: string;
    callerSocketId: string;
    targetId: string;
    targetSocketId: string;
    expiresAt: number;
    timeout: NodeJS.Timeout;
    processing: boolean;
};

const FRIEND_CALL_INVITE_TTL_MS = 30_000;

export class VideoCallService {
    private static waitingQueue: Map<string, string> = new Map();
    private static activeCalls: Map<string, { users: { id: string; socketId: string; }[]; startTime: Date; status: string; }> = new Map();
    private static onlineSockets: Map<string, Set<string>> = new Map();
    private static friendCallInvitations = new Map<string, FriendCallInvitation>();

    private static instance: VideoCallService;

    private constructor() { }

    private static readonly callEvents = {
        incoming: 'incoming_call_invite',
        result: 'call_invite_result',
        status: 'call_invite_status',
        cancelled: 'call_invite_cancelled',
        accepted: 'call_invite_accepted',
    };

    public registerCallPresence(userId: string, socketId: string) {
        const sockets = VideoCallService.onlineSockets.get(userId) ?? new Set<string>();
        sockets.add(socketId);
        VideoCallService.onlineSockets.set(userId, sockets);
    }

    private getOnlineSocket(io: Server, userId: string): string | null {
        const sockets = VideoCallService.onlineSockets.get(userId);
        if (!sockets) return null;
        for (const socketId of [...sockets]) {
            if (io.sockets.sockets.has(socketId)) return socketId;
            sockets.delete(socketId);
        }
        if (sockets.size === 0) VideoCallService.onlineSockets.delete(userId);
        return null;
    }

    private async areUnblockedFriends(userId: string, otherUserId: string): Promise<boolean> {
        if (userId === otherUserId) return false;
        const [friendship, block] = await Promise.all([
            Friends.findOne({
                where: {
                    [Op.or]: [
                        { user1_id: userId, user2_id: otherUserId },
                        { user1_id: otherUserId, user2_id: userId }
                    ]
                }
            }),
            UserBlocks.findOne({
                where: {
                    [Op.or]: [
                        { blocker_id: userId, blocked_id: otherUserId },
                        { blocker_id: otherUserId, blocked_id: userId }
                    ]
                }
            })
        ]);
        return Boolean(friendship && !block);
    }

    private hasPendingInvitation(userId: string): boolean {
        return [...VideoCallService.friendCallInvitations.values()]
            .some(invite => invite.callerId === userId || invite.targetId === userId);
    }

    private async userIsInCall(userId: string): Promise<boolean> {
        return Boolean(await this.getUserActiveCall(userId));
    }

    private emitInvitationStatus(io: Server, invitation: FriendCallInvitation, status: string, message?: string) {
        if (io.sockets.sockets.has(invitation.callerSocketId)) {
            io.to(invitation.callerSocketId).emit(VideoCallService.callEvents.status, {
                inviteId: invitation.inviteId,
                status,
                ...(message ? { message } : {})
            });
        }
    }

    private removeInvitation(invitation: FriendCallInvitation) {
        clearTimeout(invitation.timeout);
        VideoCallService.friendCallInvitations.delete(invitation.inviteId);
    }

    private expireInvitation(io: Server, invitation: FriendCallInvitation) {
        if (!VideoCallService.friendCallInvitations.has(invitation.inviteId)) return;
        this.removeInvitation(invitation);
        this.emitInvitationStatus(io, invitation, 'expired', 'La invitación ha caducado.');
        if (io.sockets.sockets.has(invitation.targetSocketId)) {
            io.to(invitation.targetSocketId).emit(VideoCallService.callEvents.cancelled, {
                inviteId: invitation.inviteId,
                reason: 'expired'
            });
        }
    }

    public async requestFriendCall(io: Server, callerId: string, callerSocketId: string, targetId: string) {
        const fail = (message: string) => ({ success: false, message });
        if (!targetId || callerId === targetId) return fail('No puedes llamarte a ti mismo.');
        if (!io.sockets.sockets.has(callerSocketId)) return fail('La conexión no está disponible.');
        if (!(await this.areUnblockedFriends(callerId, targetId))) return fail('Solo puedes llamar a una amistad disponible.');
        if (VideoCallService.waitingQueue.has(callerId) || VideoCallService.waitingQueue.has(targetId)) return fail('Una de las personas está buscando otra llamada.');
        if (await this.userIsInCall(callerId) || await this.userIsInCall(targetId)) return fail('Una de las personas ya está en una llamada.');
        if (this.hasPendingInvitation(callerId) || this.hasPendingInvitation(targetId)) return fail('Una de las personas ya tiene una invitación pendiente.');

        const targetSocketId = this.getOnlineSocket(io, targetId);
        if (!targetSocketId) return fail('Esta persona no está conectada ahora.');
        const [caller, target] = await Promise.all([
            User.findByPk(callerId, { attributes: ['user_id', 'username', 'profile_picture'] }),
            User.findByPk(targetId, { attributes: ['user_id', 'username', 'profile_picture'] })
        ]);
        if (!caller || !target) return fail('No se encontró a una de las personas.');

        const inviteId = randomUUID();
        const expiresAt = Date.now() + FRIEND_CALL_INVITE_TTL_MS;
        const invitation = {
            inviteId,
            callerId,
            callerSocketId,
            targetId,
            targetSocketId,
            expiresAt,
            processing: false,
            timeout: setTimeout(() => this.expireInvitation(io, invitation), FRIEND_CALL_INVITE_TTL_MS)
        };
        VideoCallService.friendCallInvitations.set(inviteId, invitation);
        io.to(targetSocketId).emit(VideoCallService.callEvents.incoming, {
            inviteId,
            caller: {
                id: caller.user_id,
                username: caller.username,
                profile_picture: caller.profile_picture
            },
            expiresAt
        });
        return { success: true, inviteId, expiresAt };
    }

    public async respondToFriendCall(io: Server, inviteId: string, targetId: string, targetSocketId: string, accept: boolean) {
        const invitation = VideoCallService.friendCallInvitations.get(inviteId);
        if (!invitation || invitation.targetId !== targetId || invitation.targetSocketId !== targetSocketId || invitation.processing) {
            return { success: false, message: 'La invitación ya no es válida.' };
        }
        if (Date.now() >= invitation.expiresAt) {
            this.expireInvitation(io, invitation);
            return { success: false, message: 'La invitación ha caducado.' };
        }
        invitation.processing = true;

        const callerConnected = io.sockets.sockets.has(invitation.callerSocketId);
        const targetConnected = io.sockets.sockets.has(invitation.targetSocketId);
        const stillFriends = await this.areUnblockedFriends(invitation.callerId, invitation.targetId);
        const alreadyInCall = VideoCallService.waitingQueue.has(invitation.callerId)
            || VideoCallService.waitingQueue.has(invitation.targetId)
            || await this.userIsInCall(invitation.callerId)
            || await this.userIsInCall(invitation.targetId);
        if (!callerConnected || !targetConnected || !stillFriends || alreadyInCall) {
            this.removeInvitation(invitation);
            const status = !callerConnected ? 'offline' : 'cancelled';
            this.emitInvitationStatus(io, invitation, status, 'La invitación ya no está disponible.');
            return { success: false, message: 'La invitación ya no está disponible.' };
        }

        this.removeInvitation(invitation);
        if (!accept) {
            this.emitInvitationStatus(io, invitation, 'rejected', 'La invitación fue rechazada.');
            return { success: true, status: 'rejected' };
        }

        try {
            const call = await VideoCalls.create({ user1_id: invitation.callerId, user2_id: invitation.targetId });
            const callId = call.dataValues.call_id;
            VideoCallService.activeCalls.set(callId, {
                users: [
                    { id: invitation.callerId, socketId: invitation.callerSocketId },
                    { id: invitation.targetId, socketId: invitation.targetSocketId }
                ],
                startTime: new Date(),
                status: 'connecting'
            });
            const callerData = await User.findByPk(invitation.callerId, { attributes: ['user_id', 'username', 'profile_picture'] });
            const targetData = await User.findByPk(invitation.targetId, { attributes: ['user_id', 'username', 'profile_picture'] });
            if (!callerData || !targetData || !io.sockets.sockets.has(invitation.callerSocketId) || !io.sockets.sockets.has(invitation.targetSocketId)) {
                await this.endCall(invitation.callerId, callId);
                return { success: false, message: 'No se pudo iniciar la llamada.' };
            }

            io.to(invitation.callerSocketId).emit(VideoCallService.callEvents.accepted, {
                call_id: callId,
                match: { id: targetData.user_id, socketId: invitation.targetSocketId },
                self: { id: callerData.user_id, socketId: invitation.callerSocketId },
                isInitiator: true,
                direct: true
            });
            io.to(invitation.targetSocketId).emit(VideoCallService.callEvents.accepted, {
                call_id: callId,
                match: { id: callerData.user_id, socketId: invitation.callerSocketId },
                self: { id: targetData.user_id, socketId: invitation.targetSocketId },
                isInitiator: false,
                direct: true
            });
            this.emitInvitationStatus(io, invitation, 'accepted');
            return { success: true, status: 'accepted', callId };
        } catch (error) {
            dbLogger.error('[VideoCallService] Failed to create friend call:', { error });
            this.emitInvitationStatus(io, invitation, 'cancelled', 'No se pudo iniciar la llamada.');
            return { success: false, message: 'No se pudo iniciar la llamada.' };
        }
    }

    public async unregisterCallPresence(io: Server, userId: string, socketId: string) {
        const sockets = VideoCallService.onlineSockets.get(userId);
        sockets?.delete(socketId);
        if (sockets?.size === 0) VideoCallService.onlineSockets.delete(userId);

        for (const invitation of [...VideoCallService.friendCallInvitations.values()]) {
            if (invitation.callerSocketId === socketId) {
                this.removeInvitation(invitation);
                if (io.sockets.sockets.has(invitation.targetSocketId)) {
                    io.to(invitation.targetSocketId).emit(VideoCallService.callEvents.cancelled, {
                        inviteId: invitation.inviteId,
                        reason: 'caller_disconnected'
                    });
                }
            } else if (invitation.targetSocketId === socketId) {
                this.removeInvitation(invitation);
                this.emitInvitationStatus(io, invitation, 'offline', 'La otra persona se desconectó.');
            }
        }
    }

    public cancelFriendCall(io: Server, inviteId: string, callerId: string, callerSocketId: string) {
        const invitation = VideoCallService.friendCallInvitations.get(inviteId);
        if (!invitation || invitation.callerId !== callerId || invitation.callerSocketId !== callerSocketId) {
            return false;
        }
        this.removeInvitation(invitation);
        this.emitInvitationStatus(io, invitation, 'cancelled', 'Has cancelado la invitación.');
        if (io.sockets.sockets.has(invitation.targetSocketId)) {
            io.to(invitation.targetSocketId).emit(VideoCallService.callEvents.cancelled, {
                inviteId: invitation.inviteId,
                reason: 'caller_cancelled'
            });
        }
        return true;
    }

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

            if (VideoCallService.waitingQueue.has(user_id)
                || this.hasPendingInvitation(user_id)
                || await this.userIsInCall(user_id)) return false;

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
    public async getCallRecipient(fromUserId: string, toSocketId: string, expectedCallId: string) {
        try {
            dbLogger.info(`[VideoCallService] Getting call recipient data for user ${toSocketId} requested by ${fromUserId}`);

            // Registrar información de depuración para entender qué datos tenemos
            dbLogger.info(`[VideoCallService] Active calls: ${VideoCallService.activeCalls.size}`);

            // Solo se permite señalizar a la otra persona de la misma llamada activa.
            if (!expectedCallId) return null;
            for (const [activeCallId, callData] of VideoCallService.activeCalls.entries()) {
                if (activeCallId !== expectedCallId) continue;
                dbLogger.info(`[VideoCallService] Checking call ${activeCallId} with ${callData.users.length} users`);

                // Registrar información de cada participante en la llamada
                callData.users.forEach((user, index) => {
                    dbLogger.info(`[VideoCallService] Call ${activeCallId} - User ${index}: ID=${user.id}, SocketID=${user.socketId}`);
                });

                const fromUserInCall = callData.users.find(user => user.id === fromUserId);
                const toUser = callData.users.find(user => user.socketId === toSocketId);

                if (fromUserInCall && toUser && toUser.id !== fromUserId) {
                    return { socketId: toUser.socketId, callId: activeCallId };
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
    public async markCallAsConnected(callId: string, userId: string) {
        try {
            // Actualizar en la base de datos
            const call = await VideoCalls.findByPk(callId);
            if (!call) {
                return false;
            }

            if (call.user1_id !== userId && call.user2_id !== userId) {
                throw new AppError(403, 'Forbidden');
            }

            const activeCall = VideoCallService.activeCalls.get(callId);
            if (!activeCall || !activeCall.users.some(user => user.id === userId)) {
                return false;
            }

            await call.update({
                status: "connected",
            });

            // Actualizar en memoria
            activeCall.status = "connected";
            VideoCallService.activeCalls.set(callId, activeCall);
            return true;
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
