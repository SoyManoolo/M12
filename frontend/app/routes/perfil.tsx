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
import { FaEdit } from "react-icons/fa";
import Navbar from "~/components/Inicio/Navbar";
import UserProfile from "~/components/Perfil/UserProfile";
import UserPosts from "~/components/Perfil/UserPosts";
import RightPanel from "~/components/Shared/RightPanel";
import { userService } from "~/services/user.service";
import { useAuth } from "~/hooks/useAuth";
import { postService } from "~/services/post.service";
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

interface Friend {
  friendship_id: string;
  user1_id: string;
  user2_id: string;
  created_at: string;
  user: User;
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
    let userData;
    if (username) {
      // Si hay username en la URL, cargar ese perfil
      const response = await userService.getUserByUsername(username, token);
      if (!response.success) {
        return json({ error: "Usuario no encontrado" }, { status: 404 });
      }
      userData = response.data;
    } else {
      // Si no hay username, cargar el perfil del usuario actual
      const response = await userService.getUserById('me', token);
      if (!response.success) {
        return redirect("/login");
      }
      userData = response.data;
    }

    return json({
      user: userData,
      isOwnProfile: !username || userData.username === username
    });
  } catch (error) {
    console.error('Error en loader de perfil:', error);
    return json({ error: "Error al cargar el perfil" }, { status: 500 });
  }
}

export default function Perfil() {
  const data = useLoaderData<typeof loader>() as LoaderData;
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Efecto para cargar datos cuando cambia la URL o el usuario
  useEffect(() => {
    const loadData = async () => {
      if (!token || !data.user) return;
      
      try {
        setLoading(true);
        setPosts([]); // Limpiar posts actuales
        setNextCursor(null); // Resetear cursor

        // Cargar posts iniciales
        const postsResponse = await postService.getPosts(token, undefined, data.user.username);
        if (postsResponse.success) {
          setPosts(postsResponse.data.posts as unknown as Post[]);
          setNextCursor(postsResponse.data.nextCursor);
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
        setError('Error al cargar los datos iniciales');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [token, data.user, location.search]); // Añadido location.search como dependencia

  const handleEditProfile = () => {
    navigate('/configuracion?section=cuenta');
  };

  const handleDeleteProfile = async () => {
    if (!token || !data.user) return;
    
    if (window.confirm('¿Estás seguro de que quieres eliminar tu cuenta? Esta acción no se puede deshacer.')) {
      setLoading(true);
      try {
        const response = await userService.deleteUserById(data.user.user_id, token);
        if (response.success) {
          window.location.href = '/login';
        } else {
          alert('Error al eliminar la cuenta');
        }
      } catch (err) {
        alert('Error al eliminar la cuenta');
      } finally {
        setLoading(false);
      }
    }
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

  if (data.error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Usuario no encontrado</h1>
          <p className="text-gray-400 mb-4">El perfil que buscas no existe o ha sido eliminado.</p>
          <button 
            onClick={() => navigate('/')}
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
              <p className="text-gray-400">No hay publicaciones para mostrar</p>
              <p className="text-gray-500 text-sm mt-2">Comparte algo para empezar</p>
            </div>
          ) : (
            <>
              <UserPosts
                posts={posts}
                onLike={handleLike}
                onSave={handleSave}
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
        mode="online"
      />
    </div>
  );
} 