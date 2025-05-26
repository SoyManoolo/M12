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

import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface ChatItemProps {
  chat: {
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
  };
  onClick: () => void;
}

export default function ChatItem({ chat, onClick }: ChatItemProps) {
  const formatTime = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), {
        addSuffix: true,
        locale: es
      });
    } catch (error) {
      return '';
    }
  };

  // Determinar si el chat está vacío
  const isEmpty = !chat.last_message.content;

  return (
    <div
      className="flex items-center px-3 py-2 bg-gray-900/60 rounded-lg border border-gray-800 hover:bg-gray-800/70 cursor-pointer transition-colors min-h-[56px]"
      onClick={onClick}
    >
      {/* Avatar */}
      <div className="relative">
        {chat.user.profile_picture ? (
          <img
            src={chat.user.profile_picture}
            alt={chat.user.username}
            className="w-12 h-12 rounded-full object-cover border-2 border-gray-800"
          />
        ) : (
          <div className="w-12 h-12 rounded-full border-2 border-gray-800 bg-gray-800 flex items-center justify-center">
            <span className="text-gray-400 text-sm">
              {chat.user.username.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        {chat.unread_count > 0 && (
          <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow-md">
            {chat.unread_count}
          </span>
        )}
      </div>

      {/* Información del chat */}
      <div className="ml-3 flex-1 min-w-0">
        <div className="flex justify-between items-center">
          <span className="text-white font-medium truncate max-w-[120px]">{chat.user.username}</span>
          <span className="text-xs text-gray-400 ml-2 whitespace-nowrap">
            {isEmpty ? 'Nuevo chat' : formatTime(chat.last_message.timestamp)}
          </span>
        </div>
        <div className="flex items-center">
          <span className={`text-xs ${isEmpty ? 'text-gray-500 italic' : 'text-gray-300'} truncate max-w-[180px]`}>
            {isEmpty ? 'Sin mensajes' : chat.last_message.content}
          </span>
        </div>
      </div>
    </div>
  );
} 