/**
 * Configuración del entorno
 *
 * Se utiliza VITE_API_URL en todos los entornos
 * Debe estar definida en el .env
 */
export const environment = {
    // Si VITE_API_URL no está definida, lanzamos un error claro.
    apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000',
};

if (!environment.apiUrl) {
    throw new Error('La variable de entorno VITE_API_URL no está definida.');
}