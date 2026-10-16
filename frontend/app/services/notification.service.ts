import { environment } from '~/config/environment';

export interface InboxNotification {
  notification_id: string;
  user_id: string;
  type: 'friend_request' | 'message' | 'comment' | 'post';
  related_id: string;
  is_read: boolean;
  created_at: string;
  user?: { user_id: string; username: string };
}

async function request(path: string, method = 'GET') {
  const response = await fetch(`${environment.apiUrl}/notifications${path}`, {
    method,
    credentials: 'include'
  });
  if (!response.ok) throw new Error(`Error de notificaciones (${response.status})`);
  return response;
}

export const notificationService = {
  async list(): Promise<InboxNotification[]> {
    const response = await request('/');
    const result: { success: boolean; data: InboxNotification[] } = await response.json();
    return result.data;
  },
  async markRead(id: string) {
    await request(`/${encodeURIComponent(id)}/read`, 'PATCH');
  },
  async markAllRead() {
    await request('/read-all', 'PATCH');
  },
  async remove(id: string) {
    await request(`/${encodeURIComponent(id)}`, 'DELETE');
  }
};
