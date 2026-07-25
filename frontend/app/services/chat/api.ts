import { environment } from '~/config/environment';
import type { ChatMessage, ChatSummary } from './types';

type ApiResponse<T> = { success?: boolean; data: T };

async function request<T>(path: string, token: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${environment.apiUrl}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, ...init.headers },
  });
  if (!response.ok) throw new Error(`Chat request failed (${response.status})`);
  return (await response.json() as ApiResponse<T>).data;
}

export const chatApi = {
  async getActiveChats(token: string): Promise<ChatSummary[]> {
    return request<ChatSummary[]>('/chat/list', token);
  },
  getMessages(userId: string, token: string, limit = 20, cursor?: string) {
    const params = new URLSearchParams({ receiver_id: userId, limit: String(limit) });
    if (cursor) params.set('cursor', cursor);
    return request<{ messages: ChatMessage[]; nextCursor: string | null }>(`/chat?${params}`, token, { credentials: 'include' });
  },
  createMessage(receiverId: string, content: string, token: string) {
    return request<ChatMessage>('/chat', token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ receiver_id: receiverId, content }) });
  },
  deleteMessage(messageId: string, token: string) {
    return request<{ result: boolean; message_id: string }>(`/chat/${messageId}`, token, { method: 'DELETE' });
  },
  markDelivered(messageId: string, token: string) {
    return request<ChatMessage>(`/chat/${messageId}/delivered`, token, { method: 'POST' });
  },
  markRead(messageId: string, token: string) {
    return request<ChatMessage>(`/chat/${messageId}/read`, token, { method: 'POST' });
  },
};
