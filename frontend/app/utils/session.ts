const TOKEN_KEY = 'token';

/** Obtiene el token sin asumir qué almacenamiento pudo usar el navegador. */
export function getSessionToken(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    const token = window.localStorage.getItem(TOKEN_KEY);
    if (token) return token;
  } catch {
    // Algunos navegadores bloquean localStorage; se prueba sessionStorage.
  }

  try {
    return window.sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

/** Guarda la sesión persistentemente cuando es posible, o por pestaña como respaldo. */
export function setSessionToken(token: string): void {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(TOKEN_KEY, token);
    try {
      window.sessionStorage.removeItem(TOKEN_KEY);
    } catch {
      // No hace falta un respaldo si localStorage funcionó.
    }
    return;
  } catch {
    // Continúa con sessionStorage cuando localStorage no está disponible.
  }

  try {
    window.sessionStorage.setItem(TOKEN_KEY, token);
  } catch {
    // El estado de React seguirá manteniendo la sesión durante esta carga.
  }
}

/** Elimina la sesión de ambos posibles almacenamientos. */
export function clearSessionToken(): void {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Se intenta limpiar el segundo almacenamiento igualmente.
  }
  try {
    window.sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    // No hay más almacenamientos que limpiar.
  }
}
