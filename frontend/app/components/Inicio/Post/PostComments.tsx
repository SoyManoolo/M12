import { useState } from "react";
import { FaTrash } from "react-icons/fa";
import UserAvatar from "./UserAvatar";
import { useTimeFormat } from "~/hooks/post/useTimeFormat";
import { sanitizeUserText } from "~/utils/sanitize";

interface Comment {
  comment_id: string;
  content: string;
  created_at: string;
  author: {
    user_id: string;
    username: string;
    profile_picture: string | null;
  };
}

interface PostCommentsProps {
  comments: Comment[];
  currentUserId?: string;
  onDelete: (commentId: string) => void;
  maxInitialComments?: number;
}

/**
 * Componente para mostrar la lista de comentarios
 */
export default function PostComments({
  comments,
  currentUserId,
  onDelete,
  maxInitialComments = 3,
}: PostCommentsProps) {
  const [showAll, setShowAll] = useState(false);
  const { formatRelativeTime } = useTimeFormat();

  const navigateToProfile = (username: string) => {
    window.location.href = `/perfil?username=${username}`;
  };

  const displayedComments = showAll
    ? comments
    : comments.slice(0, maxInitialComments);

  if (comments.length === 0) {
    return (
      <div className="text-center text-gray-400 py-4 sm:py-6 rounded-xl">
        <span className="text-3xl sm:text-5xl mb-2 sm:mb-3 block">💭</span>
        <p className="text-base sm:text-xl">No hay comentarios aún</p>
        <p className="text-sm sm:text-base mt-2 hidden sm:block">
          Sé el primero en comentar
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3 sm:space-y-5">
        {displayedComments.map((comment) => (
          <div key={comment.comment_id} className="flex items-start gap-2 sm:gap-4">
            <UserAvatar
              profilePicture={comment.author.profile_picture}
              username={comment.author.username}
              size="sm"
              onClick={() => navigateToProfile(comment.author.username)}
            />

            <div className="flex-1 flex justify-between items-start px-0 sm:px-2">
              <div className="flex-1 pr-2">
                <div className="flex items-center gap-2">
                  <span
                    className="font-semibold text-white text-xs sm:text-base cursor-pointer hover:underline"
                    onClick={() => navigateToProfile(comment.author.username)}
                  >
                    {comment.author.username}
                  </span>
                  <span className="text-gray-400 text-xs sm:text-sm">
                    {formatRelativeTime(comment.created_at)}
                  </span>
                </div>
                <p className="text-gray-300 text-xs sm:text-base mt-0.5 sm:mt-1.5">
                  {sanitizeUserText(comment.content)}
                </p>
              </div>

              {currentUserId === comment.author.user_id && (
                <button
                  onClick={() => onDelete(comment.comment_id)}
                  className="text-red-500 hover:text-red-700 focus:outline-none ml-2 sm:ml-4 cursor-pointer"
                  title="Eliminar comentario"
                >
                  <FaTrash className="text-xs sm:text-base" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {comments.length > maxInitialComments && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="text-blue-400 hover:text-blue-300 text-xs sm:text-base font-medium w-full text-center py-1 sm:py-3 cursor-pointer mt-2 sm:mt-3"
        >
          {showAll ? "Ver menos comentarios" : "Ver todos los comentarios"}
        </button>
      )}
    </>
  );
}
