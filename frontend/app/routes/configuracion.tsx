/**
 * @file configuracion.tsx
 * @description Página de configuraciones que permite al usuario gestionar su cuenta y seguridad.
 * 
 * @module ConfiguracionPage
 * @exports ConfiguracionPage
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from "@remix-run/react";
import Navbar from "~/components/Inicio/Navbar";
import { useAuth } from "~/hooks/useAuth";
import { environment } from "~/config/environment";
import { FaSignOutAlt } from 'react-icons/fa';
import { userService } from "~/services/user.service";
import type { UserProfile } from "~/types/user.types";

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar datos del usuario al montar el componente
  useEffect(() => {
    const fetchUserData = async () => {
      if (!token) return;
      
      try {
        setLoading(true);
        setError(null);
        const response = await userService.getUserById('me', token);
        
        if (!response.success || !response.data) {
          throw new Error('No se recibieron datos del usuario');
        }

        // Actualizar el estado con los datos del usuario
        setFormData({
          username: response.data.username || '',
          email: response.data.email || '',
          name: response.data.name || '',
          surname: response.data.surname || '',
          bio: response.data.bio || ''
        });
      } catch (err) {
        setError('Error al cargar los datos del usuario');
        console.error('Error al cargar datos del usuario:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [token]);

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
    if (!token) return;

    try {
      setError(null);
      // Actualizar los datos del usuario
      const response = await fetch(`${environment.apiUrl}/users/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          name: formData.name,
          surname: formData.surname,
          bio: formData.bio
        })
      });

      if (!response.ok) {
        throw new Error('Error al actualizar los datos');
      }
      
      alert('Datos actualizados correctamente');
    } catch (err) {
      setError('Error al actualizar los datos');
      console.error('Error al actualizar datos:', err);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    try {
      setError(null);
      // Actualizar la contraseña
      const response = await fetch(`${environment.apiUrl}/users/me/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          current_password: passwordData.currentPassword,
          new_password: passwordData.newPassword
        })
      });

      if (!response.ok) {
        throw new Error('Error al actualizar la contraseña');
      }
      
      alert('Contraseña actualizada correctamente');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err) {
      setError('Error al actualizar la contraseña');
      console.error('Error al actualizar contraseña:', err);
    }
  };

  const handleLogout = async () => {
    try {
      if (token) {
        // Llamar al endpoint de logout
        const response = await fetch(`${environment.apiUrl}${environment.apiEndpoints.auth.logout}/${token}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        // Independientemente de la respuesta del servidor, eliminamos el token y redirigimos
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        // Si no hay token, simplemente redirigimos
        navigate('/login');
      }
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      // Aún con error, eliminamos el token y redirigimos
      localStorage.removeItem('token');
      navigate('/login');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex">
        <Navbar />
        <div className="w-2/3 ml-[16.666667%] p-8">
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

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

          {error && (
            <div className="mb-4 p-4 bg-red-500/20 border border-red-500 rounded-md text-red-500">
              {error}
            </div>
          )}

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
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 flex items-center space-x-2 cursor-pointer"
          >
            <FaSignOutAlt />
            <span>Cerrar sesión</span>
          </button>
        </nav>
      </div>
    </div>
  );
} 