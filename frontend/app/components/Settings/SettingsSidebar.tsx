/**
 * @file SettingsSidebar.tsx
 * @description Componente que muestra la barra lateral de navegación en la página de configuraciones
 */

import { FaUser, FaLock, FaShieldAlt, FaSignOutAlt } from 'react-icons/fa';
import { Link } from "@remix-run/react";

interface SettingsSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  onLogout: () => void;
}

export default function SettingsSidebar({ 
  activeSection, 
  onSectionChange, 
  onLogout 
}: SettingsSidebarProps) {
  return (
    <div className="space-y-6">
      {/* Logo */}
      <div className="mb-10 flex justify-center pt-6">
        <Link to="/inicio">
          <img 
            src="/images/logo.png"
            alt="Logo FriendsGo"
            className="h-32 cursor-pointer"
          />
        </Link>
      </div>

      {/* Navegación */}
      <nav className="px-6">
        <button
          onClick={() => onSectionChange('cuenta')}
          className={`flex items-center space-x-3 text-gray-400 hover:text-white w-full p-2 rounded hover:bg-gray-800/50 cursor-pointer ${
            activeSection === 'cuenta' ? 'text-white bg-gray-800/50' : ''
          }`}
        >
          <div className="w-8 flex justify-center">
            <FaUser className="text-xl" />
          </div>
          <span className="tracking-wider">CUENTA</span>
        </button>

        <button
          onClick={() => onSectionChange('privacidad')}
          className={`flex items-center space-x-3 text-gray-400 hover:text-white w-full p-2 rounded hover:bg-gray-800/50 cursor-pointer ${
            activeSection === 'privacidad' ? 'text-white bg-gray-800/50' : ''
          }`}
        >
          <div className="w-8 flex justify-center">
            <FaLock className="text-xl" />
          </div>
          <span className="tracking-wider">PRIVACIDAD</span>
        </button>

        <button
          onClick={() => onSectionChange('seguridad')}
          className={`flex items-center space-x-3 text-gray-400 hover:text-white w-full p-2 rounded hover:bg-gray-800/50 cursor-pointer ${
            activeSection === 'seguridad' ? 'text-white bg-gray-800/50' : ''
          }`}
        >
          <div className="w-8 flex justify-center">
            <FaShieldAlt className="text-xl" />
          </div>
          <span className="tracking-wider">SEGURIDAD</span>
        </button>
        
        <button
          onClick={onLogout}
          className="flex items-center space-x-3 text-red-500 hover:text-red-400 w-full p-2 rounded hover:bg-gray-800/50 cursor-pointer"
        >
          <div className="w-8 flex justify-center">
            <FaSignOutAlt className="text-xl" />
          </div>
          <span className="tracking-wider">CERRAR SESIÓN</span>
        </button>
      </nav>
    </div>
  );
} 