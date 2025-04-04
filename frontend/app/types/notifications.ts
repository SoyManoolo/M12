export interface User {
  user_id: string;
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  password: string;
  profile_picture_url: string | null;
  bio: string | null;
  email_verified: boolean;
  is_moderator: boolean;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  notification_id: string;
  user_id: string;
  type: string;  // e.g., 'friend_request', 'message', 'comment'
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

// Tipos adicionales basados en el esquema
export interface Post {
  post_id: string;
  user_id: string;
  description: string;
  media_url: string | null;
  created_at: string;
  updated_at: string;
  user?: User;
}

export interface PostLike {
  like_id: string;
  post_id: string;
  user_id: string;
  created_at: string;
}

export interface PostComment {
  comment_id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

export interface VideoCall {
  call_id: string;
  user1_id: string;
  user2_id: string;
  started_at: string;
  ended_at: string | null;
  call_duration: string | null;
  status: string;
  match_status: boolean;
}

export interface FriendRequest {
  request_id: string;
  sender_id: string;
  receiver_id: string;
  status: string;  // 'pending', 'accepted', 'rejected'
  created_at: string;
}

export interface ChatMessage {
  message_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface UserBlock {
  block_id: string;
  blocker_id: string;
  blocked_id: string;
  created_at: string;
}

export interface VideoCallRating {
  rating_id: string;
  video_call_id: string;
  rater_id: string;
  rated_id: string;
  rating: number;
  created_at: string;
}

export interface Report {
  report_id: string;
  reporter_id: string;
  reported_user_id: string;
  report_type: string;
  related_id: string;
  reason: string;
  created_at: string;
}

export interface ContentModeration {
  moderation_id: string;
  moderator_id: string;
  reported_user_id: string;
  report_reason: string;
  action_taken: string;
  created_at: string;
}

export interface SavedPost {
  save_id: string;
  user_id: string;
  post_id: string;
  created_at: string;
} 