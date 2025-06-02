/**
 * Configuración del entorno
 * 
 * Este archivo contiene la URL base del backend.
 * Se puede cambiar fácilmente para apuntar a diferentes entornos.
 */

export const environment = {
    // URL base del backend, con fallback a localhost
    apiUrl: import.meta.env.VITE_API_URL || 'https://332f-37-133-29-123.ngrok-free.app'
    // apiUrl: import.meta.env.VITE_API_URL || 'https://4a3b-37-133-29-123.ngrok-free.app'
}; 