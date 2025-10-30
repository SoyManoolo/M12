import { useState, useEffect } from "react";
import { postService } from "~/services/post.service";

/**
 * Hook para manejar la lógica de likes en un post
 */
export function usePostLike(postId: string, initialLikesCount: string) {
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(parseInt(initialLikesCount));
  const [isLoading, setIsLoading] = useState(false);

  // Verificar si el usuario ya dio like al cargar
  useEffect(() => {
    const checkLikeStatus = async () => {
      try {
        const token = localStorage.getItem("token");
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
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No hay token de autenticación");

      if (isLiked) {
        await postService.unlikePost(token, postId);
        setLikesCount((prev) => prev - 1);
      } else {
        await postService.likePost(token, postId);
        setLikesCount((prev) => prev + 1);
      }

      setIsLiked(!isLiked);
    } catch (error) {
      console.error("Error al manejar el like:", error);
      // Revertir el estado en caso de error
      setIsLiked(!isLiked);
      setLikesCount((prev) => (isLiked ? prev + 1 : prev - 1));
    } finally {
      setIsLoading(false);
    }
  };

  return { isLiked, likesCount, isLoading, toggleLike };
}
