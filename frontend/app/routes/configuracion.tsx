/**
 * @file configuracion.tsx
 * @description Página de configuraciones que permite al usuario gestionar su cuenta,
 * privacidad y seguridad.
 * 
 * @module ConfiguracionPage
 * @exports ConfiguracionPage
 */

import { useState } from 'react';
import { Form, useNavigate } from "@remix-run/react";
import SettingsSidebar from "~/components/Settings/SettingsSidebar";
import { FaSignOutAlt } from 'react-icons/fa';

export default function ConfiguracionPage() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('cuenta');

  const handleSaveChanges = () => {
    // Implementar lógica para guardar cambios
    console.log('Guardando cambios...');
    // No redirige, se queda en la misma página
  };

  const handleSaveAndExit = () => {
    // Implementar lógica para guardar cambios
    console.log('Guardando cambios...');
    // Redirige al perfil
    navigate('/perfil');
  };

  // Función para el botón SALIR (redirige a inicio)
  const handleExit = () => {
    navigate('/inicio');
  };

  // Función para el botón CERRAR SESIÓN (limpia localStorage y redirige a login)
  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Sidebar fijo a la izquierda */}
      <div className="w-1/6 h-screen fixed left-0 top-0 border-r border-gray-800">
        <div className="mb-10 flex justify-center pt-6">
          <img 
            src="/images/logo.png"
            alt="Logo FriendsGo"
            className="h-32 cursor-pointer"
          />
        </div>
        <SettingsSidebar 
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          onLogout={handleLogout}
        />
      </div>

      {/* Contenido principal */}
      <div className="flex-1 ml-[16.666667%]">
        {/* Botón de salir en la esquina superior derecha */}
        <div className="absolute top-4 right-4">
          <button
            onClick={handleExit}
            className="flex items-center space-x-2 px-4 py-2 rounded-md text-red-500 hover:text-red-400"
          >
            <FaSignOutAlt className="text-xl" />
            <span className="tracking-wider">SALIR</span>
          </button>
        </div>

        {/* Contenido de la sección */}
        <div className="p-8">
          <h1 className="text-2xl font-bold mb-8">
            {activeSection.toUpperCase()}
          </h1>

          <Form method="post" className="space-y-6">
            {activeSection === 'cuenta' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Nombre de usuario</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-transparent border border-gray-700 rounded-md focus:outline-none focus:border-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input
                    type="email"
                    className="w-full px-3 py-2 bg-transparent border border-gray-700 rounded-md focus:outline-none focus:border-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Biografía</label>
                  <textarea
                    className="w-full px-3 py-2 bg-transparent border border-gray-700 rounded-md focus:outline-none focus:border-white"
                    rows={4}
                  />
                </div>
              </div>
            )}

            {activeSection === 'privacidad' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Cuenta Privada</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between">
                  <span>Mostrar Actividad</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            )}

            {activeSection === 'seguridad' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Contraseña Actual</label>
                  <input
                    type="password"
                    className="w-full px-3 py-2 bg-transparent border border-gray-700 rounded-md focus:outline-none focus:border-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Nueva Contraseña</label>
                  <input
                    type="password"
                    className="w-full px-3 py-2 bg-transparent border border-gray-700 rounded-md focus:outline-none focus:border-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Confirmar Nueva Contraseña</label>
                  <input
                    type="password"
                    className="w-full px-3 py-2 bg-transparent border border-gray-700 rounded-md focus:outline-none focus:border-white"
                  />
                </div>
              </div>
            )}

            {/* Botones en la parte inferior derecha */}
            <div className="fixed bottom-8 right-8 flex space-x-4">
              <button
                type="button"
                onClick={handleSaveChanges}
                className="px-6 py-2 bg-white text-black rounded-md hover:bg-gray-200 transition-colors"
              >
                GUARDAR
              </button>
              <button
                type="button"
                onClick={handleSaveAndExit}
                className="px-6 py-2 bg-white text-black rounded-md hover:bg-gray-200 transition-colors"
              >
                GUARDAR Y SALIR
              </button>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
} 