import { pageMeta } from '~/utils/seo';
import { developmentLogger } from '~/utils/logger';
/**
 * Página de Notificaciones
 * 
 * Muestra todas las notificaciones del usuario en una lista mezclada.
 * Incluye:
 * - Notificaciones de solicitudes de amistad
 * - Notificaciones de mensajes
 * - Notificaciones de comentarios
 * - Notificaciones de likes
 * - Notificaciones de videollamadas
 * 
 * @module Notificaciones
 */

import { useState, useEffect } from "react";
import { notificationService, type InboxNotification } from '~/services/notification.service';
import { friendshipService } from '~/services/friendship.service';
import { userService } from '~/services/user.service';
import type { User } from '~/types/user.types';
import { environment } from '~/config/environment';
import Navbar from "~/components/Inicio/Navbar";
import RightPanel from "~/components/Shared/RightPanel";
import { FaUserFriends, FaComment, FaHeart, FaVideo, FaCheck, FaTimes, FaSearch, FaTrash, FaCheckDouble, FaBell } from 'react-icons/fa';
import { useAuth } from "~/hooks/useAuth";
import { formatDistanceToNow, isToday, isYesterday, isThisWeek, isThisMonth } from 'date-fns';
import { es } from 'date-fns/locale';

export const meta = () => pageMeta('Notificaciones', 'Consulta tus novedades y solicitudes de amistad.', { path: '/notificaciones' });

