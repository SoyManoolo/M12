import { FaHeart, FaRegHeart, FaTrash, FaPencilAlt } from "react-icons/fa";

interface PostActionsProps {
  isLiked: boolean;
  likesCount: number;
  isLoading: boolean;
  errorMessage?: string | null;
  onLike: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  isOwner: boolean;
  layout?: "horizontal" | "vertical";
}

/**
 * Componente para las acciones del post (like, editar, eliminar)
 */
export default function PostActions({
  isLiked,
  likesCount,
  isLoading,
  errorMessage,
  onLike,
  onEdit,
  onDelete,
  isOwner,
  layout = "horizontal",
}: PostActionsProps) {
  const baseButtonClass = layout === "vertical" 
    ? "flex flex-col items-center"
    : "flex items-center gap-1";

  const iconSize = layout === "vertical" ? "text-2xl mb-1" : "text-xl";

  return (
    <div className={`flex ${layout === "vertical" ? "flex-col space-y-5" : "gap-6"} items-center`}>
      {/* Like button */}
      <button
        onClick={onLike}
        disabled={isLoading}
        className={`${baseButtonClass} cursor-pointer ${
          isLiked ? "text-red-500" : "text-gray-400 hover:text-white"
        } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        {isLiked ? (
          <FaHeart className={iconSize} />
        ) : (
          <FaRegHeart className={iconSize} />
        )}
        <span className="text-sm">{likesCount}</span>
      </button>
      {errorMessage && (
        <p className="text-xs text-red-400" role="alert" aria-live="polite">
          {errorMessage}
        </p>
      )}

      {/* Edit & Delete (solo para el dueño) */}
      {isOwner && (
        <>
          {onEdit && (
            <button
              onClick={onEdit}
              title="Editar publicación"
              className={`${baseButtonClass} text-blue-500 hover:text-blue-700 focus:outline-none cursor-pointer`}
            >
              <FaPencilAlt className={iconSize} />
              {layout === "vertical" && <span className="text-sm">Editar</span>}
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              title="Eliminar publicación"
              className={`${baseButtonClass} text-red-500 hover:text-red-700 focus:outline-none cursor-pointer`}
            >
              <FaTrash className={iconSize} />
              {layout === "vertical" && <span className="text-sm">Eliminar</span>}
            </button>
          )}
        </>
      )}
    </div>
  );
}
