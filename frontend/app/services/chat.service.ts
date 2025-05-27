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
  private deliveryHandlers: ((data: { message_id: string; status: string }) => void)[] = [];
  private readHandlers: ((data: { message_id: string; status: string }) => void)[] = [];
  private typingHandlers: ((data: { userId: string; isTyping: boolean }) => void)[] = [];
  private baseUrl = 'http://localhost:3000';
  private isConnecting = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 2;
  private reconnectDelay = 2000;
  private lastToken: string | null = null;

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

    this.socket.on('connect', () => {
      console.log('Socket conectado');
      this.isConnecting = false;
    });

    this.socket.on('disconnect', () => {
      console.log('Socket desconectado');
    });

    this.socket.on('new-message', (data: { message: Message }) => {
      console.log('Nuevo mensaje recibido:', data.message);
      requestAnimationFrame(() => {
        this.messageHandlers.forEach(handler => handler(data.message));
      });
    });

    this.socket.on('chat-message-sent', (data: { success: boolean; message: Message }) => {
      console.log('Mensaje enviado:', data.message);
      requestAnimationFrame(() => {
        this.messageHandlers.forEach(handler => handler(data.message));
      });
    });

    this.socket.on('message-received', (data: { message: Message }) => {
      console.log('Mensaje recibido:', data.message);
      this.messageHandlers.forEach(handler => handler(data.message));
    });

    this.socket.on('message-delivery-status', (data) => {
      console.log('Estado de entrega actualizado:', data);
      this.deliveryHandlers.forEach(handler => handler(data));
    });

    this.socket.on('message-read-status', (data) => {
      console.log('Estado de lectura actualizado:', data);
      this.readHandlers.forEach(handler => handler(data));
    });

    this.socket.on('user-typing', (data) => {
      console.log('Estado de escritura actualizado:', data);
      this.typingHandlers.forEach(handler => handler(data));
    });

    this.socket.on('error', (error) => {
      console.error('Error del socket:', error);
      
      // Solo manejar errores críticos
      if (error.type === 'UserNotAuthenticated' || error.type === 'InvalidToken') {
        this.isConnecting = false;
        this.socket?.disconnect();
      }
    });
  }

  public connect(token: string, userId: string) {
    if (!this.socket || this.isConnecting) return;

    try {
      // Decodificar el token para obtener el ID del usuario
      const decoded = jwtDecode(token) as { id: string };
      
      // Verificar que el token pertenece al usuario correcto
      if (decoded.id !== userId) {
        console.error('El token no coincide con el usuario:', {
          tokenId: decoded.id,
          userId
        });
        return;
      }

      this.isConnecting = true;
      
      // Configurar la autenticación del socket
      this.socket.auth = { token };
      
      // Conectar el socket
      this.socket.connect();

      // Configurar el manejador de conexión exitosa
      this.socket.on('connect', () => {
        console.log('Socket conectado');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        
        // Unirse a la sala del usuario
        this.socket?.emit('join-user', { userId, token });
      });

      // Configurar el manejador de reconexión
      this.socket.on('connect_error', (error) => {
        console.error('Error de conexión:', error);
        this.isConnecting = false;
        
        if (error.message === 'InvalidToken') {
          // Si el token es inválido, no intentar reconectar
          this.socket?.disconnect();
          return;
        }
        
        // Intentar reconectar después de un retraso
        setTimeout(() => {
          if (this.socket && !this.socket.connected) {
            this.connect(token, userId);
          }
        }, this.reconnectDelay);
      });

    } catch (error) {
      console.error('Error al conectar el socket:', error);
      this.isConnecting = false;
    }
  }

  public disconnect() {
    if (!this.socket) return;
    
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.lastToken = null;
    
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

    // Verificar que el socket está conectado
    if (!this.socket.connected) {
      console.log('Socket no conectado, reconectando...');
      this.connect(token, receiverId);
      return;
    }

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

  public onDeliveryStatus(handler: (data: { message_id: string; status: string }) => void) {
    this.deliveryHandlers.push(handler);
  }

  public onReadStatus(handler: (data: { message_id: string; status: string }) => void) {
    this.readHandlers.push(handler);
  }

  public onTyping(handler: (data: { userId: string; isTyping: boolean }) => void) {
    this.typingHandlers.push(handler);
  }

  public removeMessageHandler(handler: (message: Message) => void) {
    this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
  }

  public removeDeliveryHandler(handler: (data: { message_id: string; status: string }) => void) {
    this.deliveryHandlers = this.deliveryHandlers.filter(h => h !== handler);
  }

  public removeReadHandler(handler: (data: { message_id: string; status: string }) => void) {
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
}

export const chatService = new ChatService(); 