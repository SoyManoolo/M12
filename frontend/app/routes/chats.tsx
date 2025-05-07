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

import { useState } from 'react';
import { redirect } from '@remix-run/node';
import type { MetaFunction } from '@remix-run/node';
import Navbar from '~/components/Inicio/Navbar';
import ChatItem from '~/components/Chats/ChatItem';
import RightPanel from '~/components/Shared/RightPanel';
import { FaSearch, FaEnvelope } from 'react-icons/fa';

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
    profile_picture_url: string | null;
  };
  last_message: {
    content: string;
    timestamp: string;
  };
  unread_count: number;
}

export default function Chats() {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Mock de datos de chats para la interfaz
  const mockChats: Chat[] = [
    {
      chat_id: '1',
      user: {
        user_id: '1',
        username: 'usuario1',
        profile_picture_url: 'https://i.pravatar.cc/150?img=1'
      },
      last_message: {
        content: 'Hola, ¿cómo estás? Espero que todo esté bien por allá...',
        timestamp: new Date().toISOString()
      },
      unread_count: 2
    },
    {
      chat_id: '2',
      user: {
        user_id: '2',
        username: 'usuario2',
        profile_picture_url: 'https://i.pravatar.cc/150?img=2'
      },
      last_message: {
        content: '¡Nos vemos mañana en la videollamada!',
        timestamp: new Date().toISOString()
      },
      unread_count: 0
    }
  ];

  // Mock de datos de amigos en línea
  const mockOnlineFriends = [
    {
      user_id: '1',
      username: 'usuario1',
      name: 'Usuario',
      surname: 'Uno',
      email: 'usuario1@example.com',
      profile_picture_url: 'https://i.pravatar.cc/150?img=1',
      bio: null,
      email_verified: true,
      is_moderator: false,
      deleted_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      active_video_call: false
    },
    {
      user_id: '2',
      username: 'usuario2',
      name: 'Usuario',
      surname: 'Dos',
      email: 'usuario2@example.com',
      profile_picture_url: 'https://i.pravatar.cc/150?img=2',
      bio: null,
      email_verified: true,
      is_moderator: false,
      deleted_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      active_video_call: false
    }
  ];

  // Filtrar chats basado en la búsqueda
  const filteredChats = mockChats.filter(chat =>
    chat.user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleChatClick = (chatId: string) => {
    // Redirigir a la página de chat individual
    window.location.href = `/chat?chatId=${chatId}`;
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
          <div className="space-y-4">
            {filteredChats.map((chat) => (
              <ChatItem
                key={chat.chat_id}
                chat={chat}
                onClick={() => handleChatClick(chat.chat_id)}
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
                  onClick={() => {/* Aquí iría la lógica para iniciar nuevo chat */}}
                >
                  Iniciar nuevo chat
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Panel lateral derecho */}
      <RightPanel
        friends={mockOnlineFriends.map(user => ({
          friendship_id: user.user_id,
          user1_id: user.user_id,
          user2_id: user.user_id,
          created_at: new Date().toISOString(),
          user
        }))}
        mode="online"
      />
    </div>
  );
} 