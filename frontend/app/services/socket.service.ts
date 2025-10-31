import type { Socket } from 'socket.io-client';
import { environment } from '~/config/environment';

// Función helper para cargar socket.io solo en el cliente con import dinámico
async function getSocketIO(): Promise<typeof import('socket.io-client') | null> {
    if (typeof window === 'undefined') {
        return null;
    }
    // Usar import dinámico en lugar de require para Vite
    const socketIO = await import('socket.io-client');
    return socketIO;
}

class SocketService {
    private static instance: SocketService;
    private socket: Socket | null = null;
    private connectCallbacks: Array<() => void> = [];

    private constructor() { }

    public static getInstance(): SocketService {
        if (!SocketService.instance) {
            SocketService.instance = new SocketService();
        }
        return SocketService.instance;
    }

    public async connect(token: string): Promise<void> {
        // Protección SSR
        if (typeof window === 'undefined') {
            console.warn('Socket.connect llamado en SSR, ignorando.');
            return;
        }

        if (this.socket?.connected) {
            console.log('Socket ya conectado.');
            this.connectCallbacks.forEach(cb => cb());
            this.connectCallbacks = [];
            return;
        }

        if (this.socket?.connected) {
            console.log('Socket ya está intentando conectar.');
            return;
        }

        console.log('Intentando conectar a Socket.IO en:', environment.apiUrl);
        
        const socketIO = await getSocketIO();
        if (!socketIO) {
            console.error('No se pudo cargar socket.io-client');
            return;
        }

        this.socket = socketIO.io(environment.apiUrl, {
            auth: { token },
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        this.setupConnectionHandlers();
    }

    private setupConnectionHandlers(): void {
        if (!this.socket) return;

        this.socket.on('connect', () => {
            console.log('Conectado al servidor de Socket.IO con ID:', this.socket?.id);
            this.connectCallbacks.forEach(cb => cb());
            this.connectCallbacks = [];
        });

        this.socket.on('disconnect', (reason) => {
            console.warn('Desconectado del servidor Socket.IO:', reason);
        });

        this.socket.on('connect_error', (error) => {
            console.error('Error de conexión Socket.IO:', error.message);
        });

    }

    public disconnect(): void {
        if (this.socket) {
            console.log('Desconectando socket...');
            this.socket.disconnect();
        }
    }

    public emit(event: string, data: any): void {
        if (!this.socket?.connected) {
            console.error('Socket no conectado. No se puede emitir el evento:', event, data);
            return;
        }
        this.socket.emit(event, data);
    }

    public on(event: string, callback: (data: any) => void): void {
        if (!this.socket) {
            console.warn('Socket no inicializado al intentar registrar listener para:', event);
            return;
        }
        this.socket.on(event, callback);
    }

    public off(event: string, callback?: (data: any) => void): void {
        if (!this.socket) {
            return;
        }
        this.socket.off(event, callback);
    }

    public isConnected(): boolean {
        return this.socket?.connected || false;
    }

    public getSocketId(): string | undefined {
        return this.socket?.id;
    }

    public onConnect(callback: () => void): void {
        if (this.socket?.connected) {
            callback();
            return;
        }
        if (this.socket) {
            this.socket.on('connect', callback);
        } else {
            this.connectCallbacks.push(callback);
            console.warn("Socket no existe al registrar onConnect. El callback se ejecutará después de llamar a connect() y que la conexión sea exitosa.");
        }
    }
}

export default SocketService;