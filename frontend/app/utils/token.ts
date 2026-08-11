import { environment } from '../config/environment';
import { developmentLogger } from './logger';

interface DecodedToken {
    user_id: string;
    username: string;
}

/**
 * Decodifica un token JWT de forma segura para SSR.
 * Usa decodificación manual en el servidor y jwt-decode en el cliente.
 * * @param {string} token - El token JWT a decodificar.
 * @returns {DecodedToken | null} Los datos del token decodificado.
 */
export function decodeToken(token: string): DecodedToken | null {
    // 🛑 Protección de SSR: La librería jwt-decode falla en el servidor
    if (typeof window === 'undefined') {
        // En el servidor (SSR), hacemos una decodificación manual y segura
        try {
            const parts = token.split('.');
            if (parts.length !== 3) return null;
            
            // Decodificación Base64URL del payload (parte 1)
            const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
            
            if (payload.user_id && payload.username) {
                return { user_id: payload.user_id, username: payload.username };
            }
            return null;

        } catch {
            return null;
        }
    } else {
        // En el cliente, usamos decodificación manual también para evitar problemas de bundling
        try {
            const parts = token.split('.');
            if (parts.length !== 3) return null;
            
            // Decodificación Base64URL del payload (parte 1)
            const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
                atob(base64)
                    .split('')
                    .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                    .join('')
            );
            
            const payload = JSON.parse(jsonPayload);
            
            if (payload.user_id && payload.username) {
                return { user_id: payload.user_id, username: payload.username };
            }
            return null;
        } catch {
            return null;
        }
    }
}

/**
 * Función para obtener la información completa del usuario.
 * @param {string} user_id - ID del usuario.
 * @param {string} token - El token de autenticación (pasado como argumento para seguridad SSR).
 * @returns {Promise<any | null>} La información del usuario.
 */
export async function getUserInfo(user_id: string, token: string) { 
    try {
        const response = await fetch(`${environment.apiUrl}/users/${user_id}`, {
            headers: {
                'Content-Type': 'application/json',
                // Usar el token pasado como argumento
                'Authorization': `Bearer ${token}`, 
                // Añadir este encabezado específico para bypasear la advertencia de ngrok
                'Ngrok-Skip-Browser-Warning': 'true'
            }
        });

        const rawContent = await response.text();

        // Verificar si es HTML o JSON
        if (rawContent.includes('<!DOCTYPE html>')) {
            developmentLogger.warn('La API devolvió HTML al solicitar información de usuario.');
            return null;
        }

        // Intentar parsear como JSON
        try {
            const data = JSON.parse(rawContent);
            return data;
        } catch (e) {
            developmentLogger.error('No se pudo procesar la respuesta del usuario.', e);
            return null;
        }
    } catch (error) {
        developmentLogger.error('No se pudo obtener la información del usuario.', error);
        return null;
    }
}
