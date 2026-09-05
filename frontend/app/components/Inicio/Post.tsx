/**
 * Componente Post - Refactorizado
 *
 * Representa una publicación individual en el feed con:
 * - Información del autor
 * - Contenido multimedia
 * - Interacciones (like, comentarios)
 * - Sistema de comentarios
 *
 * @module Post
 */

import PostHeader from "./Post/PostHeader";
import PostActions from "./Post/PostActions";
import PostComments from "./Post/PostComments";
import CommentInput from "./Post/CommentInput";
import PostDescription from "./Post/PostDescription";
import PostMedia from "./Post/PostMedia";
import SecureImage from "~/components/Shared/SecureImage";
import { usePostLike } from "~/hooks/post/usePostLike";
import { useComments } from "~/hooks/post/useComments";

interface PostProps {
  post_id: string;
  user: {
    user_id: string;
    username: string;
    profile_picture: string | null;
    name: string;
  };
  description: string;
  media_url: string;
  comments: Array<{
    comment_id: string;
    author: {
      user_id: string;
      username: string;
      profile_picture: string | null;
    };
    content: string;
    created_at: string;
  }>;
  created_at: string;
  likes_count: string;
  onLike: () => void;
  currentUserId?: string;
  onDelete?: (postId: string) => void;
  onEdit?: (postId: string) => void;
  onImageClick: (imageUrl: string) => void;
  is_saved?: boolean;
  onSave?: (postId: string) => void;
}

/**
 * Componente principal del Post (refactorizado)
 */
export default function Post({
  post_id,
  user,
  description,
  media_url,
  comments: initialComments,
  created_at,
  likes_count,
  onLike,
  currentUserId,
  onDelete,
  onEdit,
  onImageClick,
}: PostProps) {
  // Hooks personalizados para manejar la lógica
  const { isLiked, likesCount, isLoading, error: likeError, toggleLike } = usePostLike(
    post_id,
    likes_count
  );
  const { comments, isCommenting, addComment, deleteComment } = useComments(
    post_id,
    initialComments
  );

  // Handlers
  const handleLike = async () => {
    if (await toggleLike()) {
      onLike();
    }
  };

  const handleImageClick = () => {
    if (media_url) {
      onImageClick(media_url);
    }
  };

  const isOwner = currentUserId === user.user_id;
  const hasMedia = !!media_url;

  // Altura dinámica según si tiene media
  const containerHeight = hasMedia
    ? "sm:h-[550px] sm:min-h-[550px] sm:max-h-[550px]"
    : "sm:h-[450px] sm:min-h-[450px] sm:max-h-[450px]";

  return (
    <div className={`bg-gray-900 rounded-lg p-2 sm:p-4 mb-4 w-full ${containerHeight}`}>
      {/* ========== MOBILE LAYOUT ========== */}
      <div className="block sm:hidden">
        {/* Imagen arriba (mobile) */}
        {hasMedia && (
          <div className="w-full mb-3">
            <div className="rounded-lg overflow-hidden bg-gray-800 cursor-pointer">
              <SecureImage
                src={media_url}
                alt="Contenido del post"
                className="w-full h-60 object-cover"
                onClick={handleImageClick}
              />
            </div>
          </div>
        )}

        {/* Header usuario */}
        <div className="mb-2">
          <PostHeader user={user} layout="horizontal" />
        </div>

        {/* Descripción */}
        <div className="mb-2">
          <PostDescription description={description} maxLength={120} />
        </div>

        {/* Acciones */}
        <div className="mb-2">
          <PostActions
            isLiked={isLiked}
            likesCount={likesCount}
            isLoading={isLoading}
            errorMessage={likeError}
            onLike={handleLike}
            onEdit={() => onEdit?.(post_id)}
            onDelete={() => onDelete?.(post_id)}
            isOwner={isOwner}
            layout="horizontal"
          />
        </div>

        {/* Comentarios */}
        <div className="mb-2">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-white font-semibold text-base">Comentarios</h3>
            <span className="text-xs text-gray-400">({comments.length})</span>
          </div>
          <div className="max-h-32 overflow-y-auto">
            <PostComments
              comments={comments}
              currentUserId={currentUserId}
              onDelete={deleteComment}
              maxInitialComments={2}
            />
          </div>
        </div>

        {/* Input comentarios */}
        <div className="mt-2 pt-2 border-t border-gray-800">
          <CommentInput onSubmit={addComment} isSubmitting={isCommenting} />
        </div>
      </div>

      {/* ========== DESKTOP LAYOUT ========== */}
      <div className="hidden sm:block h-full">
        <div className="flex h-full">
          {/* Columna izquierda - Perfil y acciones */}
          <div className="w-[90px] flex flex-col items-center space-y-4 h-full">
            <PostHeader user={user} layout="vertical" />
            <PostActions
              isLiked={isLiked}
              likesCount={likesCount}
              isLoading={isLoading}
              errorMessage={likeError}
              onLike={handleLike}
              onEdit={() => onEdit?.(post_id)}
              onDelete={() => onDelete?.(post_id)}
              isOwner={isOwner}
              layout="vertical"
            />
          </div>

          {/* Columna central - Media (si existe) */}
          {hasMedia && (
            <div className="w-[520px] px-4 h-full flex items-center">
              <PostMedia
                mediaUrl={media_url}
                createdAt={created_at}
                onImageClick={handleImageClick}
              />
            </div>
          )}

          {/* Columna derecha - Descripción y comentarios */}
          <div className="flex-1 flex flex-col pl-4 h-full">
            {/* Descripción */}
            <div className="mb-5 flex-shrink-0">
              <h3 className="text-white font-semibold mb-3 text-lg">
                Descripción
              </h3>
              <PostDescription
                description={description}
                maxLength={hasMedia ? 120 : 220}
              />
            </div>

            {/* Comentarios con scroll */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex items-center gap-2 mb-3 flex-shrink-0">
                <h3 className="text-white font-semibold text-lg">Comentarios</h3>
                <span className="text-sm text-gray-400">({comments.length})</span>
              </div>
              <div className="flex-1 overflow-y-auto pr-2">
                <PostComments
                  comments={comments}
                  currentUserId={currentUserId}
                  onDelete={deleteComment}
                  maxInitialComments={3}
                />
              </div>
            </div>

            {/* Input comentarios */}
            <div className="mt-5 pt-4 border-t border-gray-800 flex-shrink-0">
              <CommentInput onSubmit={addComment} isSubmitting={isCommenting} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
