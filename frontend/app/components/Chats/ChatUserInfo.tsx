/**
 * Componente ChatUserInfo
 * 
 * Muestra la información del usuario con quien se está chateando
 * Incluye:
 * - Foto de perfil
 * - Nombre de usuario
 * - @username
 * - Descripción/bio
 * - Estado en línea
 * 
 * @module ChatUserInfo
 */

import type { User } from '~/types/user.types';

interface ChatUserInfoProps {
  user: User;
}

export default function ChatUserInfo({ user }: ChatUserInfoProps) {
  return (
    <div className="w-1/3 bg-gray-900 border-l border-gray-800 p-6 flex flex-col items-center">
      <div className="mb-4">
        {user.profile_picture_url ? (
          <img
            src={user.profile_picture_url}
            alt={user.username}
            className="w-24 h-24 rounded-full object-cover border-4 border-gray-800"
          />
        ) : (
          <div className="w-24 h-24 rounded-full border-4 border-gray-800 bg-gray-800 flex items-center justify-center">
            <span className="text-gray-400 text-sm text-center px-2">Sin foto</span>
          </div>
        )}
      </div>
      <h2 className="text-xl font-bold text-white mb-1">{user.name} {user.surname}</h2>
      <p className="text-gray-400 mb-2">@{user.username}</p>
      <p className="text-gray-300 text-center mb-4">{user.bio || 'Sin biografía'}</p>
      <div className="flex items-center gap-2">
        <span className={`w-3 h-3 rounded-full ${user.active_video_call ? 'bg-green-500' : 'bg-gray-500'}`}></span>
        <span className="text-xs text-gray-400">{user.active_video_call ? 'En llamada' : 'Offline'}</span>
      </div>
    </div>
  );
} 