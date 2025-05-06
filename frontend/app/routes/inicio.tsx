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

  useEffect(() => {
    const fetchPosts = async () => {
      if (!token) {
        setError('No hay token de autenticación');
        setLoading(false);
        return;
      }

      try {
        const response = await postService.getPosts(token);
        if (response.success) {
          // Transformar los posts para incluir la información necesaria para el componente Post
          const transformedPosts = response.data.posts.map(post => ({
            ...post,
            user: {
              user_id: post.user_id,
              name: "Usuario", // Esto debería venir del backend
              surname: "Demo", // Esto debería venir del backend
              username: "usuario", // Esto debería venir del backend
              email: "usuario@demo.com", // Esto debería venir del backend
              profile_picture_url: null, // Esto debería venir del backend
              bio: null, // Esto debería venir del backend
              email_verified: false, // Esto debería venir del backend
              is_moderator: false, // Esto debería venir del backend
              deleted_at: null, // Esto debería venir del backend
              created_at: new Date().toISOString(), // Esto debería venir del backend
              updated_at: new Date().toISOString(), // Esto debería venir del backend
              active_video_call: false // Esto debería venir del backend
            },
            likes_count: 0, // Esto debería venir del backend
            is_saved: false, // Esto debería venir del backend
            comments: [] // Esto debería venir del backend
          }));
          setPosts(transformedPosts);
        } else {
          throw new Error(response.message || 'Error al obtener los posts');
        }
      } catch (err) {
        console.error('Error al obtener los posts:', err);
        setError(err instanceof Error ? err.message : 'Error al conectar con el servidor');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [token]);

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

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Barra lateral usando el componente Navbar */}
      <Navbar />

      {/* Contenido central */}
      <div className="w-2/3 ml-[16.666667%] border-r border-gray-800">
        <div className="p-4">
          <h2 className="text-xl font-bold mb-4">Feed Principal</h2>

          {/* Lista de posts */}
          {posts.length === 0 ? (
            <div className="bg-gray-900 rounded-lg p-6 text-center border border-gray-800">
              <p className="text-gray-400">No hay publicaciones para mostrar</p>
            </div>
          ) : (
            posts.map((post: Post) => (
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
            ))
          )}
        </div>
      </div>

      {/* Barra lateral derecha */}
      <RightPanel
        friends={[]}
        mode="online"
      />
    </div>
  );
} 