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
import { useAuth } from "~/hooks/useAuth";
import SecureImage from '../Shared/SecureImage';
import { FaTrash } from 'react-icons/fa';

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
      sender_id: string;
    };
    unread_count: number;
  };
  onClick: () => void;
  onDelete: () => void;
}

export default function ChatItem({ chat, onClick, onDelete }: ChatItemProps) {
  const { user } = useAuth();

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

  // Determinar quién envió el último mensaje
  const isLastMessageFromMe = user?.user_id === chat.last_message.sender_id;

  return (
    <div className="flex items-center gap-2 rounded-xl border border-transparent bg-gray-900/50 p-3 transition-all duration-200 hover:border-gray-700 hover:bg-gray-800/80">
      <button type="button" onClick={onClick} className="group flex min-w-0 flex-1 items-center space-x-4 rounded-lg p-1 text-left focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label={`Abrir conversación con ${chat.user.username}`}>
        <div className="relative flex-shrink-0">
          {chat.user.profile_picture ? (
            <SecureImage src={chat.user.profile_picture} alt={chat.user.username} className="h-14 w-14 rounded-full border-2 border-gray-800 object-cover transition-colors group-hover:border-blue-500/50" />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-gray-800 bg-gray-800 transition-colors group-hover:border-blue-500/50">
              <span className="text-xl text-gray-400 transition-colors group-hover:text-blue-400">{chat.user.username.charAt(0).toUpperCase()}</span>
            </div>
          )}
          {chat.unread_count > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-blue-600 px-1 text-xs font-bold text-white shadow-lg">{chat.unread_count}</span>}
        </div>
        <span className="flex min-w-0 flex-1 items-start justify-between">
          <span className="min-w-0">
            <span className="block text-base font-semibold text-white transition-colors group-hover:text-blue-400">{chat.user.username}</span>
            {!isEmpty && <span className="mt-0.5 block truncate text-sm text-gray-400 transition-colors group-hover:text-gray-300"><span className="text-gray-500">{isLastMessageFromMe ? 'Tú: ' : `${chat.user.username}: `}</span>{chat.last_message.content}</span>}
          </span>
          <span className="ml-2 whitespace-nowrap text-xs text-gray-500 transition-colors group-hover:text-gray-400">{isEmpty ? '' : formatTime(chat.last_message.timestamp)}</span>
        </span>
      </button>
      <button type="button" onClick={onDelete} aria-label={`Eliminar conversación con ${chat.user.username}`} title="Eliminar conversación" className="rounded-lg p-3 text-gray-500 transition-colors hover:bg-red-950 hover:text-red-400 focus:outline-none focus:ring-2 focus:ring-red-500">
        <FaTrash aria-hidden="true" />
      </button>
    </div>
  );
}
