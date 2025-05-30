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
import { FaSearch, FaUserPlus, FaUserMinus, FaUserClock, FaUserCheck, FaUserTimes, FaUserFriends } from 'react-icons/fa';
import { useAuth } from "~/hooks/useAuth";
import { useState, useEffect } from 'react';
import { friendshipService } from "~/services/friendship.service";
import Notification from "./Notification";

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

interface FriendshipStatus {
  status: 'none' | 'pending' | 'friends';
  request_id?: string;
  is_sender?: boolean;
}

interface RightPanelProps {
  friends?: Friend[];
  users?: User[];
  mode?: 'suggested' | 'common' | 'online' | 'friends';
  showSearch?: boolean;
  onSearch?: (query: string) => void;
  customTitle?: string;
}

export default function RightPanel({ 
  friends = [], 
  users = [],
  mode = 'suggested', 
  showSearch = true,
  onSearch, 
  customTitle
}: RightPanelProps) {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [friendshipStatuses, setFriendshipStatuses] = useState<Record<string, FriendshipStatus>>({});
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  const title = customTitle || (mode === 'suggested' 
    ? 'Amigos sugeridos' 
    : mode === 'common' 
    ? 'Amigos en común' 
    : mode === 'friends'
    ? 'Mis amigos'
    : 'Sugerencias de amistades');
    
  const emptyMessage = mode === 'suggested' 
    ? 'No hay sugerencias disponibles' 
    : mode === 'common'
    ? 'No hay amigos en común'
    : mode === 'friends'
    ? (
      <div className="flex flex-col items-center justify-center py-8">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-full flex items-center justify-center mb-4">
          <FaUserFriends className="text-4xl text-blue-500" />
        </div>
        <h4 className="text-lg font-semibold text-white mb-2">¡Aún no tienes amigos!</h4>
        <p className="text-gray-400 text-center max-w-xs">
          Conecta con personas, envía solicitudes de amistad y tu lista de amigos aparecerá aquí. ¡Empieza a crear tu red!
        </p>
      </div>
    )
    : 'No hay usuarios disponibles';

  useEffect(() => {
    const fetchFriendshipStatuses = async () => {
      if (!token || !users.length) return;
      const statuses: Record<string, FriendshipStatus> = {};
      for (const user of users) {
        const response = await friendshipService.getFriendshipStatus(token, user.user_id);
        if (response.success && response.data) {
          statuses[user.user_id] = response.data as FriendshipStatus;
        }
      }
      setFriendshipStatuses(statuses);
    };
    fetchFriendshipStatuses();
  }, [token, users]);

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
        } else {
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
        }
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

  // Convertir users a friends si es necesario
  const displayFriends = friends.length > 0 ? friends : users.map(user => ({
    friendship_id: user.user_id,
    user1_id: user.user_id,
    user2_id: user.user_id,
    created_at: new Date().toISOString(),
    user
  }));

  return (
    <div className="w-[370px] p-4 sticky top-0 h-screen overflow-y-auto">
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
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-full flex items-center justify-center mb-4">
                <FaUserFriends className="text-4xl text-blue-500" />
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">¡Aún no tienes amigos!</h4>
              <p className="text-gray-400 text-center max-w-xs">
                Conecta con personas, envía solicitudes de amistad y tu lista de amigos aparecerá aquí. ¡Empieza a crear tu red!
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {displayFriends.map((friend) => {
                const imageUrl = friend.user.profile_picture;

                return (
                  <div key={friend.friendship_id} className="flex items-center justify-between py-2">
                    <div className="flex items-center p-2 rounded-lg transition-colors w-full">
                    <div 
                        className="relative cursor-pointer"
                      onClick={() => handleUserClick(friend.user.username)}
                    >
                        {imageUrl ? (
                          <img 
                            src={imageUrl}
                            alt={friend.user.username}
                            className="w-12 h-12 rounded-full object-cover border-2 border-gray-800 transition-all duration-200 hover:scale-110 hover:border-blue-500 hover:shadow-lg cursor-pointer"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = "/default-avatar.png";
                            }}
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full border-2 border-gray-800 bg-gray-800 flex items-center justify-center transition-all duration-200 hover:scale-110 hover:border-blue-500 hover:shadow-lg cursor-pointer">
                            <span className="text-gray-400 text-sm">{friend.user.username.charAt(0).toUpperCase()}</span>
                          </div>
                        )}
                        {mode === 'online' && friend.user.is_online && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-black"></div>
                        )}
                      </div>
                      <div className="ml-4 flex flex-col">
                        <p 
                          className="font-semibold text-white hover:text-blue-400 text-base cursor-pointer"
                          onClick={() => handleUserClick(friend.user.username)}
                        >
                          {friend.user.username}
                        </p>
                        <p className="text-sm text-gray-400">
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
                    {mode !== 'friends' && getFriendButton(friend.user.user_id)}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Notificación */}
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
} 