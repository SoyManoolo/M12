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

import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { useState } from "react";
import Navbar from "~/components/Inicio/Navbar";
import RightSidebar from "~/components/Inicio/RightSidebar";
import UserProfile from "~/components/Perfil/UserProfile";
import UserPosts from "~/components/Perfil/UserPosts";

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

export async function loader() {
  // Aquí iría la lógica para cargar los datos del usuario actual desde la API
  return json({
    user: MOCK_USER,
    posts: MOCK_POSTS,
    suggestedUsers: MOCK_SUGGESTED_USERS,
    isOwnProfile: true,
  });
}

export default function Perfil() {
  const { user, posts, suggestedUsers, isOwnProfile } = useLoaderData<typeof loader>();
  const [currentPosts, setCurrentPosts] = useState(posts);

  const handleLike = (postId: string) => {
    // Implementar lógica de like
    console.log("Like post:", postId);
  };

  const handleSave = (postId: string) => {
    // Implementar lógica de guardado
    console.log("Save post:", postId);
  };

  const handleSearch = (query: string) => {
    // Implementar lógica de búsqueda
    console.log("Search:", query);
  };

  const handleFollow = (userId: string) => {
    // Implementar lógica de seguimiento
    console.log("Follow user:", userId);
  };

  const handleEditProfile = () => {
    // Implementar lógica de edición de perfil
    console.log("Edit profile");
  };

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
      <RightSidebar
        suggestedUsers={suggestedUsers}
        onSearch={handleSearch}
        onFollow={handleFollow}
      />
    </div>
  );
} 