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

import { json, redirect } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { useState, useEffect } from "react";
import type { Notification } from "~/types/notifications";
import type { User } from "~/types/user.types";
import type { Friend } from "~/services/friendship.service";
import Navbar from "~/components/Inicio/Navbar";
import RightPanel from "~/components/Shared/RightPanel";
import { FaUserFriends, FaComment, FaHeart, FaVideo, FaCheck, FaTimes, FaSearch, FaTrash, FaCheckDouble, FaBell } from 'react-icons/fa';
import { useAuth } from "~/hooks/useAuth";
import { userService } from "~/services/user.service";
import { formatDistanceToNow, isToday, isYesterday, isThisWeek, isThisMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { friendshipService } from "~/services/friendship.service";

interface LoaderData {
  notifications: (Notification & { user: User })[];
  currentUser: User;
}

export const loader = async ({ request }: { request: Request }) => {
  const cookieHeader = request.headers.get("Cookie");
  const token = cookieHeader?.split(";").find((c: string) => c.trim().startsWith("token="))?.split("=")[1];
  if (!token) return redirect("/login");
  try {
    // Datos mock para pruebas
    const mockUser: User = {
      user_id: "1",
      username: "mariagarcia",
      name: "María",
      surname: "García",
      email: "maria@example.com",
      profile_picture: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg",
      bio: "¡Hola! Me encanta compartir momentos especiales",
      email_verified: true,
      is_moderator: false,
      deleted_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      active_video_call: false
    };

    const mockNotifications: (Notification & { user: User })[] = [
      {
        notification_id: "1",
        type: "friend_request",
        user_id: "2",
        related_id: "1",
        post_id: null,
        is_read: false,
        severity: "info",
        created_at: new Date().toISOString(),
        user: {
          user_id: "2",
          username: "carlos123",
          name: "Carlos",
          surname: "Pérez",
          email: "carlos@example.com",
          profile_picture: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg",
          bio: "Amante de la música",
          email_verified: true,
          is_moderator: false,
          deleted_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          active_video_call: false
        }
      },
      {
        notification_id: "2",
        type: "message",
        user_id: "3",
        related_id: "1",
        post_id: null,
        is_read: false,
        severity: "info",
        created_at: new Date().toISOString(),
        user: {
          user_id: "3",
          username: "analopez",
          name: "Ana",
          surname: "López",
          email: "ana@example.com",
          profile_picture: "https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg",
          bio: "Viajera y fotógrafa",
          email_verified: true,
          is_moderator: false,
          deleted_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          active_video_call: false
        }
      }
    ];

    return json<LoaderData>({
      notifications: mockNotifications,
      currentUser: mockUser
    });
  } catch (error) {
    throw new Error('Error al cargar las notificaciones');
  }
};

export default function Notificaciones(): React.ReactElement {
  const { notifications, currentUser } = useLoaderData<LoaderData>();
  const { token } = useAuth();
  const [currentNotifications, setCurrentNotifications] = useState<Notification[]>(notifications);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  useEffect(() => {
    const fetchFriends = async () => {
      if (!token) {
        setError('Por favor, inicia sesión para ver las notificaciones');
        setLoading(false);
        return;
      }

      try {
        // Cargar amigos
        const friendsResponse = await friendshipService.getUserFriends(token);
        if (friendsResponse.success && friendsResponse.data) {
          setFriends(friendsResponse.data);

          // Cargar usuarios sugeridos
          const suggestedResponse = await userService.getAllUsers(token);
          if (suggestedResponse.success && suggestedResponse.data && Array.isArray(suggestedResponse.data.users)) {
            // Filtrar los usuarios que ya son amigos
            const friendIds = new Set(friendsResponse.data.map(friend => friend.user.user_id));
            const filteredSuggestedUsers = suggestedResponse.data.users.filter(
              user => !friendIds.has(user.user_id)
            );
            setSuggestedUsers(filteredSuggestedUsers);
          }
        } else {
          setFriends([]);
          setSuggestedUsers([]);
        }
      } catch (err) {
        console.error('Error al cargar los amigos:', err);
        setError('Error al cargar la lista de amigos');
      } finally {
        setLoading(false);
      }
    };

    fetchFriends();
  }, [token]);

  const handleAcceptFriend = async (friendshipId: string) => {
    try {
      console.log('Aceptando solicitud de amistad:', friendshipId);
      setFriends(prev =>
        prev.map(friend =>
          friend.friendship_id === friendshipId
            ? { ...friend, status: 'accepted' }
            : friend
        )
      );
    } catch (error) {
      console.error('Error al aceptar solicitud:', error);
    }
  };

  const handleRejectFriend = async (friendshipId: string) => {
    try {
      console.log('Rechazando solicitud de amistad:', friendshipId);
      setFriends(prev =>
        prev.filter(friend => friend.friendship_id !== friendshipId)
      );
    } catch (error) {
      console.error('Error al rechazar solicitud:', error);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      console.log('Marcando notificación como leída:', notificationId);
      setCurrentNotifications(prev =>
        prev.map(notification =>
          notification.notification_id === notificationId
            ? { ...notification, is_read: true }
            : notification
        )
      );
    } catch (error) {
      console.error('Error al marcar como leída:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setCurrentNotifications(prev =>
        prev.map(notification => ({ ...notification, is_read: true }))
      );
    } catch (error) {
      console.error('Error al marcar todas como leídas:', error);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      setCurrentNotifications(prev =>
        prev.filter(notification => notification.notification_id !== notificationId)
      );
    } catch (error) {
      console.error('Error al eliminar notificación:', error);
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
      case 'post_like':
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
      case 'post_like':
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
      const matchesSearch = notification.user?.username.toLowerCase().includes(searchQuery.toLowerCase());
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
    }, {} as Record<string, Notification[]>);

  return (
    <div className="min-h-screen bg-black text-white flex">
      <Navbar />

      {/* Contenido central */}
      <div className="w-2/3 ml-[16.666667%] border-r border-gray-800">
        <div className="p-6">
          {/* Encabezado */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-6">
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
          <div className="space-y-4">
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
                  onClick={() => setSelectedFilter('post_like')}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors whitespace-nowrap ${
                    selectedFilter === 'post_like' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  Likes
                </button>
                <button
                  onClick={() => setSelectedFilter('comment')}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors whitespace-nowrap ${
                    selectedFilter === 'comment' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  Comentarios
                </button>
              </div>
            </div>
          </div>

          {/* Lista de notificaciones agrupadas */}
          <div className="space-y-6">
            {Object.entries(filteredNotifications).map(([group, notifications]) => (
              <div key={group} className="space-y-2">
                <h2 className="text-sm font-semibold text-gray-400 mb-3">{group}</h2>
                {notifications.map((notification) => (
              <div
                key={notification.notification_id}
                    className={`group relative ${getNotificationStyle(notification.type, notification.is_read)} hover:scale-[1.02] transition-all duration-200`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 flex items-center justify-center">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div>
                      <p className="text-sm">
                        <span className="font-semibold">{notification.user?.username}</span>
                        {notification.type === 'friend_request' && ' te envió una solicitud de amistad'}
                        {notification.type === 'message' && ' te envió un mensaje'}
                        {notification.type === 'comment' && ' comentó tu publicación'}
                        {notification.type === 'post_like' && ' le gustó tu publicación'}
                        {notification.type === 'video_call' && ' te llamó'}
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
                  {notification.type === 'friend_request' ? (
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
                  ) : !notification.is_read && (
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
        </div>
      </div>

      {/* Panel lateral derecho */}
      <RightPanel
        users={suggestedUsers}
        mode="suggested"
      />

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