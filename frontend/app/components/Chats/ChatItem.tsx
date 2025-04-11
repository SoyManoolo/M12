/**
 * Componente ChatItem
 * 
 * Este componente representa un elemento individual de chat en la lista de conversaciones.
 * Incluye:
 * - Foto de perfil del contacto
 * - Nombre de usuario
 * - Último mensaje
 * - Indicador de mensajes no leídos
 * 
 * @module ChatItem
 */

import { FaEnvelope } from 'react-icons/fa';

interface ChatItemProps {
  chat: {
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
  };
  onClick?: () => void;
}

export default function ChatItem({ chat, onClick }: ChatItemProps) {
  return (
    <div
      className="flex items-center bg-gray-900 rounded-xl p-4 hover:bg-gray-800 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-xl border border-gray-800 hover:border-gray-700"
      onClick={onClick}
    >
      {/* Foto de perfil */}
      <div className="relative mr-4">
        <img
          src={chat.user.profile_picture_url || '/images/default-avatar.png'}
          alt={chat.user.username}
          className="w-14 h-14 rounded-full object-cover border-2 border-gray-800"
        />
        {chat.unread_count > 0 && (
          <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold shadow-lg">
            {chat.unread_count}
          </div>
        )}
      </div>

      {/* Información del chat */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold text-white text-lg truncate">
            {chat.user.username}
          </h3>
          <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
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
  );
} 