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
        console.log(`Intentando obtener usuario desde: ${environment.apiUrl}/users/${user_id}`);

        const response = await fetch(`${environment.apiUrl}/users/${user_id}`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                // Añadir este encabezado específico para bypasear la advertencia de ngrok
                'Ngrok-Skip-Browser-Warning': 'true'
            }
        });

        console.log('Headers de respuesta:', {
            status: response.status,
            contentType: response.headers.get('content-type'),
            server: response.headers.get('server')
        });

        // El resto del código puede mantenerse igual
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