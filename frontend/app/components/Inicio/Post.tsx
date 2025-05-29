/**
 * Componente Post
 * 
 * Este componente representa una publicación individual en el feed de la aplicación.
 * Incluye:
 * - Información del autor
 * - Contenido multimedia (imágenes/videos)
 * - Interacciones (me gusta, comentarios, compartir)
 * - Sistema de comentarios
 * 
 * @module Post
 * @requires react
 * @requires react-icons/fa
 * @requires date-fns
 */

import { useState, useEffect, useRef } from 'react';
import { FaHeart, FaRegHeart, FaComment, FaTrash, FaPencilAlt, FaSmile } from 'react-icons/fa';
import { formatDistanceToNow, differenceInSeconds, differenceInMinutes, differenceInHours, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import ImageZoomModal from '~/components/Shared/ImageZoomModal';
import { postService } from '~/services/post.service';
import { commentService } from '~/services/comment.service';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';

/**
 * Interfaz que define la estructura de datos de una publicación
 */
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
  currentUserId?: string; // ID del usuario actual
  onDelete?: (postId: string) => void; // Función para eliminar el post
  onEdit?: (postId: string) => void; // Nueva prop para manejar la edición
  onImageClick: (imageUrl: string) => void; // Nueva prop para abrir el modal de zoom
}

