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
import { FaVideo, FaUpload, FaBell, FaEnvelope, FaCog, FaUser, FaShieldAlt, FaNewspaper, FaUsers, FaChartBar, FaChevronDown } from 'react-icons/fa';
import { useAuth } from "~/hooks/useAuth";
import { useState } from 'react';

/**
 * Componente principal de la barra de navegación
 * 
 * @returns {JSX.Element} Barra de navegación con enlaces y funcionalidades principales
 */
export default function Navbar() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  const handleProfileClick = () => {
    // Navegar al perfil sin parámetros
    navigate('/perfil');
  };

  return (
    <div className="w-1/6 h-screen bg-black border-r border-gray-800 p-6 fixed left-0 top-0">
      {/* Contenedor del logo */}
      <div className="mb-10 flex justify-center">
        <Link to="/inicio">
          <img 
            src="/images/logo.png"
            alt="Logo FriendsGo"
            className="h-32 cursor-pointer"
          />
        </Link>
      </div>

      {/* Menú de navegación */}
      <nav className="space-y-6">
        {/* Enlace a videollamada - Función principal */}
        <Link 
          to="/videollamada"
          className="flex flex-col items-center justify-center text-white hover:text-blue-400 w-full p-4 rounded-lg hover:bg-gray-800/50 transition-all transform hover:scale-105 cursor-pointer group relative"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <FaVideo className="text-4xl mb-2" />
          <span className="text-sm font-semibold tracking-wider">VIDEOLLAMADA</span>
        </Link>

        {/* Enlace a sección de publicaciones */}
        <Link 
          to="/publicar"
          className="flex items-center space-x-3 text-gray-400 hover:text-white w-full p-2 rounded hover:bg-gray-800/50 cursor-pointer"
        >
          <FaUpload className="text-xl" />
          <span className="tracking-wider">PUBLICAR</span>
        </Link>

        {/* Enlace a notificaciones */}
        <Link 
          to="/notificaciones"
          className="flex items-center space-x-3 text-gray-400 hover:text-white w-full p-2 rounded hover:bg-gray-800/50 cursor-pointer"
        >
          <FaBell className="text-xl" />
          <span className="tracking-wider">NOTIFICACIONES</span>
        </Link>

        {/* Enlace a mensajes */}
        <Link 
          to="/chats"
          className="flex items-center space-x-3 text-gray-400 hover:text-white w-full p-2 rounded hover:bg-gray-800/50 cursor-pointer"
        >
          <FaEnvelope className="text-xl" />
          <span className="tracking-wider">MENSAJES</span>
        </Link>

        {/* Enlace a configuración */}
        <Link 
          to="/configuracion"
          className="flex items-center space-x-3 text-gray-400 hover:text-white w-full p-2 rounded hover:bg-gray-800/50 cursor-pointer"
        >
          <FaCog className="text-xl" />
          <span className="tracking-wider">CONFIGURACIÓN</span>
        </Link>

        {/* Enlace a perfil de usuario */}
        <Link 
          to="/perfil"
          className="flex items-center space-x-3 text-gray-400 hover:text-white w-full p-2 rounded hover:bg-gray-800/50 cursor-pointer"
        >
          <FaUser className="text-xl" />
          <span className="tracking-wider">PERFIL</span>
        </Link>

        {/* Menú de administración */}
        <div className="mt-auto">
          {/* Botón principal de administración */}
          <button
            onClick={() => setIsAdminOpen(!isAdminOpen)}
            className="flex items-center justify-between w-full p-2 rounded hover:bg-gray-800/50 cursor-pointer text-gray-400 hover:text-white group"
          >
            <div className="flex items-center space-x-3">
              <FaShieldAlt className="text-xl" />
              <span className="tracking-wider">ADMINISTRACIÓN</span>
            </div>
            <FaChevronDown className={`text-sm transition-transform ${isAdminOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Submenú de administración */}
          {isAdminOpen && (
            <div className="mt-2 ml-4 space-y-2 border-l border-gray-800 pl-4">
              <Link 
                to="/admin/publicaciones"
                className="flex items-center space-x-3 text-gray-400 hover:text-white w-full p-2 rounded hover:bg-gray-800/50 cursor-pointer"
              >
                <FaNewspaper className="text-lg" />
                <span className="tracking-wider text-sm">Publicaciones</span>
              </Link>

              <Link 
                to="/admin/usuarios"
                className="flex items-center space-x-3 text-gray-400 hover:text-white w-full p-2 rounded hover:bg-gray-800/50 cursor-pointer"
              >
                <FaUsers className="text-lg" />
                <span className="tracking-wider text-sm">Usuarios</span>
              </Link>

              <Link 
                to="/admin/estadisticas"
                className="flex items-center space-x-3 text-gray-400 hover:text-white w-full p-2 rounded hover:bg-gray-800/50 cursor-pointer"
              >
                <FaChartBar className="text-lg" />
                <span className="tracking-wider text-sm">Estadísticas</span>
              </Link>
            </div>
          )}
        </div>
      </nav>
    </div>
  );
}
