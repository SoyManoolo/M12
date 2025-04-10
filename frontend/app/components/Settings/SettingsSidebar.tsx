/**
 * @file SettingsSidebar.tsx
 * @description Componente que muestra la barra lateral de navegación en la página de configuraciones
 */

import { FaUser, FaLock, FaShieldAlt, FaSignOutAlt } from 'react-icons/fa';

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
    <div className="w-full pr-8">
      <div className="space-y-4">
        <button
          onClick={() => onSectionChange('cuenta')}
          className={`w-full text-left px-4 py-2 rounded-md flex items-center space-x-3 ${
            activeSection === 'cuenta' ? 'bg-gray-800' : 'hover:bg-gray-800'
          }`}
        >
          <FaUser className="text-xl" />
          <span className="tracking-wider">CUENTA</span>
        </button>

        <button
          onClick={() => onSectionChange('privacidad')}
          className={`w-full text-left px-4 py-2 rounded-md flex items-center space-x-3 ${
            activeSection === 'privacidad' ? 'bg-gray-800' : 'hover:bg-gray-800'
          }`}
        >
          <FaLock className="text-xl" />
          <span className="tracking-wider">PRIVACIDAD</span>
        </button>

        <button
          onClick={() => onSectionChange('seguridad')}
          className={`w-full text-left px-4 py-2 rounded-md flex items-center space-x-3 ${
            activeSection === 'seguridad' ? 'bg-gray-800' : 'hover:bg-gray-800'
          }`}
        >
          <FaShieldAlt className="text-xl" />
          <span className="tracking-wider">SEGURIDAD</span>
        </button>
        
        <button
          onClick={onLogout}
          className="w-full text-left px-4 py-2 rounded-md flex items-center space-x-3 text-red-500 hover:bg-gray-800"
        >
          <FaSignOutAlt className="text-xl" />
          <span className="tracking-wider">CERRAR SESIÓN</span>
        </button>
      </div>
    </div>
  );
} 