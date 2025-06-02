import { Notifications } from '../models/Notifications';
import { User } from '../models/User';
import { FriendRequest } from '../models/FriendRequest';
import { FriendRequestAttributes } from '../types/custom';
import { Op } from 'sequelize';
import dbLogger from '../config/logger';
import { friendshipService } from './friendship';

interface FriendRequestWithUser extends FriendRequest {
    sender?: User;
}

export class NotificationService {
    private friendshipService = friendshipService;

    async getUserNotifications(userId: string) {
        try {
            // Obtener solicitudes de amistad pendientes
            const friendRequests = await FriendRequest.findAll({
                where: {
                    receiver_id: userId,
                    status: 'pending'
                },
                include: [{
                    model: User,
                    as: 'sender',
                    attributes: ['user_id', 'username', 'name', 'profile_picture']
                }],
                order: [['created_at', 'DESC']]
            }) as FriendRequestWithUser[];

            // Verificar que no existan amistades duplicadas
            const uniqueRequests = await Promise.all(
                friendRequests.map(async (request) => {
                    const requestData = request.toJSON();
                    // Verificar si ya existe una amistad
                    const areFriends = await this.friendshipService.verifyFriendship(
                        requestData.sender_id,
                        requestData.receiver_id
                    );
                    // Solo incluir la solicitud si no son amigos
                    return areFriends ? null : request;
                })
            );

            // Filtrar las solicitudes nulas (ya son amigos)
            const validRequests = uniqueRequests.filter(Boolean) as FriendRequestWithUser[];

            // Transformar las solicitudes de amistad en notificaciones
            const notifications = validRequests.map(request => ({
                notification_id: `friend_request_${request.get('request_id')}`,
                type: 'friend_request',
                user_id: request.get('sender_id'),
                related_id: request.get('request_id'),
                post_id: null,
                is_read: false,
                severity: 'info',
                created_at: request.get('created_at') || new Date(),
                user: request.sender
            }));

            return {
                success: true,
                data: notifications
            };
        } catch (error: unknown) {
            dbLogger.error('[NotificationService] Error getting user notifications:', error as object);
            return {
                success: false,
                message: 'Error al obtener las notificaciones'
            };
        }
    }

    async markNotificationAsRead(userId: string, notificationId: string) {
        try {
            // Por ahora solo manejamos notificaciones de amistad
            if (notificationId.startsWith('friend_request_')) {
                const requestId = notificationId.replace('friend_request_', '');
                // Aquí podríamos marcar la solicitud como leída si tuviéramos esa columna
                return {
                    success: true,
                    message: 'Notificación marcada como leída'
                };
            }

            return {
                success: false,
                message: 'Tipo de notificación no soportado'
            };
        } catch (error: unknown) {
            dbLogger.error('[NotificationService] Error marking notification as read:', error as object);
            return {
                success: false,
                message: 'Error al marcar la notificación como leída'
            };
        }
    }

    async handleFriendRequest(userId: string, requestId: string, action: 'accept' | 'reject') {
        try {
            if (action === 'accept') {
                await this.friendshipService.acceptFriendRequest(requestId, userId);
            } else {
                await this.friendshipService.rejectFriendRequest(requestId, userId);
            }
            return {
                success: true,
                message: `Solicitud de amistad ${action === 'accept' ? 'aceptada' : 'rechazada'} correctamente`
            };
        } catch (error: unknown) {
            dbLogger.error('[NotificationService] Error handling friend request:', error as object);
            return {
                success: false,
                message: `Error al ${action === 'accept' ? 'aceptar' : 'rechazar'} la solicitud de amistad`
            };
        }
    }
} 