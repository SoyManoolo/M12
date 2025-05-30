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
import { chatService } from '~/services/chat.service';
import { friendshipService } from '~/services/friendship.service';

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
    sender_id: string;
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
        console.log('Chats activos recibidos:', activeChats);
        const formattedChats: Chat[] = activeChats
          .filter((chat: any) => chat.other_user && chat.other_user.user_id !== user.user_id) // Filtrar chats con uno mismo
          .map((chat: any) => ({
            chat_id: `${user.user_id}-${chat.other_user.user_id}`,
            user: {
              user_id: chat.other_user.user_id,
              username: chat.other_user.username,
              profile_picture: chat.other_user.profile_picture
            },
            last_message: {
              content: chat.last_message.content,
              timestamp: chat.last_message.created_at,
              sender_id: chat.last_message.sender_id
            },
            unread_count: chat.unread_count
          }));
        console.log('Chats formateados:', formattedChats);
        setChats(formattedChats);

        // Cargar solo amigos reales
        const friendsResponse = await friendshipService.getUserFriends(token);
        if (friendsResponse.success && friendsResponse.data) {
          const friendsData = friendsResponse.data.map(friend => ({
            ...friend,
            user: {
              user_id: friend.user.user_id,
              username: friend.user.username,
              name: friend.user.name || '',
              surname: '',
              email: '',
              profile_picture: friend.user.profile_picture || null,
              bio: '',
              email_verified: false,
              is_moderator: false,
              deleted_at: null,
              created_at: '',
              updated_at: '',
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

    // Manejar mensajes nuevos
    const unsubscribeNewMessage = chatService.onNewMessage((message) => {
      console.log('Nuevo mensaje recibido:', message);
      if (message.sender_id === user.user_id || message.receiver_id === user.user_id) {
        setChats(prevChats => {
          const otherUserId = message.sender_id === user.user_id ? message.receiver_id : message.sender_id;
          const existingChatIndex = prevChats.findIndex(chat => 
            chat.user.user_id === otherUserId
          );

          if (existingChatIndex >= 0) {
            // Actualizar chat existente
            const updatedChats = [...prevChats];
            updatedChats[existingChatIndex] = {
              ...updatedChats[existingChatIndex],
              last_message: {
                content: message.content,
                timestamp: message.created_at,
                sender_id: message.sender_id
              },
              unread_count: message.sender_id === user.user_id ? 0 : updatedChats[existingChatIndex].unread_count + 1
            };
            return updatedChats;
          } else {
            // Buscar la información del usuario en la lista de amigos
            const otherUser = friends.find(f => f.user.user_id === otherUserId)?.user;
            
            if (otherUser) {
              // Crear nuevo chat con la información del amigo
              return [{
                chat_id: `${user.user_id}-${otherUserId}`,
                user: {
                  user_id: otherUser.user_id,
                  username: otherUser.username,
                  profile_picture: otherUser.profile_picture
                },
                last_message: {
                  content: message.content,
                  timestamp: message.created_at,
                  sender_id: message.sender_id
                },
                unread_count: message.sender_id === user.user_id ? 0 : 1
              }, ...prevChats];
            }
            
            // Si no encontramos al usuario en la lista de amigos, no creamos el chat
            return prevChats;
          }
        });
      }
    });

    // Registrar el handler y guardar la función de limpieza
    unsubscribeFunctions.push(unsubscribeNewMessage);

    fetchData();

    // Limpiar al desmontar
    return () => {
      console.log('Limpiando suscripciones de chats...');
      unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    };
  }, [token, user]);

  // Filtrar chats basado en la búsqueda y solo mostrar chats con amigos
  const filteredChats = chats.filter(chat => {
    const isFriend = friends.some(friend => friend.user.user_id === chat.user.user_id);
    return isFriend && chat.user.username.toLowerCase().includes(searchQuery.toLowerCase());
  });

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
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Mensajes</h1>
                <p className="text-gray-400 mt-1">Gestiona tus conversaciones y mensajes</p>
              </div>
            </div>
          </div>

          {/* Barra de búsqueda */}
          <div className="mb-6">
            <div className="relative">
              <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar en mensajes..."
                className="w-full bg-gray-900 rounded-full py-3 pl-12 pr-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Lista de chats */}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="text-red-500 text-center py-8">{error}</div>
          ) : friends.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-full flex items-center justify-center mb-6">
                <FaEnvelope className="text-5xl text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">No tienes amigos aún</h3>
              <p className="text-gray-400 text-center max-w-md mb-6">
                Para poder chatear necesitas tener amigos. ¡Conecta con personas y empieza a conversar!
              </p>
              <button
                onClick={handleStartNewChat}
                className="px-6 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-500 transition-colors duration-200 font-semibold"
              >
                Buscar amigos
              </button>
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-full flex items-center justify-center mb-6">
                <FaEnvelope className="text-5xl text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">No hay mensajes</h3>
              <p className="text-gray-400 text-center max-w-md mb-6">
                {searchQuery ? 'No se encontraron mensajes con esa búsqueda' : 'No tienes conversaciones activas con tus amigos'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredChats.map((chat) => (
                <ChatItem
                  key={chat.chat_id}
                  chat={chat}
                  onClick={() => handleChatClick(chat.user.user_id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Panel derecho */}
      <RightPanel mode="friends" friends={friends} />

      <style>
        {`
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #374151;
            border-radius: 3px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #4B5563;
          }
        `}
      </style>
    </div>
  );
} 