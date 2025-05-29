import { environment } from '../config/environment';
import type { UserProfile, ApiResponse, PaginatedUsersResponse } from '../types/user.types';
import { jwtDecode } from 'jwt-decode';
import type { User } from '~/types/user.types';

export const userService = {
    /**
     * Obtiene todos los usuarios
     */
    async getAllUsers(token: string): Promise<ApiResponse<PaginatedUsersResponse>> {
        try {
            const response = await fetch(`${environment.apiUrl}/users`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Error al obtener usuarios');
            }

            const data = await response.json();
            
            // Obtener el ID del usuario actual del token
            const decodedToken = jwtDecode(token) as { user_id: string };
            const currentUserId = decodedToken.user_id;

            // Filtrar el usuario actual de la lista
            const filteredUsers = data.data.users.filter((user: User) => user.user_id !== currentUserId);

            return {
                success: true,
                status: 200,
                message: 'Usuarios obtenidos correctamente',
                data: {
                    users: filteredUsers,
                    total: filteredUsers.length,
                    page: 1,
                    limit: filteredUsers.length,
                    hasMore: false
                }
            };
        } catch (error) {
            console.error('Error al obtener usuarios:', error);
            return {
                success: false,
                status: 500,
                message: 'Error al obtener usuarios',
                data: {
                    users: [],
                    total: 0,
                    page: 1,
                    limit: 0,
                    hasMore: false
                }
            };
        }
    },

    /**
     * Obtiene todos los usuarios incluyendo al administrador actual
     * Esta función es específica para la página de administración
     */
    async getAllUsersForAdmin(token: string): Promise<ApiResponse<PaginatedUsersResponse>> {
        try {
            const response = await fetch(`${environment.apiUrl}/users`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Error al obtener usuarios');
            }

            const data = await response.json();
            
            return {
                success: true,
                status: 200,
                message: 'Usuarios obtenidos correctamente',
                data: {
                    users: data.data.users,
                    total: data.data.users.length,
                    page: 1,
                    limit: data.data.users.length,
                    hasMore: false
                }
            };
        } catch (error) {
            console.error('Error al obtener usuarios:', error);
            return {
                success: false,
                status: 500,
                message: 'Error al obtener usuarios',
                data: {
                    users: [],
                    total: 0,
                    page: 1,
                    limit: 0,
                    hasMore: false
                }
            };
        }
    },

    /**
     * Obtiene un usuario por ID
     */
    async getUserById(userId: string, token: string): Promise<ApiResponse<UserProfile>> {
        try {
            // Si el userId es 'me', decodificamos el token para obtener el ID
            if (userId === 'me') {
                const decoded = jwtDecode(token) as { user_id: string };
                userId = decoded.user_id;
            }

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
                message: 'Error al conectar con el servidor',
                data: {} as UserProfile
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
                message: 'Error al conectar con el servidor',
                data: {} as UserProfile
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
                message: 'Error al conectar con el servidor',
                data: {} as UserProfile
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
                message: 'Error al conectar con el servidor',
                data: {} as UserProfile
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
                message: 'Error al conectar con el servidor',
                data: undefined
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
                message: 'Error al conectar con el servidor',
                data: undefined
            };
        }
    },

    /**
     * Actualiza la foto de perfil del usuario
     */
    async updateProfilePicture(userId: string, file: File, token: string): Promise<ApiResponse<UserProfile>> {
        try {
            const formData = new FormData();
            formData.append('media', file);

            const response = await fetch(`${environment.apiUrl}/users/${userId}/profile-picture`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error al actualizar la foto de perfil:', error);
            return {
                success: false,
                status: 500,
                message: 'Error al conectar con el servidor',
                data: {} as UserProfile
            };
        }
    },

    /**
     * Elimina la foto de perfil del usuario
     */
    async deleteProfilePicture(userId: string, token: string): Promise<ApiResponse<void>> {
        try {
            const response = await fetch(`${environment.apiUrl}/users/${userId}/profile-picture`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error al eliminar la foto de perfil:', error);
            return {
                success: false,
                status: 500,
                message: 'Error al conectar con el servidor',
                data: undefined
            };
        }
    },

    /**
     * Obtiene un usuario por ID o username
     */
    async getUser(params: { user_id?: string; username?: string }, token: string): Promise<ApiResponse<UserProfile>> {
        try {
            let url = `${environment.apiUrl}/users`;
            if (params.user_id) {
                url += `/${params.user_id}`;
            } else if (params.username) {
                url += `/username?username=${params.username}`;
            } else {
                throw new Error('Se requiere user_id o username');
            }

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error al obtener el usuario:', error);
            return {
                success: false,
                status: 500,
                message: 'Error al conectar con el servidor',
                data: {} as UserProfile
            };
        }
    }
}; 