export default function Notificaciones(): React.ReactElement {
  const { isAuthenticated, isLoading, token, user } = useAuth();
  const currentUserId = user?.user_id;
  const [currentNotifications, setCurrentNotifications] = useState<InboxNotification[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  useEffect(() => {
    let cancelled = false;
    const fetchNotifications = async () => {
      if (isLoading) return;
      setLoading(true);
      setError(null);
      if (!isAuthenticated) {
        setCurrentNotifications([]);
        setError('Por favor, inicia sesión para ver las notificaciones');
        setLoading(false);
        return;
      }

      try {
        const notifications = await notificationService.list();
        if (!cancelled) setCurrentNotifications(notifications);
      } catch (err) {
        developmentLogger.error('Error al cargar las notificaciones:', err);
        if (!cancelled) setError('Error al cargar las notificaciones');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchNotifications();
    return () => { cancelled = true; };
  }, [isAuthenticated, isLoading, reloadKey]);

  useEffect(() => {
    let cancelled = false;
    if (!token || !currentUserId) {
      setSuggestedUsers([]);
      return;
    }

    const fetchSuggestedUsers = async () => {
      try {
        const friendsResponse = await friendshipService.getUserFriends(token);
        if (!friendsResponse.success || !friendsResponse.data) {
          if (!cancelled) setSuggestedUsers([]);
          return;
        }

        const usersResponse = await userService.getAllUsers(token);
        if (!cancelled) {
          const friendIds = new Set(friendsResponse.data.map(friend => friend.user.user_id));
          setSuggestedUsers(usersResponse.success && Array.isArray(usersResponse.data?.users)
            ? usersResponse.data.users.filter(candidate => candidate.user_id !== currentUserId && !friendIds.has(candidate.user_id))
            : []);
        }
      } catch (err) {
        developmentLogger.error('Error al cargar sugerencias:', err);
        if (!cancelled) setSuggestedUsers([]);
      }
    };

    fetchSuggestedUsers();
    return () => { cancelled = true; };
  }, [token, currentUserId]);

  const showActionError = (error: unknown) => {
    developmentLogger.error('Error al actualizar la notificación:', error);
    setError('No se pudo actualizar la notificación. Inténtalo de nuevo.');
  };

  const respondToFriend = async (requestId: string, action: 'accept' | 'reject') => {
    const response = await fetch(`${environment.apiUrl}/friendship/request/${encodeURIComponent(requestId)}/${action}`, {
      method: 'POST', credentials: 'include'
    });
    if (!response.ok) throw new Error(`Error en solicitud de amistad (${response.status})`);
    setCurrentNotifications(prev => prev.filter(item => item.related_id !== requestId));
  };

  const handleAcceptFriend = async (friendshipId: string) => {
    try {
      await respondToFriend(friendshipId, 'accept');
    } catch (error) {
      showActionError(error);
    }
  };

  const handleRejectFriend = async (friendshipId: string) => {
    try {
      await respondToFriend(friendshipId, 'reject');
    } catch (error) {
      showActionError(error);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationService.markRead(notificationId);
      setCurrentNotifications(prev =>
        prev.map(notification =>
          notification.notification_id === notificationId
            ? { ...notification, is_read: true }
            : notification
        )
      );
    } catch (error) {
      showActionError(error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllRead();
      setCurrentNotifications(prev =>
        prev.map(notification => ({ ...notification, is_read: true }))
      );
    } catch (error) {
      showActionError(error);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await notificationService.remove(notificationId);
      setCurrentNotifications(prev =>
        prev.filter(notification => notification.notification_id !== notificationId)
      );
    } catch (error) {
      showActionError(error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'friend_request':
        return <FaUserFriends className="text-blue-500" />;
      case 'message':
        return <FaComment className="text-green-500" />;
      case 'comment':
        return <FaComment className="text-yellow-500" />;
      case 'post':
        return <FaHeart className="text-red-500" />;
      case 'video_call':
        return <FaVideo className="text-purple-500" />;
      default:
        return null;
    }
  };

  const getNotificationStyle = (type: string, isRead: boolean) => {
    const baseStyle = 'p-4 rounded-lg border transition-colors';
    const readStyle = isRead ? 'border-gray-800 bg-gray-900/50' : 'border-blue-500 bg-blue-500/10';
    
    switch (type) {
      case 'friend_request':
        return `${baseStyle} ${readStyle}`;
      case 'message':
        return `${baseStyle} ${isRead ? 'border-gray-800 bg-gray-900/50' : 'border-green-500 bg-green-500/10'}`;
      case 'comment':
        return `${baseStyle} ${isRead ? 'border-gray-800 bg-gray-900/50' : 'border-yellow-500 bg-yellow-500/10'}`;
      case 'post':
        return `${baseStyle} ${isRead ? 'border-gray-800 bg-gray-900/50' : 'border-red-500 bg-red-500/10'}`;
      case 'video_call':
        return `${baseStyle} ${isRead ? 'border-gray-800 bg-gray-900/50' : 'border-purple-500 bg-purple-500/10'}`;
      default:
        return `${baseStyle} ${readStyle}`;
    }
  };

  const getNotificationGroup = (date: string) => {
    const notificationDate = new Date(date);
    if (isToday(notificationDate)) return 'Hoy';
    if (isYesterday(notificationDate)) return 'Ayer';
    if (isThisWeek(notificationDate)) return 'Esta semana';
    if (isThisMonth(notificationDate)) return 'Este mes';
    return 'Anteriores';
  };

  const filteredNotifications = currentNotifications
    .filter(notification => {
      const matchesSearch = !searchQuery || (notification.user?.username.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
      const matchesFilter = selectedFilter === 'all' || notification.type === selectedFilter;
      return matchesSearch && matchesFilter;
    })
    .reduce((groups, notification) => {
      const group = getNotificationGroup(notification.created_at);
      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group].push(notification);
      return groups;
    }, {} as Record<string, InboxNotification[]>);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col lg:flex-row">
      <Navbar />

      {/* Contenido central */}
      <div className="w-full lg:w-2/3 lg:ml-[16.666667%] lg:border-r border-gray-800">
        <div className="pt-16 pb-16 p-3 sm:p-6">
          {/* Encabezado */}
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4 sm:mb-6">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Notificaciones</h1>
                <p className="text-gray-400 mt-1">Mantente al día con tus actividades</p>
              </div>
              <button
                onClick={handleMarkAllAsRead}
                className="px-4 py-2 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition-colors flex items-center space-x-2"
              >
                <FaCheckDouble className="text-sm" />
                <span>Marcar todas como leídas</span>
              </button>
            </div>

            {/* Barra de búsqueda y filtros */}
            <div className="space-y-3 sm:space-y-4">
              <div className="relative">
                <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar en notificaciones..."
                  className="w-full bg-gray-900 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex space-x-2 overflow-x-auto pb-2 custom-scrollbar">
                <button
                  onClick={() => setSelectedFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors whitespace-nowrap ${
                    selectedFilter === 'all' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  Todas
                </button>
                <button
                  onClick={() => setSelectedFilter('friend_request')}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors whitespace-nowrap ${
                    selectedFilter === 'friend_request' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  Solicitudes
                </button>
                <button
                  onClick={() => setSelectedFilter('message')}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors whitespace-nowrap ${
                    selectedFilter === 'message' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  Mensajes
                </button>
                <button
                  onClick={() => setSelectedFilter('post')}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors whitespace-nowrap ${
                    selectedFilter === 'post' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  Likes
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 bg-gray-900/50 rounded-xl border border-gray-800" role="status">
              <FaBell className="mb-4 text-3xl text-blue-500 animate-pulse" aria-hidden="true" />
              <p className="text-gray-300">Cargando notificaciones…</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 bg-red-950/20 rounded-xl border border-red-900/60" role="alert">
              <FaBell className="mb-4 text-3xl text-red-400" aria-hidden="true" />
              <h2 className="text-lg font-semibold text-white">No pudimos cargar las notificaciones</h2>
              <p className="mt-2 text-center text-gray-300">{error}</p>
              <button
                type="button"
                onClick={() => setReloadKey((value) => value + 1)}
                className="mt-5 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-500"
              >
                Reintentar
              </button>
            </div>
          ) : (
          /* Lista de notificaciones agrupadas */
          <div className="space-y-4 sm:space-y-6">
            {Object.entries(filteredNotifications).map(([group, notifications]) => (
              <div key={group} className="space-y-2">
                <h2 className="text-xs sm:text-sm font-semibold text-gray-400 mb-2 sm:mb-3">{group}</h2>
                {notifications.map((notification) => (
                  <div
                    key={notification.notification_id}
                    className={`group relative ${getNotificationStyle(notification.type, notification.is_read)} hover:scale-[1.02] transition-all duration-200 p-3 sm:p-4 text-xs sm:text-sm`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 sm:space-x-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm">
                            {notification.type === 'friend_request' && (notification.user
                              ? `${notification.user.username} te envió una solicitud de amistad`
                              : 'Solicitud de amistad')}
                            {notification.type === 'message' && 'Nuevo mensaje'}
                            {notification.type === 'comment' && 'Nuevo comentario en tu publicación'}
                            {notification.type === 'post' && 'Nueva publicación'}
                          </p>
                          <p className="text-xs text-gray-400">
                            {formatDistanceToNow(new Date(notification.created_at), {
                              addSuffix: true,
                              locale: es
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {notification.type === 'friend_request' && notification.user && (
                          <>
                            <button
                              onClick={() => handleAcceptFriend(notification.related_id)}
                              className="p-2 bg-green-500/20 text-green-400 rounded-full hover:bg-green-500/30 transition-colors"
                              title="Aceptar solicitud"
                            >
                              <FaCheck />
                            </button>
                            <button
                              onClick={() => handleRejectFriend(notification.related_id)}
                              className="p-2 bg-red-500/20 text-red-400 rounded-full hover:bg-red-500/30 transition-colors"
                              title="Rechazar solicitud"
                            >
                              <FaTimes />
                            </button>
                          </>
                        )}
                        {!notification.is_read && (
                          <button
                            onClick={() => handleMarkAsRead(notification.notification_id)}
                            className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
                            title="Marcar como leída"
                          >
                            Marcar como leída
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteNotification(notification.notification_id)}
                          className="p-2 text-gray-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all duration-200"
                          title="Eliminar notificación"
                        >
                          <FaTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    {!notification.is_read && (
                      <div className="absolute top-0 right-0 w-2 h-2 bg-blue-500 rounded-full transform translate-x-1 -translate-y-1" />
                    )}
                  </div>
                ))}
              </div>
            ))}

            {/* Mensaje cuando no hay notificaciones */}
            {Object.keys(filteredNotifications).length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 bg-gray-900/50 rounded-xl border border-gray-800">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-full flex items-center justify-center mb-6">
                  <FaBell className="text-4xl text-blue-500" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {searchQuery ? 'No se encontraron notificaciones' : 'No tienes notificaciones'}
                </h3>
                <p className="text-gray-400 text-center max-w-md">
                  {searchQuery 
                    ? 'Intenta con otros términos de búsqueda'
                    : 'Las notificaciones aparecerán aquí cuando tengas nuevas interacciones'}
                </p>
              </div>
            )}
          </div>
          )}
        </div>
      </div>

      {/* Panel lateral derecho */}
      <div className="hidden lg:block">
        <RightPanel
          users={suggestedUsers}
          mode="suggested"
        />
      </div>

      <style>
        {`
          .custom-scrollbar::-webkit-scrollbar {
            height: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #374151;
            border-radius: 2px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #4B5563;
          }
        `}
      </style>
    </div>
  );
} 
