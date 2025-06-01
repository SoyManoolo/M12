/**
 * Configuración del entorno
 * 
 * Este archivo contiene las configuraciones globales de la aplicación:
 * - URL base de la API
 * - Endpoints de autenticación
 * 
 * @module environment
 */

export const environment = {
    // URL base de la API, con fallback a localhost
    apiUrl: import.meta.env.VITE_API_URL || 'https://332f-37-133-29-123.ngrok-free.app',
    // Configuración de endpoints de la API
    apiEndpoints: {
        // Endpoints relacionados con autenticación
        auth: {
            login: '/auth/login',      // Endpoint para inicio de sesión
            register: '/auth/register', // Endpoint para registro de usuarios
            logout: '/auth/logout'     // Endpoint para cerrar sesión
        }
    }
}; 