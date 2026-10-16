import { FriendRequest, Notifications, User } from '../models';
import { AppError } from '../middlewares/errors/AppError';
import { Op } from 'sequelize';

export class NotificationService {
    public async list(userId: string) {
        const notifications = await Notifications.findAll({
            where: { user_id: userId },
            order: [['created_at', 'DESC']],
            attributes: ['notification_id', 'user_id', 'type', 'related_id', 'is_read', 'created_at']
        });
        const requestIds = notifications
            .filter(notification => notification.getDataValue('type') === 'friend_request')
            .map(notification => notification.getDataValue('related_id') as string);
        const requests = requestIds.length ? await FriendRequest.findAll({
            where: { request_id: { [Op.in]: requestIds }, receiver_id: userId, status: 'pending' },
            attributes: ['request_id', 'sender_id'],
            include: [{ model: User, as: 'sender', attributes: ['user_id', 'username'] }]
        }) : [];
        const senders = new Map(requests.map(request => {
            const row = request.get({ plain: true }) as { request_id: string; sender?: { user_id: string; username: string } };
            return [row.request_id, row.sender] as const;
        }));
        return notifications.map(notification => {
            const row = notification.get({ plain: true }) as {
                notification_id: string; user_id: string; type: string; related_id: string;
                is_read: boolean; created_at: Date;
            };
            return { ...row, user: row.type === 'friend_request' ? senders.get(row.related_id) : undefined };
        });
    }

    public async markRead(userId: string, notificationId: string) {
        const [updated] = await Notifications.update({ is_read: true }, {
            where: { notification_id: notificationId, user_id: userId }
        });
        if (!updated) {
            const owned = await Notifications.count({ where: { notification_id: notificationId, user_id: userId } });
            if (!owned) throw new AppError(404, 'NotificationNotFound');
        }
    }

    public async markAllRead(userId: string) {
        await Notifications.update({ is_read: true }, { where: { user_id: userId, is_read: false } });
    }

    public async remove(userId: string, notificationId: string) {
        const removed = await Notifications.destroy({ where: { notification_id: notificationId, user_id: userId } });
        if (!removed) throw new AppError(404, 'NotificationNotFound');
    }
}

export const notificationService = new NotificationService();
