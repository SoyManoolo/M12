import { json } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { useState } from "react";
import type { Notification, Friend, User, FriendRequest, ChatMessage, PostComment } from "~/types/notifications";
import Navbar from "~/components/Inicio/Navbar";
import { FaSearch } from 'react-icons/fa';

interface LoaderData {
  notifications: (Notification & { user: User })[];
  friends: (Friend & { user: User })[];
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
        related_id: '098f6bcd-4621-3373-8ade-4e832627b000', // ID del post
        is_read: false,
        created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutos atrás
        severity: 'info',
        post_id: '098f6bcd-4621-3373-8ade-4e832627b000',
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
      },
      {
        notification_id: '550e8400-e29b-41d4-a716-446655440001',
        type: 'comment',
        user_id: '123e4567-e89b-12d3-a456-426614174001',
        related_id: '098f6bcd-4621-3373-8ade-4e832627b001', // ID del post
        is_read: false,
        created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutos atrás
        severity: 'info',
        post_id: '098f6bcd-4621-3373-8ade-4e832627b001',
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
      },
      {
        notification_id: '550e8400-e29b-41d4-a716-446655440002',
        type: 'friend_request',
        user_id: '123e4567-e89b-12d3-a456-426614174002',
        related_id: '098f6bcd-4621-3373-8ade-4e832627b002', // ID de la solicitud de amistad
        is_read: false,
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 horas atrás
        severity: 'info',
        post_id: null,
        user: {
          user_id: '123e4567-e89b-12d3-a456-426614174002',
          first_name: 'Ana',
          last_name: 'Martínez',
          username: 'ana_martinez',
          email: 'ana@example.com',
          password: 'hashed_password',
          profile_picture_url: 'https://i.pravatar.cc/150?img=3',
          bio: 'Viajera incansable',
          email_verified: true,
          is_moderator: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      },
      {
        notification_id: '550e8400-e29b-41d4-a716-446655440003',
        type: 'message',
        user_id: '123e4567-e89b-12d3-a456-426614174003',
        related_id: '098f6bcd-4621-3373-8ade-4e832627b003', // ID del mensaje
        is_read: false,
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 día atrás
        severity: 'info',
        post_id: null,
        user: {
          user_id: '123e4567-e89b-12d3-a456-426614174003',
          first_name: 'Carlos',
          last_name: 'López',
          username: 'carlos_lopez',
          email: 'carlos@example.com',
          password: 'hashed_password',
          profile_picture_url: 'https://i.pravatar.cc/150?img=4',
          bio: 'Desarrollador web',
          email_verified: true,
          is_moderator: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      }
    ];

    return json<LoaderData>({
      notifications: mockNotifications,
      friends: [],
      currentUser: {} as User
    });
  } catch (error) {
    throw new Error('Error al cargar las notificaciones');
  }
};

export default function Notificaciones() {
  const { notifications, friends, currentUser } = useLoaderData<typeof loader>();
  const [searchTerm, setSearchTerm] = useState("");

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
    <div className="flex min-h-screen bg-black text-white">
      {/* Navbar */}
      <Navbar />

      {/* Contenido principal - Notificaciones */}
      <div className="flex-1 ml-[16.666667%] p-6 mr-80">
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

      {/* Barra lateral derecha - Amigos */}
      <div className="w-80 bg-black border-l border-gray-800 p-6 fixed right-0 top-0 h-screen overflow-y-auto">
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar amigos..."
              className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <FaSearch className="absolute right-3 top-3 text-gray-500" />
          </div>
        </div>
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white mb-4">Amigos en línea</h2>
          {friends.length === 0 ? (
            <p className="text-gray-500 text-center">No hay amigos conectados</p>
          ) : (
            friends.map((friend) => (
              <div key={friend.friendship_id} className="flex items-center gap-3 p-2 hover:bg-gray-800/50 rounded-lg transition-all">
                <div className="relative">
                  <img 
                    src={friend.user?.profile_picture_url || '/images/default-avatar.png'} 
                    alt={friend.user?.username}
                    className="w-10 h-10 rounded-full object-cover border border-gray-700"
                  />
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-black"></div>
                </div>
                <div>
                  <p className="font-medium text-white">{friend.user?.first_name} {friend.user?.last_name}</p>
                  <p className="text-sm text-green-500">En línea</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
} 