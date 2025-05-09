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
 * 
 * @interface User - Define la estructura de datos de un usuario
 * @interface Post - Define la estructura de datos de una publicación
 * @interface SuggestedUser - Define la estructura de datos de un usuario sugerido
 * 
 * @constant MOCK_POSTS - Array de publicaciones de ejemplo
 * @constant MOCK_SUGGESTED_USERS - Array de usuarios sugeridos de ejemplo
 */

import React from 'react';
import { useLoaderData, redirect } from "@remix-run/react";
import Navbar from "~/components/Inicio/Navbar";
import Post from "~/components/Inicio/Post";
import RightPanel from "~/components/Shared/RightPanel";
import { useState, useEffect } from "react";
import { json } from "@remix-run/node";
import { useAuth } from "~/hooks/useAuth";
import { postService } from "~/services/post.service";
import { userService } from "~/services/user.service";

/**
 * @interface User
 * @description Define la estructura de datos de un usuario en el sistema
 * @property {string} user_id - Identificador único del usuario
 * @property {string} name - Nombre del usuario
 * @property {string} surname - Apellido del usuario
 * @property {string} username - Nombre de usuario único
 * @property {string} email - Correo electrónico del usuario
 * @property {string} profile_picture_url - URL de la imagen de perfil
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
  profile_picture_url: string | null;
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
    user_id: string;
    username: string;
    content: string;
    created_at: string;
  }>;
}

/**
 * @interface Friend
 * @description Define la estructura de datos de una amistad entre usuarios
 * @property {string} friendship_id - Identificador único de la amistad
 * @property {string} user1_id - Identificador del primer usuario en la amistad
 * @property {string} user2_id - Identificador del segundo usuario en la amistad
 * @property {string} created_at - Fecha de creación de la amistad
 * @property {User} user - Objeto con la información del segundo usuario en la amistad
 */

interface Friend {
  friendship_id: string;
  user1_id: string;
  user2_id: string;
  created_at: string;
  user: User;
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

export default function InicioPage() {
  const { token } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!token) {
        setError('No hay token de autenticación');
        setLoading(false);
        return;
      }

      try {
        // Cargar posts
        const response = await postService.getPosts(token);
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
            comments: []
          }));
          setPosts(transformedPosts);
          setNextCursor(response.data.nextCursor);
        }

        // Cargar amigos
        const friendsResponse = await userService.getAllUsers(token);
        if (friendsResponse.success) {
          const friendsData = friendsResponse.data.map(user => ({
            friendship_id: user.user_id,
            user1_id: user.user_id,
            user2_id: user.user_id,
            created_at: new Date().toISOString(),
            user: {
              user_id: user.user_id,
              username: user.username,
              name: user.name,
              surname: user.surname,
              email: user.email,
              profile_picture_url: user.profile_picture_url ?? null,
              bio: user.bio ?? null,
              email_verified: user.email_verified,
              is_moderator: user.is_moderator,
              deleted_at: null,
              created_at: user.created_at,
              updated_at: user.updated_at,
              active_video_call: false
            }
          }));
          setFriends(friendsData);
        }
      } catch (err) {
        console.error('Error al cargar los datos:', err);
        setError(err instanceof Error ? err.message : 'Error al conectar con el servidor');
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
          comments: []
        }));
        setPosts(prev => [...prev, ...transformedPosts]);
        setNextCursor(response.data.nextCursor);
      } else {
        throw new Error(response.message || 'Error al cargar más posts');
      }
    } catch (err) {
      console.error('Error al cargar más posts:', err);
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
    if (!token) {
      setError('No hay token de autenticación');
      return;
    }

    try {
      const response = await postService.deletePost(token, postId);
      if (response.success) {
        // Eliminar el post de la lista local
        setPosts(prevPosts => prevPosts.filter(post => post.post_id !== postId));
      } else {
        setError(response.message || 'Error al eliminar el post');
      }
    } catch (err) {
      console.error('Error al eliminar el post:', err);
      setError(err instanceof Error ? err.message : 'Error al conectar con el servidor');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex">
      <Navbar />
      <div className="w-2/3 ml-[16.666667%] border-r border-gray-800">
        <div className="p-4">
          <h2 className="text-xl font-bold mb-4">Feed Principal</h2>

          {loading && posts.length === 0 ? (
            <div className="flex justify-center items-center h-[calc(100vh-200px)]">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="bg-gray-900 rounded-lg p-6 text-center border border-gray-800">
              <div className="text-4xl mb-4">📝</div>
              <h3 className="text-xl font-semibold text-white mb-2">¡No hay publicaciones disponibles!</h3>
              <p className="text-gray-400 mb-4">Sé el primero en compartir algo con la comunidad.</p>
              <button
                onClick={() => window.location.href = '/publicar'}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors cursor-pointer"
              >
                Crear mi primera publicación
              </button>
            </div>
          ) : posts.length === 0 ? (
            <div className="bg-gray-900 rounded-lg p-6 text-center border border-gray-800">
              <div className="text-4xl mb-4">📝</div>
              <h3 className="text-xl font-semibold text-white mb-2">¡No hay publicaciones disponibles!</h3>
              <p className="text-gray-400 mb-4">Sé el primero en compartir algo con la comunidad.</p>
              <button
                onClick={() => window.location.href = '/publicar'}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors cursor-pointer"
              >
                Crear mi primera publicación
              </button>
            </div>
          ) : (
            <>
              {posts.map((post) => (
                <Post
                  key={post.post_id}
                  post_id={post.post_id}
                  user={post.author}
                  description={post.description}
                  media_url={post.media}
                  comments={post.comments || []}
                  created_at={post.created_at}
                  likes_count={post.likes_count}
                  is_saved={post.is_saved || false}
                  onLike={() => handleLike(post.post_id)}
                  onSave={() => handleSave(post.post_id)}
                  currentUserId={token ? JSON.parse(atob(token.split('.')[1])).user_id : undefined}
                  onDelete={handleDelete}
                />
              ))}
              
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
      <RightPanel friends={friends} mode="online" />
    </div>
  );
} 