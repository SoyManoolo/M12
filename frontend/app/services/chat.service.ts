import { io, Socket } from 'socket.io-client';
import { jwtDecode } from 'jwt-decode';
import { environment } from '../config/environment';

interface Message {
    id: string;
    content: string;
    sender_id: string;
    receiver_id: string;
    created_at: string;
    is_delivered: boolean;
    delivered_at: string | null;
    read_at: string | null;
}

interface DeliveryStatus {
    message_id: string;
    status: string;
    delivered_at?: string;
}

interface ReadStatus {
    message_id: string;
    status: string;
    read_at?: string;
}

interface ChatUser {
    user_id: string;
    username: string;
    name: string;
    surname: string;
    profile_picture: string | null;
}

interface Chat {
    other_user: ChatUser;
    last_message: Message;
    unread_count: number;
}

class ChatService {
    private socket: Socket | null = null;
    private messageHandlers: ((message: Message) => void)[] = [];
    private deliveryHandlers: ((data: DeliveryStatus) => void)[] = [];
    private readHandlers: ((data: ReadStatus) => void)[] = [];
    private typingHandlers: ((data: { userId: string; isTyping: boolean }) => void)[] = [];
    private connectionHandlers: ((status: 'connected' | 'disconnected' | 'reconnecting') => void)[] = [];
    private isConnecting = false;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectDelay = 2000;
    private lastToken: string | null = null;
    private lastUserId: string | null = null;

    constructor() {
        this.socket = io(environment.apiUrl, {
            autoConnect: false,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            transports: ['websocket', 'polling']
        });

        this.setupSocketListeners();
    }

    private setupSocketListeners() {
        if (!this.socket) return;

        // Limpiar listeners existentes para evitar duplicados
        this.socket.removeAllListeners();

        this.socket.on('connect', () => {
            console.log('Socket conectado');
            this.isConnecting = false;
            this.reconnectAttempts = 0;

            if (this.lastUserId && this.lastToken) {
                console.log('Enviando join-user con:', { userId: this.lastUserId });
                // Asegurarse de que el usuario se una a su sala
                this.socket?.emit('join-user', {
                    userId: this.lastUserId,
                    token: this.lastToken
                });
            }

            this.connectionHandlers.forEach(handler => handler('connected'));
        });

        this.socket.on('disconnect', (reason) => {
            console.log('Socket desconectado:', reason);
            this.isConnecting = false;
            this.connectionHandlers.forEach(handler => handler('disconnected'));

            if (reason !== 'io client disconnect' && this.lastToken && this.lastUserId) {
                this.handleReconnect();
            }
        });

        this.socket.on('connect_error', (error) => {
            console.error('Error de conexión:', error);
            this.isConnecting = false;
            this.connectionHandlers.forEach(handler => handler('reconnecting'));

            if (error.message === 'InvalidToken') {
                console.error('Token inválido, desconectando...');
                this.socket?.disconnect();
                return;
            }

            this.handleReconnect();
        });

        this.socket.on('connection-success', (data) => {
            console.log('Conexión exitosa:', data);
            if (data.status === 'connected') {
                console.log('Usuario unido a su sala:', this.lastUserId);
                this.connectionHandlers.forEach(handler => handler('connected'));
            } else {
                console.error('Error al conectar:', data.error);
                this.connectionHandlers.forEach(handler => handler('disconnected'));
            }
        });

        // Manejar mensajes nuevos
        this.socket.on('new-message', (data: { message: Message }) => {
            console.log('Nuevo mensaje recibido en socket:', data.message);

            // Verificar que el mensaje sea para nosotros o de nosotros usando el ID del token
            if (this.lastUserId &&
                (data.message.sender_id === this.lastUserId ||
                    data.message.receiver_id === this.lastUserId)) {
                console.log('Mensaje válido para este usuario, emitiendo a handlers');
                // Emitir el mensaje a todos los handlers
                this.messageHandlers.forEach(handler => {
                    try {
                        handler(data.message);
                    } catch (error) {
                        console.error('Error en handler de mensaje:', error);
                    }
                });

                // Si el mensaje es nuestro, marcar como entregado
                if (this.lastUserId && data.message.sender_id === this.lastUserId) {
                    console.log('Marcando mensaje como entregado:', data.message.id);
                    this.markMessageAsDelivered(data.message.id, this.lastToken!);
                }
            } else {
                console.log('Mensaje ignorado - no es para este usuario:', {
                    messageUserId: data.message.sender_id,
                    messageReceiverId: data.message.receiver_id,
                    currentUserId: this.lastUserId
                });
            }
        });

        // Manejar confirmación de envío
        this.socket.on('chat-message-sent', (data: { success: boolean; message: Message }) => {
            console.log('Mensaje enviado:', data.message);
            // No necesitamos hacer nada aquí ya que el mensaje se maneja en new-message
        });

        // Manejar estado de entrega
        this.socket.on('message-delivery-status', (data: { message_id: string; status: string; delivered_at?: string }) => {
            console.log('Estado de entrega actualizado:', data);
            if (data.message_id) {
                this.deliveryHandlers.forEach(handler => handler({
                    message_id: data.message_id,
                    status: data.status,
                    delivered_at: data.delivered_at
                }));
            }
        });

        // Manejar estado de lectura
        this.socket.on('message-read-status', (data: { message_id: string; status: string; read_at?: string }) => {
            console.log('Estado de lectura actualizado:', data);
            if (data.message_id) {
                this.readHandlers.forEach(handler => handler({
                    message_id: data.message_id,
                    status: data.status,
                    read_at: data.read_at
                }));
            }
        });

        // Manejar estado de escritura
        this.socket.on('user-typing', (data: { userId: string; isTyping: boolean }) => {
            console.log('Estado de escritura actualizado:', data);
            this.typingHandlers.forEach(handler => handler(data));
        });

        // Manejar estado de usuario
        this.socket.on('user-status', (data: { userId: string; status: string }) => {
            console.log('Estado de usuario actualizado:', data);
            // Aquí podríamos agregar handlers para el estado de usuario si es necesario
        });

        this.socket.on('error', (error) => {
            console.error('Error del socket:', error);

            if (error.type === 'UserNotAuthenticated' || error.type === 'InvalidToken') {
                this.isConnecting = false;
                this.socket?.disconnect();
            }
        });
    }

