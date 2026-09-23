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
import { useAuth } from '~/hooks/useAuth';
import ImageZoomModal from '~/components/Shared/ImageZoomModal';
import { useState } from 'react';

interface UserPostsProps {
  posts: Array<{
    post_id: string;
    user_id: string;
    description: string;
    media_url: string | null;
    media?: string | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    likes_count: number;
    comments_count?: string | number;
    is_liked?: boolean;
    is_saved: boolean;
    comments: Array<{
      comment_id: string;
      post_id: string;
      user_id: string;
      content: string;
      created_at: string;
      author?: {
        user_id: string;
        username: string;
        profile_picture: string | null;
      };
    }>;
    author: {
      user_id: string;
      username: string;
      profile_picture: string | null;
      name: string;
    };
  }>;
  onLike: (postId: string) => void;
  onSave: (postId: string) => void;
  onDelete: (postId: string) => void;
  onEdit: (postId: string) => void;
}

export default function UserPosts({ posts = [], onLike, onSave, onDelete, onEdit }: UserPostsProps) {
  const { user } = useAuth();
  const currentUserId = user?.user_id;
  
  // Estados para el ImageZoomModal global
  const [showImageZoomModal, setShowImageZoomModal] = useState(false);
  const [zoomImageUrl, setZoomImageUrl] = useState('');

  if (!posts || posts.length === 0) {
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
            user_id: post.author.user_id,
            username: post.author.username,
            profile_picture: post.author.profile_picture,
            name: post.author.name
          }}
          description={post.description}
          media_url={post.media_url || ''}
          comments={post.comments?.map(comment => ({
            comment_id: comment.comment_id,
            author: {
              user_id: comment.author?.user_id || comment.user_id,
              username: comment.author?.username || 'Usuario',
              profile_picture: comment.author?.profile_picture || null
            },
            content: comment.content,
            created_at: comment.created_at
          })) || []}
          created_at={post.created_at}
          likes_count={post.likes_count.toString()}
          comments_count={post.comments_count}
          is_liked={post.is_liked}
          is_saved={post.is_saved}
          onLike={() => onLike(post.post_id)}
          onSave={() => onSave(post.post_id)}
          onDelete={() => onDelete(post.post_id)}
          onEdit={() => onEdit(post.post_id)}
          currentUserId={currentUserId}
          onImageClick={(imageUrl) => {
            setZoomImageUrl(imageUrl);
            setShowImageZoomModal(true);
          }}
        />
      ))}
      <ImageZoomModal
        isOpen={showImageZoomModal}
        onClose={() => setShowImageZoomModal(false)}
        imageUrl={zoomImageUrl}
        alt="Imagen de la publicación ampliada"
      />
    </div>
  );
}
