export const COOKIE_SESSION = 'cookie-session';

export function legacySessionToken(token: string | null | undefined): string | undefined {
    return token && token !== COOKIE_SESSION ? token : undefined;
}

export function fetchWithSession(url: string | URL, token: string | null | undefined, init: RequestInit = {}): Promise<Response> {
    const headers = new Headers(init.headers);
    const bearer = legacySessionToken(token);
    if (bearer) headers.set('Authorization', `Bearer ${bearer}`);
    return fetch(url, { ...init, headers, credentials: 'include' });
}
