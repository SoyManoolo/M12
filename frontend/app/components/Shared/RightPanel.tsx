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

import { Link } from "@remix-run/react";
import { FaSearch } from 'react-icons/fa';

interface User {
  user_id: string;
  username: string;
  first_name: string;
  last_name: string;
  profile_picture_url: string | null;
  common_friends_count?: number;
  is_online?: boolean;
}

interface RightPanelProps {
  users: User[];
  mode: 'suggested' | 'common' | 'online';
  showSearch?: boolean;
  onSearch?: (query: string) => void;
  onFollow?: (userId: string) => void;
}

export default function RightPanel({ 
  users, 
  mode, 
  showSearch = true,
  onSearch, 
  onFollow 
}: RightPanelProps) {
  const title = mode === 'suggested' 
    ? 'Amigos sugeridos' 
    : mode === 'common' 
    ? 'Amigos en común' 
    : 'Amigos en línea';
    
  const emptyMessage = mode === 'suggested' 
    ? 'No hay sugerencias disponibles' 
    : mode === 'common'
    ? 'No hay amigos en común'
    : 'No hay amigos conectados';

  return (
    <div className="w-1/4 p-4">
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
        {users.length === 0 ? (
          <p className="text-gray-400 text-center">{emptyMessage}</p>
        ) : (
          <div className="space-y-4">
            {users.map((user) => (
              <div key={user.user_id} className="flex items-center justify-between py-3">
                <div className="flex items-center">
                  <div className="relative">
                    <img 
                      src={user.profile_picture_url || 'https://i.pravatar.cc/150'} 
                      alt={user.username}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    {mode === 'online' && user.is_online && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-black"></div>
                    )}
                  </div>
                  <div className="ml-3">
                    <p className="font-semibold text-white">{user.username}</p>
                    <p className="text-sm text-gray-400">
                      {user.first_name} {user.last_name}
                    </p>
                    {mode === 'suggested' && user.common_friends_count !== undefined && (
                      <p className="text-xs text-gray-500">
                        {user.common_friends_count} {user.common_friends_count === 1 ? 'amigo' : 'amigos'} en común
                      </p>
                    )}
                    {mode === 'online' && user.is_online && (
                      <p className="text-xs text-green-500">En línea</p>
                    )}
                  </div>
                </div>
                {mode === 'suggested' ? (
                  <button 
                    onClick={() => onFollow?.(user.user_id)}
                    className="px-4 py-1 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors text-sm"
                  >
                    Seguir
                  </button>
                ) : (
                  <Link 
                    to={`/perfilother?username=${user.username}`}
                    className="text-blue-500 hover:text-blue-400 text-sm"
                  >
                    Ver perfil
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 