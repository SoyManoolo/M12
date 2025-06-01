/**
 * @file inicio.tsx
 * @description Componente principal de la página de inicio que muestra el feed de publicaciones
 * y la barra lateral con usuarios sugeridos. Incluye funcionalidades de búsqueda, seguimiento,
 * likes y guardado de posts.
 * 
 * @module InicioPage
 * @exports InicioPage
 * 
 * @requires react
 * @requires @remix-run/react
 * @requires ~/components/Inicio/Navbar
 * @requires ~/components/Inicio/Post
 * @requires ~/components/Shared/RightPanel
 * @requires ~/components/Shared/ConfirmModal
 * @requires ~/components/Shared/Notification
 * 
 * @interface User - Define la estructura de datos de un usuario
 * @interface Post - Define la estructura de datos de una publicación
 * @interface SuggestedUser - Define la estructura de datos de un usuario sugerido
 * 
 * @constant MOCK_POSTS - Array de publicaciones de ejemplo
 * @constant MOCK_SUGGESTED_USERS - Array de usuarios sugeridos de ejemplo
 */

import { useState, useEffect } from "react";
import { redirect, useNavigate, useSearchParams, Link } from "@remix-run/react";
import { json } from "@remix-run/node";
import Navbar from "~/components/Inicio/Navbar";
import Post from "~/components/Inicio/Post";
import RightPanel from "~/components/Shared/RightPanel";
import ConfirmModal from "~/components/Shared/ConfirmModal";
import Notification from "~/components/Shared/Notification";
import EditPostModal from '~/components/Shared/EditPostModal';
import ImageZoomModal from '~/components/Shared/ImageZoomModal';
import { useAuth } from "~/hooks/useAuth";
import { postService } from "~/services/post.service";
import { userService } from "~/services/user.service";
import { friendshipService } from "~/services/friendship.service";
import type { Friend } from "~/services/friendship.service";
import { FaCamera } from 'react-icons/fa';

/**
 * @interface User
 * @description Define la estructura de datos de un usuario en el sistema
 * @property {string} user_id - Identificador único del usuario
 * @property {string} name - Nombre del usuario
 * @property {string} surname - Apellido del usuario
 * @property {string} username - Nombre de usuario único
 * @property {string} email - Correo electrónico del usuario
 * @property {string} profile_picture - URL de la imagen de perfil
 * @property {string} bio - Biografía del usuario
 * @property {boolean} email_verified - Estado de verificación del email
 * @property {boolean} is_moderator - Indica si el usuario es moderador
 * @property {boolean} deleted_at - Indica si el usuario está eliminado
 * @property {string} created_at - Fecha de creación del usuario
 * @property {string} updated_at - Fecha de última actualización
 * @property {boolean} active_video_call - Indica si el usuario está en línea
 */

interface User {
  user_id: string;
  name: string;
  surname: string;
  username: string;
  email: string;
  profile_picture: string | null;
  bio: string | null;
  email_verified: boolean;
  is_moderator: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  active_video_call: boolean;
}

/**
 * @interface Post
 * @description Define la estructura de datos de una publicación en el feed
 * @property {string} post_id - Identificador único del post
 * @property {string} user_id - ID del usuario que creó el post
 * @property {User} user - Objeto con la información del usuario
 * @property {string} description - Contenido textual del post
 * @property {string} media_url - URL del contenido multimedia
 * @property {string} created_at - Fecha de creación del post
 * @property {string} updated_at - Fecha de última actualización
 * @property {number} likes_count - Número de likes del post
 * @property {boolean} is_saved - Indica si el post está guardado
 * @property {Array<Comment>} comments - Lista de comentarios del post
 */

interface Post {
  post_id: string;
  user_id: string;
  description: string;
  media: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  likes_count: string;
  author: {
    user_id: string;
    username: string;
    profile_picture: string | null;
    name: string;
  };
  is_saved?: boolean;
  comments?: Array<{
    comment_id: string;
    author: {
      user_id: string;
      username: string;
      profile_picture: string | null;
    };
    content: string;
    created_at: string;
  }>;
}

/**
 * @function InicioPage
 * @description Componente principal de la página de inicio
 * @returns {JSX.Element} Renderiza la estructura de la página de inicio
 * 
 * @state {string} searchQuery - Estado para la búsqueda de usuarios
 * @state {Post[]} posts - Lista de publicaciones en el feed
 * @state {SuggestedUser[]} suggestedUsers - Lista de usuarios sugeridos
 * 
 * @method handleSearch - Maneja la búsqueda de usuarios
 * @method handleFollow - Maneja el seguimiento de usuarios
 * @method handleLike - Maneja los likes en publicaciones
 * @method handleSave - Maneja el guardado de publicaciones
 */

export const loader = async ({ request }: { request: Request }) => {
  const cookieHeader = request.headers.get("Cookie");
  const token = cookieHeader?.split(";").find(c => c.trim().startsWith("token="))?.split("=")[1];

  if (!token) {
    return redirect("/login");
  }

  return json({ 
    error: null
  });
};

// Función para decodificar el token JWT
const decodeToken = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Error decodificando token:', e);
    return null;
  }
};

