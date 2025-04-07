import { json } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { useState } from "react";
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
    // Datos mock para pruebas que coinciden con el esquema de la base de datos
    const mockNotifications: (Notification & { user: User })[] = [
      {
        notification_id: '550e8400-e29b-41d4-a716-446655440000',
        type: 'post_like',
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        related_id: '098f6bcd-4621-3373-8ade-4e832627b000',
        is_read: false,
        created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        user: {
          user_id: '123e4567-e89b-12d3-a456-426614174000',
          first_name: 'María',
          last_name: 'García',
          username: 'maria_garcia',
          email: 'maria@example.com',
          password: 'hashed_password',
          profile_picture_url: 'https://i.pravatar.cc/150?img=1',
          bio: 'Me gusta la fotografía',
          email_verified: true,
          is_moderator: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      }
    ];

    const mockFriends: Friend[] = [
      {
        friendship_id: '1',
        user1_id: '123e4567-e89b-12d3-a456-426614174000',
        user2_id: '123e4567-e89b-12d3-a456-426614174001',
        created_at: new Date().toISOString(),
        user: {
          user_id: '123e4567-e89b-12d3-a456-426614174001',
          first_name: 'Juan',
          last_name: 'Pérez',
          username: 'juan_perez',
          email: 'juan@example.com',
          password: 'hashed_password',
          profile_picture_url: 'https://i.pravatar.cc/150?img=2',
          bio: 'Amante de la música',
          email_verified: true,
          is_moderator: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      }
    ];

    return json<LoaderData>({
      notifications: mockNotifications,
      friends: mockFriends,
      currentUser: {} as User
    });
  } catch (error) {
    throw new Error('Error al cargar las notificaciones');
  }
};

export default function Notificaciones() {
  const { notifications, friends } = useLoaderData<typeof loader>();
  const [searchTerm, setSearchTerm] = useState<string>("");

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Hace un momento';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `Hace ${minutes} minutos`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Hace ${hours} horas`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `Hace ${days} días`;
    return date.toLocaleDateString();
  };

  const getNotificationContent = (notification: Notification & { user: User }) => {
    switch (notification.type) {
      case 'friend_request':
        return {
          title: 'Nueva solicitud de amistad',
          description: `${notification.user.first_name} quiere ser tu amigo`
        };
      case 'message':
        return {
          title: 'Nuevo mensaje',
          description: `${notification.user.first_name} te ha enviado un mensaje`
        };
      case 'comment':
        return {
          title: 'Nuevo comentario',
          description: `${notification.user.first_name} comentó en tu publicación`
        };
      case 'post_like':
        return {
          title: 'Me gusta en tu publicación',
          description: `A ${notification.user.first_name} le gustó tu publicación`
        };
      case 'video_call':
        return {
          title: 'Llamada perdida',
          description: `${notification.user.first_name} intentó iniciar una videollamada contigo`
        };
      default:
        return {
          title: 'Nueva notificación',
          description: 'Tienes una nueva notificación'
        };
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Barra lateral izquierda */}
      <Navbar />

      {/* Contenido central - Notificaciones */}
      <div className="w-2/3 ml-[16.666667%] border-r border-gray-800">
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-6 text-white">Notificaciones</h1>
          <div className="space-y-4">
            {notifications.length === 0 ? (
              <div className="bg-gray-800/50 rounded-lg p-6 text-center">
                <p className="text-gray-400">No tienes notificaciones nuevas</p>
              </div>
            ) : (
              notifications.map((notification) => {
                const content = getNotificationContent(notification);
                return (
                  <Link 
                    to={
                      notification.type === 'post_like' || notification.type === 'comment'
                        ? `/post/${notification.related_id}`
                        : notification.type === 'message'
                        ? `/mensajes/${notification.user.username}`
                        : notification.type === 'friend_request'
                        ? `/amigos`
                        : '#'
                    }
                    key={notification.notification_id} 
                    className="block bg-gray-800/50 p-4 rounded-lg border border-gray-700 hover:bg-gray-700/50 transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <img 
                        src={notification.user.profile_picture_url || '/images/default-avatar.png'} 
                        alt={notification.user.username}
                        className="w-12 h-12 rounded-full object-cover border-2 border-gray-700"
                      />
                      <div>
                        <p className="font-medium text-white">{content.title}</p>
                        <p className="text-gray-400">{content.description}</p>
                        <p className="text-sm text-gray-500 mt-2">
                          {formatTimeAgo(notification.created_at)}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Barra lateral derecha - Amigos en línea */}
      <RightPanel
        users={friends.map((friend: Friend) => ({
          ...friend.user,
          is_online: true // Esto debería venir del backend
        }))}
        mode="online"
        onSearch={setSearchTerm}
      />
    </div>
  );
} 