/**
 * Página de perfil de usuario
 * 
 * Esta página muestra el perfil del usuario, ya sea propio o de otro usuario.
 * Incluye:
 * - Información personal
 * - Foto de perfil
 * - Biografía
 * - Publicaciones
 * - Amigos sugeridos
 * 
 * @module Perfil
 */

import { json, redirect } from "@remix-run/node";
import { useLoaderData, useNavigate, useLocation, useFetcher } from "@remix-run/react";
import { useState, useEffect } from "react";
import { FaEdit, FaCamera } from "react-icons/fa";
import { Link } from "@remix-run/react";
import Navbar from "~/components/Inicio/Navbar";
import UserProfile from "~/components/Perfil/UserProfile";
import UserPosts from "~/components/Perfil/UserPosts";
import RightPanel from "~/components/Shared/RightPanel";
import ConfirmModal from "~/components/Shared/ConfirmModal";
import Notification from "~/components/Shared/Notification";
import EditPostModal from "~/components/Shared/EditPostModal";
import { userService } from "~/services/user.service";
import { postService } from "~/services/post.service";
import { friendshipService } from "~/services/friendship.service";
import type { Friend } from "~/services/friendship.service";
import { useAuth } from "~/hooks/useAuth";
import type { User } from "~/types/user.types";

interface Post {
  post_id: string;
  user_id: string;
  description: string;
  media_url: string | null;
  media?: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  likes_count: number;
  is_saved: boolean;
  comments: Array<{
    comment_id: string;
    post_id: string;
    user_id: string;
    content: string;
    created_at: string;
  }>;
  author: {
    user_id: string;
    username: string;
    profile_picture: string | null;
    name: string;
  };
}

interface LoaderData {
  user?: User;
  isOwnProfile?: boolean;
  error?: string;
}

export async function loader({ request }: { request: Request }) {
  const url = new URL(request.url);
  const username = url.searchParams.get("username");
  
  // Obtener el token de las cookies
  const cookieHeader = request.headers.get("Cookie");
  const token = cookieHeader?.split(";").find(c => c.trim().startsWith("token="))?.split("=")[1];

  if (!token) {
    return redirect("/login");
  }

  try {
    // Primero obtenemos el usuario actual para comparar IDs
    const currentUserResponse = await userService.getUserById('me', token);
    if (!currentUserResponse.success) {
      return redirect("/login");
    }
    const currentUserId = currentUserResponse.data.user_id;

    let userData;
    if (username) {
      // Si hay username en la URL, cargar ese perfil
      const response = await userService.getUserByUsername(username, token);
      if (!response.success) {
        return json({ error: "Usuario no encontrado" }, { status: 404 });
      }
      userData = response.data;
    } else {
      // Si no hay username, usar el usuario actual
      userData = currentUserResponse.data;
    }

    return json({
      user: userData,
      isOwnProfile: userData.user_id === currentUserId
    });
  } catch (error) {
    console.error('Error en loader de perfil:', error);
    return json({ error: "Error al cargar el perfil" }, { status: 500 });
  }
}

