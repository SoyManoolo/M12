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

import { useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/node";
import { useState } from "react";
import Navbar from "~/components/Inicio/Navbar";
import UserProfile from "~/components/Perfil/UserProfile";
import UserPosts from "~/components/Perfil/UserPosts";
import RightPanel from "~/components/Shared/RightPanel";

interface User {
  user_id: string;
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  password: string;
  profile_picture_url: string | null;
  bio: string | null;
  email_verified: boolean;
  is_moderator: boolean;
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
  user: User;
  posts: Post[];
  friends: Friend[];
  isOwnProfile: boolean;
}

// Datos de ejemplo - Reemplazar con datos reales de la API
const MOCK_USER = {
  user_id: "1",
  first_name: "María",
  last_name: "García",
  username: "mariagarcia",
  profile_picture_url: "/images/default-avatar.png",
  bio: "¡Hola! Me encanta compartir momentos especiales y conectar con personas nuevas.",
};

const MOCK_POSTS = [
  {
    post_id: "1",
    user: {
      user_id: "1",
      username: "mariagarcia",
      profile_picture_url: "/images/default-avatar.png" as string | null,
    },
    description: "¡Disfrutando de un hermoso día!",
    media_url: "/images/post1.jpg" as string | null,
    comments: [
      {
        comment_id: "1",
        user_id: "2",
        username: "carlos123",
        content: "¡Qué bonito día!",
        created_at: new Date().toISOString(),
      }
    ],
    created_at: new Date().toISOString(),
    likes_count: 15,
    is_saved: false,
  },
];

const MOCK_SUGGESTED_USERS = [
  {
    user_id: "2",
    username: "carlos123",
    first_name: "Carlos",
    last_name: "Pérez",
    profile_picture_url: "/images/default-avatar.png",
    common_friends_count: 3,
  },
];

export const loader = async () => {
  // Datos mock para pruebas
  const mockUser: User = {
    user_id: "1",
    first_name: "María",
    last_name: "García",
    username: "mariagarcia",
    email: "maria@example.com",
    password: "hashed_password",
    profile_picture_url: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg",
    bio: "¡Hola! Me encanta compartir momentos especiales",
    email_verified: true,
    is_moderator: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const mockPosts: Post[] = [
    {
      post_id: "1",
      user_id: "1",
      user: mockUser,
      description: "¡Disfrutando de un hermoso día en la playa! 🌊☀️ #Verano #Vacaciones",
      media_url: "https://images.pexels.com/photos/189349/pexels-photo-189349.jpeg",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      likes_count: 15,
      is_saved: false,
      comments: [
        {
          comment_id: "1",
          post_id: "1",
          user_id: "2",
          content: "¡Qué foto tan bonita! 😍",
          created_at: new Date().toISOString()
        }
      ]
    },
    {
      post_id: "2",
      user_id: "1",
      user: mockUser,
      description: "Nueva sesión de fotos 📷 #Fotografía #Retrato",
      media_url: "https://images.pexels.com/photos/2387873/pexels-photo-2387873.jpeg",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      likes_count: 8,
      is_saved: false,
      comments: []
    },
    {
      post_id: "3",
      user_id: "1",
      user: mockUser,
      description: "Explorando nuevos lugares 🌍 #Viajes #Aventura",
      media_url: "https://images.pexels.com/photos/3155666/pexels-photo-3155666.jpeg",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      likes_count: 12,
      is_saved: false,
      comments: []
    }
  ];

  const mockFriends: Friend[] = [
    {
      friendship_id: "1",
      user1_id: "1",
      user2_id: "2",
      created_at: new Date().toISOString(),
      user: {
        user_id: "2",
        first_name: "Carlos",
        last_name: "Pérez",
        username: "carlos123",
        email: "carlos@example.com",
        password: "hashed_password",
        profile_picture_url: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg",
        bio: "Amante de la música",
        email_verified: true,
        is_moderator: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    },
    {
      friendship_id: "2",
      user1_id: "1",
      user2_id: "3",
      created_at: new Date().toISOString(),
      user: {
        user_id: "3",
        first_name: "Ana",
        last_name: "Martínez",
        username: "anamartinez",
        email: "ana@example.com",
        password: "hashed_password",
        profile_picture_url: "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg",
        bio: "Viajera incansable ✈️",
        email_verified: true,
        is_moderator: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    },
    {
      friendship_id: "3",
      user1_id: "1",
      user2_id: "4",
      created_at: new Date().toISOString(),
      user: {
        user_id: "4",
        first_name: "David",
        last_name: "López",
        username: "davidlopez",
        email: "david@example.com",
        password: "hashed_password",
        profile_picture_url: "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg",
        bio: "Desarrollador web 💻",
        email_verified: true,
        is_moderator: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    }
  ];

  return json({ 
    user: mockUser, 
    posts: mockPosts, 
    friends: mockFriends,
    isOwnProfile: true 
  });
};

export default function Perfil() {
  const { user, posts, friends, isOwnProfile } = useLoaderData<typeof loader>();
  const [currentPosts, setCurrentPosts] = useState<Post[]>(posts);
  const [searchTerm, setSearchTerm] = useState<string>("");

  const handleLike = async (postId: string) => {
    try {
      console.log('Dando like al post:', postId);
      setCurrentPosts(prev =>
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
      setCurrentPosts(prev =>
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
            isOwnProfile={isOwnProfile}
            onEditProfile={handleEditProfile}
          />

          {/* Publicaciones del usuario */}
          <UserPosts
            posts={currentPosts}
            onLike={handleLike}
            onSave={handleSave}
          />
        </div>
      </div>

      {/* Barra lateral derecha */}
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