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
import { FaPaperPlane } from 'react-icons/fa';
import { redirect } from "@remix-run/node";
import type { User } from '~/types/user.types';
import { chatService } from '~/services/chat.service';
import { useAuth } from '~/hooks/useAuth';
import { userService } from '~/services/user.service';

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

interface ChatUser {
  user_id: string;
  username: string;
  name: string;
  surname: string;
  profile_picture: string | null;
  email: string;
  bio: string | null;
  email_verified: boolean;
  is_moderator: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  active_video_call: boolean;
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
  const [chatUser, setChatUser] = useState<ChatUser | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { token } = useAuth();
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!token) return;

    const loadChat = async () => {
      try {
        setLoading(true);
        const userId = searchParams.get('userId');
        
        if (!userId) {
          // Si no hay userId, cargar la lista de chats activos
          const chats = await chatService.getActiveChats(token);
          if (chats.length > 0) {
            // Redirigir al primer chat
            window.location.href = `/chat?userId=${chats[0].other_user.user_id}`;
            return;
          }
          setLoading(false);
          return;
        }

        // Cargar información del usuario del chat
        const userResponse = await userService.getUserById(userId, token);
        if (userResponse.success && userResponse.data) {
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
        } else {
          setChatUser(null);
        }

        // Cargar mensajes del chat
        const { messages: chatMessages } = await chatService.getMessages(userId, token);
        setMessages(chatMessages.reverse().map(msg => ({
          ...msg,
          is_own: msg.sender_id !== userId
        })));

        // Definir los handlers de eventos
        const handleNewMessage = (message: Message) => {
          console.log('Manejando nuevo mensaje:', message);
          // Verificar si el mensaje ya existe en el estado
          setMessages(prev => {
            const messageExists = prev.some(msg => msg.id === message.id);
            if (messageExists) return prev;
            return [...prev, { ...message, is_own: message.sender_id !== userId }];
          });
          scrollToBottom();
        };

        const handleDeliveryStatus = (data: { message_id: string; status: string }) => {
          console.log('Manejando estado de entrega:', data);
          setMessages(prev => prev.map(msg => 
            msg.id === data.message_id 
              ? { ...msg, is_delivered: true, delivered_at: new Date().toISOString() }
              : msg
          ));
        };

        const handleReadStatus = (data: { message_id: string; status: string }) => {
          console.log('Manejando estado de lectura:', data);
          setMessages(prev => prev.map(msg => 
            msg.id === data.message_id 
              ? { ...msg, read_at: new Date().toISOString() }
              : msg
          ));
        };

        const handleTyping = (data: { userId: string; isTyping: boolean }) => {
          console.log('Manejando estado de escritura:', data);
          if (data.userId === userId) {
            setIsTyping(data.isTyping);
          }
        };

        // Suscribirse a los eventos del socket
        chatService.onNewMessage(handleNewMessage);
        chatService.onDeliveryStatus(handleDeliveryStatus);
        chatService.onReadStatus(handleReadStatus);
        chatService.onTyping(handleTyping);

        // Conectar al WebSocket
        chatService.connect(token, userId);

        // Marcar mensajes como leídos
        chatMessages
          .filter(msg => msg.sender_id === userId && !msg.read_at)
          .forEach(msg => chatService.markMessageAsRead(msg.id, token));

        // Limpiar suscripciones al desmontar
        return () => {
          chatService.removeMessageHandler(handleNewMessage);
          chatService.removeDeliveryHandler(handleDeliveryStatus);
          chatService.removeReadHandler(handleReadStatus);
          chatService.removeTypingHandler(handleTyping);
          chatService.disconnect();
        };

      } catch (error) {
        console.error('Error al cargar el chat:', error);
      } finally {
        setLoading(false);
      }
    };

    loadChat();
  }, [token, searchParams]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !token || !chatUser) return;

    try {
      // Enviar el mensaje
      const message = await chatService.createMessage(chatUser.user_id, newMessage, token);
      
      // Agregar el mensaje al estado local
      setMessages(prev => [...prev, { ...message, is_own: true }]);
      setNewMessage('');
      scrollToBottom();
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
    }
  };

  const handleTyping = () => {
    if (!chatUser) return;

    chatService.setTyping(chatUser.user_id, true);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      chatService.setTyping(chatUser.user_id, false);
    }, 2000);
  };

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
          {/* Encabezado del chat */}
          <div className="p-4 border-b border-gray-800">
            <h1 className="text-xl font-bold">{chatUser.name} {chatUser.surname}</h1>
            {isTyping && (
              <p className="text-sm text-gray-400">Escribiendo...</p>
            )}
          </div>

          {/* Mensajes */}
          <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
            <div className="space-y-4">
              {messages.length === 0 ? (
                <p className="text-gray-400 text-center mt-8">Aún no hay mensajes. ¡Escribe el primero!</p>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.is_own ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] p-3 rounded-lg ${
                        message.is_own
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-800 text-white'
                      }`}
                    >
                      <p className="break-words">{message.content}</p>
                      <div className="flex items-center justify-end space-x-2 mt-1">
                        <p className="text-xs text-gray-400">
                          {new Date(message.created_at).toLocaleTimeString()}
                        </p>
                        {message.is_own && (
                          <span className="text-xs">
                            {message.read_at ? '✓✓' : message.is_delivered ? '✓' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
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
            `}
          </style>

          {/* Input de mensaje */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-800">
            <div className="flex items-center">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleTyping}
                placeholder="Escribe un mensaje..."
                className="flex-1 bg-gray-900 rounded-lg py-2 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="ml-4 p-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
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