export default function Perfil() {
  const data = useLoaderData<typeof loader>() as LoaderData;
  const { token, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<User[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [postToEdit, setPostToEdit] = useState<Post | null>(null);
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);
  const [showZoomModal, setShowZoomModal] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [showEditPostModal, setShowEditPostModal] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showImageZoomModal, setShowImageZoomModal] = useState(false);
  const [zoomImageUrl, setZoomImageUrl] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      if (!token) {
        setError('Por favor, inicia sesión para ver el perfil');
        setLoading(false);
        return;
      }

      try {
        // Cargar amigos
        const friendsResponse = await friendshipService.getUserFriends(token);
        if (friendsResponse.success && friendsResponse.data) {
          // Asegurarnos de que los usuarios tengan todos los campos requeridos
          const friendsWithCompleteUser = friendsResponse.data.map(friend => ({
            ...friend,
            user: {
              ...friend.user,
              deleted_at: null,
              active_video_call: false
            }
          }));
          setFriends(friendsWithCompleteUser);

          // Cargar usuarios sugeridos
          const suggestedResponse = await userService.getAllUsers(token);
          if (suggestedResponse.success && suggestedResponse.data && Array.isArray(suggestedResponse.data.users)) {
            // Filtrar los usuarios que ya son amigos
            const friendIds = new Set(friendsResponse.data.map(friend => friend.user.user_id));
            const filteredSuggestedUsers = suggestedResponse.data.users.filter(
              user => !friendIds.has(user.user_id)
            ).map(user => ({
              ...user,
              deleted_at: null,
              active_video_call: false
            }));
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

    fetchData();
  }, [token]);

  const handleEditProfile = () => {
    navigate('/configuracion?section=cuenta');
  };

  const handleLoadMore = async () => {
    if (!token || !nextCursor || loading || !data.user) return;

    setLoading(true);
    try {
      const response = await postService.getPosts(token, nextCursor, data.user.username);
      if (response.success) {
        setPosts(prev => [...prev, ...(response.data.posts as unknown as Post[])]);
        setNextCursor(response.data.nextCursor);
      } else {
        throw new Error(response.message || 'Error al cargar más posts');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      console.log('Dando like al post:', postId);
      setPosts(prev =>
        prev.map(post =>
          post.post_id === postId
            ? { ...post, likes_count: post.likes_count + 1 }
            : post
        )
      );
    } catch (error) {
      console.error('Error al dar like:', error);
    }
  };

  const handleSave = async (postId: string) => {
    try {
      console.log('Guardando post:', postId);
      setPosts(prev =>
        prev.map(post =>
          post.post_id === postId
            ? { ...post, is_saved: !post.is_saved }
            : post
        )
      );
    } catch (error) {
      console.error('Error al guardar el post:', error);
    }
  };

  const handleDelete = async (postId: string) => {
    if (!token) return;
    setPostToDelete(postId);
    setDeleteModalOpen(true);
  };

  const handleEdit = (postId: string) => {
    const post = posts.find(p => p.post_id === postId);
    if (post) {
      setPostToEdit(post);
      setShowEditModal(true);
    }
  };

  const handleUpdatePost = async (newDescription: string) => {
    if (!token || !postToEdit) return;

    try {
      const response = await postService.updatePost(token, postToEdit.post_id, newDescription);
      if (response.success) {
        setPosts(prev => prev.map(post => 
          post.post_id === postToEdit.post_id
            ? { ...post, description: newDescription }
            : post
        ));
        setNotification({
          message: 'Publicación actualizada correctamente',
          type: 'success'
        });
      } else {
        throw new Error(response.message);
      }
    } catch (err) {
      setNotification({
        message: err instanceof Error ? err.message : 'Error al actualizar la publicación',
        type: 'error'
      });
    } finally {
      setShowEditModal(false);
      setPostToEdit(null);
    }
  };

  const confirmDelete = async () => {
    if (!token || !postToDelete) return;
    
    setLoading(true);
    try {
      const response = await postService.deletePost(token, postToDelete);
      if (response.success) {
        setPosts(prev => prev.filter(post => post.post_id !== postToDelete));
        setNotification({
          message: 'Publicación eliminada correctamente',
          type: 'success'
        });
      } else {
        throw new Error(response.message || 'Error al eliminar la publicación');
      }
    } catch (err) {
      console.error('Error al eliminar el post:', err);
      setNotification({
        message: err instanceof Error ? err.message : 'Error al eliminar la publicación',
        type: 'error'
      });
    } finally {
      setLoading(false);
      setDeleteModalOpen(false);
      setPostToDelete(null);
    }
  };

  const handleRemoveFriend = async (userId: string) => {
    if (!token) return;

    try {
      const response = await friendshipService.removeFriendship(token, userId);
      if (response.success) {
        // Actualizar el estado local de amigos inmediatamente
        const friendToRemove = friends.find(friend => friend.user.user_id === userId);
        if (friendToRemove) {
          // Eliminar de la lista de amigos
          setFriends(prev => prev.filter(friend => friend.user.user_id !== userId));
          // Agregar a la lista de usuarios sugeridos
          setSuggestedUsers(prev => [...prev, {
            ...friendToRemove.user,
            deleted_at: null,
            active_video_call: false
          }]);
        }
        setNotification({
          message: 'Amistad eliminada correctamente',
          type: 'success'
        });
      } else {
        throw new Error(response.message);
      }
    } catch (err) {
      setNotification({
        message: err instanceof Error ? err.message : 'Error al eliminar la amistad',
        type: 'error'
      });
    }
  };

  if (data.error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Usuario no encontrado</h1>
          <p className="text-gray-400 mb-4">El perfil que buscas no existe o ha sido eliminado.</p>
          <button
            onClick={() => navigate('/inicio')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  if (!data.user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex">
      <Navbar />
      
      <div className="w-2/3 ml-[16.666667%] border-r border-gray-800">
        <div className="p-6 space-y-6">
          {/* Perfil del usuario */}
          <UserProfile
            user={data.user}
            isOwnProfile={data.isOwnProfile ?? false}
            onEditProfile={handleEditProfile}
          />

          {/* Publicaciones del usuario */}
          {posts.length === 0 ? (
            <div className="bg-gray-900 rounded-lg p-6 text-center border border-gray-800">
              {data.isOwnProfile ? (
                <>
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <FaCamera className="text-4xl text-blue-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    No has publicado nada aún
                  </h3>
                  <p className="text-gray-400 text-center max-w-md mx-auto mb-6">
                    ¡Comparte tus momentos especiales con tus amigos! Crea tu primera publicación y comienza a conectar.
                  </p>
                  <Link
                    to="/publicar"
                    className="inline-flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <FaCamera className="text-sm" />
                    <span>Crear mi primera publicación</span>
                  </Link>
                </>
              ) : (
                <>
                  <div className="w-24 h-24 bg-gradient-to-br from-gray-600/20 to-gray-800/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <FaCamera className="text-4xl text-gray-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {data.user.username} aún no ha publicado nada
                  </h3>
                  <p className="text-gray-400 text-center max-w-md mx-auto">
                    Cuando {data.user.username} comparta algo, aparecerá aquí.
                  </p>
                </>
              )}
            </div>
          ) : (
            <>
              <UserPosts
                posts={posts}
                onLike={handleLike}
                onSave={handleSave}
                onDelete={handleDelete}
                onEdit={handleEdit}
              />
              
              {/* Botón de cargar más */}
              {nextCursor && (
                <div className="flex justify-center mt-6">
                  <button
                    onClick={handleLoadMore}
                    disabled={loading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Cargando...' : 'Cargar más'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Panel lateral derecho con amigos */}
      <RightPanel
        friends={friends}
        mode="friends"
        customTitle="Mis amigos"
      />

      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setPostToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Eliminar publicación"
        message="¿Estás seguro de que quieres eliminar esta publicación? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
      />

      <EditPostModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setPostToEdit(null);
        }}
        onConfirm={handleUpdatePost}
        currentDescription={postToEdit?.description || ''}
      />

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