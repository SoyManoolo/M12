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
 * @requires react-router
 * @requires react-icons/fa
 */

// src/components/Navbar.tsx
import { Link } from "react-router";
import ThemeToggle from '~/components/Shared/ThemeToggle';
import { FaVideo, FaUpload, FaBell, FaEnvelope, FaCog, FaUser, FaShieldAlt, FaNewspaper, FaUsers, FaChevronDown, FaSearch, FaHome } from 'react-icons/fa';
import { useAuth } from "~/hooks/useAuth";
import { useState, useEffect } from 'react';

/**
 * Componente principal de la barra de navegación
 *
 * @returns {JSX.Element} Barra de navegación con enlaces y funcionalidades principales
 */
export default function Navbar() {
  const { user } = useAuth();
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isModerator, setIsModerator] = useState(false);

  useEffect(() => {
    if (user) {
      setIsModerator(user.is_moderator === true);
    }
  }, [user]);

  return (
    <>
      {/* Navbar Lateral (Escritorio) */}
      <div className="w-1/6 h-screen bg-page border-r border-line p-4 fixed left-0 top-0 overflow-y-auto hidden lg:block">
      {/* Contenedor del logo */}
      <div className="mb-6 flex justify-center">
        <Link to="/inicio">
          <img
            src="/images/friendsgo-mark.svg"
            alt="Logo FriendsGo"
            className="h-24 cursor-pointer"
          />
        </Link>
      </div>

      {/* Menú de navegación */}
      <div className="mb-6 flex justify-center"><ThemeToggle /></div>
      <nav className="space-y-3" aria-label="Navegación principal">
        {/* Enlace a videollamada - Función principal */}
        <Link
          to="/videollamada"
          className="flex flex-col items-center justify-center text-ink hover:text-accent w-full p-3 rounded-lg hover:bg-soft/50 transition-all transform hover:scale-105 cursor-pointer group relative"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <FaVideo className="text-3xl mb-1" />
          <span className="text-sm font-semibold">Videollamada</span>
        </Link>

        {/* Enlace a búsqueda */}
        <Link
          to="/buscar"
          className="flex items-center space-x-2 text-muted hover:text-ink w-full p-3 rounded-xl hover:bg-soft cursor-pointer"
        >
          <FaSearch className="text-lg" />
          <span className="font-medium text-sm">Buscar amigos</span>
        </Link>

        {/* Enlace a sección de publicaciones */}
        <Link
          to="/publicar"
          className="flex items-center space-x-2 text-muted hover:text-ink w-full p-3 rounded-xl hover:bg-soft cursor-pointer"
        >
          <FaUpload className="text-lg" />
          <span className="font-medium text-sm">Compartir</span>
        </Link>

        {/* Enlace a notificaciones */}
        <Link
          to="/notificaciones"
          className="flex items-center space-x-2 text-muted hover:text-ink w-full p-3 rounded-xl hover:bg-soft cursor-pointer"
        >
          <FaBell className="text-lg" />
          <span className="font-medium text-sm">Notificaciones</span>
        </Link>

        {/* Enlace a mensajes */}
        <Link
          to="/chats"
          className="flex items-center space-x-2 text-muted hover:text-ink w-full p-3 rounded-xl hover:bg-soft cursor-pointer"
        >
          <FaEnvelope className="text-lg" />
          <span className="font-medium text-sm">Mensajes</span>
        </Link>

        {/* Enlace a configuración */}
        <Link
          to="/configuracion"
          className="flex items-center space-x-2 text-muted hover:text-ink w-full p-3 rounded-xl hover:bg-soft cursor-pointer"
        >
          <FaCog className="text-lg" />
          <span className="font-medium text-sm">Configuración</span>
        </Link>

        {/* Enlace a perfil de usuario */}
        <Link
          to="/perfil"
          className="flex items-center space-x-2 text-muted hover:text-ink w-full p-3 rounded-xl hover:bg-soft cursor-pointer"
        >
          <FaUser className="text-lg" />
          <span className="font-medium text-sm">Mi perfil</span>
        </Link>

        {/* Menú de administración - Solo visible para moderadores */}
        {isModerator && (
          <div className="mt-2">
          {/* Botón principal de administración */}
          <button
            onClick={() => setIsAdminOpen(!isAdminOpen)}
            className="flex items-center justify-between w-full p-3 rounded-xl hover:bg-soft cursor-pointer text-muted hover:text-ink group"
          >
              <div className="flex items-center space-x-2">
                <FaShieldAlt className="text-lg" />
                <span className="font-medium text-sm">Administración</span>
            </div>
              <FaChevronDown className={`text-xs transition-transform ${isAdminOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Submenú de administración */}
          {isAdminOpen && (
              <div className="mt-1 ml-3 space-y-1 border-l border-line pl-3">
              <Link
                to="/admin/publicaciones"
                  className="flex items-center space-x-2 text-muted hover:text-ink w-full p-1.5 rounded hover:bg-soft/50 cursor-pointer"
              >
                  <FaNewspaper className="text-base" />
                  <span className="tracking-wider text-xs">Publicaciones</span>
              </Link>

              <Link
                to="/admin/usuarios"
                  className="flex items-center space-x-2 text-muted hover:text-ink w-full p-1.5 rounded hover:bg-soft/50 cursor-pointer"
              >
                  <FaUsers className="text-base" />
                  <span className="tracking-wider text-xs">Usuarios</span>
              </Link>
            </div>
          )}
        </div>
        )}
      </nav>
    </div>

      {/* Header Móvil (Solo en móviles) */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-page border-b border-line flex items-center justify-between px-4 lg:hidden z-50">
        {/* Logo */}
        <Link to="/inicio" className="flex items-center">
          <img
            src="/images/friendsgo-mark.svg"
            alt="Logo FriendsGo"
            className="h-10 cursor-pointer"
          />
        </Link>

        {/* Iconos de la derecha */}
        <div className="flex items-center space-x-4">
          <ThemeToggle />
          {/* Icono Notificaciones */}
          <Link to="/notificaciones" className="text-muted hover:text-ink transition-colors">
            <FaBell className="text-2xl" />
          </Link>
          {/* Icono Mensajes */}
          <Link to="/chats" className="text-muted hover:text-ink transition-colors">
            <FaEnvelope className="text-2xl" />
          </Link>
          {/* Icono Administración (solo para moderadores) */}
          {isModerator && (
            <div className="relative">
              <button
                onClick={() => setIsAdminOpen(!isAdminOpen)}
                className="text-muted hover:text-ink transition-colors focus:outline-none"
              >
                <FaShieldAlt className="text-2xl" />
              </button>
              {isAdminOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-soft rounded-md shadow-lg py-1 z-20">
                  <Link
                    to="/admin/publicaciones"
                    className="block px-4 py-2 text-sm text-copy hover:bg-hover hover:text-ink"
                    onClick={() => setIsAdminOpen(false)}
                  >
                    Publicaciones
                  </Link>
                  <Link
                    to="/admin/usuarios"
                    className="block px-4 py-2 text-sm text-copy hover:bg-hover hover:text-ink"
                    onClick={() => setIsAdminOpen(false)}
                  >
                    Usuarios
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Navbar Inferior Móvil (Solo en móviles) */}
      <div className="fixed bottom-0 left-0 right-0 h-16 bg-page border-t border-line flex items-center justify-around lg:hidden z-50">
        {/* Icono Inicio */}
        <Link to="/inicio" className="flex flex-col items-center justify-center text-muted hover:text-ink transition-colors">
          <FaHome className="text-2xl" />
        </Link>
        {/* Icono Buscador */}
        <Link to="/buscar" className="flex flex-col items-center justify-center text-muted hover:text-ink transition-colors">
          <FaSearch className="text-2xl" />
        </Link>
        {/* Icono Videollamada */}
        <Link to="/videollamada" className="flex flex-col items-center justify-center text-muted hover:text-ink transition-colors">
          <FaVideo className="text-2xl" />
        </Link>
        {/* Icono Publicación */}
        <Link to="/publicar" className="flex flex-col items-center justify-center text-muted hover:text-ink transition-colors">
          <FaUpload className="text-2xl" />
        </Link>
        {/* Icono Perfil */}
        <Link to="/perfil" className="flex flex-col items-center justify-center text-muted hover:text-ink transition-colors">
          <FaUser className="text-2xl" />
        </Link>
      </div>
    </>
  );
}
