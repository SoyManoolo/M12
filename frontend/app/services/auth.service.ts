import { environment } from '../config/environment';

/**
 * Servicio de Autenticación
 * 
 * Este servicio maneja todas las operaciones relacionadas con la autenticación:
 * - Login de usuarios
 * - Registro de nuevos usuarios
 * - Manejo de tokens JWT
 * 
 * @module auth.service
 * @requires ../config/environment
 */

/**
 * Interfaz para las credenciales de inicio de sesión
 * El campo 'identifier' puede ser email o nombre de usuario
 */
interface LoginCredentials {
    identifier: string;  // Email o nombre de usuario
    password: string;    // Contraseña del usuario
}

/**
 * Interfaz para los datos de registro de usuario
 */
interface RegisterData {
    email: string;      // Email del usuario
    username: string;   // Nombre de usuario
    name: string;       // Nombre real
    surname: string;    // Apellido
    password: string;   // Contraseña
}

/**
 * Interfaz para la respuesta de autenticación
 */
interface AuthResponse {
    success: boolean;   // Indica si la operación fue exitosa
    status: number;     // Código de estado HTTP
    token?: string;     // Token JWT (opcional)
    message?: string;   // Mensaje de respuesta (opcional)
}

/**
 * Objeto que contiene los métodos de autenticación
 */
export const authService = {
    /**
     * Inicia sesión con las credenciales proporcionadas
     * 
     * @param {LoginCredentials} credentials - Credenciales de inicio de sesión
     * @returns {Promise<AuthResponse>} Respuesta del servidor
     */
    async login(credentials: LoginCredentials): Promise<AuthResponse> {
        try {
            const response = await fetch(`${environment.apiUrl}${environment.apiEndpoints.auth.login}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(credentials),
            });

            const data = await response.json();
            
            if (!response.ok) {
                return {
                    success: false,
                    status: response.status,
                    message: data.message || 'Error al iniciar sesión'
                };
            }

            return {
                success: true,
                status: response.status,
                token: data.token,
                message: data.message
            };
        } catch (error) {
            console.error('Error en login:', error);
            return {
                success: false,
                status: 500,
                message: 'Error al conectar con el servidor'
            };
        }
    },

    /**
     * Registra un nuevo usuario
     * 
     * @param {RegisterData} userData - Datos del usuario a registrar
     * @returns {Promise<AuthResponse>} Respuesta del servidor
     */
    async register(userData: RegisterData): Promise<AuthResponse> {
        try {
            const response = await fetch(`${environment.apiUrl}${environment.apiEndpoints.auth.register}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData),
            });

            const data = await response.json();
            
            if (!response.ok) {
                return {
                    success: false,
                    status: response.status,
                    message: data.message || 'Error al registrarse'
                };
            }

            return {
                success: true,
                status: response.status,
                token: data.token,
                message: data.message
            };
        } catch (error) {
            console.error('Error en registro:', error);
            return {
                success: false,
                status: 500,
                message: 'Error al conectar con el servidor'
            };
        }
    }
}; 