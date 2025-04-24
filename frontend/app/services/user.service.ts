import { environment } from '../config/environment';

interface UserProfile {
    user_id: string;
    first_name: string;
    last_name: string;
    username: string;
    email: string;
    profile_picture_url: string | null;
    bio: string | null;
    email_verified: boolean;
    is_moderator: boolean;
    id_deleted: boolean;
    created_at: string;
    updated_at: string;
}

export const userService = {
    /**
     * Obtiene el perfil del usuario actual
     * @param token - Token JWT del usuario
     * @returns Promise con los datos del perfil
     */
    async getProfile(token: string): Promise<{ success: boolean; data?: UserProfile; message?: string }> {
        try {
            // Decodificar el token para obtener el ID del usuario
            const tokenPayload = JSON.parse(atob(token.split('.')[1]));
            const userId = tokenPayload.id;

            const response = await fetch(`${environment.apiUrl}/users/${userId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                return {
                    success: false,
                    message: 'Error al obtener el perfil'
                };
            }

            const data = await response.json();
            return {
                success: true,
                data: data.data
            };
        } catch (error) {
            console.error('Error al obtener el perfil:', error);
            return {
                success: false,
                message: 'Error al conectar con el servidor'
            };
        }
    },

    /**
     * Actualiza el perfil del usuario
     * @param token - Token JWT del usuario
     * @param updateData - Datos a actualizar
     * @returns Promise con el resultado de la actualización
     */
    async updateProfile(token: string, updateData: Partial<UserProfile>): Promise<{ success: boolean; data?: UserProfile; message?: string }> {
        try {
            // Decodificar el token para obtener el ID del usuario
            const tokenPayload = JSON.parse(atob(token.split('.')[1]));
            const userId = tokenPayload.id;

            const response = await fetch(`${environment.apiUrl}/users/${userId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updateData),
            });

            if (!response.ok) {
                return {
                    success: false,
                    message: 'Error al actualizar el perfil'
                };
            }

            const data = await response.json();
            return {
                success: true,
                data: data.data
            };
        } catch (error) {
            console.error('Error al actualizar el perfil:', error);
            return {
                success: false,
                message: 'Error al conectar con el servidor'
            };
        }
    }
}; 