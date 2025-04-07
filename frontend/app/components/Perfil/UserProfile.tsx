/**
 * Componente UserProfile
 * 
 * Este componente muestra la información principal del perfil de usuario.
 * Incluye:
 * - Foto de perfil
 * - Nombre completo
 * - Nombre de usuario
 * - Biografía
 * 
 * @module UserProfile
 * @requires react
 */

import { FaEdit } from 'react-icons/fa';

interface UserProfileProps {
  user: {
    user_id: string;
    first_name: string;
    last_name: string;
    username: string;
    email: string;
    profile_picture_url: string | null;
    bio: string | null;
    email_verified: boolean;
    is_moderator: boolean;
    id_deleted: boolean;
    created_at: string;
    updated_at: string;
  };
  isOwnProfile?: boolean;
  onEditProfile?: () => void;
}

export default function UserProfile({ user, isOwnProfile = false, onEditProfile }: UserProfileProps) {
  return (
    <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
      <div className="flex items-start space-x-6">
        {/* Foto de perfil */}
        <div className="relative">
          <img
            src={user.profile_picture_url || '/images/default-avatar.png'}
            alt={`${user.username} profile`}
            className="w-32 h-32 rounded-full object-cover border-4 border-gray-800"
          />
        </div>

        {/* Información del usuario */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-white">
                {user.first_name} {user.last_name}
              </h1>
              <p className="text-gray-400">@{user.username}</p>
            </div>
            
            {isOwnProfile && (
              <button
                onClick={onEditProfile}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center space-x-2 transition-colors"
              >
                <FaEdit />
                <span>Editar perfil</span>
              </button>
            )}
          </div>

          {/* Biografía */}
          <div className="mt-4">
            <p className="text-gray-300 whitespace-pre-wrap">
              {user.bio || "Sin biografía"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 