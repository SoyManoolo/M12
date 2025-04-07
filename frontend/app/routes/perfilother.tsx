/**
 * Página de perfil de otro usuario
 * 
 * Esta página muestra el perfil de un usuario específico, incluyendo:
 * - Información personal
 * - Publicaciones
 * - Amigos en común
 * 
 * @module PerfilOther
 */

import { json } from "@remix-run/node";
import { useLoaderData, useSearchParams } from "@remix-run/react";
import { useState } from "react";
import Navbar from "~/components/Inicio/Navbar";
import UserProfile from "~/components/Perfil/UserProfile";
import UserPosts from "~/components/Perfil/UserPosts";
import RightPanel from "~/components/Shared/RightPanel";

// Datos de ejemplo basados en la estructura de la base de datos
const MOCK_USERS = {
  "carlos123": {
    user_id: "550e8400-e29b-41d4-a716-446655440000",
    first_name: "Carlos",
    last_name: "Pérez",
    username: "carlos123",
    email: "carlos@example.com",
    password: "hashed_password",
    profile_picture_url: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400&h=400&fit=crop",
    bio: "¡Hola! Soy Carlos y me encanta la fotografía. 📸 Explorando el mundo a través de mi lente.",
    email_verified: true,
    is_moderator: false,
    id_deleted: false,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z"
  }
};

const MOCK_POSTS = {
  "carlos123": [
    {
      post_id: "550e8400-e29b-41d4-a716-446655440001",
      user_id: "550e8400-e29b-41d4-a716-446655440000",
      user: MOCK_USERS["carlos123"],
      description: "Capturando la magia del atardecer en la playa. 🌅 #Fotografía #Naturaleza",
      media_url: "https://images.unsplash.com/photo-1566241832378-917a0f30db2c?w=800&h=600",
      created_at: "2024-03-15T18:30:00Z",
      updated_at: "2024-03-15T18:30:00Z",
      comments: [
        {
          comment_id: "550e8400-e29b-41d4-a716-446655440002",
          post_id: "550e8400-e29b-41d4-a716-446655440001",
          user_id: "550e8400-e29b-41d4-a716-446655440003",
          content: "¡Increíble foto! Los colores son espectaculares 😍",
          created_at: "2024-03-15T18:35:00Z"
        }
      ],
      likes_count: 25,
      is_saved: false
    },
    {
      post_id: "550e8400-e29b-41d4-a716-446655440004",
      user_id: "550e8400-e29b-41d4-a716-446655440000",
      user: MOCK_USERS["carlos123"],
      description: "Explorando nuevos rincones de la ciudad 🌆 #FotografíaUrbana",
      media_url: "https://images.unsplash.com/photo-1514565131-fce0801e5785?w=800&h=600",
      created_at: "2024-03-14T15:20:00Z",
      updated_at: "2024-03-14T15:20:00Z",
      comments: [],
      likes_count: 18,
      is_saved: false
    }
  ]
};

// Amigos en común - basado en la tabla friends
const MOCK_COMMON_FRIENDS = {
  "carlos123": [
    {
      user_id: "550e8400-e29b-41d4-a716-446655440004",
      first_name: "Ana",
      last_name: "López",
      username: "ana_lopez",
      email: "ana@example.com",
      password: "hashed_password",
      profile_picture_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop",
      bio: "Amante de la música y los viajes",
      email_verified: true,
      is_moderator: false,
      id_deleted: false,
      created_at: "2024-01-02T00:00:00Z",
      updated_at: "2024-01-02T00:00:00Z"
    },
    {
      user_id: "550e8400-e29b-41d4-a716-446655440006",
      first_name: "Juan",
      last_name: "Martínez",
      username: "juan_martinez",
      email: "juan@example.com",
      password: "hashed_password",
      profile_picture_url: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=400&h=400&fit=crop",
      bio: "Desarrollador web y fotógrafo aficionado",
      email_verified: true,
      is_moderator: false,
      id_deleted: false,
      created_at: "2024-01-03T00:00:00Z",
      updated_at: "2024-01-03T00:00:00Z"
    },
    {
      user_id: "550e8400-e29b-41d4-a716-446655440007",
      first_name: "Laura",
      last_name: "García",
      username: "laura_garcia",
      email: "laura@example.com",
      password: "hashed_password",
      profile_picture_url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop",
      bio: "Viajera incansable y amante de la naturaleza",
      email_verified: true,
      is_moderator: false,
      id_deleted: false,
      created_at: "2024-01-04T00:00:00Z",
      updated_at: "2024-01-04T00:00:00Z"
    }
  ]
};

export async function loader({ request }: { request: Request }) {
  const url = new URL(request.url);
  const username = url.searchParams.get("username");
  
  if (!username) {
    throw new Response("Se requiere un nombre de usuario", { status: 400 });
  }

  // Aquí iría la lógica para cargar los datos del usuario desde la API
  // Por ahora usamos datos de ejemplo
  const user = MOCK_USERS[username as keyof typeof MOCK_USERS];
  const posts = MOCK_POSTS[username as keyof typeof MOCK_POSTS] || [];
  const commonFriends = MOCK_COMMON_FRIENDS[username as keyof typeof MOCK_COMMON_FRIENDS] || [];

  if (!user) {
    throw new Response("Usuario no encontrado", { status: 404 });
  }

  return json({
    user,
    posts,
    commonFriends,
    isOwnProfile: false,
  });
}

export default function PerfilOther() {
  const { user, posts, commonFriends, isOwnProfile } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const username = searchParams.get("username");

  const handleLike = (postId: string) => {
    // Implementar lógica de like usando post_likes table
    console.log("Like post:", postId);
  };

  const handleSave = (postId: string) => {
    // Implementar lógica de guardado usando saved_posts table
    console.log("Save post:", postId);
  };

  const handleSearch = (query: string) => {
    // Implementar lógica de búsqueda
    console.log("Search:", query);
  };

  const handleFollow = (userId: string) => {
    // Implementar lógica de seguimiento usando friend_requests table
    console.log("Follow user:", userId);
  };

  if (!username) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-xl">Se requiere un nombre de usuario</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Barra lateral izquierda */}
      <Navbar />

      {/* Contenido principal */}
      <div className="w-2/3 ml-[16.666667%] border-r border-gray-800">
        <div className="p-6 space-y-6">
          {/* Perfil del usuario */}
          <UserProfile
            user={user}
            isOwnProfile={isOwnProfile}
          />

          {/* Publicaciones del usuario */}
          <UserPosts
            posts={posts}
            onLike={handleLike}
            onSave={handleSave}
          />
        </div>
      </div>

      {/* Panel lateral derecho con amigos en común */}
      <RightPanel
        users={commonFriends}
        mode="common"
      />
    </div>
  );
} 