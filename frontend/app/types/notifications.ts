export interface User {
  user_id: string;
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  profile_picture_url: string | null;
  bio: string | null;
}

export interface Notification {
  notification_id: string;
  user_id: string;
  type: 'friend_request' | 'message' | 'comment' | string;
  related_id: string;
  is_read: boolean;
  created_at: string;
  // Campos adicionales para UI
  user?: User;  // Usuario relacionado con la notificación
}

export interface Friend {
  friendship_id: string;
  user1_id: string;
  user2_id: string;
  created_at: string;
  // Campos adicionales para UI
  user?: User;  // Datos del amigo
} 