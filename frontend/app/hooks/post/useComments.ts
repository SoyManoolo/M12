import { useState, useEffect } from "react";
import { commentService } from "~/services/comment.service";
import { getSessionToken } from "~/utils/session";

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
export function useComments(postId: string, initialComments: Comment[]) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [isCommenting, setIsCommenting] = useState(false);

  // Cargar comentarios al montar
  useEffect(() => {
    const loadComments = async () => {
      try {
        const token = getSessionToken();
        if (!token) return;

        const response = await commentService.getComments(token, postId);
        if (response.success && response.data.comments) {
          setComments(
            response.data.comments.map((comment: any) => ({
              comment_id: comment.comment_id || "",
              content: comment.content || "",
              created_at: comment.created_at || "",
              author: {
                user_id: comment.author?.user_id || "",
                username: comment.author?.username ?? "",
                profile_picture: comment.author?.profile_picture || null,
              },
            }))
          );
        }
      } catch (error) {
        console.error("Error al cargar comentarios:", error);
      }
    };

    loadComments();
  }, [postId]);

  const addComment = async (content: string) => {
    if (!content.trim()) return;

    try {
      setIsCommenting(true);
      const token = getSessionToken();
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
    } catch (error) {
      console.error("Error al agregar comentario:", error);
      throw error;
    } finally {
      setIsCommenting(false);
    }
  };

  const deleteComment = async (commentId: string) => {
    try {
      const token = getSessionToken();
      if (!token) throw new Error("No hay token de autenticación");

      await commentService.deleteComment(token, commentId);
      setComments((prev) =>
        prev.filter((comment) => comment.comment_id !== commentId)
      );
    } catch (error) {
      console.error("Error al eliminar comentario:", error);
      throw error;
    }
  };

  return { comments, isCommenting, addComment, deleteComment };
}
