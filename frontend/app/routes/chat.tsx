/**
 * Página de Chat Individual
 * 
 * Esta página muestra el chat con un usuario específico.
 * Incluye:
 * - Navbar para navegación
 * - Área de chat con mensajes
 * - Información del usuario con quien se chatea
 * 
 * @module Chat
 */

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from '@remix-run/react';
import Navbar from '~/components/Inicio/Navbar';
import ChatUserInfo from '~/components/Chats/ChatUserInfo';
import { FaPaperPlane, FaSmile } from 'react-icons/fa';
import { redirect } from "@remix-run/node";
import type { User } from '~/types/user.types';
import { chatService } from '~/services/chat.service';
import { useAuth } from '~/hooks/useAuth';
import { userService } from '~/services/user.service';
import { jwtDecode } from 'jwt-decode';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  receiver_id: string;
  created_at: string;
  is_delivered: boolean;
  delivered_at: string | null;
  read_at: string | null;
  is_own?: boolean;
}

export const loader = async ({ request }: { request: Request }) => {
  const cookieHeader = request.headers.get("Cookie");
  const token = cookieHeader?.split(";").find((c: string) => c.trim().startsWith("token="))?.split("=")[1];
  if (!token) return redirect("/login");
  return null;
};

export default function Chat() {
  const [searchParams] = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatUser, setChatUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('disconnected');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const { token, user: currentUser } = useAuth();
  const userId = searchParams.get('userId');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // Efecto para manejar la carga inicial
  useEffect(() => {
    if (!token || !userId || !currentUser) {
      console.log('Datos no disponibles:', { 
        noToken: !token, 
        noUserId: !userId,
        noCurrentUser: !currentUser 
      });
      setLoading(false);
      return;
    }

    console.log('Datos disponibles:', { 
      token: !!token, 
      userId, 
      currentUserId: currentUser.user_id 
    });

    let isComponentMounted = true;
    let unsubscribeFunctions: (() => void)[] = [];

    // Definir los handlers de eventos
    const handleNewMessage = (message: Message) => {
      console.log('Manejando nuevo mensaje:', message);
      if (!isComponentMounted) return;
      
      setMessages(prev => {
        // Verificar si el mensaje ya existe usando el ID
        const messageExists = prev.some(msg => msg.id === message.id);
        if (messageExists) {
          console.log('Mensaje ya existe, ignorando:', message.id);
          return prev;
        }

        // Si es un mensaje nuestro, reemplazar cualquier mensaje temporal
        if (message.sender_id === currentUser.user_id) {
          const newMessages = prev.filter(msg => !msg.id.startsWith('temp-'));
          newMessages.push({ ...message, is_own: true });
          return newMessages.sort((a, b) => 
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        }
        
        // Para mensajes de otros usuarios, simplemente agregar
        const newMessages = [...prev, { ...message, is_own: message.sender_id === currentUser.user_id }];
        return newMessages.sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      });

      // Hacer scroll solo si el mensaje es nuevo y no es nuestro
      if (message.sender_id !== currentUser.user_id) {
        setTimeout(scrollToBottom, 100);
      }
    };

    const handleDeliveryStatus = (data: { message_id: string; status: string; delivered_at?: string }) => {
      console.log('Manejando estado de entrega:', data);
      if (!isComponentMounted) return;
      
      setMessages(prev => {
        const messageExists = prev.some(msg => msg.id === data.message_id);
        if (!messageExists) {
          console.log('Mensaje no encontrado para actualizar entrega:', data.message_id);
          return prev;
        }
        
        return prev.map(msg => 
          msg.id === data.message_id 
            ? { ...msg, is_delivered: true, delivered_at: data.delivered_at || new Date().toISOString() }
            : msg
        );
      });
    };

    const handleReadStatus = (data: { message_id: string; status: string; read_at?: string }) => {
      console.log('Manejando estado de lectura:', data);
      if (!isComponentMounted) return;
      
      setMessages(prev => {
        const messageExists = prev.some(msg => msg.id === data.message_id);
        if (!messageExists) {
          console.log('Mensaje no encontrado para actualizar lectura:', data.message_id);
          return prev;
        }
        
        return prev.map(msg => 
          msg.id === data.message_id 
            ? { ...msg, read_at: data.read_at || new Date().toISOString() }
            : msg
        );
      });
    };

    const handleTyping = (data: { userId: string; isTyping: boolean }) => {
      if (!isComponentMounted) return;
      
      // Solo actualizar si es el usuario del chat actual
      if (data.userId === userId) {
        console.log('Actualizando estado de escritura:', data);
        setIsTyping(data.isTyping);
      }
    };

    // Registrar los handlers una sola vez
    const unsubscribeNewMessage = chatService.onNewMessage(handleNewMessage);
    const unsubscribeDelivery = chatService.onDeliveryStatus(handleDeliveryStatus);
    const unsubscribeRead = chatService.onReadStatus(handleReadStatus);
    const unsubscribeTyping = chatService.onTyping(handleTyping);
    const unsubscribeConnection = chatService.onConnectionStatus((status) => {
      if (!isComponentMounted) return;
      console.log('Estado de conexión actualizado:', status);
      setConnectionStatus(status);
    });

    unsubscribeFunctions.push(
      unsubscribeNewMessage,
      unsubscribeDelivery,
      unsubscribeRead,
      unsubscribeTyping,
      unsubscribeConnection
    );

    const loadChat = async () => {
      try {
        setLoading(true);
        
        // Limpiar mensajes existentes
        setMessages([]);
        
        // Conectar al WebSocket
        chatService.connect(token, currentUser.user_id);

        // Cargar mensajes del chat
        const { messages: chatMessages } = await chatService.getMessages(userId, token);
        if (isComponentMounted) {
          // Asegurarse de que no haya duplicados al cargar mensajes iniciales
          const uniqueMessages = chatMessages.reduce((acc: Message[], msg) => {
            if (!acc.some(m => m.id === msg.id)) {
              acc.push({ ...msg, is_own: msg.sender_id === currentUser.user_id });
            }
            return acc;
          }, []);
          
          setMessages(uniqueMessages.sort((a, b) => 
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          ));

          // Desplazarse al final después de cargar los mensajes
          setTimeout(() => {
            scrollToBottom();
          }, 100);
        }

        // Cargar información del usuario del chat
        const userResponse = await userService.getUserById(userId, token);
        if (isComponentMounted && userResponse.success && userResponse.data) {
          setChatUser({
            user_id: userResponse.data.user_id,
            username: userResponse.data.username,
            name: userResponse.data.name,
            surname: userResponse.data.surname,
            profile_picture: userResponse.data.profile_picture ?? null,
            email: userResponse.data.email || '',
            bio: userResponse.data.bio ?? null,
            email_verified: userResponse.data.email_verified || false,
            is_moderator: userResponse.data.is_moderator || false,
            deleted_at: null,
            created_at: userResponse.data.created_at || '',
            updated_at: userResponse.data.updated_at || '',
            active_video_call: false
          });
        }

      } catch (error) {
        console.error('Error al cargar el chat:', error);
        if (isComponentMounted) {
          setConnectionStatus('disconnected');
        }
      } finally {
        if (isComponentMounted) {
          setLoading(false);
        }
      }
    };

    loadChat();

    // Limpiar suscripciones al desmontar
    return () => {
      console.log('Limpiando suscripciones del chat...');
      isComponentMounted = false;
      unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
      chatService.disconnect();
    };

  }, [token, userId, currentUser]);

  // Agregar un efecto para desplazarse al final cuando cambian los mensajes
  useEffect(() => {
    if (!loading && messages.length > 0) {
      scrollToBottom();
    }
  }, [loading, messages]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      const container = messagesEndRef.current.parentElement;
      if (container) {
        const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
        
        // Solo hacer scroll automático si estamos cerca del final
        if (isNearBottom) {
          messagesEndRef.current.scrollIntoView({ 
            behavior: 'smooth',
            block: 'end'
          });
        }
      }
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !token || !userId || !chatUser || !currentUser || connectionStatus !== 'connected') {
      console.log('No se puede enviar mensaje:', { 
        messageEmpty: !newMessage.trim(), 
        noToken: !token, 
        noUserId: !userId,
        noChatUser: !chatUser,
        noCurrentUser: !currentUser,
        connectionStatus 
      });
      return;
    }

    const tempId = `temp-${Date.now()}`;
    const messageContent = newMessage.trim();

    try {
      // Limpiar el input inmediatamente
      setNewMessage('');

      // Crear el mensaje temporal
      const tempMessage = {
        id: tempId,
        content: messageContent,
        sender_id: currentUser.user_id,
        receiver_id: chatUser.user_id,
        created_at: new Date().toISOString(),
        is_delivered: false,
        delivered_at: null,
        read_at: null,
        is_own: true
      };

      // Agregar mensaje temporal
      setMessages(prev => [...prev, tempMessage]);
      scrollToBottom();

      // Enviar mensaje real
      const sentMessage = await chatService.createMessage(chatUser.user_id, messageContent, token);
      
      // Actualizar el mensaje temporal con el real
      setMessages(prev => {
        // Filtrar el mensaje temporal
        const filteredMessages = prev.filter(msg => msg.id !== tempId);
        // Verificar si el mensaje real ya existe (por si acaso)
        const messageExists = filteredMessages.some(msg => msg.id === sentMessage.id);
        if (!messageExists) {
          // Agregar el mensaje real si no existe
          filteredMessages.push({ ...sentMessage, is_own: true });
        }
        // Ordenar mensajes
        return filteredMessages.sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      });

    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      // Remover el mensaje temporal en caso de error
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
      // Restaurar el mensaje en el input
      setNewMessage(messageContent);
      // Intentar reconectar si hay error
      if (currentUser?.user_id) {
        chatService.connect(token, currentUser.user_id);
      }
    }
  };

  const handleTyping = () => {
    if (!chatUser || !token || connectionStatus !== 'connected') {
      console.log('No se puede enviar estado de escritura:', {
        noChatUser: !chatUser,
        noToken: !token,
        connectionStatus
      });
      return;
    }

    chatService.setTyping(chatUser.user_id, true, token);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      chatService.setTyping(chatUser.user_id, false, token);
    }, 2000);
  };

  // Cerrar el selector de emojis al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setNewMessage(prev => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  // Mostrar estado de carga mientras se obtiene el usuario
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando información del usuario...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!chatUser) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No tienes chats activos</h1>
          <p className="text-gray-400 mb-4">Busca usuarios para comenzar una conversación</p>
          <button
            onClick={() => window.location.href = '/buscar'}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Buscar usuarios
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Navbar */}
      <Navbar />

      {/* Contenido principal */}
      <div className="w-2/3 ml-[16.666667%] border-r border-gray-800">
        {/* Área de chat */}
        <div className="flex flex-col h-screen">
          {/* Encabezado del chat con estado de conexión */}
          <div className="p-4 border-b border-gray-800">
            <div className="flex justify-between items-center">
              <h1 className="text-xl font-bold">{chatUser?.name} {chatUser?.surname}</h1>
              <div className="flex items-center space-x-2">
                {connectionStatus === 'connected' && (
                  <span className="text-green-500 text-sm flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                    Conectado
                  </span>
                )}
                {connectionStatus === 'disconnected' && (
                  <span className="text-red-500 text-sm flex items-center">
                    <span className="w-2 h-2 bg-red-500 rounded-full mr-1"></span>
                    Desconectado
                  </span>
                )}
                {connectionStatus === 'reconnecting' && (
                  <span className="text-yellow-500 text-sm flex items-center">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full mr-1 animate-pulse"></span>
                    Reconectando...
                  </span>
                )}
              </div>
            </div>
            {isTyping && (
              <p className="text-sm text-gray-400 mt-1">Escribiendo...</p>
            )}
          </div>

          {/* Mensajes */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
            {loading ? (
              <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              messages.map((message, index) => {
                // Determinar si este mensaje es parte de un grupo con el anterior
                const prevMessage = messages[index - 1];
                const isGrouped = prevMessage && 
                  prevMessage.sender_id === message.sender_id && 
                  new Date(message.created_at).getTime() - new Date(prevMessage.created_at).getTime() < 60000; // 1 minuto

                return (
                  <div
                    key={message.id}
                    className={`flex ${message.is_own ? 'justify-end' : 'justify-start'} ${
                      !isGrouped ? 'mt-6' : 'mt-1'
                    }`}
                  >
                    <div
                      className={`max-w-[70%] p-3 rounded-2xl ${
                        message.is_own
                          ? 'bg-blue-600 text-white rounded-br-none'
                          : 'bg-gray-800 text-white rounded-bl-none'
                      } shadow-md hover:shadow-lg transition-shadow duration-200`}
                    >
                      <p className="break-words text-[15px] leading-relaxed">{message.content}</p>
                      <div className="flex items-center justify-end space-x-2 mt-1.5">
                        <p className="text-xs text-gray-400">
                          {new Date(message.created_at).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                        {message.is_own && (
                          <span className="text-xs flex items-center space-x-1">
                            {message.read_at ? (
                              <span className="text-blue-300" title="Leído">✓✓</span>
                            ) : message.is_delivered ? (
                              <span className="text-gray-300" title="Entregado">✓</span>
                            ) : (
                              <span className="text-gray-500 animate-pulse" title="Enviando">•</span>
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <style>
            {`
              .custom-scrollbar::-webkit-scrollbar {
                width: 6px;
              }
              
              .custom-scrollbar::-webkit-scrollbar-track {
                background: #1f2937;
                border-radius: 3px;
              }
              
              .custom-scrollbar::-webkit-scrollbar-thumb {
                background: #4b5563;
                border-radius: 3px;
              }
              
              .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                background: #6b7280;
              }

              /* Animación suave para nuevos mensajes */
              @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
              }

              .custom-scrollbar > div {
                animation: fadeIn 0.3s ease-out;
              }
            `}
          </style>

          {/* Input de mensaje con estado de conexión */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-800">
            <div className="flex items-center relative">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleTyping}
                  placeholder={connectionStatus === 'connected' ? "Escribe un mensaje..." : "Conectando..."}
                  disabled={connectionStatus !== 'connected'}
                  className={`w-full bg-gray-900 rounded-lg py-2 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    connectionStatus !== 'connected' ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  disabled={connectionStatus !== 'connected'}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-white transition-colors ${
                    connectionStatus !== 'connected' ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <FaSmile className="text-xl" />
                </button>
                {showEmojiPicker && (
                  <div 
                    ref={emojiPickerRef}
                    className="absolute bottom-12 right-0 z-50"
                  >
                    <EmojiPicker
                      onEmojiClick={onEmojiClick}
                      theme={Theme.DARK}
                      width={350}
                      height={400}
                      searchDisabled={false}
                      skinTonesDisabled={true}
                      previewConfig={{
                        showPreview: false
                      }}
                    />
                  </div>
                )}
              </div>
              <button
                type="submit"
                disabled={connectionStatus !== 'connected' || !newMessage.trim()}
                className={`ml-4 p-2 bg-blue-600 rounded-lg transition-colors ${
                  connectionStatus === 'connected' && newMessage.trim()
                    ? 'hover:bg-blue-700'
                    : 'opacity-50 cursor-not-allowed'
                }`}
              >
                <FaPaperPlane className="text-white" />
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Información del usuario */}
      <ChatUserInfo user={chatUser} />
    </div>
  );
}