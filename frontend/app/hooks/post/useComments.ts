import { useState } from "react";
import { commentService } from "~/services/comment.service";
import { useAuth } from "~/hooks/useAuth";

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

/**
 * Hook para manejar la lógica de comentarios en un post
 */
export function useComments(postId: string, initialComments: Comment[], totalComments: number) {
  const { token } = useAuth();
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [isCommenting, setIsCommenting] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialComments.length < totalComments);
  const [commentCount, setCommentCount] = useState(totalComments);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);

  const mapComment = (comment: any): Comment => ({
    comment_id: comment.comment_id || "",
    content: comment.content || "",
    created_at: comment.created_at || "",
    author: {
      user_id: comment.author?.user_id || "",
      username: comment.author?.username ?? "",
      profile_picture: comment.author?.profile_picture || null,
    },
  });

  const loadMoreComments = async () => {
    if (isLoadingMore || !hasMore) return;

    try {
      setIsLoadingMore(true);
      setLoadMoreError(null);
      if (!token) throw new Error("No hay token de autenticación");

      const response = await commentService.getComments(token, postId, comments.length);
      const nextComments = response.data.comments.map(mapComment);
      setComments((prev) => {
        const existingIds = new Set(prev.map((comment) => comment.comment_id));
        return [...prev, ...nextComments.filter((comment) => !existingIds.has(comment.comment_id))];
      });
      setHasMore(response.data.nextOffset !== null);
    } catch (error) {
      console.error("Error al cargar más comentarios:", error);
      setLoadMoreError("No se pudieron cargar más comentarios. Inténtalo de nuevo.");
    } finally {
      setIsLoadingMore(false);
    }
  };

  const addComment = async (content: string) => {
    if (!content.trim()) return;

    try {
      setIsCommenting(true);
      if (!token) throw new Error("No hay token de autenticación");

      const response = await commentService.createComment(
        token,
        postId,
        content.trim()
      );

      setComments((prev) => [
        {
          comment_id: response.data.comment?.comment_id || "",
          content: response.data.comment?.content || "",
          created_at: response.data.comment?.created_at || "",
          author: {
            user_id: (response.data.comment?.author as any)?.user_id || "",
            username: response.data.comment?.author?.username ?? "",
            profile_picture:
              response.data.comment?.author?.profile_picture || null,
          },
        },
        ...prev,
      ]);
      setCommentCount((count) => count + 1);
    } catch (error) {
      console.error("Error al agregar comentario:", error);
      throw error;
    } finally {
      setIsCommenting(false);
    }
  };

  const deleteComment = async (commentId: string) => {
    try {
      if (!token) throw new Error("No hay token de autenticación");

      await commentService.deleteComment(token, commentId);
      setComments((prev) =>
        prev.filter((comment) => comment.comment_id !== commentId)
      );
      setCommentCount((count) => Math.max(0, count - 1));
    } catch (error) {
      console.error("Error al eliminar comentario:", error);
      throw error;
    }
  };

  return { comments, commentCount, isCommenting, isLoadingMore, hasMore, loadMoreError, addComment, deleteComment, loadMoreComments };
}
