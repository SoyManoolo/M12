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
import type { MetaFunction } from '@remix-run/node';
import Navbar from '~/components/Inicio/Navbar';
import { FaSearch } from 'react-icons/fa';

export const meta: MetaFunction = () => {
  return [
    { title: "Chats | FriendsGo" },
    { name: "description", content: "Mensajes y conversaciones en FriendsGo" },
  ];
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
    },
    // Más chats mock...
  ];

  // Filtrar chats basado en la búsqueda
  const filteredChats = mockChats.filter(chat =>
    chat.user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-black text-white">
      {/* Navbar */}
      <Navbar />

      {/* Contenido principal */}
      <div className="flex-1 ml-[16.666667%] p-6">
        <div className="max-w-4xl mx-auto">
          {/* Barra de búsqueda */}
          <div className="mb-6">
            <div className="relative">
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar en mensajes..."
                className="w-full bg-gray-900 rounded-full py-2 pl-10 pr-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Lista de chats */}
          <div className="space-y-2">
            {filteredChats.map((chat) => (
              <div
                key={chat.chat_id}
                className="flex items-center bg-gray-900 rounded-lg p-4 hover:bg-gray-800 transition-colors cursor-pointer"
              >
                {/* Foto de perfil */}
                <div className="relative">
                  <img
                    src={chat.user.profile_picture_url || '/images/default-avatar.png'}
                    alt={chat.user.username}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  {chat.unread_count > 0 && (
                    <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {chat.unread_count}
                    </div>
                  )}
                </div>

                {/* Información del chat */}
                <div className="ml-4 flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-white">{chat.user.username}</h3>
                    <span className="text-xs text-gray-400">
                      {new Date(chat.last_message.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm truncate">
                    {chat.last_message.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 