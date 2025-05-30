/**
 * @file user.types.ts
 * @description Tipos relacionados con el usuario
 */

export interface UserProfile {
  user_id: string;
  username: string;
  email: string;
  name: string;
  surname: string;
  bio?: string;
  profile_picture?: string;
  email_verified: boolean;
  is_moderator: boolean;
  id_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserResponse {
  user_id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  bio?: string;
  profile_picture_url?: string;
  email_verified: boolean;
  is_moderator: boolean;
  id_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApiResponse<T> {
  success: boolean;
  status: number;
  message: string;
  data: T;
}

export interface User {
  user_id: string;
  username: string;
  name: string;
  surname: string;
  email: string;
  profile_picture: string | null;
  bio: string | null;
  email_verified: boolean;
  is_moderator: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  active_video_call: boolean;
}

export interface Friend {
  friendship_id: string;
  user1_id: string;
  user2_id: string;
  created_at: string;
  user: User;
}

export interface PaginatedUsersResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
} 