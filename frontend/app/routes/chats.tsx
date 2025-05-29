/**
 * Página de Chats
 * 
 * Esta página muestra la lista de conversaciones del usuario.
 * Incluye:
 * - Navbar para navegación
 * - Lista de chats con foto de perfil, nombre y último mensaje
 * 
 * @module Chats
 */

import { useState, useEffect } from 'react';
import { redirect } from '@remix-run/node';
import type { MetaFunction } from '@remix-run/node';
import Navbar from '~/components/Inicio/Navbar';
import ChatItem from '~/components/Chats/ChatItem';
import RightPanel from '~/components/Shared/RightPanel';
import { FaSearch, FaEnvelope } from 'react-icons/fa';
import { useAuth } from "~/hooks/useAuth";
import { userService } from "~/services/user.service";
import { chatService } from '~/services/chat.service';

export const meta: MetaFunction = () => {
  return [
    { title: "Chats | FriendsGo" },
    { name: "description", content: "Mensajes y conversaciones en FriendsGo" },
  ];
};

export const loader = async ({ request }: { request: Request }) => {
  const cookieHeader = request.headers.get("Cookie");
  const token = cookieHeader?.split(";").find((c: string) => c.trim().startsWith("token="))?.split("=")[1];
  if (!token) return redirect("/login");
  return null;
};

interface Chat {
  chat_id: string;
  user: {
    user_id: string;
    username: string;
    profile_picture: string | null;
  };
  last_message: {
    content: string;
    timestamp: string;
  };
  unread_count: number;
}

interface ChatResponse {
  other_user: {
    user_id: string;
    username: string;
    profile_picture: string | null;
  };
  last_message: {
    content: string;
    created_at: string;
  };
  unread_count: number;
}

interface Friend {
  friendship_id: string;
  user1_id: string;
  user2_id: string;
  created_at: string;
  user: {
    user_id: string;
    username: string;
    name: string;
    surname: string;
    email: string;
    profile_picture: string | null;
    bio: string | null;
    email_verified: boolean;
    is_moderator: boolean;
    deleted_at: string | null;
    created_at: string;
    updated_at: string;
    active_video_call: boolean;
  };
}

export default function Chats() {
  const { token, user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || !user) return;

    let unsubscribeFunctions: (() => void)[] = [];

    const fetchData = async () => {
      try {
        // Cargar chats activos
        const activeChats = await chatService.getActiveChats(token);
        const formattedChats: Chat[] = activeChats
          .filter((chat: ChatResponse) => chat.other_user.user_id !== user.user_id) // Filtrar chats con uno mismo
          .map((chat: ChatResponse) => ({
          chat_id: `${user.user_id}-${chat.other_user.user_id}`,
          user: {
            user_id: chat.other_user.user_id,
            username: chat.other_user.username,
            profile_picture: chat.other_user.profile_picture
          },
          last_message: {
            content: chat.last_message.content,
            timestamp: chat.last_message.created_at
          },
          unread_count: chat.unread_count
        }));
        setChats(formattedChats);

        // Cargar amigos excluyendo al usuario actual
        const friendsResponse = await userService.getAllUsers(token);
        if (friendsResponse.success && friendsResponse.data && Array.isArray(friendsResponse.data.users)) {
          const friendsData = friendsResponse.data.users
            .filter(friend => friend.user_id !== user.user_id) // Excluir al usuario actual
            .map(user => ({
            friendship_id: user.user_id,
            user1_id: user.user_id,
            user2_id: user.user_id,
            created_at: new Date().toISOString(),
            user: {
              ...user,
              profile_picture: user.profile_picture || null,
              bio: user.bio ?? null,
              deleted_at: null,
              active_video_call: false
            }
          }));
          setFriends(friendsData);
        } else {
          setFriends([]);
        }
      } catch (err) {
        console.error('Error al cargar datos:', err);
        setError('Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    };

    const handleNewMessage = (message: any) => {
      setChats(prevChats => {
        const existingChatIndex = prevChats.findIndex(
          chat => chat.user.user_id === message.sender_id || chat.user.user_id === message.receiver_id
        );

        if (existingChatIndex >= 0) {
          const updatedChats = [...prevChats];
          updatedChats[existingChatIndex] = {
            ...updatedChats[existingChatIndex],
            last_message: {
              content: message.content,
              timestamp: message.created_at
            },
            unread_count: message.sender_id !== user.user_id 
              ? updatedChats[existingChatIndex].unread_count + 1 
              : updatedChats[existingChatIndex].unread_count
          };
          return updatedChats;
        }

        // Si es un nuevo chat, necesitamos obtener la información del usuario
        const otherUserId = message.sender_id === user.user_id ? message.receiver_id : message.sender_id;
        const otherUser = friends.find(f => f.user.user_id === otherUserId)?.user;

        if (otherUser) {
          return [...prevChats, {
            chat_id: `${user.user_id}-${otherUserId}`,
            user: {
              user_id: otherUser.user_id,
              username: otherUser.username,
              profile_picture: otherUser.profile_picture
            },
            last_message: {
              content: message.content,
              timestamp: message.created_at
            },
            unread_count: message.sender_id !== user.user_id ? 1 : 0
          }];
        }

        return prevChats;
      });
    };

    // Registrar el handler y guardar la función de limpieza
    const unsubscribeNewMessage = chatService.onNewMessage(handleNewMessage);
    unsubscribeFunctions.push(unsubscribeNewMessage);

    fetchData();

    // Limpiar al desmontar
    return () => {
      console.log('Limpiando suscripciones de chats...');
      unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    };
  }, [token, user]);

  // Filtrar chats basado en la búsqueda
  const filteredChats = chats.filter(chat =>
    chat.user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleChatClick = (userId: string) => {
    window.location.href = `/chat?userId=${userId}`;
  };

  const handleStartNewChat = () => {
    // Redirigir a la página de búsqueda de usuarios
    window.location.href = '/buscar';
  };

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Navbar */}
      <Navbar />

      {/* Contenido principal */}
      <div className="w-2/3 ml-[16.666667%] border-r border-gray-800">
        <div className="p-6">
          {/* Encabezado */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Mensajes</h1>
          </div>

          {/* Barra de búsqueda */}
          <div className="mb-8">
            <div className="relative">
              <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar en mensajes..."
                className="w-full bg-gray-900 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Lista de chats */}
          <div className="space-y-4 custom-scrollbar max-h-[calc(100vh-200px)] overflow-y-auto">
            {filteredChats.map((chat) => (
              <ChatItem
                key={chat.chat_id}
                chat={chat}
                onClick={() => handleChatClick(chat.user.user_id)}
              />
            ))}

            {/* Mensaje cuando no hay chats */}
            {filteredChats.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 bg-gray-900/50 rounded-xl border border-gray-800">
                <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mb-6">
                  <FaEnvelope className="text-4xl text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {searchQuery ? 'No se encontraron chats' : 'No tienes chats activos'}
                </h3>
                <p className="text-gray-400 text-center max-w-md mb-6">
                  {searchQuery 
                    ? 'Intenta con otros términos de búsqueda o inicia una nueva conversación'
                    : 'Comienza una nueva conversación con tus amigos o contactos'}
                </p>
                <button 
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  onClick={handleStartNewChat}
                >
                  Iniciar nuevo chat
                </button>
              </div>
            )}
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
        </div>
      </div>

      {/* Panel lateral derecho */}
      <RightPanel
        friends={friends}
        mode="online"
        customTitle="Mis amigos"
      />
    </div>
  );
} 