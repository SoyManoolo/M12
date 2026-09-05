export interface ChatMessage {
  id: string;
  content: string;
  sender_id: string;
  receiver_id: string;
  created_at: string;
  is_delivered: boolean;
  delivered_at: string | null;
  read_at: string | null;
  // Solo se incluye en eventos en tiempo real para correlacionar un envío local.
  client_message_id?: string;
}

export interface DeliveryStatus {
  message_id: string;
  status: string;
  delivered_at?: string;
}

export interface ReadStatus {
  message_id: string;
  status: string;
  read_at?: string;
}

export interface ChatUser {
  user_id: string;
  username: string;
  name: string;
  surname: string;
  profile_picture: string | null;
}

export interface ChatSummary {
  other_user: ChatUser;
  last_message: ChatMessage;
  unread_count: number;
}

export type ConnectionStatus = 'connected' | 'disconnected' | 'reconnecting';
export type TypingStatus = { userId: string; isTyping: boolean };
