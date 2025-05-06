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
import { useLoaderData, useSearchParams, useNavigate } from "@remix-run/react";
import { json } from "@remix-run/node";
import Navbar from "~/components/Inicio/Navbar";
import UserProfile from "~/components/Perfil/UserProfile";
import UserPosts from "~/components/Perfil/UserPosts";
import RightPanel from "~/components/Shared/RightPanel";
import { userService } from "../services/user.service";
import { useAuth } from "../hooks/useAuth.tsx";

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
  // Datos mock de amigos
  const mockFriends: Friend[] = [
    {
      friendship_id: "1",
      user1_id: "1",
      user2_id: "2",
      created_at: new Date().toISOString(),
      user: {
        user_id: "2",
        name: "Ana",
        surname: "López",
        username: "ana_lopez",
        email: "ana@example.com",
        profile_picture_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop",
        bio: "Amante de la música y los viajes",
        email_verified: true,
        is_moderator: false,
        deleted_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        active_video_call: false
      }
    },
    {
      friendship_id: "2",
      user1_id: "1",
      user2_id: "3",
      created_at: new Date().toISOString(),
      user: {
        user_id: "3",
        name: "Carlos",
        surname: "Martínez",
        username: "carlos_martinez",
        email: "carlos@example.com",
        profile_picture_url: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=400&h=400&fit=crop",
        bio: "Desarrollador web y fotógrafo aficionado",
        email_verified: true,
        is_moderator: false,
        deleted_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        active_video_call: false
      }
    },
    {
      friendship_id: "3",
      user1_id: "1",
      user2_id: "4",
      created_at: new Date().toISOString(),
      user: {
        user_id: "4",
        name: "Laura",
        surname: "García",
        username: "laura_garcia",
        email: "laura@example.com",
        profile_picture_url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop",
        bio: "Viajera incansable y amante de la naturaleza",
        email_verified: true,
        is_moderator: false,
        deleted_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        active_video_call: false
      }
    }
  ];

  return json({ 
    user: null, 
    posts: [], 
    friends: mockFriends,
    isOwnProfile: true 
  });
};

export default function Perfil(): React.ReactElement {
  const { token } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const { friends: loaderFriends } = useLoaderData<typeof loader>();
  const [friends, setFriends] = useState<Friend[]>(loaderFriends);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) {
        setError('No hay token de autenticación');
        setLoading(false);
        navigate('/login');
        return;
      }

      try {
        // Decodificar el token para obtener el user_id
        const tokenPayload = JSON.parse(atob(token.split('.')[1]));
        const userId = tokenPayload.id;

        // Obtener el perfil usando el servicio
        const response = await userService.getUserById(userId, token);

        if (response.success && response.data) {
          setUser(response.data);
          // Actualizar la URL con el username del usuario autenticado
          setSearchParams({ username: response.data.username });
        } else {
          throw new Error(response.message || 'Error al obtener el perfil');
        }
      } catch (err) {
        console.error('Error al obtener el perfil:', err);
        setError(err instanceof Error ? err.message : 'Error al conectar con el servidor');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [token, setSearchParams, navigate]);

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
            userId={user.user_id}
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

      {/* Barra lateral derecha */}
      <RightPanel
        friends={friends}
        mode="online"
      />
    </div>
  );
} 