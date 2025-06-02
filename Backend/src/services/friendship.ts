import { FriendRequest, Friends, User } from '../models';
import { AppError } from '../middlewares/errors/AppError';
import dbLogger from '../config/logger';
import { Op } from 'sequelize';
import { verifyFriendship as verifyFriendshipUtil } from '../utils/modelExists';

export class FriendshipService {
    /**
     * Envía una solicitud de amistad
     */
    public async sendFriendRequest(sender_id: string, receiver_id: string, created_from: 'search' | 'video_call' | 'suggestion' = 'search') {
        try {
            // Verificar que ambos usuarios existan
            const [sender, receiver] = await Promise.all([
                User.findByPk(sender_id),
                User.findByPk(receiver_id)
            ]);

            if (!sender || !receiver) {
                throw new AppError(404, 'UserNotFound');
            }

            // Verificar que no exista una solicitud pendiente
            const existingRequest = await FriendRequest.findOne({
                where: {
                    [Op.or]: [
                        { sender_id, receiver_id },
                        { sender_id: receiver_id, receiver_id: sender_id }
                    ],
                    status: 'pending'
                }
            });

            if (existingRequest) {
                throw new AppError(400, 'FriendRequestAlreadyExists');
            }

            // Verificar que no sean ya amigos
            const areFriends = await verifyFriendshipUtil(sender_id, receiver_id);
            if (areFriends) {
                throw new AppError(400, 'UsersAlreadyFriends');
            }

            // Crear la solicitud
            const friendRequest = await FriendRequest.create({
                sender_id,
                receiver_id,
                status: 'pending',
                created_from
            });

            return friendRequest;
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            dbLogger.error('[FriendshipService] Error en sendFriendRequest:', { error });
            throw new AppError(500, 'InternalServerError');
        }
    }

    /**
     * Acepta una solicitud de amistad
     */
    public async acceptFriendRequest(request_id: string, receiver_id: string) {
        try {
            const friendRequest = await FriendRequest.findOne({
                where: {
                    request_id,
                    receiver_id,
                    status: 'pending'
                }
            });

            if (!friendRequest) {
                throw new AppError(404, 'FriendRequestNotFound');
            }

            // Log para depuración
            dbLogger.info('[FriendshipService] Datos de la solicitud:', {
                request_id,
                receiver_id,
                friendRequest: friendRequest.toJSON()
            });

            // Actualizar estado de la solicitud
            await friendRequest.update({ status: 'accepted' });

            // Crear la amistad asegurando que los IDs no sean null
            const requestData = friendRequest.toJSON();
            if (!requestData.sender_id || !requestData.receiver_id) {
                dbLogger.error('[FriendshipService] IDs inválidos:', {
                    sender_id: requestData.sender_id,
                    receiver_id: requestData.receiver_id
                });
                throw new AppError(500, 'InvalidFriendRequestData');
            }

            await Friends.create({
                user1_id: requestData.sender_id,
                user2_id: requestData.receiver_id
            });

            return friendRequest;
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            dbLogger.error('[FriendshipService] Error en acceptFriendRequest:', { error });
            throw new AppError(500, 'InternalServerError');
        }
    }

    /**
     * Rechaza una solicitud de amistad
     */
    public async rejectFriendRequest(request_id: string, receiver_id: string) {
        try {
            const friendRequest = await FriendRequest.findOne({
                where: {
                    request_id,
                    receiver_id,
                    status: 'pending'
                }
            });

            if (!friendRequest) {
                throw new AppError(404, 'FriendRequestNotFound');
            }

            await friendRequest.update({ status: 'rejected' });
            return friendRequest;
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            dbLogger.error('[FriendshipService] Error en rejectFriendRequest:', { error });
            throw new AppError(500, 'InternalServerError');
        }
    }

    /**
     * Obtiene las solicitudes de amistad pendientes de un usuario
     */
    public async getPendingFriendRequests(user_id: string) {
        try {
            const requests = await FriendRequest.findAll({
                where: {
                    receiver_id: user_id,
                    status: 'pending'
                },
                include: [{
                    model: User,
                    as: 'sender',
                    attributes: ['user_id', 'username', 'name', 'profile_picture']
                }],
                order: [['created_at', 'DESC']]
            });

            return requests;
        } catch (error) {
            dbLogger.error('[FriendshipService] Error en getPendingFriendRequests:', { error });
            throw new AppError(500, 'InternalServerError');
        }
    }

