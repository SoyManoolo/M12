/**
 * Componente UserPosts
 * 
 * Este componente muestra la lista de publicaciones del usuario en su perfil.
 * Reutiliza el componente Post existente para mantener la consistencia.
 * 
 * @module UserPosts
 * @requires react
 * @requires ~/components/Inicio/Post
 */

import Post from '~/components/Inicio/Post';

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

interface UserPostsProps {
  posts: Array<{
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
  }>;
  onLike: (postId: string) => void;
  onSave: (postId: string) => void;
}

export default function UserPosts({ posts, onLike, onSave }: UserPostsProps) {
  if (posts.length === 0) {
    return (
      <div className="bg-gray-900 rounded-lg p-6 text-center border border-gray-800">
        <p className="text-gray-400">No hay publicaciones para mostrar</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {posts.map((post) => (
        <Post
          key={post.post_id}
          post_id={post.post_id}
          user={{
            user_id: post.user.user_id,
            username: post.user.username,
            profile_picture_url: post.user.profile_picture_url
          }}
          description={post.description}
          media_url={post.media_url}
          comments={post.comments.map(comment => ({
            ...comment,
            username: post.user.username // Usamos el username del usuario del post
          }))}
          created_at={post.created_at}
          likes_count={post.likes_count}
          is_saved={post.is_saved}
          onLike={() => onLike(post.post_id)}
          onSave={() => onSave(post.post_id)}
        />
      ))}
    </div>
  );
} 