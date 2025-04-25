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

interface User {
  user_id: string;
  username: string;
  first_name: string;
  last_name: string;
  profile_picture_url: string | null;
  bio: string | null;
  is_online: boolean;
}

interface ChatUserInfoProps {
  user: User;
}

export default function ChatUserInfo({ user }: ChatUserInfoProps) {
  return (
    <div className="w-1/4 p-4 sticky top-0 h-screen overflow-y-auto">
      <div className="pt-4">
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
          {/* Foto de perfil y estado */}
          <div className="flex flex-col items-center mb-4">
            <div className="relative">
              <img 
                src={user.profile_picture_url || 'https://i.pravatar.cc/150'} 
                alt={user.username}
                className="w-24 h-24 rounded-full object-cover mb-4"
              />
              {user.is_online && (
                <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-black"></div>
              )}
            </div>
            <h2 className="text-xl font-bold text-white">{user.first_name} {user.last_name}</h2>
            <p className="text-gray-400">@{user.username}</p>
          </div>

          {/* Descripción */}
          {user.bio && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-400 mb-2">Sobre mí</h3>
              <p className="text-white text-sm">{user.bio}</p>
            </div>
          )}

          {/* Estado */}
          <div className="flex items-center justify-center">
            <div className={`w-2 h-2 rounded-full mr-2 ${user.is_online ? 'bg-green-500' : 'bg-gray-500'}`}></div>
            <span className="text-sm text-gray-400">
              {user.is_online ? 'En línea' : 'Desconectado'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
} 