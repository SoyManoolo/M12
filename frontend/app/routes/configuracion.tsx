/**
 * @file configuracion.tsx
 * @description Página de configuraciones que permite al usuario gestionar su cuenta y seguridad.
 * 
 * @module ConfiguracionPage
 * @exports ConfiguracionPage
 */

import { useState } from 'react';
import { useNavigate, useSearchParams } from "@remix-run/react";
import Navbar from "~/components/Inicio/Navbar";
import { useAuth } from "~/hooks/useAuth";

export default function ConfiguracionPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { token } = useAuth();
  const [activeSection, setActiveSection] = useState(searchParams.get('section') || 'cuenta');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    name: '',
    surname: '',
    bio: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Aquí iría la lógica para guardar los cambios
    console.log('Guardando cambios:', formData);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }
    // Aquí iría la lógica para cambiar la contraseña
    console.log('Cambiando contraseña:', passwordData);
  };

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Barra lateral usando el componente Navbar */}
      <Navbar />

      {/* Contenido principal */}
      <div className="w-2/3 ml-[16.666667%] border-r border-gray-800">
        <div className="p-8">
          <h1 className="text-2xl font-bold mb-8">
            {activeSection.toUpperCase()}
          </h1>

          {activeSection === 'cuenta' && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Nombre</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-transparent border border-gray-700 rounded-md focus:outline-none focus:border-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Apellidos</label>
                  <input
                    type="text"
                    name="surname"
                    value={formData.surname}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-transparent border border-gray-700 rounded-md focus:outline-none focus:border-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Nombre de usuario</label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-transparent border border-gray-700 rounded-md focus:outline-none focus:border-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-transparent border border-gray-700 rounded-md focus:outline-none focus:border-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Biografía</label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-transparent border border-gray-700 rounded-md focus:outline-none focus:border-white"
                    rows={4}
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Guardar cambios
                  </button>
                </div>
              </div>
            </form>
          )}

          {activeSection === 'seguridad' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Contraseña actual</label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    className="w-full px-3 py-2 bg-transparent border border-gray-700 rounded-md focus:outline-none focus:border-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Nueva contraseña</label>
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    className="w-full px-3 py-2 bg-transparent border border-gray-700 rounded-md focus:outline-none focus:border-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Confirmar nueva contraseña</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    className="w-full px-3 py-2 bg-transparent border border-gray-700 rounded-md focus:outline-none focus:border-white"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Cambiar contraseña
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Barra lateral derecha */}
      <div className="w-1/6 p-6">
        <nav className="space-y-2">
          <button
            onClick={() => setActiveSection('cuenta')}
            className={`w-full text-left px-4 py-2 rounded-md ${
              activeSection === 'cuenta'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            Cuenta
          </button>
          <button
            onClick={() => setActiveSection('seguridad')}
            className={`w-full text-left px-4 py-2 rounded-md ${
              activeSection === 'seguridad'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            Seguridad
          </button>
        </nav>
      </div>
    </div>
  );
} 