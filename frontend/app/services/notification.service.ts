import { environment } from '~/config/environment';
import type { Notification } from '~/types/notifications';

class NotificationService {
    private baseUrl = `${environment.apiUrl}/notifications`;

    async getUserNotifications(token: string): Promise<{ success: boolean; data?: Notification[]; message?: string }> {
        try {
            const response = await fetch(this.baseUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error al obtener notificaciones:', error);
            return {
                success: false,
                message: 'Error al obtener las notificaciones'
            };
        }
    }

    async markNotificationAsRead(token: string, notificationId: string): Promise<{ success: boolean; message?: string }> {
        try {
            const response = await fetch(`${this.baseUrl}/${notificationId}/read`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error al marcar notificación como leída:', error);
            return {
                success: false,
                message: 'Error al marcar la notificación como leída'
            };
        }
    }

    async handleFriendRequest(token: string, requestId: string, action: 'accept' | 'reject'): Promise<{ success: boolean; message?: string }> {
        try {
            const response = await fetch(`${this.baseUrl}/friend-request/${requestId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ action })
            });

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error al manejar solicitud de amistad:', error);
            return {
                success: false,
                message: `Error al ${action === 'accept' ? 'aceptar' : 'rechazar'} la solicitud de amistad`
            };
        }
    }
}

export const notificationService = new NotificationService(); 