/**
 * Página de perfil propio del usuario
 * 
 * Esta página muestra el perfil del usuario actual, incluyendo:
 * - Información personal
 * - Publicaciones
 * - Amigos sugeridos
 * 
 * @module Perfil
 */

import React, { useState, useEffect } from 'react';
import { useLoaderData, useSearchParams, useNavigate, redirect } from "@remix-run/react";
import { json } from "@remix-run/node";
import Navbar from "~/components/Inicio/Navbar";
import UserProfile from "~/components/Perfil/UserProfile";
import UserPosts from "~/components/Perfil/UserPosts";
import RightPanel from "~/components/Shared/RightPanel";
import { userService } from "../services/user.service";
import { useAuth } from "../hooks/useAuth.tsx";
import { postService } from "~/services/post.service";

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

interface Post {
  post_id: string;
  user_id: string;
  user: User;
  description: string;
  media_url: string | null;
  created_at: string;
  updated_at: string;
  likes_count: number;
  is_saved: boolean;
  comments: Array<{
    comment_id: string;
    post_id: string;
    user_id: string;
    username: string;
    content: string;
    created_at: string;
  }>;
}

interface Friend {
  friendship_id: string;
  user1_id: string;
  user2_id: string;
  created_at: string;
  user: User;
}

interface LoaderData {
  user: User | null;
  posts: Post[];
  friends: Friend[];
  isOwnProfile: boolean;
  error?: string;
}

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

export default function Perfil(): React.ReactElement {
  const { token } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      if (!token) {
        setError('No hay token de autenticación');
        setLoading(false);
        return;
      }

      try {
        // Obtener datos del usuario
        const userResponse = await userService.getUserById('me', token);
        if (userResponse.success && userResponse.data) {
          const userData: User = {
            user_id: userResponse.data.user_id,
            name: userResponse.data.name,
            surname: userResponse.data.surname,
            username: userResponse.data.username,
            email: userResponse.data.email,
            profile_picture_url: userResponse.data.profile_picture_url ?? null,
            bio: userResponse.data.bio ?? null,
            email_verified: userResponse.data.email_verified,
            is_moderator: userResponse.data.is_moderator,
            deleted_at: null,
            created_at: userResponse.data.created_at,
            updated_at: userResponse.data.updated_at,
            active_video_call: false
          };
          setUser(userData);
          
          // Limpiar la URL si estamos en nuestro propio perfil
          if (window.location.search.includes('username=')) {
            navigate('/perfil', { replace: true });
          }
          
          // Obtener posts del usuario
          const postsResponse = await postService.getPosts(token, undefined, userData.username);
          if (postsResponse.success) {
            const transformedPosts = postsResponse.data.posts.map(post => ({
              ...post,
              user: userData,
              likes_count: 0,
              is_saved: false,
              comments: []
            }));
            setPosts(transformedPosts);
            setNextCursor(postsResponse.data.nextCursor);
          }
        } else {
          setError(userResponse.message || 'Error al obtener datos del usuario');
        }
      } catch (err) {
        console.error('Error al obtener datos:', err);
        setError(err instanceof Error ? err.message : 'Error al conectar con el servidor');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [token, navigate]);

  const handleLoadMore = async () => {
    if (!token || !nextCursor || loading || !user) return;

    setLoading(true);
    try {
      const response = await postService.getPosts(token, nextCursor, user.username);
      if (response.success) {
        const transformedPosts = response.data.posts.map(post => ({
          ...post,
          user: user,
          likes_count: 0,
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

  const handleEditProfile = () => {
    // Implementar lógica de edición de perfil
    console.log("Editando perfil...");
  };

  if (loading && !user) {
    return (
      <div className="min-h-screen bg-black text-white flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="min-h-screen bg-black text-white flex justify-center items-center">
        <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex justify-center items-center">
        <div className="bg-yellow-500/10 border border-yellow-500 text-yellow-500 px-4 py-3 rounded">
          No se encontró el perfil
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Barra lateral usando el componente Navbar */}
      <Navbar />

      {/* Contenido central */}
      <div className="w-2/3 ml-[16.666667%] border-r border-gray-800">
        <div className="p-6 space-y-6">
          {/* Perfil del usuario */}
          <UserProfile
            userId={user.user_id}
            isOwnProfile={true}
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

      {/* Barra lateral derecha */}
      <RightPanel
        friends={friends}
        mode="online"
      />
    </div>
  );
} 