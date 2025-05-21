/**
 * Página de Administración de Usuarios
 * 
 * Esta página permite gestionar todos los usuarios de la aplicación.
 * Incluye:
 * - Lista de usuarios con opciones de edición y eliminación
 * - Filtros y búsqueda
 * - Gestión de roles y permisos
 */

import { useState } from 'react';
import Navbar from '~/components/Inicio/Navbar';
import { FaSearch, FaEdit, FaTrash, FaFilter, FaUserShield, FaUserSlash } from 'react-icons/fa';

export default function AdminUsuarios() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="min-h-screen bg-black text-white flex">
      <Navbar />
      
      <div className="w-5/6 ml-[16.666667%] p-8">
        <div className="max-w-7xl mx-auto">
          {/* Encabezado */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Gestión de Usuarios
              </h1>
              <p className="text-gray-400 mt-2">Administra los usuarios y sus permisos</p>
            </div>
            
            {/* Barra de búsqueda */}
            <div className="relative w-96">
              <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar usuarios..."
                className="w-full bg-gray-900 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Filtros */}
          <div className="bg-gray-900 rounded-lg p-4 mb-6 border border-gray-800">
            <div className="flex items-center space-x-4">
              <FaFilter className="text-gray-400" />
              <button className="px-4 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors">
                Todos
              </button>
              <button className="px-4 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors">
                Administradores
              </button>
              <button className="px-4 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors">
                Bloqueados
              </button>
              <button className="px-4 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors">
                Nuevos
              </button>
            </div>
          </div>

          {/* Lista de usuarios */}
          <div className="space-y-4">
            {/* Ejemplo de usuario */}
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 hover:border-blue-500 transition-colors">
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-4">
                  <img
                    src="/images/default-avatar.png"
                    alt="Usuario"
                    className="w-12 h-12 rounded-full"
                  />
                  <div>
                    <h3 className="font-semibold">Nombre del Usuario</h3>
                    <p className="text-sm text-gray-400">usuario@email.com</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="px-2 py-1 bg-blue-500/10 text-blue-500 rounded-full text-xs">
                        Usuario
                      </span>
                      <span className="px-2 py-1 bg-green-500/10 text-green-500 rounded-full text-xs">
                        Activo
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors" title="Editar usuario">
                    <FaEdit />
                  </button>
                  <button className="p-2 text-yellow-500 hover:bg-yellow-500/10 rounded-lg transition-colors" title="Cambiar rol">
                    <FaUserShield />
                  </button>
                  <button className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors" title="Bloquear usuario">
                    <FaUserSlash />
                  </button>
                  <button className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors" title="Eliminar usuario">
                    <FaTrash />
                  </button>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-4 text-sm text-gray-400">
                <div>
                  <p className="font-semibold">Último acceso</p>
                  <p>Hace 2 horas</p>
                </div>
                <div>
                  <p className="font-semibold">Publicaciones</p>
                  <p>45 posts</p>
                </div>
                <div>
                  <p className="font-semibold">Estado</p>
                  <p>Verificado</p>
                </div>
              </div>
            </div>

            {/* Más usuarios... */}
          </div>
        </div>
      </div>
    </div>
  );
} 