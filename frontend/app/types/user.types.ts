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
  profile_picture_url?: string;
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