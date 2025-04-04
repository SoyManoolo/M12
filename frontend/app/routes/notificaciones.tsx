import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
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
    // TODO: Implementar llamadas a la API cuando esté lista
    // const response = await fetch('/api/notifications');
    // const data = await response.json();
    
    // Por ahora retornamos datos de ejemplo
    return json<LoaderData>({
      notifications: [],
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
      <div className="flex-1 ml-[16.666667%] p-6">
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
                <div key={notification.notification_id} className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 hover:bg-gray-700/50 transition-all">
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
                </div>
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