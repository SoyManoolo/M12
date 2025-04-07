/**
 * Componente RightSidebar
 * 
 * Este componente representa la barra lateral derecha de la aplicación.
 * Incluye:
 * - Barra de búsqueda de amigos
 * - Lista de usuarios sugeridos
 * - Funcionalidad de seguimiento
 * 
 * @module RightSidebar
 * @requires react-icons/fa
 */

import { FaSearch } from 'react-icons/fa';

/**
 * Interfaz que define la estructura de un usuario
 */
interface User {
  user_id: string;
  username: string;
  first_name: string;
  last_name: string;
  profile_picture_url: string | null;
}

/**
 * Interfaz que extiende User para usuarios sugeridos
 * Incluye el conteo de amigos en común
 */
interface SuggestedUser extends User {
  common_friends_count: number;
}

/**
 * Interfaz que define las propiedades del componente RightSidebar
 */
interface RightSidebarProps {
  suggestedUsers?: SuggestedUser[];
  onSearch?: (query: string) => void;
  onFollow?: (userId: string) => void;
}

/**
 * Componente principal de la barra lateral derecha
 * 
 * @param {RightSidebarProps} props - Propiedades del componente
 * @returns {JSX.Element} Barra lateral con búsqueda y usuarios sugeridos
 */
export default function RightSidebar({ 
  suggestedUsers = [], 
  onSearch, 
  onFollow 
}: RightSidebarProps) {
  /**
   * Manejador para la búsqueda de usuarios
   * 
   * @param {React.ChangeEvent<HTMLInputElement>} e - Evento de cambio en el input
   */
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearch?.(e.target.value);
  };

  /**
   * Manejador para seguir a un usuario
   * 
   * @param {string} userId - ID del usuario a seguir
   */
  const handleFollow = (userId: string) => {
    onFollow?.(userId);
  };

  return (
    <div className="w-1/4 p-4">
      {/* Contenedor de búsqueda */}
      <div className="mb-6">
        <div className="relative">
          <FaSearch className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar amigos..."
            className="w-full bg-gray-900 rounded-full py-2 pl-10 pr-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={handleSearch}
          />
        </div>
      </div>

      {/* Contenedor de usuarios sugeridos */}
      <div className="bg-gray-900 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-4">Amigos sugeridos</h3>
        {/* Lista de usuarios sugeridos */}
        {suggestedUsers.map((user) => (
          <div key={user.user_id} className="flex items-center justify-between py-3">
            <div className="flex items-center">
              <img 
                src={user.profile_picture_url || '/default-avatar.png'} 
                alt={user.username}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div className="ml-3">
                <p className="font-semibold">{user.username}</p>
                <p className="text-sm text-gray-400">
                  {user.common_friends_count} {user.common_friends_count === 1 ? 'amigo en común' : 'amigos en común'}
                </p>
              </div>
            </div>
            <button 
              className="text-blue-500 hover:text-blue-400"
              onClick={() => handleFollow(user.user_id)}
            >
              Seguir
            </button>
          </div>
        ))}
      </div>
    </div>
  );
} 