    private handleReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.log('Máximo número de intentos de reconexión alcanzado');
            this.connectionHandlers.forEach(handler => handler('disconnected'));
            return;
        }

        this.reconnectAttempts++;
        const delay = this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1);

        console.log(`Intentando reconectar en ${delay}ms (intento ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        this.connectionHandlers.forEach(handler => handler('reconnecting'));

        setTimeout(() => {
            if (this.lastToken && this.lastUserId && !this.socket?.connected) {
                this.connect(this.lastToken, this.lastUserId);
            }
        }, delay);
    }

    public connect(token: string, userId: string) {
        if (!this.socket) {
            console.error('Socket no inicializado');
            return;
        }

        if (this.isConnecting) {
            console.log('Ya hay una conexión en progreso');
            return;
        }

        try {
            const decoded = jwtDecode(token) as { user_id: string };

            if (decoded.user_id !== userId) {
                console.error('El token no coincide con el usuario:', {
                    tokenId: decoded.user_id,
                    userId
                });
                return;
            }

            console.log('Iniciando conexión del socket...');
            this.isConnecting = true;
            this.lastToken = token;
            this.lastUserId = decoded.user_id;
            this.socket.auth = { token };

            // Si ya está conectado, desconectar primero para asegurar una conexión limpia
            if (this.socket.connected) {
                console.log('Socket ya conectado, reconectando...');
                this.socket.disconnect();
            }

            // Configurar los listeners antes de conectar
            this.setupSocketListeners();

            // Conectar el socket
            console.log('Conectando socket...');
            this.socket.connect();

        } catch (error) {
            console.error('Error al conectar el socket:', error);
            this.isConnecting = false;
            this.connectionHandlers.forEach(handler => handler('disconnected'));
        }
    }

    public disconnect() {
        if (!this.socket) return;

        console.log('Desconectando socket...');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.lastToken = null;
        this.lastUserId = null;

        // Remover todos los listeners
        this.socket.removeAllListeners();

        // Limpiar los handlers
        this.messageHandlers = [];
        this.deliveryHandlers = [];
        this.readHandlers = [];
        this.typingHandlers = [];
        this.connectionHandlers = [];

        this.socket.disconnect();
    }

    public sendMessage(receiverId: string, content: string, token: string) {
        if (!this.socket) return;

        if (!this.socket.connected) {
            console.log('Socket no conectado, reconectando...');
            this.connect(token, receiverId);
            return;
        }

        // Emitir el mensaje una sola vez
        this.socket.emit('chat-message', {
            data: {
                receiver_id: receiverId,
                content
            },
            token
        });
    }

    public markMessageAsDelivered(messageId: string, token: string) {
        if (!this.socket) return;

        this.socket.emit('message-delivered', {
            message_id: messageId,
            status: 'delivered',
            delivered_at: new Date().toISOString(),
            token
        });
    }

    public markMessageAsRead(messageId: string, token: string) {
        if (!this.socket) return;

        this.socket.emit('message-read', {
            message_id: messageId,
            status: 'read',
            read_at: new Date().toISOString(),
            token
        });
    }

    public setTyping(receiverId: string, isTyping: boolean, token: string) {
        if (!this.socket || !token) return;

        // Verificar que el socket está conectado
        if (!this.socket.connected) {
            console.log('Socket no conectado, reconectando...');
            // Obtener el userId del token
            try {
                const decodedToken = JSON.parse(atob(token.split('.')[1]));
                this.connect(token, decodedToken.id);
            } catch (error) {
                console.error('Error al decodificar el token:', error);
                return;
            }
            return;
        }

        this.socket.emit('typing', {
            receiver_id: receiverId,
            isTyping,
            token
        });
    }

    public onNewMessage(handler: (message: Message) => void) {
        this.messageHandlers.push(handler);
        return () => {
            this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
        };
    }

    public onDeliveryStatus(handler: (data: DeliveryStatus) => void) {
        this.deliveryHandlers.push(handler);
        return () => {
            this.deliveryHandlers = this.deliveryHandlers.filter(h => h !== handler);
        };
    }

    public onReadStatus(handler: (data: ReadStatus) => void) {
        this.readHandlers.push(handler);
        return () => {
            this.readHandlers = this.readHandlers.filter(h => h !== handler);
        };
    }

    public onTyping(handler: (data: { userId: string; isTyping: boolean }) => void) {
        this.typingHandlers.push(handler);
        return () => {
            this.typingHandlers = this.typingHandlers.filter(h => h !== handler);
        };
    }

    public onConnectionStatus(handler: (status: 'connected' | 'disconnected' | 'reconnecting') => void) {
        this.connectionHandlers.push(handler);
        return () => {
            this.connectionHandlers = this.connectionHandlers.filter(h => h !== handler);
        };
    }

    public async getActiveChats(token: string): Promise<Chat[]> {
        try {
            const response = await fetch(`${environment.apiUrl}/chat/list`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Error al obtener los chats');
            }

            const responseData = await response.json();

            if (!responseData.success || !responseData.data) {
                throw new Error('Formato de respuesta inválido');
            }

            // Procesar los chats para incluir el sender_id en el último mensaje
            return responseData.data.map((chat: any) => ({
                ...chat,
                last_message: {
                    ...chat.last_message,
                    sender_id: chat.last_message.sender_id // Asegurarnos de que el sender_id esté incluido
                }
            }));
        } catch (error) {
            console.error('Error al obtener los chats:', error);
            return [];
        }
    }

    public async getMessages(userId: string, token: string, limit: number = 20, cursor?: string): Promise<{ messages: Message[], nextCursor: string | null }> {
        try {
            let url = `${environment.apiUrl}/chat?receiver_id=${userId}&limit=${limit}`;
            if (cursor) {
                url += `&cursor=${cursor}`;
            }

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Error al obtener los mensajes');
            }

            const data = await response.json();
            return {
                messages: data.data.messages,
                nextCursor: data.data.nextCursor
            };
        } catch (error) {
            console.error('Error al obtener mensajes:', error);
            return { messages: [], nextCursor: null };
        }
    }

    public async createMessage(receiverId: string, content: string, token: string): Promise<Message> {
        try {
            console.log('Creando mensaje:', { receiverId, content });

            // Solo enviar por socket si está conectado, y dejar que el backend maneje la persistencia
            if (this.socket?.connected) {
                console.log('Enviando mensaje por socket');
                this.socket.emit('chat-message', {
                    data: {
                        receiver_id: receiverId,
                        content
                    },
                    token
                });

                // Esperar la respuesta del socket que incluirá el mensaje creado
                return new Promise((resolve, reject) => {
                    const timeout = setTimeout(() => {
                        reject(new Error('Timeout esperando respuesta del servidor'));
                    }, 5000);

                    const handler = (data: { success: boolean; message: Message }) => {
                        if (data.success) {
                            clearTimeout(timeout);
                            this.socket?.off('chat-message-sent', handler);
                            resolve(data.message);
                        }
                    };

                    this.socket?.once('chat-message-sent', handler);
                });
            } else {
                // Si no hay socket, usar HTTP
                console.log('Socket no conectado, usando HTTP');
                const response = await fetch(`${environment.apiUrl}/chat`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        receiver_id: receiverId,
                        content
                    })
                });

                if (!response.ok) {
                    throw new Error('Error al crear el mensaje');
                }

                const data = await response.json();
                return data.data;
            }
        } catch (error) {
            console.error('Error al crear mensaje:', error);
            throw error;
        }
    }

    public async deleteMessage(messageId: string, token: string): Promise<{ result: boolean, message_id: string }> {
        try {
            const response = await fetch(`${environment.apiUrl}/chat/${messageId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Error al eliminar el mensaje');
            }

            const data = await response.json();
            return data.data;
        } catch (error) {
            console.error('Error al eliminar mensaje:', error);
            throw error;
        }
    }

    public async markMessageAsDeliveredHttp(messageId: string, token: string): Promise<Message> {
        try {
            const response = await fetch(`${environment.apiUrl}/chat/${messageId}/delivered`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Error al marcar mensaje como entregado');
            }

            const data = await response.json();
            return data.data;
        } catch (error) {
            console.error('Error al marcar mensaje como entregado:', error);
            throw error;
        }
    }

    public async markMessageAsReadHttp(messageId: string, token: string): Promise<Message> {
        try {
            const response = await fetch(`${environment.apiUrl}/chat/${messageId}/read`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Error al marcar mensaje como leído');
            }

            const data = await response.json();
            return data.data;
        } catch (error) {
            console.error('Error al marcar mensaje como leído:', error);
            throw error;
        }
    }
}

export const chatService = new ChatService(); 