/**
 * Configuración del entorno
 * 
 * Este archivo contiene la URL base del backend.
 * Se puede cambiar fácilmente para apuntar a diferentes entornos.
 */

export const environment = {
    // URL base del backend, con fallback a localhost
    apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000'
}; 