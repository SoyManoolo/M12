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
import { FaCircle } from 'react-icons/fa';
import SecureImage from '../Shared/SecureImage';

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
}

export default function ChatItem({ chat, onClick }: ChatItemProps) {
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
    <div 
      onClick={onClick}
      className="group bg-gray-900/50 hover:bg-gray-800/80 rounded-xl p-4 cursor-pointer transition-all duration-200 border border-transparent hover:border-gray-700"
    >
    <div className="flex items-center space-x-4">
      {/* Avatar con indicador de estado */}
      <div className="relative flex-shrink-0">
        {chat.user.profile_picture ? (
          <SecureImage
            src={chat.user.profile_picture}
            alt={chat.user.username}
            className="w-14 h-14 rounded-full object-cover border-2 border-gray-800 group-hover:border-blue-500/50 transition-colors"
          />
        ) : (
          <div className="w-14 h-14 rounded-full border-2 border-gray-800 group-hover:border-blue-500/50 bg-gray-800 flex items-center justify-center transition-colors">
            <span className="text-gray-400 text-xl group-hover:text-blue-400 transition-colors">
              {chat.user.username.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        {/* Indicador de mensajes no leídos */}
        {chat.unread_count > 0 && (
          <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 shadow-lg">
            {chat.unread_count}
          </span>
        )}
      </div>

      {/* Información del chat */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-white font-semibold text-base group-hover:text-blue-400 transition-colors">
              {chat.user.username}
            </h3>
              <div className="flex items-center mt-0.5">
                {!isEmpty && (
                  <>
                    <span className="text-sm text-gray-500 mr-1">
                      {isLastMessageFromMe ? 'Tú: ' : `${chat.user.username}: `}
                    </span>
                    <p className={`text-sm truncate max-w-[200px] text-gray-400 group-hover:text-gray-300 transition-colors`}>
                      {chat.last_message.content}
            </p>
                  </>
                )}
              </div>
        </div>
          <span className="text-xs text-gray-500 group-hover:text-gray-400 whitespace-nowrap ml-2 transition-colors">
            {isEmpty ? '' : formatTime(chat.last_message.timestamp)}
          </span>
          </div>
        </div>
      </div>
    </div>
  );
} 