import { io, Socket } from 'socket.io-client';
import { jwtDecode } from 'jwt-decode';

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
  private baseUrl = 'http://localhost:3000';
  private isConnecting = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 2000;
  private lastToken: string | null = null;
  private lastUserId: string | null = null;

  constructor() {
    this.socket = io(this.baseUrl, {
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
    this.socket.off('connect');
    this.socket.off('disconnect');
    this.socket.off('connect_error');
    this.socket.off('connection-success');
    this.socket.off('new-message');
    this.socket.off('chat-message-sent');
    this.socket.off('message-received');
    this.socket.off('message-delivery-status');
    this.socket.off('message-read-status');
    this.socket.off('user-typing');
    this.socket.off('error');

    this.socket.on('connect', () => {
      console.log('Socket conectado');
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      
      if (this.lastUserId && this.lastToken) {
        console.log('Enviando join-user con:', { userId: this.lastUserId });
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
        this.connectionHandlers.forEach(handler => handler('connected'));
      } else {
        console.error('Error al conectar:', data.error);
        this.connectionHandlers.forEach(handler => handler('disconnected'));
      }
    });

    // Manejar mensajes nuevos
    this.socket.on('new-message', (data: { message: Message }) => {
      console.log('Nuevo mensaje recibido:', data.message);
      this.messageHandlers.forEach(handler => handler(data.message));
    });

    // Manejar confirmación de envío
    this.socket.on('chat-message-sent', (data: { success: boolean; message: Message }) => {
      console.log('Mensaje enviado:', data.message);
      // No emitir el mensaje aquí, ya que se maneja en new-message
    });

    // Manejar confirmación de recepción
    this.socket.on('message-received', (data: { message: Message }) => {
      console.log('Mensaje recibido:', data.message);
      // No emitir el mensaje aquí, ya que se maneja en new-message
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
      const decoded = jwtDecode(token) as { id: string };
      
      if (decoded.id !== userId) {
        console.error('El token no coincide con el usuario:', {
          tokenId: decoded.id,
          userId
        });
        return;
      }

      console.log('Iniciando conexión del socket...');
      this.isConnecting = true;
      this.lastToken = token;
      this.lastUserId = userId;
      this.socket.auth = { token };

      // Si ya está conectado, emitir join-user directamente
      if (this.socket.connected) {
        console.log('Socket ya conectado, enviando join-user...');
        this.socket.emit('join-user', { userId, token });
      } else {
        console.log('Conectando socket...');
        this.socket.connect();
      }

    } catch (error) {
      console.error('Error al conectar el socket:', error);
      this.isConnecting = false;
      this.connectionHandlers.forEach(handler => handler('disconnected'));
    }
  }

  public disconnect() {
    if (!this.socket) return;
    
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.lastToken = null;
    this.lastUserId = null;
    
    // Remover todos los listeners
    this.socket.off('connect');
    this.socket.off('disconnect');
    this.socket.off('new-message');
    this.socket.off('chat-message-sent');
    this.socket.off('message-received');
    this.socket.off('message-delivery-status');
    this.socket.off('message-read-status');
    this.socket.off('user-typing');
    this.socket.off('error');
    
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
  }

  public onDeliveryStatus(handler: (data: DeliveryStatus) => void) {
    this.deliveryHandlers.push(handler);
  }

  public onReadStatus(handler: (data: ReadStatus) => void) {
    this.readHandlers.push(handler);
  }

  public onTyping(handler: (data: { userId: string; isTyping: boolean }) => void) {
    this.typingHandlers.push(handler);
  }

  public removeMessageHandler(handler: (message: Message) => void) {
    this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
  }

  public removeDeliveryHandler(handler: (data: DeliveryStatus) => void) {
    this.deliveryHandlers = this.deliveryHandlers.filter(h => h !== handler);
  }

  public removeReadHandler(handler: (data: ReadStatus) => void) {
    this.readHandlers = this.readHandlers.filter(h => h !== handler);
  }

  public removeTypingHandler(handler: (data: { userId: string; isTyping: boolean }) => void) {
    this.typingHandlers = this.typingHandlers.filter(h => h !== handler);
  }

  public async getActiveChats(token: string): Promise<Chat[]> {
    try {
      // Primero obtenemos la lista de usuarios
      const usersResponse = await fetch(`${this.baseUrl}/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!usersResponse.ok) {
        throw new Error('Error al obtener los usuarios');
      }

      const usersData = await usersResponse.json();
      const users = usersData.data.users;

      // Luego obtenemos los chats activos
      const chatsResponse = await fetch(`${this.baseUrl}/chat/list`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      let activeChats: Chat[] = [];
      if (chatsResponse.ok) {
        const chatsData = await chatsResponse.json();
        activeChats = chatsData.data;
      }

      // Creamos un mapa de chats activos por user_id para búsqueda rápida
      const activeChatsMap = new Map(
        activeChats.map(chat => [chat.other_user.user_id, chat])
      );

      // Para cada usuario, creamos un chat si no existe
      const allChats = users.map((user: ChatUser) => {
        const existingChat = activeChatsMap.get(user.user_id);
        if (existingChat) {
          return existingChat;
        }

        // Si no existe un chat, creamos uno vacío
        return {
          other_user: {
            user_id: user.user_id,
            username: user.username,
            name: user.name,
            surname: user.surname,
            profile_picture: user.profile_picture
          },
          last_message: {
            id: '',
            content: '',
            sender_id: '',
            receiver_id: '',
            created_at: new Date().toISOString(),
            is_delivered: false,
            delivered_at: null,
            read_at: null
          },
          unread_count: 0
        };
      });

      return allChats;
    } catch (error) {
      console.error('Error al obtener chats:', error);
      return [];
    }
  }

  public async getMessages(userId: string, token: string, limit: number = 20, cursor?: string): Promise<{ messages: Message[], nextCursor: string | null }> {
    try {
      let url = `${this.baseUrl}/chat?receiver_id=${userId}&limit=${limit}`;
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
      // Enviar el mensaje por socket
      if (this.socket?.connected) {
        this.socket.emit('chat-message', {
          data: {
            receiver_id: receiverId,
            content
          },
          token
        });
      }

      // También guardar en el backend por HTTP
      const response = await fetch(`${this.baseUrl}/chat`, {
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
    } catch (error) {
      console.error('Error al crear mensaje:', error);
      throw error;
    }
  }

  public async deleteMessage(messageId: string, token: string): Promise<{ result: boolean, message_id: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/${messageId}`, {
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
      const response = await fetch(`${this.baseUrl}/chat/${messageId}/delivered`, {
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
      const response = await fetch(`${this.baseUrl}/chat/${messageId}/read`, {
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

  public onConnectionStatus(handler: (status: 'connected' | 'disconnected' | 'reconnecting') => void) {
    this.connectionHandlers.push(handler);
    return () => {
      this.connectionHandlers = this.connectionHandlers.filter(h => h !== handler);
    };
  }
}

export const chatService = new ChatService(); 