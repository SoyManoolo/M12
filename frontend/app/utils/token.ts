import { jwtDecode } from 'jwt-decode';
import { environment } from '../config/environment';

interface DecodedToken {
  user_id: string;
  username: string;
}

export function decodeToken(token: string): DecodedToken | null {
  try {
    const decoded = jwtDecode<DecodedToken>(token);
    return decoded;
  } catch (error) {
    console.error('Error al decodificar el token:', error);
    return null;
  }
}

// Función para obtener la información completa del usuario
export async function getUserInfo(user_id: string) {
  try {
    const response = await fetch(`${environment.apiUrl}/users/${user_id}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Error al obtener la información del usuario');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error al obtener la información del usuario:', error);
    return null;
  }
}