export default function InicioPage() {
  const { token } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [postToEdit, setPostToEdit] = useState<Post | null>(null);
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);
  let currentUserId: string | undefined = undefined;

  // Estados para el ImageZoomModal global
  const [showImageZoomModal, setShowImageZoomModal] = useState(false);
  const [zoomImageUrl, setZoomImageUrl] = useState('');

  const [suggestedUsers, setSuggestedUsers] = useState<User[]>([]);

  if (token) {
    const decodedToken = decodeToken(token);
    currentUserId = decodedToken?.user_id;
  }

  useEffect(() => {
    const fetchData = async () => {
      if (!token) {
        setError('Por favor, inicia sesión para ver el contenido');
        setLoading(false);
        return;
      }

      try {
        // Cargar posts
        const postsResponse = await postService.getPosts(token);
        if (postsResponse.success && postsResponse.data) {
          const transformedPosts: Post[] = postsResponse.data.posts.map((post: any) => ({
            post_id: post.post_id,
            user_id: post.user_id,
            description: post.description,
            media: post.media || '',
            created_at: post.created_at,
            updated_at: post.updated_at,
            deleted_at: post.deleted_at,
            likes_count: post.likes_count,
            author: post.author,
            is_saved: false,
            comments: (post.comments || []).map((c: any) => ({
              comment_id: c.comment_id,
              author: {
                user_id: c.user_id,
                username: c.username,
                profile_picture: c.profile_picture || null
              },
              content: c.content,
              created_at: c.created_at
            }))
          }));
          setPosts(transformedPosts);
          setNextCursor(postsResponse.data.nextCursor);
        }

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
        let errorMessage = 'Lo sentimos, algo salió mal';
        
        if (err instanceof Error) {
          if (err.message.includes('Failed to fetch')) {
            errorMessage = 'No pudimos conectar con el servidor. Por favor, verifica tu conexión a internet.';
          } else if (err.message.includes('Unexpected token')) {
            errorMessage = 'Lo sentimos, estamos teniendo algunos problemas técnicos. Por favor, intenta de nuevo en unos minutos.';
          } else {
            errorMessage = err.message;
          }
        }
        
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  const handleLoadMore = async () => {
    if (!token || !nextCursor || loading) return;

    setLoading(true);
    try {
      const response = await postService.getPosts(token, nextCursor);
      if (response.success) {
        const transformedPosts: Post[] = response.data.posts.map((post: any) => ({
          post_id: post.post_id,
          user_id: post.user_id,
          description: post.description,
          media: post.media || '',
          created_at: post.created_at,
          updated_at: post.updated_at,
          deleted_at: post.deleted_at,
          likes_count: post.likes_count,
          author: post.author,
          is_saved: false,
          comments: (post.comments || []).map((c: any) => ({
            comment_id: c.comment_id,
            author: {
              user_id: c.user_id,
              username: c.username,
              profile_picture: c.profile_picture || null
            },
            content: c.content,
            created_at: c.created_at
          }))
        }));
        setPosts(prev => [...prev, ...transformedPosts]);
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
    setPostToDelete(postId);
    setShowDeleteModal(true);
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

    try {
      const response = await postService.deletePost(token, postToDelete);
      if (response.success) {
        setPosts(prev => prev.filter(post => post.post_id !== postToDelete));
        setNotification({
          message: 'Publicación eliminada correctamente',
          type: 'success'
        });
      } else {
        setError(response.message || 'Error al eliminar la publicación');
        setNotification({
          message: response.message || 'Error al eliminar la publicación',
          type: 'error'
        });
      }
    } catch (err) {
      setError('Error al eliminar la publicación');
      setNotification({
        message: 'Error al eliminar la publicación',
        type: 'error'
      });
    } finally {
      setShowDeleteModal(false);
      setPostToDelete(null);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex">
      <Navbar />
      <div className="w-2/3 ml-[16.666667%] border-r border-gray-800">
        <div className="p-6 space-y-6">
          {error ? (
            <div className="bg-red-500/10 text-red-500 p-4 rounded-lg">
              {error}
            </div>
          ) : loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 bg-gray-900/50 rounded-xl border border-gray-800">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-full flex items-center justify-center mb-6">
                <FaCamera className="text-4xl text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
              No hay publicaciones para mostrar
              </h3>
              <p className="text-gray-400 text-center max-w-md">
                Sé el primero en compartir un momento especial. ¡Comienza a publicar y conecta con tus amigos!
              </p>
              <Link
                to="/publicar"
                className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <FaCamera className="text-sm" />
                <span>Crear nueva publicación</span>
              </Link>
            </div>
          ) : (
            <>
              {posts.map((post) => (
                <Post
                  key={post.post_id}
                  post_id={post.post_id}
                  user={{
                    user_id: post.author?.user_id || post.user_id,
                    username: post.author?.username || 'Usuario desconocido',
                    profile_picture: post.author?.profile_picture || null,
                    name: post.author?.name || 'Usuario'
                  }}
                  description={post.description}
                  media_url={post.media || ''}
                  comments={post.comments || []}
                  created_at={post.created_at}
                  likes_count={post.likes_count}
                  is_saved={post.is_saved || false}
                  onLike={() => handleLike(post.post_id)}
                  onSave={() => handleSave(post.post_id)}
                  onDelete={() => handleDelete(post.post_id)}
                  onEdit={() => handleEdit(post.post_id)}
                  currentUserId={currentUserId}
                  onImageClick={(imageUrl) => {
                    setZoomImageUrl(imageUrl);
                    setShowImageZoomModal(true);
                  }}
                />
              ))}

              {nextCursor && (
                <div className="flex justify-center mt-6">
                  <button
                    onClick={handleLoadMore}
                    disabled={loading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Cargando...' : 'Cargar más'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <div className="hidden lg:block">
        <RightPanel
          users={suggestedUsers}
          mode="suggested"
        />
      </div>
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
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
      <ImageZoomModal
        isOpen={showImageZoomModal}
        onClose={() => setShowImageZoomModal(false)}
        imageUrl={zoomImageUrl}
        alt="Imagen de la publicación ampliada"
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