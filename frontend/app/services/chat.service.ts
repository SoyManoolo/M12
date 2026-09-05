// app/services/chat.service.ts

import type { Socket } from 'socket.io-client';
import { environment } from '../config/environment';
import { chatApi } from './chat/api';
import { decodeUserId, loadSocketClient } from './chat/client';
import type { ChatMessage as Message, ChatSummary as Chat, ConnectionStatus, DeliveryStatus, ReadStatus, TypingStatus } from './chat/types';

// ===================================
// INTERFACES
// ===================================

// ===================================
// CLASE CHATSERVICE
// ===================================

class ChatService {
    private socket: Socket | null = null;
    private messageHandlers: ((message: Message) => void)[] = [];
    private deliveryHandlers: ((data: DeliveryStatus) => void)[] = [];
    private readHandlers: ((data: ReadStatus) => void)[] = [];
    private typingHandlers: ((data: TypingStatus) => void)[] = [];
    private connectionHandlers: ((status: ConnectionStatus) => void)[] = [];
    private isConnecting = false;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectDelay = 2000;
    private lastToken: string | null = null;
    private lastUserId: string | null = null;

    // CONSTRUCTOR ELIMINADO para evitar inicialización global del socket en SSR.
    // La inicialización se moverá a initSocket.

    private async initSocket() {
        // Bloqueo de seguridad adicional: Si estamos en el servidor (SSR), no inicializamos el socket.
        if (typeof window === 'undefined') {
            console.warn('Intentando inicializar socket en el servidor (SSR). Ignorando.');
            return;
        }

        if (!this.socket) {
            console.log('🔌 Inicializando cliente de socket.io...');
            console.log('🌐 URL del servidor:', environment.apiUrl);
            const socketIO = await loadSocketClient();
            if (!socketIO) {
                console.error('❌ No se pudo cargar socket.io-client');
                return;
            }
            this.socket = socketIO.io(environment.apiUrl, {
                autoConnect: false,
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
                transports: ['websocket', 'polling']
            });
            console.log('✅ Socket creado para URL:', environment.apiUrl);
            this.setupSocketListeners();
        }
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
                    // Solo marcar como entregado si el token existe
                    if (this.lastToken) {
                        this.markMessageAsDelivered(data.message.id, this.lastToken);
                    }
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

    public async connect(token: string, userId: string) {
        // Asegura la inicialización solo en el cliente
        await this.initSocket();

        if (!this.socket) {
            console.error('Socket no inicializado, posiblemente llamado en SSR');
            return;
        }

        if (this.isConnecting) {
            console.log('Ya hay una conexión en progreso');
            return;
        }

        try {
            const decoded = decodeUserId(token);

            if (!decoded) {
                console.error('❌ No se pudo decodificar el token');
                return;
            }

            if (decoded !== userId) {
                console.error('❌ El token no coincide con el usuario:', {
                    tokenUserId: decoded,
                    providedUserId: userId,
                    message: 'Asegúrate de pasar tu propio user_id, no el del chat'
                });
                return;
            }

            console.log('🚀 Iniciando conexión del socket...');
            console.log('👤 User ID:', decoded);
            this.isConnecting = true;
            this.lastToken = token;
            this.lastUserId = decoded;
            this.socket.auth = { token };

            // Si ya está conectado, desconectar primero para asegurar una conexión limpia
            if (this.socket.connected) {
                console.log('Socket ya conectado, reconectando...');
                this.socket.disconnect();
            }

            // Configurar los listeners antes de conectar (llamado por initSocket, pero lo dejamos por si acaso)
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
        // Asegura la inicialización del socket si es la primera llamada
        this.initSocket();

        if (!this.socket) {
            console.error('Socket no disponible. No se pudo enviar el mensaje.');
            return;
        }

        if (!this.socket.connected) {
            console.log('Socket no conectado, intentando reconectar...');
            // Llama a connect para reconectar y luego, si tiene éxito, se envía.
            // Por simplicidad, solo llamamos a connect y dejamos el reenvío a la lógica de chat/reconexión.
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

    // --- MÉTODOS DE MANEJO DE ESTADO ---

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
        // Asegura la inicialización del socket si es la primera llamada
        this.initSocket();

        if (!this.socket || !token) return;

        // Verificar que el socket está conectado
        if (!this.socket.connected) {
            console.log('Socket no conectado, reconectando...');
            // Obtener el userId del token
            try {
                const decodedToken = decodeUserId(token);
                if (decodedToken) {
                    this.connect(token, decodedToken);
                }
            } catch (error) {
                console.error('Error al decodificar el token para reconexión:', error);
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

    // --- HANDLERS ---

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

    // --- MÉTODOS HTTP ---

    public async getActiveChats(token: string): Promise<Chat[]> {
        try {
            return await chatApi.getActiveChats(token);
        } catch (error) {
            console.error('Error al obtener los chats:', error);
            return [];
        }
    }

    public async getMessages(userId: string, token: string, limit: number = 20, cursor?: string): Promise<{ messages: Message[], nextCursor: string | null }> {
        try {
            return await chatApi.getMessages(userId, token, limit, cursor);
        } catch (error) {
            console.error('Error al obtener mensajes:', error);
            return { messages: [], nextCursor: null };
        }
    }

    public async createMessage(receiverId: string, content: string, token: string, clientMessageId?: string): Promise<Message> {
        // [ ... Implementación de fetch y socket ... ]
        try {
            console.log('Creando mensaje:', { receiverId, content });

            // Asegura la inicialización del socket si es la primera llamada
            this.initSocket();

            // Solo enviar por socket si está conectado, y dejar que el backend maneje la persistencia
            if (this.socket?.connected) {
                console.log('Enviando mensaje por socket');
                // Esperar la respuesta del socket que incluirá el mensaje creado
                return new Promise((resolve, reject) => {
                    const timeout = setTimeout(() => {
                        this.socket?.off('chat-message-sent', handler);
                        reject(new Error('Timeout esperando respuesta del servidor'));
                    }, 5000);

                    const handler = (data: { success: boolean; message: Message; client_message_id?: string }) => {
                        if (data.success && (!clientMessageId || data.client_message_id === clientMessageId)) {
                            clearTimeout(timeout);
                            this.socket?.off('chat-message-sent', handler);
                            resolve(data.message);
                        }
                    };

                    // Se mantiene el listener hasta recibir la confirmación de
                    // este envío; `once` lo eliminaría al confirmar otro envío.
                    this.socket?.on('chat-message-sent', handler);

                    this.socket?.emit('chat-message', {
                        data: {
                            receiver_id: receiverId,
                            content,
                            client_message_id: clientMessageId
                        },
                        token
                    });
                });
            } else {
                // Si no hay socket o no está conectado, usar HTTP
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
        return chatApi.deleteMessage(messageId, token);
    }

    public async markMessageAsDeliveredHttp(messageId: string, token: string): Promise<Message> {
        return chatApi.markDelivered(messageId, token);
    }

    public async markMessageAsReadHttp(messageId: string, token: string): Promise<Message> {
        return chatApi.markRead(messageId, token);
    }
}

// ===================================
// EXPORTACIÓN DE SINGLETON SEGURO
// ===================================

let clientChatService: ChatService | null = null;

/**
 * Obtiene la instancia del ChatService. Asegura que el servicio y su socket
 * SÓLO se inicialicen en el entorno del navegador para prevenir el error TDZ
 * durante el Server Side Rendering (SSR).
 * * En el servidor, devuelve un objeto simulado que sólo permite llamadas a los métodos HTTP seguros.
 */
export const getChatService = (): ChatService => {
    if (typeof window !== 'undefined') {
        if (!clientChatService) {
            clientChatService = new ChatService();
        }
        return clientChatService;
    }

    // Si estamos en el servidor, devolvemos un objeto parcial que solo permite
    // el uso de los métodos seguros basados en Fetch/HTTP.
    const serverInstance = new ChatService();
    return {
        // Métodos seguros para el servidor (HTTP)
        getActiveChats: serverInstance.getActiveChats.bind(serverInstance),
        getMessages: serverInstance.getMessages.bind(serverInstance),
        createMessage: serverInstance.createMessage.bind(serverInstance),
        deleteMessage: serverInstance.deleteMessage.bind(serverInstance),
        markMessageAsDeliveredHttp: serverInstance.markMessageAsDeliveredHttp.bind(serverInstance),
        markMessageAsReadHttp: serverInstance.markMessageAsReadHttp.bind(serverInstance),

        // Métodos de Socket simulados (para evitar errores si se llaman accidentalmente)
        connect: () => { console.warn("ChatService.connect llamado en el servidor. Ignorado."); },
        disconnect: () => { console.warn("ChatService.disconnect llamado en el servidor. Ignorado."); },
        sendMessage: () => { throw new Error("sendMessage solo puede usarse en el cliente."); },
        markMessageAsDelivered: () => { throw new Error("markMessageAsDelivered solo puede usarse en el cliente."); },
        markMessageAsRead: () => { throw new Error("markMessageAsRead solo puede usarse en el cliente."); },
        setTyping: () => { throw new Error("setTyping solo puede usarse en el cliente."); },
        onNewMessage: () => () => { },
        onDeliveryStatus: () => () => { },
        onReadStatus: () => () => { },
        onTyping: () => () => { },
        onConnectionStatus: () => () => { },

    } as unknown as ChatService;
};
