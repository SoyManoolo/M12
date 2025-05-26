import { jwtDecode } from 'jwt-decode';

interface DecodedToken {
  user_id: string;
  username: string;
  name: string;
  surname: string;
  email: string;
  profile_picture: string | null;
  bio: string | null;
  email_verified: boolean;
  is_moderator: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  active_video_call: boolean;
}

export function decodeToken(token: string): DecodedToken | null {
  try {
    const decoded = jwtDecode<{ id: string } & Omit<DecodedToken, 'user_id'>>(token);
    return {
      ...decoded,
      user_id: decoded.id
    };
  } catch (error) {
    console.error('Error al decodificar el token:', error);
    return null;
  }
} 