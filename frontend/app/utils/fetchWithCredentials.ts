/**
 * Utility para hacer fetch con las configuraciones correctas de CORS
 * Automáticamente incluye credentials: 'include' que es necesario
 * para que funcione CORS con el backend
 */

interface FetchOptions extends RequestInit {
    headers?: HeadersInit;
}

/**
 * Wrapper de fetch que automáticamente incluye credentials
 * @param url - URL a la que hacer la petición
 * @param options - Opciones de fetch (se le añadirá credentials: 'include')
 * @returns Promise con la respuesta
 */
export async function fetchWithCredentials(url: string, options: FetchOptions = {}): Promise<Response> {
    return fetch(url, {
        ...options,
        credentials: 'include', // Siempre incluir credentials para CORS
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });
}
