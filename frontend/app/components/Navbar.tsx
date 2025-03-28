// src/components/Navbar.tsx
import { Link } from "@remix-run/react";
import { FaVideo, FaUpload, FaBell, FaEnvelope, FaCog, FaUser } from 'react-icons/fa';

interface NavbarProps {
  onNavigate?: (route: string) => void;
}

export default function Navbar({ onNavigate }: NavbarProps) {
  const handleNavigation = (route: string) => {
    if (onNavigate) {
      onNavigate(route);
    }
  };

  return (
    <div className="w-1/6 h-screen bg-black border-r border-gray-800 p-6 fixed left-0 top-0">
      <div className="mb-10">
        <h1 className="text-2xl font-bold text-white cursor-pointer" onClick={() => handleNavigation('/inicio')}>
          LOGO
        </h1>
      </div>

      <nav className="space-y-6">
        {/* Videollamada - Función principal */}
        <button 
          onClick={() => handleNavigation('/videollamada')}
          className="flex items-center space-x-3 text-white hover:text-gray-300 w-full p-3 rounded-lg hover:bg-gray-800 transition-all transform hover:scale-105 bg-gray-800 border border-gray-700"
        >
          <FaVideo className="text-2xl" />
          <span className="text-lg font-medium tracking-wider">VIDEOLLAMADA</span>
        </button>

        {/* Publicar */}
        <button 
          onClick={() => handleNavigation('/publicar')}
          className="flex items-center space-x-3 text-gray-400 hover:text-white w-full p-2 rounded hover:bg-gray-800/50"
        >
          <FaUpload className="text-xl" />
          <span className="tracking-wider">PUBLICAR</span>
        </button>

        {/* Notificaciones */}
        <button 
          onClick={() => handleNavigation('/notificaciones')}
          className="flex items-center space-x-3 text-gray-400 hover:text-white w-full p-2 rounded hover:bg-gray-800/50"
        >
          <FaBell className="text-xl" />
          <span className="tracking-wider">NOTIFICACIONES</span>
        </button>

        {/* Mensajes */}
        <button 
          onClick={() => handleNavigation('/mensajes')}
          className="flex items-center space-x-3 text-gray-400 hover:text-white w-full p-2 rounded hover:bg-gray-800/50"
        >
          <FaEnvelope className="text-xl" />
          <span className="tracking-wider">MENSAJES</span>
        </button>

        {/* Configuración */}
        <button 
          onClick={() => handleNavigation('/configuracion')}
          className="flex items-center space-x-3 text-gray-400 hover:text-white w-full p-2 rounded hover:bg-gray-800/50"
        >
          <FaCog className="text-xl" />
          <span className="tracking-wider">CONFIGURACIÓN</span>
        </button>

        {/* Perfil */}
        <button 
          onClick={() => handleNavigation('/perfil')}
          className="flex items-center space-x-3 text-gray-400 hover:text-white w-full p-2 rounded hover:bg-gray-800/50"
        >
          <FaUser className="text-xl" />
          <span className="tracking-wider">PERFIL</span>
        </button>
      </nav>
    </div>
  );
}
