import { useState } from 'react';
import { FaHeart, FaShare, FaBookmark, FaComment, FaTimes } from 'react-icons/fa';

interface PostProps {
  post_id: string;
  user: {
    user_id: string;
    username: string;
    profile_picture_url: string;
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
  likes_count?: number;
  is_saved?: boolean;
}

export default function Post({ 
  post_id, 
  user, 
  description, 
  media_url, 
  comments, 
  created_at,
  likes_count = 0,
  is_saved = false
}: PostProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(is_saved);
  const [isShared, setIsShared] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showAllComments, setShowAllComments] = useState(false);
  const [currentLikes, setCurrentLikes] = useState(likes_count);
  const [newComment, setNewComment] = useState('');

  // Función para truncar texto
  const truncateText = (text: string, limit: number) => {
    if (text.length <= limit) return text;
    return text.slice(0, limit);
  };

  // Manejadores de eventos
  const handleImageClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsExpanded(true);
  };

  const handleCloseModal = () => {
    setIsExpanded(false);
  };

  const toggleDescription = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowFullDescription(!showFullDescription);
  };

  // Función para manejar nuevo comentario
  const handleAddComment = () => {
    if (!newComment.trim()) return;
    // Aquí iría la llamada a la API cuando la implementemos
    // Por ahora solo simulamos
    console.log('Nuevo comentario:', {
      post_id,
      content: newComment,
      user_id: 'current_user_id', // Esto vendría del contexto de autenticación
    });
    setNewComment('');
  };

  // Función para manejar likes
  const handleLike = () => {
    setIsLiked(!isLiked);
    setCurrentLikes(prev => isLiked ? prev - 1 : prev + 1);
    // Aquí iría la llamada a la API cuando la implementemos
  };

  // Función para guardar post
  const handleSave = () => {
    setIsSaved(!isSaved);
    // Aquí iría la llamada a la API cuando la implementemos
  };

  return (
    <>
      {/* Post normal */}
      <div className="bg-gray-900 rounded-lg p-4 mb-4 w-full h-[500px]">
        <div className="flex h-full">
          {/* Columna izquierda - más estrecha */}
          <div className="w-[80px] flex flex-col items-center space-y-4">
            {/* Perfil y nombre */}
            <img 
              src={user.profile_picture_url} 
              alt={user.username} 
              className="w-12 h-12 rounded-full cursor-pointer object-cover"
              onClick={() => window.location.href = `/perfil/${user.username}`}
            />
            <p className="font-semibold text-white cursor-pointer hover:underline text-center text-sm">
              {user.username}
            </p>

            {/* Acciones en columna con estados */}
            <div className="flex flex-col space-y-4 mt-4">
              <button 
                onClick={handleLike}
                className={`flex flex-col items-center ${isLiked ? 'text-red-500' : 'text-gray-400 hover:text-white'}`}
              >
                <FaHeart className="text-xl mb-1" />
                <span className="text-xs">Like</span>
              </button>
              
              <button 
                onClick={() => setIsShared(!isShared)}
                className={`flex flex-col items-center ${isShared ? 'text-blue-500' : 'text-gray-400 hover:text-white'}`}
              >
                <FaShare className="text-xl mb-1" />
                <span className="text-xs">Compartir</span>
              </button>
              
              <button 
                onClick={handleSave}
                className={`flex flex-col items-center ${isSaved ? 'text-yellow-500' : 'text-gray-400 hover:text-white'}`}
              >
                <FaBookmark className="text-xl mb-1" />
                <span className="text-xs">Guardar</span>
              </button>
            </div>
          </div>

          {/* Columna central - más ancha */}
          <div className="w-[500px] px-4">
            <div 
              className="rounded-lg overflow-hidden bg-gray-800 h-full cursor-pointer"
              onClick={handleImageClick}
            >
              <img 
                src={media_url} 
                alt="Contenido del post"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Columna derecha reorganizada */}
          <div className="flex-1 pl-4 flex flex-col h-full">
            {/* Contenedor superior para descripción y comentarios */}
            <div className="flex-1 overflow-hidden">
              {/* Descripción */}
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

              {/* Comentarios */}
              <div className="overflow-y-auto">
                <h3 className="text-white font-semibold mb-2">Comentarios</h3>
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

            {/* Input de comentarios fijo en la parte inferior */}
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