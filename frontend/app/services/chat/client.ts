export async function loadSocketClient(): Promise<typeof import('socket.io-client') | null> {
  return typeof window === 'undefined' ? null : import('socket.io-client');
}
