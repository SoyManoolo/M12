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
import type { User, Friend } from "~/types/user.types";
import Navbar from "~/components/Inicio/Navbar";
import RightPanel from "~/components/Shared/RightPanel";
import { FaUserFriends, FaComment, FaHeart, FaVideo, FaCheck, FaTimes } from 'react-icons/fa';
import { useAuth } from "~/hooks/useAuth";
import { userService } from "~/services/user.service";

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
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFriends = async () => {
      if (!token) {
        setError('Por favor, inicia sesión para ver las notificaciones');
        setLoading(false);
        return;
      }

      try {
        const friendsResponse = await userService.getAllUsers(token);
        console.log('Respuesta del servidor para amigos:', friendsResponse);
        if (friendsResponse.success && friendsResponse.data && Array.isArray(friendsResponse.data.users)) {
          const friendsData = friendsResponse.data.users.map(user => ({
            friendship_id: user.user_id,
            user1_id: user.user_id,
            user2_id: user.user_id,
            created_at: new Date().toISOString(),
            user: {
              ...user,
              profile_picture: user.profile_picture || null,
              bio: user.bio ?? null,
              deleted_at: null,
              active_video_call: false
            }
          }));
          console.log('Datos transformados de amigos:', friendsData);
          setFriends(friendsData);
        } else {
          console.error('La respuesta de amigos no tiene el formato esperado:', friendsResponse);
          setFriends([]);
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

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Barra lateral usando el componente Navbar */}
      <Navbar />

      {/* Contenido central */}
      <div className="w-2/3 ml-[16.666667%] border-r border-gray-800">
        <div className="p-6">
          <h1 className="text-3xl font-bold mb-6">Notificaciones</h1>

          {/* Lista de notificaciones */}
          <div className="space-y-4">
            {currentNotifications.map((notification) => (
              <div
                key={notification.notification_id}
                className={getNotificationStyle(notification.type, notification.is_read)}
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
                        {new Date(notification.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {notification.type === 'friend_request' ? (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleAcceptFriend(notification.related_id)}
                        className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600"
                      >
                        <FaCheck />
                      </button>
                      <button
                        onClick={() => handleRejectFriend(notification.related_id)}
                        className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  ) : !notification.is_read && (
                    <button
                      onClick={() => handleMarkAsRead(notification.notification_id)}
                      className="text-blue-500 hover:text-blue-400 text-sm"
                    >
                      Marcar como leída
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Barra lateral derecha */}
      <RightPanel
        friends={friends}
        mode="online"
      />
    </div>
  );
} 