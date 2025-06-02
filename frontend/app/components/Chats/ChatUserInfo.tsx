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

import { FaVideo, FaPhone } from 'react-icons/fa';
import type { User } from '~/types/user.types';
import SecureImage from '../Shared/SecureImage';

interface ChatUserInfoProps {
  user: User;
}

export default function ChatUserInfo({ user }: ChatUserInfoProps) {
  return (
    <div className="w-1/4 min-w-[220px] max-w-xs flex flex-col items-center pt-8">
      {/* Información del usuario sin cuadro */}
      <div className="flex flex-col items-center mb-4 w-full">
        {user.profile_picture ? (
          <SecureImage
            src={user.profile_picture}
            alt={user.username}
            className="w-32 h-32 rounded-full object-cover mb-4 border-2 border-gray-800"
          />
        ) : (
          <div className="w-32 h-32 rounded-full border-2 border-gray-800 bg-gray-800 flex items-center justify-center mb-4">
            <span className="text-gray-400 text-5xl select-none">{user.username.charAt(0).toUpperCase()}</span>
          </div>
        )}
        <h2 className="text-xl font-bold text-white text-center">{user.name} {user.surname}</h2>
        <p className="text-gray-400 text-center">@{user.username}</p>
      </div>

      {/* Bio */}
      {user.bio && (
        <div className="mb-2 w-full flex flex-col items-center">
          <h3 className="text-sm font-semibold text-gray-400 mb-1">Biografía</h3>
          <p className="text-white text-center break-words">{user.bio}</p>
        </div>
      )}
    </div>
  );
} 