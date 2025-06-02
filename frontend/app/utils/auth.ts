/**
 * Obtiene el token de autenticación de la sesión
 */
export async function getToken(request: Request): Promise<string | null> {
    const cookieHeader = request.headers.get('Cookie');
    if (!cookieHeader) return null;

    const cookies = Object.fromEntries(
        cookieHeader.split('; ').map(cookie => {
            const [name, value] = cookie.split('=');
            return [name, value];
        })
    );

    return cookies.token || null;
}

/**
 * Guarda el token en las cookies
 */
export function setToken(token: string): void {
    document.cookie = `token=${token}; path=/; max-age=2592000; SameSite=Lax`;
}

/**
 * Elimina el token de las cookies
 */
export function removeToken(): void {
    document.cookie = 'token=; path=/; max-age=0; SameSite=Lax';
}

/**
 * Verifica si el usuario está autenticado
 */
export function isAuthenticated(): boolean {
    return document.cookie.includes('token=');
} 