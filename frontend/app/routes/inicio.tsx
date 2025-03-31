import { useNavigate } from "@remix-run/react";
import Navbar from "~/components/Navbar";
import Post from "~/components/Post";
import { FaSearch } from 'react-icons/fa';

// Datos de ejemplo - En producción vendrían del backend
const MOCK_POSTS = [
  {
    id: '1',
    userImage: '/images/default-avatar.png',
    userName: 'Usuario1',
    description: 'Esta es una descripción detallada del post donde el usuario puede explicar el contenido de su publicación. Puede ser un texto más largo que describe el contexto o la historia detrás de la imagen.',
    content: '/images/post1.jpg',
    comments: [
      { id: '1', userName: 'Usuario2', text: '¡Gran publicación!' },
      { id: '2', userName: 'Usuario3', text: 'Me encanta esta foto' },
      { id: '3', userName: 'Usuario4', text: '¡Increíble!' }
    ],
    createdAt: '2024-03-31T12:00:00Z'
  },
  // ... más posts de ejemplo
];

export default function InicioPage() {
  const navigate = useNavigate();

  const handleNavigation = (route: string) => {
    navigate(route);
  };

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Barra lateral usando el componente Navbar */}
      <Navbar onNavigate={handleNavigation} />

      {/* Contenido central */}
      <div className="w-1/2 ml-[16.666667%] border-r border-gray-800">
        <div className="p-4">
          <h2 className="text-xl font-bold mb-4">Feed Principal</h2>
          
          {/* Lista de posts */}
          {MOCK_POSTS.map(post => (
            <Post key={post.id} {...post} />
          ))}
        </div>
      </div>

      {/* Barra lateral derecha */}
      <div className="w-1/3 p-4 fixed right-0">
        <div className="mb-6">
          <div className="relative">
            <FaSearch className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar amigos..."
              className="w-full bg-gray-900 rounded-full py-2 pl-10 pr-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4">Amigos sugeridos</h3>
          {/* Lista de amigos */}
          {[1, 2, 3, 4, 5].map((friend) => (
            <div key={friend} className="flex items-center justify-between py-3">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gray-700 rounded-full"></div>
                <div className="ml-3">
                  <p className="font-semibold">Usuario {friend}</p>
                  <p className="text-sm text-gray-400">5 amigos en común</p>
                </div>
              </div>
              <button className="text-blue-500 hover:text-blue-400">Seguir</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 