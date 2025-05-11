import { io, Socket } from 'socket.io-client';
import { VideoCallEvent } from '~/types/videocall.types';

class SocketService {
  private socket: Socket | null = null;
  private static instance: SocketService;

  private constructor() {}

  public static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  public connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3000', {
          auth: { token },
          transports: ['websocket'],
        });

        this.socket.on('connect', () => {
          console.log('Socket conectado');
          resolve();
        });

        this.socket.on('connect_error', (error) => {
          console.error('Error de conexión:', error);
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  public emit(event: VideoCallEvent, data: any): void {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }

  public on(event: VideoCallEvent, callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  public off(event: VideoCallEvent): void {
    if (this.socket) {
      this.socket.off(event);
    }
  }

  public isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export default SocketService; 