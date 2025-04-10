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
import { FaVideo, FaUpload, FaBell, FaEnvelope, FaCog, FaUser } from 'react-icons/fa';

/**
 * Componente principal de la barra de navegación
 * 
 * @returns {JSX.Element} Barra de navegación con enlaces y funcionalidades principales
 */
export default function Navbar() {
  const navigate = useNavigate();

  const handleProfileClick = () => {
    // Mock de usuario basado en la estructura de la base de datos
    const mockUser = {
      user_id: "550e8400-e29b-41d4-a716-446655440000",
      first_name: "Usuario",
      last_name: "Demo",
      username: "usuario_demo",
      email: "demo@example.com",
      password: "hashed_password",
      profile_picture_url: "https://i.pravatar.cc/150",
      bio: "¡Hola! Soy un usuario de prueba de FriendsGo.",
      email_verified: true,
      is_moderator: false,
      id_deleted: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Guardar mock en localStorage
    localStorage.setItem('user', JSON.stringify(mockUser));
    
    // Navegar al perfil del usuario mock
    navigate(`/perfil?username=${mockUser.username}`);
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
      </nav>
    </div>
  );
}
