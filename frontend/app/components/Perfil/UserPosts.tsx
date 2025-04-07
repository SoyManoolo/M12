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

interface UserPostsProps {
  posts: Array<{
    post_id: string;
    user: {
      user_id: string;
      username: string;
      profile_picture_url: string | null;
    };
    description: string;
    media_url: string | null;
    comments: Array<{
      comment_id: string;
      user_id: string;
      username: string;
      content: string;
      created_at: string;
    }>;
    created_at: string;
    likes_count: number;
    is_saved: boolean;
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
          user={post.user}
          description={post.description}
          media_url={post.media_url}
          comments={post.comments}
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