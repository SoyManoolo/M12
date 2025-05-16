import { io, Socket } from 'socket.io-client';
import { environment } from '~/config/environment';

class SocketService {
  private static instance: SocketService;
  private socket: Socket | null = null;

  private constructor() {}

  public static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  public connect(token: string): void {
    if (this.socket?.connected) return;

    this.socket = io(environment.apiUrl, {
      auth: {
        token
      },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    this.setupConnectionHandlers();
  }

  private setupConnectionHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Conectado al servidor de Socket.IO');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Desconectado del servidor:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Error de conexión:', error);
    });
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  public emit(event: string, data: any): void {
    if (!this.socket?.connected) {
      console.error('No hay conexión con el servidor');
      return;
    }
    this.socket.emit(event, data);
  }

  public on(event: string, callback: (data: any) => void): void {
    if (!this.socket) {
      console.error('Socket no inicializado');
      return;
    }
    this.socket.on(event, callback);
  }

  public off(event: string, callback?: (data: any) => void): void {
    if (!this.socket) {
      console.error('Socket no inicializado');
      return;
    }
    this.socket.off(event, callback);
  }
}

export default SocketService; 