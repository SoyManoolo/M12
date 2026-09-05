import { useState, useEffect } from "react";
import { postService } from "~/services/post.service";
import { getSessionToken } from "~/utils/session";

/**
 * Hook para manejar la lógica de likes en un post
 */
export function usePostLike(postId: string, initialLikesCount: string) {
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(parseInt(initialLikesCount));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Verificar si el usuario ya dio like al cargar
  useEffect(() => {
    const checkLikeStatus = async () => {
      try {
        const token = getSessionToken();
        if (!token) return;

        const { hasLiked } = await postService.checkUserLike(token, postId);
        setIsLiked(hasLiked);
      } catch (error) {
        console.error("Error al verificar el estado del like:", error);
      }
    };

    checkLikeStatus();
  }, [postId]);

  const toggleLike = async () => {
    const previousIsLiked = isLiked;

    try {
      setIsLoading(true);
      setError(null);
      const token = getSessionToken();
      if (!token) throw new Error("No hay token de autenticación");

      if (previousIsLiked) {
        await postService.unlikePost(token, postId);
        setLikesCount((prev) => prev - 1);
      } else {
        await postService.likePost(token, postId);
        setLikesCount((prev) => prev + 1);
      }

      setIsLiked(!previousIsLiked);
      return true;
    } catch (error) {
      console.error("Error al manejar el like:", error);
      // La interfaz solo cambia después de que el servidor confirma la acción,
      // así que se conserva el estado anterior si la petición falla.
      setError("No se pudo actualizar el like. Inténtalo de nuevo.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { isLiked, likesCount, isLoading, error, toggleLike };
}
