import { FriendRequest, Friends, User, UserBlocks } from '../models';
import { AppError } from '../middlewares/errors/AppError';
import dbLogger from '../config/logger';
import { Op } from 'sequelize';
import { verifyFriendship } from '../utils/modelExists';
import { sequelize } from '../config/database';
import { UserAttributes } from '../types/custom';

export class FriendshipService {
    /** Lista candidatos de amistad sin incluir al usuario actual ni relaciones existentes. */
    public async getFriendSuggestions(userId: string, limit = 20) {
        try {
            const [friendships, requests, blocks] = await Promise.all([
                Friends.findAll({
                    where: { [Op.or]: [{ user1_id: userId }, { user2_id: userId }] },
                    attributes: ['user1_id', 'user2_id']
                }),
                FriendRequest.findAll({
                    where: {
                        [Op.or]: [{ sender_id: userId }, { receiver_id: userId }],
                        status: 'pending'
                    },
                    attributes: ['sender_id', 'receiver_id']
                }),
                // No sugerimos cuentas bloqueadas ni las que han bloqueado al usuario.
                UserBlocks.findAll({
                    where: { [Op.or]: [{ blocker_id: userId }, { blocked_id: userId }] },
                    attributes: ['blocker_id', 'blocked_id']
                })
            ]);

            const excludedIds = new Set<string>([userId]);
            for (const friendship of friendships) {
                const row = friendship.get({ plain: true }) as { user1_id: string; user2_id: string };
                excludedIds.add(row.user1_id === userId ? row.user2_id : row.user1_id);
            }
            for (const request of requests) {
                const row = request.get({ plain: true }) as { sender_id: string; receiver_id: string };
                excludedIds.add(row.sender_id === userId ? row.receiver_id : row.sender_id);
            }
            for (const block of blocks) {
                const row = block.get({ plain: true }) as { blocker_id: string; blocked_id: string };
                excludedIds.add(row.blocker_id === userId ? row.blocked_id : row.blocker_id);
            }

            return await User.findAll({
                where: { user_id: { [Op.notIn]: [...excludedIds] } },
                attributes: ['user_id', 'username', 'name', 'surname', 'profile_picture', 'bio', 'created_at'],
                order: [['created_at', 'DESC']],
                limit
            });
        } catch (error) {
            dbLogger.error('[FriendshipService] Error en getFriendSuggestions:', { error });
            throw new AppError(500, 'InternalServerError');
        }
    }

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
            const areFriends = await verifyFriendship(sender_id, receiver_id);
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
            return await sequelize.transaction(async (transaction) => {
                const friendRequest = await FriendRequest.findOne({
                    where: { request_id, receiver_id, status: 'pending' },
                    transaction,
                    lock: transaction.LOCK.UPDATE
                });

                if (!friendRequest) {
                    throw new AppError(404, 'FriendRequestNotFound');
                }

                const requestData = friendRequest.toJSON();
                if (!requestData.sender_id || !requestData.receiver_id) {
                    throw new AppError(500, 'InvalidFriendRequestData');
                }

                await Friends.create({
                    user1_id: requestData.sender_id,
                    user2_id: requestData.receiver_id
                }, { transaction });
                await friendRequest.update({ status: 'accepted' }, { transaction });

                return friendRequest;
            });
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
                    const f = friendship.toJSON() as {
                        friendship_id: string;
                        user1_id: string;
                        user2_id: string;
                        created_at: Date;
                        user1: UserAttributes;
                        user2: UserAttributes;
                    };
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
            const areFriends = await verifyFriendship(user_id, other_user_id);
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
}

export const friendshipService = new FriendshipService();
