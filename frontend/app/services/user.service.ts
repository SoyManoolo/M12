import { environment } from '../config/environment';

interface UserProfile {
    user_id: string;
    name: string;
    surname: string;
    username: string;
    email: string;
    profile_picture_url: string | null;
    bio: string | null;
    email_verified: boolean;
    is_moderator: boolean;
    deleted_at: string | null;
    created_at: string;
    updated_at: string;
    active_video_call: boolean;
}

interface ApiResponse<T> {
    success: boolean;
    status: number;
    message: string;
    data?: T;
}

export const userService = {
    /**
     * Obtiene todos los usuarios
     */
    async getAllUsers(token: string): Promise<ApiResponse<UserProfile[]>> {
        try {
            const response = await fetch(`${environment.apiUrl}/users`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error al obtener usuarios:', error);
            return {
                success: false,
                status: 500,
                message: 'Error al conectar con el servidor'
            };
        }
    },

    /**
     * Obtiene un usuario por ID
     */
    async getUserById(userId: string, token: string): Promise<ApiResponse<UserProfile>> {
        try {
            const response = await fetch(`${environment.apiUrl}/users/${userId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error al obtener el perfil:', error);
            return {
                success: false,
                status: 500,
                message: 'Error al conectar con el servidor'
            };
        }
    },

    /**
     * Obtiene un usuario por username
     */
    async getUserByUsername(username: string, token: string): Promise<ApiResponse<UserProfile>> {
        try {
            const response = await fetch(`${environment.apiUrl}/users/username?username=${username}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error al obtener el perfil:', error);
            return {
                success: false,
                status: 500,
                message: 'Error al conectar con el servidor'
            };
        }
    },

    /**
     * Actualiza un usuario por ID
     */
    async updateUserById(userId: string, updateData: Partial<UserProfile>, token: string): Promise<ApiResponse<UserProfile>> {
        try {
            const response = await fetch(`${environment.apiUrl}/users/${userId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updateData),
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error al actualizar el perfil:', error);
            return {
                success: false,
                status: 500,
                message: 'Error al conectar con el servidor'
            };
        }
    },

    /**
     * Actualiza un usuario por username
     */
    async updateUserByUsername(username: string, updateData: Partial<UserProfile>, token: string): Promise<ApiResponse<UserProfile>> {
        try {
            const response = await fetch(`${environment.apiUrl}/users/username?username=${username}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updateData),
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error al actualizar el perfil:', error);
            return {
                success: false,
                status: 500,
                message: 'Error al conectar con el servidor'
            };
        }
    },

    /**
     * Elimina un usuario por ID
     */
    async deleteUserById(userId: string, token: string): Promise<ApiResponse<void>> {
        try {
            const response = await fetch(`${environment.apiUrl}/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error al eliminar el usuario:', error);
            return {
                success: false,
                status: 500,
                message: 'Error al conectar con el servidor'
            };
        }
    },

    /**
     * Elimina un usuario por username
     */
    async deleteUserByUsername(username: string, token: string): Promise<ApiResponse<void>> {
        try {
            const response = await fetch(`${environment.apiUrl}/users/username?username=${username}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error al eliminar el usuario:', error);
            return {
                success: false,
                status: 500,
                message: 'Error al conectar con el servidor'
            };
        }
    }
}; 