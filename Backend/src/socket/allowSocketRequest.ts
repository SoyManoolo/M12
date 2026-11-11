import { ALLOWED_ORIGINS } from '../config/cors';

type SocketRequest = { headers: { origin?: string; cookie?: string } };

// El navegador puede enviar cookies durante el handshake, incluso por WebSocket.
// Sin Origin solo se admiten clientes sin cookies (por ejemplo, clientes nativos).
export function allowSocketRequest(request: SocketRequest): boolean {
    const { origin, cookie } = request.headers;
    return origin ? ALLOWED_ORIGINS.includes(origin) : !cookie;
}
