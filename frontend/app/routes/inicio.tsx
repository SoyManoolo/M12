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

/**
 * @interface User
 * @description Define la estructura de datos de un usuario en el sistema
 * @property {string} user_id - Identificador único del usuario
 * @property {string} first_name - Nombre del usuario
 * @property {string} last_name - Apellido del usuario
 * @property {string} username - Nombre de usuario único
 * @property {string} email - Correo electrónico del usuario
 * @property {string} profile_picture_url - URL de la imagen de perfil
 * @property {string} bio - Biografía del usuario
 * @property {boolean} email_verified - Estado de verificación del email
 * @property {boolean} is_moderator - Indica si el usuario es moderador
 * @property {boolean} id_deleted - Indica si el usuario está eliminado
 * @property {string} created_at - Fecha de creación del usuario
 * @property {string} updated_at - Fecha de última actualización
 * @property {boolean} is_online - Indica si el usuario está en línea
 */

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
  is_online?: boolean;
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
  user: User;
  description: string;
  media_url: string | null;
  created_at: string;
  updated_at: string;
  likes_count: number;
  is_saved: boolean;
  comments: Array<{
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
  // Verificar si hay un token en las cookies
  const cookieHeader = request.headers.get("Cookie");
  const token = cookieHeader?.split(";").find(c => c.trim().startsWith("token="))?.split("=")[1];

  if (!token) {
    return redirect("/login");
  }

  // Datos mock para pruebas
  const mockPosts: Post[] = [
    {
      post_id: "1",
      user_id: "1",
      user: {
        user_id: "1",
        first_name: "María",
        last_name: "García",
        username: "mariagarcia",
        email: "maria@example.com",
        profile_picture_url: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg",
        bio: "¡Hola! Me encanta compartir momentos especiales",
        email_verified: true,
        is_moderator: false,
        id_deleted: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      description: "¡Disfrutando de un hermoso día en la playa! 🌊☀️ #Verano #Vacaciones",
      media_url: "https://images.pexels.com/photos/189349/pexels-photo-189349.jpeg",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      likes_count: 15,
      is_saved: false,
      comments: [
        {
          comment_id: "1",
          user_id: "2",
          username: "carlos123",
          content: "¡Qué foto tan bonita! 😍",
          created_at: new Date().toISOString()
        }
      ]
    },
    {
      post_id: "2",
      user_id: "2",
      user: {
        user_id: "2",
        first_name: "Carlos",
        last_name: "Pérez",
        username: "carlos123",
        email: "carlos@example.com",
        profile_picture_url: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg",
        bio: "Amante de la música y la fotografía",
        email_verified: true,
        is_moderator: false,
        id_deleted: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      description: "Nueva canción que estoy escuchando 🎵 #Música #Vibes",
      media_url: "https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      likes_count: 8,
      is_saved: false,
      comments: []
    },
    {
      post_id: "3",
      user_id: "3",
      user: {
        user_id: "3",
        first_name: "Ana",
        last_name: "Martínez",
        username: "anamartinez",
        email: "ana@example.com",
        profile_picture_url: "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg",
        bio: "Viajera incansable ✈️",
        email_verified: true,
        is_moderator: false,
        id_deleted: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      description: "Nuevo destino, nuevas aventuras 🌍 #Viajes #Aventura",
      media_url: "https://images.pexels.com/photos/3155666/pexels-photo-3155666.jpeg",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      likes_count: 12,
      is_saved: false,
      comments: []
    },
    {
      post_id: "4",
      user_id: "4",
      user: {
        user_id: "4",
        first_name: "David",
        last_name: "López",
        username: "davidlopez",
        email: "david@example.com",
        profile_picture_url: "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg",
        bio: "Desarrollador web 💻",
        email_verified: true,
        is_moderator: false,
        id_deleted: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      description: "Nuevo proyecto en desarrollo 🚀 #Programación #WebDev",
      media_url: "https://images.pexels.com/photos/1181467/pexels-photo-1181467.jpeg",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      likes_count: 6,
      is_saved: false,
      comments: []
    },
    {
      post_id: "5",
      user_id: "5",
      user: {
        user_id: "5",
        first_name: "Laura",
        last_name: "Gómez",
        username: "lauragomez",
        email: "laura@example.com",
        profile_picture_url: "https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg",
        bio: "Fotógrafa profesional 📸",
        email_verified: true,
        is_moderator: false,
        id_deleted: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      description: "Nueva sesión de fotos 📷 #Fotografía #Retrato",
      media_url: "https://images.pexels.com/photos/2387873/pexels-photo-2387873.jpeg",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      likes_count: 20,
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
        profile_picture_url: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg",
        bio: "Amante de la música",
        email_verified: true,
        is_moderator: false,
        id_deleted: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    }
  ];

  return json({ 
    posts: mockPosts,
    friends: mockFriends,
    error: null
  });
};

export default function InicioPage() {
  const { token } = useAuth();
  const { posts: loaderPosts, friends, error } = useLoaderData<typeof loader>();
  const [posts, setPosts] = useState<Post[]>(loaderPosts);
  const [searchQuery, setSearchQuery] = useState("");

  if (error) {
    return <div>Error: {error}</div>;
  }

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

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Barra lateral usando el componente Navbar */}
      <Navbar />

      {/* Contenido central */}
      <div className="w-2/3 ml-[16.666667%] border-r border-gray-800">
        <div className="p-4">
          <h2 className="text-xl font-bold mb-4">Feed Principal</h2>

          {/* Lista de posts */}
          {posts.map((post: Post) => (
            <Post
              key={post.post_id}
              post_id={post.post_id}
              user={post.user}
              description={post.description}
              media_url={post.media_url}
              comments={post.comments}
              created_at={post.created_at}
              likes_count={post.likes_count}
              is_saved={post.is_saved}
              onLike={() => handleLike(post.post_id)}
              onSave={() => handleSave(post.post_id)}
            />
          ))}
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