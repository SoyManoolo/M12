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

import { useState } from 'react';
import { FaHeart, FaRegHeart, FaBookmark, FaRegBookmark, FaShare, FaComment, FaTimes, FaTrash, FaPencilAlt } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

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
    user_id: string;
    username: string;
    content: string;
    created_at: string;
  }>;
  created_at: string;
  likes_count: string;
  is_saved: boolean;
  onLike: () => void;
  onSave: () => void;
  currentUserId?: string; // ID del usuario actual
  onDelete?: (postId: string) => void; // Función para eliminar el post
  onEdit?: (postId: string) => void; // Nueva prop para manejar la edición
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
  comments,
  created_at,
  likes_count,
  is_saved,
  onLike,
  onSave,
  currentUserId,
  onDelete,
  onEdit
}: PostProps) {
  // Estados para controlar las interacciones del usuario
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(is_saved);
  const [isShared, setIsShared] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showAllComments, setShowAllComments] = useState(false);
  const [currentLikes, setCurrentLikes] = useState(parseInt(likes_count));
  const [newComment, setNewComment] = useState('');

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
    setIsExpanded(true);
  };

  /**
   * Manejador para cerrar el modal de imagen expandida
   */
  const handleCloseModal = () => {
    setIsExpanded(false);
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
  const handleAddComment = () => {
    if (!newComment.trim()) return;
    setNewComment('');
  };

  /**
   * Manejador para la acción de "me gusta"
   */
  const handleLike = () => {
    setIsLiked(!isLiked);
    setCurrentLikes(prev => isLiked ? prev - 1 : prev + 1);
    onLike();
  };

  /**
   * Manejador para guardar la publicación
   */
  const handleSave = () => {
    setIsSaved(!isSaved);
    onSave();
  };

  const handleDelete = () => {
    onDelete?.(post_id);
  };

  return (
    <>
      {/* Contenedor principal del post */}
      <div className="bg-gray-900 rounded-lg p-4 mb-4 w-full h-[500px]">
        <div className="flex h-full">
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
                  className={`flex flex-col items-center cursor-pointer ${isLiked ? 'text-red-500' : 'text-gray-400 hover:text-white'}`}
                >
                  {isLiked ? <FaHeart className="text-xl mb-1" /> : <FaRegHeart className="text-xl mb-1" />}
                  <span className="text-xs">Like</span>
                </button>
              </div>
              
              {/* Botón de compartir */}
              <div className="flex flex-col items-center">
                <button 
                  onClick={() => setIsShared(!isShared)}
                  className={`flex flex-col items-center cursor-pointer ${isShared ? 'text-blue-500' : 'text-gray-400 hover:text-white'}`}
                >
                  <FaShare className="text-xl mb-1" />
                  <span className="text-xs">Compartir</span>
                </button>
              </div>
              
              {/* Botón de guardar */}
              <div className="flex flex-col items-center">
                <button 
                  onClick={handleSave}
                  className={`flex flex-col items-center cursor-pointer ${isSaved ? 'text-yellow-500' : 'text-gray-400 hover:text-white'}`}
                >
                  {isSaved ? <FaBookmark className="text-xl mb-1" /> : <FaRegBookmark className="text-xl mb-1" />}
                  <span className="text-xs">Guardar</span>
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

          {/* Columna central - Contenido multimedia */}
          <div className="w-[500px] px-4">
            <div 
              className={`rounded-lg overflow-hidden bg-gray-800 h-full ${media_url ? 'cursor-pointer' : ''} relative`}
              onClick={media_url ? handleImageClick : undefined}
            >
              {media_url ? (
                <img 
                  src={media_url}
                  alt="Contenido del post"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-800">
                  <div className="text-center">
                    <svg
                      className="mx-auto h-16 w-16 text-gray-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <p className="mt-2 text-gray-500">Sin imagen</p>
                  </div>
                </div>
              )}
              {/* Fecha de publicación */}
              <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 px-2 py-1 rounded text-xs text-gray-300">
                {formatDistanceToNow(new Date(created_at), { addSuffix: true, locale: es })}
              </div>
            </div>
          </div>

          {/* Columna derecha - Descripción y comentarios */}
          <div className="flex-1 pl-4 flex flex-col h-full">
            {/* Contenedor de descripción y comentarios */}
            <div className="flex-1 overflow-hidden">
              {/* Sección de descripción */}
              <div className="mb-4">
                <h3 className="text-white font-semibold mb-2">Descripción</h3>
                <div className="text-gray-300 text-sm">
                  {showFullDescription ? (
                    <p>{description}</p>
                  ) : (
                    <p>{truncateText(description, 100)}</p>
                  )}
                  {description.length > 100 && (
                    <button
                      onClick={toggleDescription}
                      className="text-blue-400 hover:text-blue-300 text-sm font-medium block mt-1"
                    >
                      {showFullDescription ? 'Ver menos' : 'Leer más...'}
                    </button>
                  )}
                </div>
              </div>

              {/* Sección de comentarios */}
              <div className="overflow-y-auto">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-white font-semibold">Comentarios</h3>
                  <span className="text-sm text-gray-400">({comments.length})</span>
                </div>
                <div className="space-y-2">
                  {(showAllComments ? comments : comments.slice(0, 3)).map(comment => (
                    <div key={comment.comment_id} className="text-sm text-gray-300">
                      <span className="font-semibold text-white">{comment.username}</span>
                      <span className="inline">
                        {" "}{truncateText(comment.content, 100)}
                      </span>
                    </div>
                  ))}
                  {comments.length > 3 && (
                    <button
                      onClick={() => setShowAllComments(!showAllComments)}
                      className="text-blue-400 hover:text-blue-300 text-sm font-medium block mt-2"
                    >
                      {showAllComments 
                        ? 'Ver menos comentarios' 
                        : `Ver todos los ${comments.length} comentarios`}
                    </button>
                  )}
                </div>
              </div>
            </div>


            {/* Input para nuevos comentarios */}
            <div className="mt-auto pt-4 border-t border-gray-800">
              <div className="flex items-center bg-gray-800 rounded-lg p-2">
                <input
                  type="text"
                  placeholder="Añadir un comentario..."
                  className="flex-1 bg-transparent border-none text-white placeholder-gray-500 focus:outline-none text-sm"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />
                <button className="ml-2 text-gray-400 hover:text-white" onClick={handleAddComment}>
                  <FaComment className="text-xl" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal para imagen expandida */}
      {isExpanded && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={handleCloseModal}
        >
          <div 
            className="relative max-w-4xl max-h-[90vh]"
            onClick={e => e.stopPropagation()}
          >
            <button 
              onClick={handleCloseModal}
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-50"
            >
              <FaTimes className="text-2xl" />
            </button>
            <img 
              src={media_url}
              alt="Contenido expandido"
              className="max-w-full max-h-[90vh] object-contain"
            />
          </div>
        </div>
      )}
    </>
  );
} 