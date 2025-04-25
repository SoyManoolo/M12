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

import * as React from 'react';
import { useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/node";
import { useState, useEffect } from "react";
import Navbar from "~/components/Inicio/Navbar";
import UserProfile from "~/components/Perfil/UserProfile";
import UserPosts from "~/components/Perfil/UserPosts";
import RightPanel from "~/components/Shared/RightPanel";
import { userService } from "../services/user.service";
import { useAuth } from "../hooks/useAuth.tsx";

interface User {
  user_id: string;
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  profile_picture_url: string | null;
  bio: string | null;
  email_verified: boolean;
  is_moderator: boolean;
  id_deleted: boolean;
  created_at: string;
  updated_at: string;
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

export const loader = async () => {
  return json({ 
    user: null, 
    posts: [], 
    friends: [],
    isOwnProfile: true 
  });
};

export default function Perfil(): React.ReactElement {
  const { token } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) {
        setError('No hay token de autenticación');
        setLoading(false);
        return;
      }

      try {
        const response = await userService.getProfile(token);
        if (response.success && response.data) {
          setUser(response.data);
        } else {
          setError(response.message || 'Error al cargar el perfil');
        }
      } catch (err) {
        setError('Error al conectar con el servidor');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [token]);

  const handleLike = async (postId: string) => {
    try {
      console.log('Dando like al post:', postId);
    } catch (error) {
      console.error('Error al dar like:', error);
    }
  };

  const handleSave = async (postId: string) => {
    try {
      console.log('Guardando post:', postId);
    } catch (error) {
      console.error('Error al guardar el post:', error);
    }
  };

  const handleEditProfile = () => {
    // Implementar lógica de edición de perfil
    console.log("Editando perfil...");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
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
            user={user}
            isOwnProfile={true}
            onEditProfile={handleEditProfile}
          />

          {/* Publicaciones del usuario */}
          <UserPosts
            posts={posts}
            onLike={handleLike}
            onSave={handleSave}
          />
        </div>
      </div>

      {/* Panel derecho */}
      <div className="w-1/3">
        <RightPanel friends={friends} />
      </div>
    </div>
  );
} 