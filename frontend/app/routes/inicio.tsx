import { useNavigate } from "@remix-run/react";
import Navbar from "~/components/Navbar";
import { FaSearch } from 'react-icons/fa';

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

          {/* Posts de ejemplo */}
          {[1, 2, 3].map((post) => (
            <div key={post} className="bg-gray-900 rounded-lg p-4 mb-4">
              <div className="flex items-center mb-3">
                <div className="w-10 h-10 bg-gray-700 rounded-full"></div>
                <div className="ml-3">
                  <p className="font-semibold">Usuario {post}</p>
                  <p className="text-sm text-gray-400">Hace {post} horas</p>
                </div>
              </div>
              <p className="text-gray-300">Este es un post de ejemplo #{post}</p>
              <div className="mt-4 h-48 bg-gray-800 rounded-lg"></div>
            </div>
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