    /**
     * Obtiene la lista de amigos de un usuario
     */
    public async getUserFriends(user_id: string) {
        try {
            const friendships = await Friends.findAll({
                where: {
                    [Op.or]: [
                        { user1_id: user_id },
                        { user2_id: user_id }
                    ]
                },
                include: [
                    {
                        model: User,
                        as: 'user1',
                        attributes: ['user_id', 'username', 'name', 'surname', 'email', 'profile_picture', 'bio', 'email_verified', 'is_moderator', 'deleted_at', 'created_at', 'updated_at'],
                        required: true
                    },
                    {
                        model: User,
                        as: 'user2',
                        attributes: ['user_id', 'username', 'name', 'surname', 'email', 'profile_picture', 'bio', 'email_verified', 'is_moderator', 'deleted_at', 'created_at', 'updated_at'],
                        required: true
                    }
                ]
            });

            // Transformar el resultado para devolver la relación y el usuario amigo
            return {
                success: true,
                data: friendships.map(friendship => {
                    const f = friendship.toJSON() as any;
                    const isUser1 = f.user1.user_id === user_id;
                    const amigo = isUser1 ? f.user2 : f.user1;
                    return {
                        friendship_id: f.friendship_id,
                        user1_id: f.user1_id,
                        user2_id: f.user2_id,
                        created_at: f.created_at,
                        user: amigo
                    };
                })
            };
        } catch (error) {
            dbLogger.error('[FriendshipService] Error en getUserFriends:', { error });
            throw new AppError(500, 'InternalServerError');
        }
    }

    /**
     * Elimina una amistad
     */
    public async removeFriendship(user_id: string, friend_id: string) {
        try {
            const friendship = await Friends.findOne({
                where: {
                    [Op.or]: [
                        { user1_id: user_id, user2_id: friend_id },
                        { user1_id: friend_id, user2_id: user_id }
                    ]
                }
            });

            if (!friendship) {
                throw new AppError(404, 'FriendshipNotFound');
            }

            await friendship.destroy();
            return true;
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            dbLogger.error('[FriendshipService] Error en removeFriendship:', { error });
            throw new AppError(500, 'InternalServerError');
        }
    }

    /**
     * Obtiene las solicitudes de amistad enviadas por el usuario
     */
    public async getSentFriendRequests(user_id: string) {
        try {
            const requests = await FriendRequest.findAll({
                where: {
                    sender_id: user_id,
                    status: 'pending'
                },
                include: [{
                    model: User,
                    as: 'receiver',
                    attributes: ['user_id', 'username', 'name', 'profile_picture']
                }],
                order: [['created_at', 'DESC']]
            });

            return requests;
        } catch (error) {
            dbLogger.error('[FriendshipService] Error en getSentFriendRequests:', { error });
            throw new AppError(500, 'InternalServerError');
        }
    }

    /**
     * Obtiene el estado de la relación con otro usuario
     */
    public async getFriendshipStatus(user_id: string, other_user_id: string) {
        try {
            // Verificar si son amigos
            const areFriends = await verifyFriendshipUtil(user_id, other_user_id);
            if (areFriends) {
                return { status: 'friends' };
            }

            // Verificar si hay una solicitud pendiente
            const pendingRequest = await FriendRequest.findOne({
                where: {
                    [Op.or]: [
                        { sender_id: user_id, receiver_id: other_user_id },
                        { sender_id: other_user_id, receiver_id: user_id }
                    ],
                    status: 'pending'
                }
            });

            if (pendingRequest) {
                const requestData = pendingRequest.toJSON();
                return {
                    status: 'pending',
                    request_id: requestData.request_id,
                    is_sender: requestData.sender_id === user_id
                };
            }

            return { status: 'none' };
        } catch (error) {
            dbLogger.error('[FriendshipService] Error en getFriendshipStatus:', { error });
            throw new AppError(500, 'InternalServerError');
        }
    }

    /**
     * Cancela una solicitud de amistad enviada
     */
    public async cancelFriendRequest(request_id: string, sender_id: string) {
        try {
            const friendRequest = await FriendRequest.findOne({
                where: {
                    request_id,
                    sender_id,
                    status: 'pending'
                }
            });

            if (!friendRequest) {
                throw new AppError(404, 'FriendRequestNotFound');
            }

            await friendRequest.update({ status: 'cancelled' });
            return friendRequest;
        } catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            dbLogger.error('[FriendshipService] Error en cancelFriendRequest:', { error });
            throw new AppError(500, 'InternalServerError');
        }
    }

    /**
     * Verifica si dos usuarios son amigos
     */
    public async verifyFriendship(user1_id: string, user2_id: string): Promise<boolean> {
        try {
            return await verifyFriendshipUtil(user1_id, user2_id);
        } catch (error) {
            dbLogger.error('[FriendshipService] Error en verifyFriendship:', { error });
            return false;
        }
    }
}

export const friendshipService = new FriendshipService(); 