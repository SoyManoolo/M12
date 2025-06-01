/**
 * Componente Navbar
 * 
 * Este componente representa la barra de navegación lateral de la aplicación.
 * Incluye:
 * - Logo de la aplicación
 * - Enlaces de navegación principales
 * - Iconos para cada sección
 * 
 * @module Navbar
 * @requires @remix-run/react
 * @requires react-icons/fa
 */

// src/components/Navbar.tsx
import { Link, useNavigate } from "@remix-run/react";
import { FaVideo, FaUpload, FaBell, FaEnvelope, FaCog, FaUser, FaShieldAlt, FaNewspaper, FaUsers, FaChartBar, FaChevronDown, FaSearch } from 'react-icons/fa';
import { useAuth } from "~/hooks/useAuth";
import { useState, useEffect } from 'react';

/**
 * Componente principal de la barra de navegación
 * 
 * @returns {JSX.Element} Barra de navegación con enlaces y funcionalidades principales
 */
export default function Navbar() {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isModerator, setIsModerator] = useState(false);

  useEffect(() => {
    if (user) {
      setIsModerator(user.is_moderator === true);
    }
  }, [user]);

  const handleProfileClick = () => {
    // Navegar al perfil sin parámetros
    navigate('/perfil');
  };

  return (
    <div className="w-1/6 h-screen bg-black border-r border-gray-800 p-4 fixed left-0 top-0 overflow-y-auto">
      {/* Contenedor del logo */}
      <div className="mb-6 flex justify-center">
        <Link to="/inicio">
          <img 
            src="/images/logo.png"
            alt="Logo FriendsGo"
            className="h-24 cursor-pointer"
          />
        </Link>
      </div>

      {/* Menú de navegación */}
      <nav className="space-y-3">
        {/* Enlace a videollamada - Función principal */}
        <Link 
          to="/videollamada"
          className="flex flex-col items-center justify-center text-white hover:text-blue-400 w-full p-3 rounded-lg hover:bg-gray-800/50 transition-all transform hover:scale-105 cursor-pointer group relative"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <FaVideo className="text-3xl mb-1" />
          <span className="text-xs font-semibold tracking-wider">VIDEOLLAMADA</span>
        </Link>

        {/* Enlace a búsqueda */}
        <Link 
          to="/buscar"
          className="flex items-center space-x-2 text-gray-400 hover:text-white w-full p-2 rounded hover:bg-gray-800/50 cursor-pointer"
        >
          <FaSearch className="text-lg" />
          <span className="tracking-wider text-sm">BÚSQUEDA</span>
        </Link>

        {/* Enlace a sección de publicaciones */}
        <Link 
          to="/publicar"
          className="flex items-center space-x-2 text-gray-400 hover:text-white w-full p-2 rounded hover:bg-gray-800/50 cursor-pointer"
        >
          <FaUpload className="text-lg" />
          <span className="tracking-wider text-sm">PUBLICAR</span>
        </Link>

        {/* Enlace a notificaciones */}
        <Link 
          to="/notificaciones"
          className="flex items-center space-x-2 text-gray-400 hover:text-white w-full p-2 rounded hover:bg-gray-800/50 cursor-pointer"
        >
          <FaBell className="text-lg" />
          <span className="tracking-wider text-sm">NOTIFICACIONES</span>
        </Link>

        {/* Enlace a mensajes */}
        <Link 
          to="/chats"
          className="flex items-center space-x-2 text-gray-400 hover:text-white w-full p-2 rounded hover:bg-gray-800/50 cursor-pointer"
        >
          <FaEnvelope className="text-lg" />
          <span className="tracking-wider text-sm">MENSAJES</span>
        </Link>

        {/* Enlace a configuración */}
        <Link 
          to="/configuracion"
          className="flex items-center space-x-2 text-gray-400 hover:text-white w-full p-2 rounded hover:bg-gray-800/50 cursor-pointer"
        >
          <FaCog className="text-lg" />
          <span className="tracking-wider text-sm">CONFIGURACIÓN</span>
        </Link>

        {/* Enlace a perfil de usuario */}
        <Link 
          to="/perfil"
          className="flex items-center space-x-2 text-gray-400 hover:text-white w-full p-2 rounded hover:bg-gray-800/50 cursor-pointer"
        >
          <FaUser className="text-lg" />
          <span className="tracking-wider text-sm">PERFIL</span>
        </Link>

        {/* Menú de administración - Solo visible para moderadores */}
        {isModerator && (
          <div className="mt-2">
          {/* Botón principal de administración */}
          <button
            onClick={() => setIsAdminOpen(!isAdminOpen)}
            className="flex items-center justify-between w-full p-2 rounded hover:bg-gray-800/50 cursor-pointer text-gray-400 hover:text-white group"
          >
              <div className="flex items-center space-x-2">
                <FaShieldAlt className="text-lg" />
                <span className="tracking-wider text-sm">ADMINISTRACIÓN</span>
            </div>
              <FaChevronDown className={`text-xs transition-transform ${isAdminOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Submenú de administración */}
          {isAdminOpen && (
              <div className="mt-1 ml-3 space-y-1 border-l border-gray-800 pl-3">
              <Link 
                to="/admin/publicaciones"
                  className="flex items-center space-x-2 text-gray-400 hover:text-white w-full p-1.5 rounded hover:bg-gray-800/50 cursor-pointer"
              >
                  <FaNewspaper className="text-base" />
                  <span className="tracking-wider text-xs">Publicaciones</span>
              </Link>

              <Link 
                to="/admin/usuarios"
                  className="flex items-center space-x-2 text-gray-400 hover:text-white w-full p-1.5 rounded hover:bg-gray-800/50 cursor-pointer"
              >
                  <FaUsers className="text-base" />
                  <span className="tracking-wider text-xs">Usuarios</span>
              </Link>

              <Link 
                to="/admin/estadisticas"
                  className="flex items-center space-x-2 text-gray-400 hover:text-white w-full p-1.5 rounded hover:bg-gray-800/50 cursor-pointer"
              >
                  <FaChartBar className="text-base" />
                  <span className="tracking-wider text-xs">Estadísticas</span>
              </Link>
            </div>
          )}
        </div>
        )}
      </nav>
    </div>
  );
}
