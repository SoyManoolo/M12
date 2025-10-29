import { environment } from '../config/environment';

interface DecodedToken {
    user_id: string;
    username: string;
}

// -------------------------------------------------------------------------
// Definición de tipo para jwt-decode cargado dinámicamente
// Esto soluciona el error ts(2347) al usar 'require'.
// -------------------------------------------------------------------------
type JwtDecodeFunction = <T = unknown>(token: string, options?: unknown) => T;

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

        } catch (error) {
            // console.error('Error al decodificar el token en SSR:', error); 
            return null;
        }
    } else {
        // En el cliente, usamos jwt-decode (se carga dinámicamente)
        try {
            // 🛑 CARGA DINÁMICA: Usamos 'require' para asegurar que la librería solo se carga en el cliente.
            // USAMOS LA CONVERSIÓN 'as JwtDecodeFunction' PARA SOLUCIONAR EL ERROR ts(2347)
            const { jwtDecode } = require('jwt-decode'); 
            const decoded = (jwtDecode as JwtDecodeFunction)<DecodedToken>(token);
            return decoded;
        } catch (error) {
            // console.error('Error al decodificar el token en el cliente:', error);
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
        console.log(`Intentando obtener usuario desde: ${environment.apiUrl}/users/${user_id}`);

        const response = await fetch(`${environment.apiUrl}/users/${user_id}`, {
            headers: {
                'Content-Type': 'application/json',
                // Usar el token pasado como argumento
                'Authorization': `Bearer ${token}`, 
                // Añadir este encabezado específico para bypasear la advertencia de ngrok
                'Ngrok-Skip-Browser-Warning': 'true'
            }
        });

        console.log('Headers de respuesta:', {
            status: response.status,
            contentType: response.headers.get('content-type'),
            server: response.headers.get('server')
        });

        const rawContent = await response.text();

        // Verificar si es HTML o JSON
        if (rawContent.includes('<!DOCTYPE html>')) {
            console.log('Aún recibiendo HTML a pesar del header de ngrok');
            console.log(rawContent.substring(0, 200) + '...');
            return null;
        }

        // Intentar parsear como JSON
        try {
            const data = JSON.parse(rawContent);
            console.log('Respuesta JSON recibida correctamente');
            return data;
        } catch (e) {
            console.error('Error al parsear JSON:', e);
            return null;
        }
    } catch (error) {
        console.error('Error al obtener información del usuario:', error);
        return null;
    }
}