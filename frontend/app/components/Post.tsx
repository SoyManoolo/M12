import { useState } from 'react';
import { FaHeart, FaShare, FaBookmark, FaComment, FaTimes } from 'react-icons/fa';

interface PostProps {
  id: string;
  userImage: string;
  userName: string;
  description: string;
  content: string;
  comments: Array<{
    id: string;
    text: string;
    userName: string;
  }>;
  createdAt: string;
}

export default function Post({ 
  id, 
  userImage, 
  userName, 
  description, 
  content, 
  comments, 
  createdAt 
}: PostProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isShared, setIsShared] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showAllComments, setShowAllComments] = useState(false);

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

  return (
    <>
      {/* Post normal */}
      <div className="bg-gray-900 rounded-lg p-4 mb-4 w-full h-[500px]">
        <div className="flex h-full">
          {/* Columna izquierda - más estrecha */}
          <div className="w-[80px] flex flex-col items-center space-y-4">
            {/* Perfil y nombre */}
            <img 
              src={userImage} 
              alt={userName} 
              className="w-12 h-12 rounded-full cursor-pointer object-cover"
              onClick={() => window.location.href = `/perfil/${userName}`}
            />
            <p className="font-semibold text-white cursor-pointer hover:underline text-center text-sm">
              {userName}
            </p>

            {/* Acciones en columna con estados */}
            <div className="flex flex-col space-y-4 mt-4">
              <button 
                onClick={() => setIsLiked(!isLiked)}
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
                onClick={() => setIsSaved(!isSaved)}
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
                src={content} 
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
                    <div key={comment.id} className="text-sm text-gray-300">
                      <span className="font-semibold text-white">{comment.userName}</span>
                      <span className="inline">
                        {" "}{truncateText(comment.text, 100)}
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
                />
                <button className="ml-2 text-gray-400 hover:text-white">
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
              src={content} 
              alt="Contenido expandido"
              className="max-w-full max-h-[90vh] object-contain"
            />
          </div>
        </div>
      )}
    </>
  );
} 