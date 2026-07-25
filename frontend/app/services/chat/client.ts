export function decodeUserId(token: string): string | null {
  try {
    const payload = token.split('.')[1];
    if (!payload || typeof atob === 'undefined') return null;
    const value: unknown = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return typeof value === 'object' && value !== null && 'user_id' in value && typeof value.user_id === 'string'
      ? value.user_id
      : null;
  } catch {
    return null;
  }
}

export async function loadSocketClient(): Promise<typeof import('socket.io-client') | null> {
  return typeof window === 'undefined' ? null : import('socket.io-client');
}
