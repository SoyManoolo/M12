/**
 * Componente Navbar
 * 
 * Este componente representa la barra de navegación lateral de la aplicación.
 * Incluye:
 * - Logo de la aplicación
 * - Enlaces de navegación principales
 * - Iconos para cada sección
 * - Botón de cerrar sesión en la sección de perfil
 * 
 * @module Navbar
 * @requires @remix-run/react
 * @requires react-icons/fa
 */

// src/components/Navbar.tsx
import { Link, useLocation, useNavigate } from "@remix-run/react";
import { FaVideo, FaUpload, FaBell, FaEnvelope, FaCog, FaUser, FaSignOutAlt } from 'react-icons/fa';

/**
 * Componente principal de la barra de navegación
 * 
 * @returns {JSX.Element} Barra de navegación con enlaces y funcionalidades principales
 */
export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const isProfilePage = location.pathname.includes('/perfil');

  const handleLogout = () => {
    // Limpiar localStorage
    localStorage.clear();
    // Redirigir al login
    navigate('/login');
  };

  const handleProfileClick = () => {
    // Obtener el usuario actual del localStorage
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    if (currentUser && currentUser.username) {
      navigate(`/perfil?username=${currentUser.username}`);
    }
  };

  return (
    <div className="w-1/6 h-screen bg-black border-r border-gray-800 p-6 fixed left-0 top-0">
      {/* Contenedor del logo */}
      <div className="mb-10 flex justify-center">
        <Link to="/inicio">
          <img 
            src="/images/logo.png"
            alt="Logo FriendsGo"
            className="h-24 cursor-pointer"
          />
        </Link>
      </div>

      {/* Menú de navegación */}
      <nav className="space-y-6">
        {/* Enlace a videollamada - Función principal */}
        <Link 
          to="/videollamada"
          className="flex items-center justify-center text-white hover:text-gray-300 w-full p-4 rounded-lg hover:bg-gray-800 transition-all transform hover:scale-105 bg-gray-800 border border-gray-700 cursor-pointer"
        >
          <FaVideo className="text-4xl" />
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
          to="/mensajes"
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
        <div 
          onClick={handleProfileClick}
          className="flex items-center space-x-3 text-gray-400 hover:text-white w-full p-2 rounded hover:bg-gray-800/50 cursor-pointer"
        >
          <FaUser className="text-xl" />
          <span className="tracking-wider">PERFIL</span>
        </div>

        {/* Botón de cerrar sesión (solo visible en la página de perfil) */}
        {isProfilePage && (
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 text-red-500 hover:text-red-400 w-full p-2 rounded hover:bg-gray-800/50 mt-4 cursor-pointer"
          >
            <FaSignOutAlt className="text-xl" />
            <span className="tracking-wider">CERRAR SESIÓN</span>
          </button>
        )}
      </nav>
    </div>
  );
}
