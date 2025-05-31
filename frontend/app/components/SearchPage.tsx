import { useState, useEffect } from 'react';
import { useNavigate } from '@remix-run/react';
import { environment } from '~/config/environment';
import Navbar from './Inicio/Navbar';
import { 
  FaUser, 
  FaSearch, 
  FaUserFriends, 
  FaUserPlus, 
  FaUserMinus, 
  FaUserClock, 
  FaUserCheck, 
  FaUserTimes,
  FaUsers,
  FaLightbulb,
  FaSearch as FaSearchIcon,
  FaUserCircle
} from 'react-icons/fa';
import { useAuth } from '~/hooks/useAuth';
import { friendshipService } from '~/services/friendship.service';
import { jwtDecode } from 'jwt-decode';

interface User {
  user_id: string;
  username: string;
  name: string;
  surname: string;
  profile_picture: string;
  bio?: string;
}

interface Friend {
  friendship_id: string;
  user: User;
}

interface FriendshipStatus {
  status: 'none' | 'pending' | 'friends';
  request_id?: string;
  is_sender?: boolean;
}

type Tab = 'friends' | 'suggestions' | 'search';

export default function SearchPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [suggestedFriends, setSuggestedFriends] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('friends');
  const [friendshipStatuses, setFriendshipStatuses] = useState<Record<string, FriendshipStatus>>({});
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const navigate = useNavigate();
  const { token } = useAuth();

  // Cargar amigos al montar el componente
  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const response = await fetch(`${environment.apiUrl}/friendship/friends`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
        });
        const data = await response.json();
        if (data.success) {
          setFriends(data.data);
        }
      } catch (error) {
        console.error('Error fetching friends:', error);
      }
    };

    fetchFriends();
  }, []);

  // Cargar usuarios sugeridos cuando se cambia a la pestaña de sugerencias
  useEffect(() => {
    const fetchSuggestedUsers = async () => {
      if (activeTab === 'suggestions') {
        try {
          setLoading(true);
          const response = await fetch(`${environment.apiUrl}/users`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json',
            },
          });
          const data = await response.json();
          if (data.success && data.data && data.data.users) {
            // Obtener el ID del usuario actual del token
            const decodedToken = jwtDecode(localStorage.getItem('token') || '') as { user_id: string };
            const currentUserId = decodedToken.user_id;

            // Filtrar usuarios que no son amigos y no es el usuario actual
            const friendIds = new Set(friends.map(friend => friend.user.user_id));
            const suggestedUsers = data.data.users.filter((user: User) => 
              !friendIds.has(user.user_id) && user.user_id !== currentUserId
            );
            setSuggestedFriends(suggestedUsers);
          } else {
            setSuggestedFriends([]);
          }
        } catch (error) {
          console.error('Error fetching suggested users:', error);
          setSuggestedFriends([]);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchSuggestedUsers();
  }, [activeTab, friends]);

  // Cargar estados de amistad para usuarios sugeridos
  useEffect(() => {
    const fetchFriendshipStatuses = async () => {
      if (!token || !suggestedFriends.length) return;
      
      try {
        const statuses: Record<string, FriendshipStatus> = {};
        for (const user of suggestedFriends) {
          const response = await friendshipService.getFriendshipStatus(token, user.user_id);
          if (response.success && response.data) {
            statuses[user.user_id] = response.data as FriendshipStatus;
          }
        }
        setFriendshipStatuses(prev => {
          if (JSON.stringify(prev) !== JSON.stringify(statuses)) {
            return statuses;
          }
          return prev;
        });
      } catch (error) {
        console.error('Error fetching friendship statuses:', error);
      }
    };

    fetchFriendshipStatuses();
  }, [token, suggestedFriends]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    try {
      setLoading(true);
      const url = `${environment.apiUrl}/users/username?username=${searchTerm}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (data.success) {
        if (data.data && !Array.isArray(data.data)) {
           setUsers(data.data ? [data.data] : []);
        } else if (data.data && Array.isArray(data.data.users)) {
           setUsers(data.data.users);
        } else {
           setUsers([]);
        }
      } else {
         setUsers([]);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUserClick = (username: string) => {
    navigate(`/perfil?username=${username}`);
  };

  const handleFriendAction = async (userId: string, action: 'send' | 'cancel' | 'accept' | 'reject' | 'remove') => {
    if (!token) return;

    try {
      let response;
      const status = friendshipStatuses[userId];
      let defaultMessage = '';
      switch (action) {
        case 'send':
          response = await friendshipService.sendFriendRequest(token, userId);
          defaultMessage = 'Solicitud de amistad enviada';
          break;
        case 'cancel':
          if (status?.request_id) {
            response = await friendshipService.cancelFriendRequest(token, status.request_id);
            defaultMessage = 'Solicitud de amistad cancelada';
          }
          break;
        case 'accept':
          if (status?.request_id) {
            response = await friendshipService.acceptFriendRequest(token, status.request_id);
            defaultMessage = 'Solicitud de amistad aceptada';
          }
          break;
        case 'reject':
          if (status?.request_id) {
            response = await friendshipService.rejectFriendRequest(token, status.request_id);
            defaultMessage = 'Solicitud de amistad rechazada';
          }
          break;
        case 'remove':
          response = await friendshipService.removeFriendship(token, userId);
          defaultMessage = 'Amistad eliminada';
          // Actualizar el estado local inmediatamente
          setFriends(prev => prev.filter(friend => friend.user.user_id !== userId));
          // Actualizar el estado de la amistad
          setFriendshipStatuses(prev => ({
            ...prev,
            [userId]: { status: 'none' }
          }));
          break;
      }

      if (response?.success) {
        setNotification({
          message: response.message || defaultMessage,
          type: 'success'
        });
        // Actualizar el estado de la amistad
        const newStatus = await friendshipService.getFriendshipStatus(token, userId);
        if (newStatus.success && newStatus.data) {
          setFriendshipStatuses(prev => ({
            ...prev,
            [userId]: newStatus.data as FriendshipStatus
          }));
        }
      } else {
        setNotification({
          message: response?.message || 'Error en la operación',
          type: 'error'
        });
      }
    } catch (error) {
      setNotification({
        message: 'Error en la operación',
        type: 'error'
      });
    }
  };

  const getFriendButton = (userId: string) => {
    const status = friendshipStatuses[userId];
    if (!status) return null;

    switch (status.status) {
      case 'none':
        return (
          <button 
            onClick={() => handleFriendAction(userId, 'send')}
            className="px-2 py-1 bg-blue-600/90 text-white rounded-full shadow-md hover:bg-blue-500 transition-all duration-200 text-xs font-semibold flex items-center justify-center gap-1 ml-4 cursor-pointer"
          >
            <FaUserPlus className="text-xs" />
            <span>Añadir</span>
          </button>
        );
      case 'pending':
        if (status.is_sender) {
          return (
            <button 
              onClick={() => handleFriendAction(userId, 'cancel')}
              className="px-2 py-1 bg-yellow-500/90 text-white rounded-full shadow-md hover:bg-yellow-400 transition-all duration-200 text-xs font-semibold flex items-center justify-center gap-1 ml-4 cursor-pointer"
            >
              <FaUserClock className="text-xs" />
              <span>Pendiente</span>
            </button>
          );
        }
        return (
          <div className="flex flex-col gap-2 ml-4 w-28">
            <button 
              onClick={() => handleFriendAction(userId, 'accept')}
              className="px-2 py-1 bg-green-500/90 text-white rounded-full shadow-md hover:bg-green-400 transition-all duration-200 text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer"
            >
              <FaUserCheck className="text-xs" />
              <span>Aceptar</span>
            </button>
            <button 
              onClick={() => handleFriendAction(userId, 'reject')}
              className="px-2 py-1 bg-red-500/90 text-white rounded-full shadow-md hover:bg-red-400 transition-all duration-200 text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer"
            >
              <FaUserTimes className="text-xs" />
              <span>Rechazar</span>
            </button>
          </div>
        );
      case 'friends':
        return (
          <button 
            onClick={() => handleFriendAction(userId, 'remove')}
            className="px-2 py-1 bg-red-500/90 text-white rounded-full shadow-md hover:bg-red-400 transition-all duration-200 text-xs font-semibold flex items-center justify-center gap-1 ml-4 cursor-pointer"
          >
            <FaUserMinus className="text-xs" />
            <span>Eliminar</span>
          </button>
        );
      default:
        return null;
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'friends':
        return (
          <div className="space-y-4">
            {friends.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 bg-gray-900/50 rounded-xl border border-gray-800">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-full flex items-center justify-center mb-6">
                  <FaUserFriends className="text-5xl text-blue-500" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  No tienes amigos aún
                </h3>
                <p className="text-gray-400 text-center max-w-md">
                  Busca usuarios y agrégalos como amigos para empezar a conectar y compartir momentos.
                </p>
              </div>
            ) : (
              friends.map((friend) => (
                <div
                  key={friend.friendship_id}
                  className="relative p-4 bg-gray-900 rounded-lg border border-gray-800 hover:border-blue-500 transition-all duration-300 group min-h-[90px] cursor-pointer"
                  onClick={() => handleUserClick(friend.user.username)}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center space-x-4">
                      {friend.user.profile_picture ? (
                        <img
                          src={friend.user.profile_picture}
                          alt={friend.user.username}
                          className="w-12 h-12 rounded-full object-cover border-2 border-gray-800 group-hover:border-blue-500 transition-all duration-300"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full border-2 border-gray-800 bg-gray-800 flex items-center justify-center group-hover:border-blue-500 transition-all duration-300">
                          <span className="text-gray-400 text-lg group-hover:text-blue-400 transition-colors">
                            {friend.user.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h2 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors truncate">
                          {friend.user.username}
                        </h2>
                        <p className="text-sm text-gray-400 truncate flex items-center gap-2">
                          <FaUserCircle className="text-xs" />
                          {friend.user.name} {friend.user.surname}
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFriendAction(friend.user.user_id, 'remove');
                      }}
                      className="relative z-10 px-3 py-1.5 bg-red-500/90 text-white rounded-full shadow-md hover:bg-red-400 transition-all duration-200 text-xs font-semibold flex items-center justify-center gap-1.5 ml-4 cursor-pointer"
                    >
                      <FaUserMinus className="text-xs" />
                      <span>Eliminar</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        );

      case 'suggestions':
        return (
          <div className="space-y-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                <p className="text-gray-400 mt-4">Cargando sugerencias...</p>
              </div>
            ) : suggestedFriends.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 bg-gray-900/50 rounded-xl border border-gray-800">
                <div className="w-24 h-24 bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-full flex items-center justify-center mb-6">
                  <FaLightbulb className="text-5xl text-purple-500" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  No hay usuarios disponibles
                </h3>
                <p className="text-gray-400 text-center max-w-md">
                  Todos los usuarios ya son tus amigos o no hay usuarios registrados en este momento.
                </p>
              </div>
            ) : (
              suggestedFriends.map((user) => (
                <div
                  key={user.user_id}
                  className="relative p-4 bg-gray-900 rounded-lg border border-gray-800 hover:border-purple-500 transition-all duration-300 group min-h-[90px] cursor-pointer"
                  onClick={() => handleUserClick(user.username)}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center space-x-4">
                      {user.profile_picture ? (
                        <img
                          src={user.profile_picture}
                          alt={user.username}
                          className="w-12 h-12 rounded-full object-cover border-2 border-gray-800 group-hover:border-purple-500 transition-all duration-300"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full border-2 border-gray-800 bg-gray-800 flex items-center justify-center group-hover:border-purple-500 transition-all duration-300">
                          <span className="text-gray-400 text-lg group-hover:text-purple-400 transition-colors">
                            {user.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h2 className="text-lg font-semibold text-white group-hover:text-purple-400 transition-colors truncate">
                          {user.username}
                        </h2>
                        <p className="text-sm text-gray-400 truncate flex items-center gap-2">
                          <FaUserCircle className="text-xs" />
                          {user.name} {user.surname}
                        </p>
                      </div>
                    </div>
                    <div className="relative z-10" onClick={(e) => e.stopPropagation()}>
                      {getFriendButton(user.user_id)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        );

      case 'search':
        return (
          <>
            <form onSubmit={handleSearch} className="mb-8">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Buscar por nombre de usuario... (presiona Enter)"
                    className="w-full pl-12 pr-4 py-3 rounded-lg bg-gray-900 border border-gray-800 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500" />
                </div>
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-500 hover:to-green-600 transition-all duration-300 shadow-lg shadow-green-500/20 flex items-center gap-2"
                >
                  <FaSearch className="text-lg" />
                  <span>Buscar</span>
                </button>
              </div>
            </form>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
                <p className="text-gray-400 mt-4">Buscando usuarios...</p>
              </div>
            ) : users.length === 0 && searchTerm !== '' ? (
              <div className="flex flex-col items-center justify-center py-12 bg-gray-900/50 rounded-xl border border-gray-800">
                <div className="w-24 h-24 bg-gradient-to-br from-green-600/20 to-blue-600/20 rounded-full flex items-center justify-center mb-6">
                  <FaSearch className="text-5xl text-green-500" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  No se encontraron usuarios
                </h3>
                <p className="text-gray-400 text-center max-w-md">
                  Intenta buscar con un nombre de usuario, nombre o apellido diferente.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {users.map((user) => (
                  <div
                    key={user.user_id}
                    className="relative p-4 bg-gray-900 rounded-lg border border-gray-800 hover:border-green-500 transition-all duration-300 group min-h-[90px] cursor-pointer"
                    onClick={() => handleUserClick(user.username)}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center space-x-4">
                        {user.profile_picture ? (
                          <img
                            src={user.profile_picture}
                            alt={user.username}
                            className="w-12 h-12 rounded-full object-cover border-2 border-gray-800 group-hover:border-green-500 transition-all duration-300"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full border-2 border-gray-800 bg-gray-800 flex items-center justify-center group-hover:border-green-500 transition-all duration-300">
                            <span className="text-gray-400 text-lg group-hover:text-green-400 transition-colors">
                              {user.username.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h2 className="text-lg font-semibold text-white group-hover:text-green-400 transition-colors truncate">
                            {user.username}
                          </h2>
                          <p className="text-sm text-gray-400 truncate flex items-center gap-2">
                            <FaUserCircle className="text-xs" />
                            {user.name} {user.surname}
                          </p>
                        </div>
                      </div>
                      <div className="relative z-10" onClick={(e) => e.stopPropagation()}>
                        {getFriendButton(user.user_id)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        );
    }
  };

  return (
    <div className="h-screen bg-black text-white flex">
      <Navbar />
      
      <div className="w-5/6 ml-[16.666667%] p-6">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Gestión de Contactos
            </h1>
            <p className="text-gray-400 text-sm flex items-center gap-2">
              <FaUsers className="text-blue-500" />
              Conecta y gestiona tus relaciones sociales
            </p>
          </div>

          {/* Tabs */}
          <div className="flex space-x-4 mb-8">
            <button
              onClick={() => setActiveTab('friends')}
              className={`px-6 py-3 rounded-lg transition-all duration-300 flex items-center gap-2 ${
                activeTab === 'friends'
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/20'
                  : 'bg-gray-900 text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <FaUserFriends className="text-lg" />
              <span>Mis Amigos</span>
            </button>
            <button
              onClick={() => setActiveTab('suggestions')}
              className={`px-6 py-3 rounded-lg transition-all duration-300 flex items-center gap-2 ${
                activeTab === 'suggestions'
                  ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg shadow-purple-500/20'
                  : 'bg-gray-900 text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <FaLightbulb className="text-lg" />
              <span>Sugerencias</span>
            </button>
            <button
              onClick={() => setActiveTab('search')}
              className={`px-6 py-3 rounded-lg transition-all duration-300 flex items-center gap-2 ${
                activeTab === 'search'
                  ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg shadow-green-500/20'
                  : 'bg-gray-900 text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <FaSearchIcon className="text-lg" />
              <span>Buscar Usuarios</span>
            </button>
          </div>

          {renderTabContent()}
        </div>
      </div>

      {/* Notificación */}
      {notification && (
        <div className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 ${
          notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white transform transition-all duration-300 animate-fade-in`}>
          {notification.type === 'success' ? (
            <FaUserCheck className="text-xl" />
          ) : (
            <FaUserTimes className="text-xl" />
          )}
          {notification.message}
        </div>
      )}
    </div>
  );
} 