/**
 * Componente RightPanel
 * 
 * Panel lateral derecho reutilizable que puede mostrar:
 * - Lista de amigos sugeridos (para perfil propio)
 * - Lista de amigos en común (para perfil de otros)
 * - Lista de amigos en línea (para notificaciones)
 * Incluye:
 * - Barra de búsqueda de amigos
 * - Lista de usuarios
 * - Funcionalidad de seguimiento (en modo sugeridos)
 * - Indicador de estado en línea (en modo online)
 * 
 * @module RightPanel
 */

import { Link, useNavigate } from "@remix-run/react";
import { FaSearch } from 'react-icons/fa';

interface User {
  user_id: string;
  username: string;
  name: string;
  surname: string;
  email: string;
  profile_picture: string | null;
  bio: string | null;
  email_verified: boolean;
  is_moderator: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  active_video_call: boolean;
  common_friends_count?: number;
  is_online?: boolean;
}

interface Friend {
  friendship_id: string;
  user1_id: string;
  user2_id: string;
  created_at: string;
  user: User;
}

interface RightPanelProps {
  friends?: Friend[];
  users?: User[];
  mode?: 'suggested' | 'common' | 'online';
  showSearch?: boolean;
  onSearch?: (query: string) => void;
  onFollow?: (userId: string) => void;
  customTitle?: string;
}

export default function RightPanel({ 
  friends = [], 
  users = [],
  mode = 'suggested', 
  showSearch = true,
  onSearch, 
  onFollow,
  customTitle
}: RightPanelProps) {
  const navigate = useNavigate();
  
  const title = customTitle || (mode === 'suggested' 
    ? 'Amigos sugeridos' 
    : mode === 'common' 
    ? 'Amigos en común' 
    : 'Posibles amigos');
    
  const emptyMessage = mode === 'suggested' 
    ? 'No hay sugerencias disponibles' 
    : mode === 'common'
    ? 'No hay amigos en común'
    : 'No hay usuarios disponibles';

  const handleUserClick = (username: string) => {
    navigate(`/perfil?username=${username}`);
  };

  // Convertir users a friends si es necesario
  const displayFriends = friends.length > 0 ? friends : users.map(user => ({
    friendship_id: user.user_id,
    user1_id: user.user_id,
    user2_id: user.user_id,
    created_at: new Date().toISOString(),
    user
  }));

  return (
    <div className="w-1/4 p-4 sticky top-0 h-screen overflow-y-auto">
      <div className="pt-4">
        {/* Barra de búsqueda */}
        {showSearch && (
          <div className="mb-6">
            <div className="relative">
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar amigos..."
                className="w-full bg-gray-900 rounded-full py-2 pl-10 pr-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onChange={(e) => onSearch?.(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Panel principal */}
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
          <h3 className="text-lg font-semibold mb-4 text-white">{title}</h3>
          {displayFriends.length === 0 ? (
            <p className="text-gray-400 text-center">{emptyMessage}</p>
          ) : (
            <div className="space-y-2">
              {displayFriends.map((friend) => {
                // Debug logs
                console.log('Friend data:', {
                  username: friend.user.username,
                  profile_picture: friend.user.profile_picture,
                  raw_user: friend.user
                });

                const imageUrl = friend.user.profile_picture;
                console.log('Image URL being used:', imageUrl);

                return (
                  <div key={friend.friendship_id} className="flex items-center justify-between py-2">
                    <div 
                      className="flex items-center cursor-pointer hover:bg-gray-800/50 p-2 rounded-lg transition-colors w-full"
                      onClick={() => handleUserClick(friend.user.username)}
                    >
                      <div className="relative">
                        {imageUrl ? (
                          <img 
                            src={imageUrl}
                            alt={friend.user.username}
                            className="w-12 h-12 rounded-full object-cover border-2 border-gray-800"
                            onError={(e) => {
                              console.error('Error loading image:', imageUrl);
                              const target = e.target as HTMLImageElement;
                              target.src = "/default-avatar.png";
                            }}
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full border-2 border-gray-800 bg-gray-800 flex items-center justify-center">
                            <span className="text-gray-400 text-sm">{friend.user.username.charAt(0).toUpperCase()}</span>
                          </div>
                        )}
                        {mode === 'online' && friend.user.is_online && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-black"></div>
                        )}
                      </div>
                      <div className="ml-4 flex flex-col">
                        <p className="font-semibold text-white hover:text-blue-400 text-base">{friend.user.username}</p>
                        <p className="text-sm text-gray-400 hover:text-gray-300">
                          {friend.user.name} {friend.user.surname}
                        </p>
                        {mode === 'suggested' && friend.user.common_friends_count !== undefined && (
                          <p className="text-xs text-gray-500 mt-1">
                            {friend.user.common_friends_count} {friend.user.common_friends_count === 1 ? 'amigo' : 'amigos'} en común
                          </p>
                        )}
                        {mode === 'online' && friend.user.is_online && (
                          <p className="text-xs text-green-500 mt-1">En línea</p>
                        )}
                      </div>
                    </div>
                    {mode === 'suggested' ? (
                      <button 
                        onClick={() => onFollow?.(friend.user.user_id)}
                        className="px-4 py-1.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors text-sm cursor-pointer ml-4"
                      >
                        Seguir
                      </button>
                    ) : (
                      <Link 
                        to={`/perfil?username=${friend.user.username}`}
                        className="text-blue-500 hover:text-blue-400 text-sm cursor-pointer ml-4 whitespace-nowrap"
                      >
                        Ver perfil
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 