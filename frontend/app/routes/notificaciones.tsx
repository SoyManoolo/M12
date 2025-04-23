import { json } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { useState, useEffect } from "react";
import type { Notification, User } from "~/types/notifications";
import Navbar from "~/components/Inicio/Navbar";
import RightPanel from "~/components/Shared/RightPanel";

interface Friend {
  friendship_id: string;
  user1_id: string;
  user2_id: string;
  created_at: string;
  user: User;
}

interface LoaderData {
  notifications: (Notification & { user: User })[];
  friends: Friend[];
  currentUser: User;
}

export const loader = async () => {
  try {
    // Datos mock para pruebas
    const mockUser: User = {
      user_id: "1",
      first_name: "María",
      last_name: "García",
      username: "mariagarcia",
      email: "maria@example.com",
      password: "hashed_password",
      profile_picture_url: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg",
      bio: "¡Hola! Me encanta compartir momentos especiales",
      email_verified: true,
      is_moderator: false,
      id_deleted: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const mockFriend: Friend = {
      friendship_id: "1",
      user1_id: "1",
      user2_id: "2",
      created_at: new Date().toISOString(),
      user: {
        user_id: "2",
        first_name: "Carlos",
        last_name: "Pérez",
        username: "carlos123",
        email: "carlos@example.com",
        password: "hashed_password",
        profile_picture_url: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg",
        bio: "Amante de la música",
        email_verified: true,
        is_moderator: false,
        id_deleted: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
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
          first_name: "Carlos",
          last_name: "Pérez",
          username: "carlos123",
          email: "carlos@example.com",
          password: "hashed_password",
          profile_picture_url: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg",
          bio: "Amante de la música",
          email_verified: true,
          is_moderator: false,
          id_deleted: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      }
    ];

    return json<LoaderData>({
      notifications: mockNotifications,
      friends: [mockFriend],
      currentUser: mockUser
    });
  } catch (error) {
    throw new Error('Error al cargar las notificaciones');
  }
};

export default function Notificaciones(): React.ReactElement {
  const { notifications, friends } = useLoaderData<LoaderData>();
  const [currentNotifications, setCurrentNotifications] = useState<Notification[]>(notifications);
  const [currentFriends, setCurrentFriends] = useState<Friend[]>(friends);

  const handleAcceptFriend = async (friendshipId: string) => {
    try {
      console.log('Aceptando solicitud de amistad:', friendshipId);
      setCurrentFriends(prev =>
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
      setCurrentFriends(prev =>
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

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Barra lateral usando el componente Navbar */}
      <Navbar />

      {/* Contenido central */}
      <div className="w-2/3 ml-[16.666667%] border-r border-gray-800">
        <div className="p-6 space-y-6">
          {/* Lista de notificaciones */}
          <div className="space-y-4">
            {currentNotifications.map((notification) => (
              <div
                key={notification.notification_id}
                className={`p-4 rounded-lg border ${
                  notification.is_read
                    ? 'border-gray-800 bg-gray-900/50'
                    : 'border-blue-500 bg-blue-500/10'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <img
                      src={notification.user?.profile_picture_url || '/images/default-avatar.png'}
                      alt={notification.user?.username}
                      className="w-10 h-10 rounded-full"
                    />
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
                  {!notification.is_read && (
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

          {/* Solicitudes de amistad */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Solicitudes de amistad</h2>
            {currentFriends.map((friend) => (
              <div
                key={friend.friendship_id}
                className="p-4 rounded-lg border border-gray-800 bg-gray-900/50"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <img
                      src={friend.user.profile_picture_url || '/images/default-avatar.png'}
                      alt={friend.user.username}
                      className="w-10 h-10 rounded-full"
                    />
                    <div>
                      <p className="font-semibold">{friend.user.username}</p>
                      <p className="text-sm text-gray-400">
                        {new Date(friend.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleAcceptFriend(friend.friendship_id)}
                      className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                    >
                      Aceptar
                    </button>
                    <button
                      onClick={() => handleRejectFriend(friend.friendship_id)}
                      className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600"
                    >
                      Rechazar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Barra lateral derecha */}
      <RightPanel
        users={friends.map((friend: Friend) => ({
          ...friend.user,
          is_online: true
        }))}
        mode="online"
      />
    </div>
  );
} 