/**
 * Componente principal de la publicación
 * 
 * @param {PostProps} props - Propiedades del componente
 * @returns {JSX.Element} Componente de publicación con todas sus funcionalidades
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
  onImageClick
}: PostProps) {
  // Estados para controlar las interacciones del usuario
  const [isLiked, setIsLiked] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showAllComments, setShowAllComments] = useState(false);
  const [currentLikes, setCurrentLikes] = useState(parseInt(likes_count));
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [comments, setComments] = useState(initialComments);
  const [isCommenting, setIsCommenting] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // Cargar comentarios al montar el componente
  useEffect(() => {
    const loadComments = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await commentService.getComments(token, post_id);
        if (response.success && response.data.comments) {
          setComments(
            response.data.comments.map((comment: any) => ({
              comment_id: comment.comment_id || '',
              content: comment.content || '',
              created_at: comment.created_at || '',
              author: {
                user_id: comment.author?.user_id || '',
                username: comment.author?.username ?? '',
                profile_picture: comment.author?.profile_picture || null
              }
            }))
          );
        }
      } catch (error) {
        console.error('Error al cargar comentarios:', error);
      }
    };

    loadComments();
  }, [post_id]);

  // Verificar si el usuario ha dado like al post al cargar el componente
  useEffect(() => {
    const checkLikeStatus = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const { hasLiked } = await postService.checkUserLike(token, post_id);
        setIsLiked(hasLiked);
      } catch (error) {
        console.error('Error al verificar el estado del like:', error);
      }
    };

    checkLikeStatus();
  }, [post_id]);

  // Cerrar el selector de emojis al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /**
   * Función auxiliar para truncar texto largo
   * 
   * @param {string} text - Texto a truncar
   * @param {number} limit - Límite de caracteres
   * @returns {string} Texto truncado si excede el límite
   */
  const truncateText = (text: string, limit: number) => {
    if (text.length <= limit) return text;
    return text.slice(0, limit);
  };

  /**
   * Manejador para expandir la imagen
   */
  const handleImageClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (media_url) {
      onImageClick(media_url);
    }
  };

  /**
   * Manejador para alternar la descripción completa
   */
  const toggleDescription = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowFullDescription(!showFullDescription);
  };

  /**
   * Manejador para agregar un nuevo comentario
   */
  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    
    try {
      setIsCommenting(true);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No hay token de autenticación');
      }

      const response = await commentService.createComment(token, post_id, newComment.trim());
      
      // Agregar el nuevo comentario a la lista
      setComments(prevComments => [
        { 
          comment_id: response.data.comment?.comment_id || '',
          content: response.data.comment?.content || '',
          created_at: response.data.comment?.created_at || '',
          author: {
            user_id: (response.data.comment?.author as any)?.user_id || '',
            username: response.data.comment?.author?.username ?? '',
            profile_picture: response.data.comment?.author?.profile_picture || null
          }
        },
        ...prevComments // Agregar el nuevo comentario al principio
      ]);
      setNewComment('');
    } catch (error) {
      console.error('Error al agregar comentario:', error);
      // Aquí podrías mostrar un mensaje de error al usuario
    } finally {
      setIsCommenting(false);
    }
  };

  /**
   * Manejador para eliminar un comentario
   */
  const handleDeleteComment = async (commentId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No hay token de autenticación');
      }

      await commentService.deleteComment(token, post_id, commentId);
      
      // Eliminar el comentario de la lista
      setComments(prevComments => prevComments.filter(comment => comment.comment_id !== commentId));
    } catch (error) {
      console.error('Error al eliminar comentario:', error);
      // Aquí podrías mostrar un mensaje de error al usuario
    }
  };

  /**
   * Manejador para la acción de "me gusta"
   */
  const handleLike = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No hay token de autenticación');
      }

      if (isLiked) {
        await postService.unlikePost(token, post_id);
        setCurrentLikes(prev => prev - 1);
      } else {
        await postService.likePost(token, post_id);
        setCurrentLikes(prev => prev + 1);
      }

      setIsLiked(!isLiked);
      onLike();
    } catch (error) {
      console.error('Error al manejar el like:', error);
      // Revertir el estado en caso de error
      setIsLiked(!isLiked);
      setCurrentLikes(prev => isLiked ? prev + 1 : prev - 1);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    onDelete?.(post_id);
  };

  /**
   * Función para formatear el tiempo de manera más detallada
   */
  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const past = new Date(date);
    
    const seconds = differenceInSeconds(now, past);
    const minutes = differenceInMinutes(now, past);
    const hours = differenceInHours(now, past);
    const days = differenceInDays(now, past);

    if (days > 0) {
      return `${days} ${days === 1 ? 'día' : 'días'}`;
    } else if (hours > 0) {
      return `${hours} ${hours === 1 ? 'hora' : 'horas'}`;
    } else if (minutes > 0) {
      return `${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`;
    } else {
      return `${seconds} ${seconds === 1 ? 'segundo' : 'segundos'}`;
    }
  };

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setNewComment(prev => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  return (
    <>
      {/* Contenedor principal del post */}
      <div className={`bg-gray-900 rounded-lg p-4 mb-4 w-full ${
        media_url 
          ? 'h-[500px]' 
          : 'h-[400px] min-h-[400px] max-h-[400px]'
      }`}>
        <div className={`flex ${media_url ? 'h-full' : 'h-[calc(400px-2rem)]'}`}>
          {/* Columna izquierda - Acciones y perfil */}
          <div className="w-[80px] flex flex-col items-center space-y-4">
            {/* Perfil y nombre del usuario */}
            <div className="relative w-full flex justify-center">
              {user.profile_picture ? (
                <img 
                  src={user.profile_picture}
                  alt={user.username} 
                  className="w-12 h-12 rounded-full cursor-pointer object-cover border-2 border-gray-800"
                  onClick={() => window.location.href = `/perfil?username=${user.username}`}
                />
              ) : (
                <div 
                  className="w-12 h-12 rounded-full border-2 border-gray-800 bg-gray-800 flex items-center justify-center cursor-pointer"
                  onClick={() => window.location.href = `/perfil?username=${user.username}`}
                >
                  <span className="text-gray-400 text-xs">{user.username.charAt(0).toUpperCase()}</span>
                </div>
              )}
            </div>
            <p 
              className="font-semibold text-white cursor-pointer hover:underline text-center text-sm"
              onClick={() => window.location.href = `/perfil?username=${user.username}`}
            >
              {user.username}
            </p>

            {/* Contenedor de acciones */}
            <div className="flex flex-col space-y-4 mt-4">
              {/* Botón de me gusta */}
              <div className="flex flex-col items-center">
                <button 
                  onClick={handleLike}
                  disabled={isLoading}
                  className={`flex flex-col items-center cursor-pointer ${isLiked ? 'text-red-500' : 'text-gray-400 hover:text-white'} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isLiked ? <FaHeart className="text-xl mb-1" /> : <FaRegHeart className="text-xl mb-1" />}
                  <span className="text-xs">{currentLikes}</span>
                </button>
              </div>

              {/* Botones de editar y eliminar - solo si el post es del usuario actual */}
              {currentUserId === user.user_id && (
                <>
                  <div className="flex flex-col items-center mt-2">
                    <button
                      onClick={() => onEdit?.(post_id)}
                      title="Editar publicación"
                      className="flex flex-col items-center cursor-pointer text-blue-500 hover:text-blue-700 focus:outline-none"
                    >
                      <FaPencilAlt className="text-xl mb-1" />
                      <span className="text-xs">Editar</span>
                    </button>
                  </div>
                  <div className="flex flex-col items-center mt-2">
                    <button
                      onClick={handleDelete}
                      title="Eliminar publicación"
                      className="flex flex-col items-center cursor-pointer text-red-500 hover:text-red-700 focus:outline-none"
                    >
                      <FaTrash className="text-xl mb-1" />
                      <span className="text-xs">Eliminar</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Columna central - Contenido multimedia (solo si hay imagen) */}
          {media_url && (
            <div className="w-[500px] px-4">
              <div 
                className="rounded-lg overflow-hidden bg-gray-800 h-full cursor-pointer relative"
                onClick={handleImageClick}
              >
                <img 
                  src={media_url}
                  alt="Contenido del post"
                  className="w-full h-full object-cover"
                />
                {/* Fecha de publicación */}
                <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 px-2 py-1 rounded text-xs text-gray-300">
                  {formatDistanceToNow(new Date(created_at), { addSuffix: true, locale: es })}
                </div>
              </div>
            </div>
          )}

          {/* Columna derecha - Descripción y comentarios */}
          <div className={`flex-1 flex flex-col ${media_url ? 'pl-4' : 'px-4'} ${!media_url ? 'h-full' : ''}`}>

            {/* Sección de descripción - Siempre visible y no scrollable */}
            <div className="mb-4 flex-shrink-0">
              <h3 className="text-white font-semibold mb-2">Descripción</h3>
              <div className="text-gray-300 text-sm">
                {showFullDescription ? (
                  <p>{description}</p>
                ) : (
                  <p>{truncateText(description, media_url ? 100 : 200)}</p>
                )}
                {description.length > (media_url ? 100 : 200) && (
                  <button
                    onClick={toggleDescription}
                    className="text-blue-400 hover:text-blue-300 text-sm font-medium block mt-1"
                  >
                    {showFullDescription ? 'Ver menos' : 'Leer más...'}
                  </button>
                )}
              </div>
            </div>

            {/* Sección de comentarios - Con scroll si es necesario */}
            <div className={`flex-1 flex flex-col ${
              media_url 
                ? 'overflow-hidden' // No scroll aquí, el scroll está en el modal principal si tiene imagen
                : comments.length > 3 
                  ? 'overflow-hidden' // No scroll aquí, el scroll está en el contenedor interno
                  : ''
            }`}>
              <div className="flex items-center gap-2 mb-2 flex-shrink-0">
                <h3 className="text-white font-semibold">Comentarios</h3>
                <span className="text-sm text-gray-400">({comments.length})</span>
              </div>
              
              {/* Contenedor de la lista de comentarios con scrollbar */}
              <div className={`flex-1 ${
                media_url || comments.length > 3 
                  ? 'overflow-y-auto custom-scrollbar' 
                  : ''
              }`}>
                {comments.length === 0 ? (
                  <div className="text-center text-gray-400 py-4 rounded-xl">
                    <span className="text-4xl mb-2 block">💭</span>
                    <p className="text-lg">No hay comentarios aún</p>
                    <p className="text-sm mt-1">Sé el primero en comentar</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4">
                      {(showAllComments ? comments : comments.slice(0, 3)).map((comment) => (
                        <div key={comment.comment_id} className="flex items-start gap-3">
                          {/* Foto de perfil o inicial */}
                          {comment.author && comment.author.profile_picture ? (
                            <img
                              src={String(comment.author.profile_picture)}
                              alt={comment.author.username}
                              className="w-9 h-9 rounded-full object-cover flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => window.location.href = `/perfil?username=${comment.author.username}`}
                            />
                          ) : (
                            <div 
                              className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => window.location.href = `/perfil?username=${comment.author.username}`}
                            >
                              <span className="text-gray-400 text-lg font-bold">
                                {comment.author?.username?.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          {/* Contenido del comentario y botón de eliminar */}
                          <div className="flex-1 flex justify-between items-start px-2">
                            <div className="flex-1 pr-2">
                              <div className="flex items-center gap-2">
                                <span 
                                  className="font-semibold text-white text-sm cursor-pointer hover:underline"
                                  onClick={() => window.location.href = `/perfil?username=${comment.author.username}`}
                                >
                                  {comment.author?.username}
                                </span>
                                <span className="text-gray-400 text-xs">
                                  {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: es })}
                                </span>
                              </div>
                              <p className="text-gray-300 text-sm mt-1">{comment.content}</p>
                            </div>
                            {currentUserId === comment.author?.user_id && (
                              <button
                                onClick={() => handleDeleteComment(comment.comment_id)}
                                className="text-red-500 hover:text-red-700 focus:outline-none ml-4 cursor-pointer"
                                title="Eliminar comentario"
                              >
                                <FaTrash className="text-sm" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    {comments.length > 3 && (
                      <button
                        onClick={() => setShowAllComments(!showAllComments)}
                        className="text-blue-400 hover:text-blue-300 text-sm font-medium w-full text-center py-2 cursor-pointer mt-2"
                      >
                        {showAllComments ? 'Ver menos comentarios' : 'Ver todos los comentarios'}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Input de comentarios - Siempre visible */}
            <div className="mt-4 pt-4 border-t border-gray-800 flex-shrink-0">
              <div className="flex items-center bg-gray-800 rounded-lg p-2 relative">
                <input
                  type="text"
                  placeholder="Añadir un comentario..."
                  className="flex-1 bg-transparent border-none text-white placeholder-gray-500 focus:outline-none text-sm"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !isCommenting) {
                      handleAddComment();
                    }
                  }}
                  disabled={isCommenting}
                />
                <button 
                  className={`ml-2 ${isCommenting ? 'text-gray-600' : 'text-gray-400 hover:text-white cursor-pointer'}`}
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  disabled={isCommenting}
                >
                  <FaSmile className="text-xl" />
                </button>
                <button 
                  className={`ml-2 ${isCommenting ? 'text-gray-600' : 'text-gray-400 hover:text-white cursor-pointer'}`}
                  onClick={handleAddComment}
                  disabled={isCommenting}
                >
                  <FaComment className="text-xl" />
                </button>
                {showEmojiPicker && (
                  <div 
                    ref={emojiPickerRef}
                    className="absolute bottom-full right-0 mb-2 z-50"
                  >
                    <EmojiPicker
                      onEmojiClick={onEmojiClick}
                      theme={Theme.DARK}
                      width={350}
                      height={400}
                      searchDisabled={false}
                      skinTonesDisabled={true}
                      previewConfig={{
                        showPreview: false
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>
        {`
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          
          .custom-scrollbar::-webkit-scrollbar-track {
            background: #1f2937;
            border-radius: 3px;
          }
          
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #4b5563;
            border-radius: 3px;
          }
          
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #6b7280;
          }
        `}
      </style>

      {/* Modal para imagen expandida */}
      {/* Eliminar completamente el modal local */}
      {/*
      {media_url && (
        <ImageZoomModal
          isOpen={showImageZoomModal}
          onClose={handleCloseModal}
          imageUrl={media_url}
          alt="Contenido del post"
        />
      )}
      */}
    </>
  );
} 