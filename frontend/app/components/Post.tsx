import { FaHeart, FaShare, FaBookmark, FaComment } from 'react-icons/fa';

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
  return (
    <div className="bg-gray-900 rounded-lg p-4 mb-4">
      <div className="flex">
        {/* Columna izquierda - Perfil, nombre y acciones */}
        <div className="w-1/6 flex flex-col items-center space-y-4">
          {/* Perfil y nombre */}
          <img 
            src={userImage} 
            alt={userName} 
            className="w-12 h-12 rounded-full cursor-pointer"
            onClick={() => window.location.href = `/perfil/${userName}`}
          />
          <p className="font-semibold text-white cursor-pointer hover:underline text-center">
            {userName}
          </p>

          {/* Acciones en columna */}
          <div className="flex flex-col space-y-4 mt-4">
            <button className="flex flex-col items-center text-gray-400 hover:text-white">
              <FaHeart className="text-xl mb-1" />
              <span className="text-xs">Like</span>
            </button>
            
            <button className="flex flex-col items-center text-gray-400 hover:text-white">
              <FaShare className="text-xl mb-1" />
              <span className="text-xs">Compartir</span>
            </button>
            
            <button className="flex flex-col items-center text-gray-400 hover:text-white">
              <FaBookmark className="text-xl mb-1" />
              <span className="text-xs">Guardar</span>
            </button>
          </div>
        </div>

        {/* Columna central - Contenido multimedia */}
        <div className="w-1/2 px-4">
          <div className="rounded-lg overflow-hidden bg-gray-800 h-full">
            <img 
              src={content} 
              alt="Contenido del post"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Columna derecha - Descripción y comentarios */}
        <div className="w-1/3 flex flex-col">
          {/* Descripción */}
          <div className="mb-4">
            <h3 className="text-white font-semibold mb-2">Descripción</h3>
            <p className="text-gray-300 text-sm">{description}</p>
          </div>

          {/* Comentarios */}
          <div className="flex-1">
            <h3 className="text-white font-semibold mb-2">Comentarios</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {comments.map(comment => (
                <div key={comment.id} className="text-sm text-gray-300">
                  <span className="font-semibold text-white">{comment.userName}</span>
                  {" "}{comment.text}
                </div>
              ))}
            </div>
          </div>

          {/* Añadir comentario */}
          <div className="mt-4">
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
  );
} 