/**
 * Página de perfil de otro usuario
 * 
 * Esta página muestra el perfil de un usuario específico, incluyendo:
 * - Información personal
 * - Publicaciones
 * - Amigos sugeridos
 * 
 * @module PerfilOther
 */

import { json } from "@remix-run/node";
import { useLoaderData, useSearchParams } from "@remix-run/react";
import { useState } from "react";
import Navbar from "~/components/Inicio/Navbar";
import RightSidebar from "~/components/Inicio/RightSidebar";
import UserProfile from "~/components/Perfil/UserProfile";
import UserPosts from "~/components/Perfil/UserPosts";

// Datos de ejemplo - Reemplazar con datos reales de la API
const MOCK_USERS = {
  "carlos123": {
    user_id: "2",
    first_name: "Carlos",
    last_name: "Pérez",
    username: "carlos123",
    profile_picture_url: "/images/default-avatar.png",
    bio: "¡Hola! Soy Carlos y me encanta la fotografía.",
  },
  // Agregar más usuarios de ejemplo según sea necesario
};

const MOCK_POSTS = {
  "carlos123": [
    {
      post_id: "2",
      user: {
        user_id: "2",
        username: "carlos123",
        profile_picture_url: "/images/default-avatar.png" as string | null,
      },
      description: "Fotografiando el atardecer",
      media_url: "/images/sunset.jpg" as string | null,
      comments: [
        {
          comment_id: "2",
          user_id: "1",
          username: "mariagarcia",
          content: "¡Hermosa foto!",
          created_at: new Date().toISOString(),
        }
      ],
      created_at: new Date().toISOString(),
      likes_count: 25,
      is_saved: false,
    },
  ],
};

const MOCK_SUGGESTED_USERS = [
  {
    user_id: "3",
    username: "ana_lopez",
    first_name: "Ana",
    last_name: "López",
    profile_picture_url: "/images/default-avatar.png",
    common_friends_count: 5,
  },
];

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

  if (!user) {
    throw new Response("Usuario no encontrado", { status: 404 });
  }

  return json({
    user,
    posts,
    suggestedUsers: MOCK_SUGGESTED_USERS,
    isOwnProfile: false,
  });
}

export default function PerfilOther() {
  const { user, posts, suggestedUsers, isOwnProfile } = useLoaderData<typeof loader>();
  const [currentPosts, setCurrentPosts] = useState(posts);
  const [searchParams] = useSearchParams();
  const username = searchParams.get("username");

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