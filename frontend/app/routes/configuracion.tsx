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
import { redirect } from "@remix-run/node";
import { useMessage } from '../hooks/useMessage';
import Message from '../components/Shared/Message';
import { authService } from '../services/auth.service';

/**
 * Función auxiliar para obtener el username del token JWT
 * @param token Token JWT
 * @returns Username del usuario
 */
const getUsernameFromToken = (token: string | null): string => {
  if (!token) return '';
  
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    const payload = JSON.parse(jsonPayload);
    return payload.username;
  } catch (error) {
    console.error('Error al decodificar el token:', error);
    return '';
  }
};

export const loader = async ({ request }: { request: Request }) => {
  const cookieHeader = request.headers.get("Cookie");
  const token = cookieHeader?.split(";").find((c: string) => c.trim().startsWith("token=") )?.split("=")[1];
  
  if (!token) {
    return redirect("/login");
  }

  try {
    // Intentamos obtener los datos del usuario para verificar que el token es válido
    const response = await fetch(`${environment.apiUrl}/users/username?username=${getUsernameFromToken(token)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    if (!data.success) {
      return redirect("/login");
    }

    return null;
  } catch (error) {
    console.error('Error al verificar el token:', error);
    return redirect("/login");
  }
};

export default function ConfiguracionPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const { message, showMessage, clearMessage } = useMessage();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const [activeSection, setActiveSection] = useState(searchParams.get('section') || 'cuenta');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    name: '',
    surname: '',
    bio: ''
  });
  const [userId, setUserId] = useState<string>('');
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    const fetchUserData = async () => {
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const username = getUsernameFromToken(token);
        if (!username) {
          navigate('/login');
          return;
        }

        const response = await fetch(`${environment.apiUrl}/users/username?username=${username}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();
        if (data.success) {
          setUser(data.data);
          setUserId(data.data.user_id);
          setFormData({
            username: data.data.username || '',
            email: data.data.email || '',
            name: data.data.name || '',
            surname: data.data.surname || '',
            bio: data.data.bio || ''
          });
        } else {
          navigate('/login');
        }
      } catch (error) {
        console.error('Error al obtener datos:', error);
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [token, navigate]);

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
    try {
      if (!userId) {
        showMessage('error', 'No pudimos obtener tu información de sesión');
        return;
      }

      // Validaciones según el esquema del backend
      if (formData.username && (formData.username.length < 3 || formData.username.length > 50)) {
        showMessage('error', 'El nombre de usuario debe tener entre 3 y 50 caracteres');
        return;
      }

      if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        showMessage('error', 'Por favor, introduce un correo electrónico válido');
        return;
      }

      // Solo enviamos los campos que han cambiado y no están vacíos
      const requestBody: Record<string, string> = {};
      
      if (formData.username !== user?.username && formData.username.trim() !== '') {
        requestBody.username = formData.username.trim();
      }
      
      if (formData.email !== user?.email && formData.email.trim() !== '') {
        requestBody.email = formData.email.trim();
      }
      
      if (formData.bio !== user?.bio && formData.bio?.trim() !== '') {
        requestBody.bio = formData.bio.trim();
      }

      // Verificar que al menos un campo ha cambiado y no está vacío
      if (Object.keys(requestBody).length === 0) {
        showMessage('error', 'No hay cambios válidos para actualizar');
        return;
      }

      // Verificar que ningún campo esté vacío
      for (const [key, value] of Object.entries(requestBody)) {
        if (!value || value.trim() === '') {
          showMessage('error', `El campo ${key} no puede estar vacío`);
          return;
        }
      }

      console.log('📤 Enviando datos:', requestBody);
      console.log('🔑 Usando ID:', userId);

      const response = await fetch(`${environment.apiUrl}/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });

      console.log('📥 Status:', response.status);
      console.log('📥 Headers:', Object.fromEntries(response.headers.entries()));

      // Intentar obtener el texto de la respuesta primero
      const responseText = await response.text();
      console.log('📥 Respuesta raw:', responseText);

      // Si la respuesta es HTML, probablemente es un error del servidor
      if (responseText.includes('<!DOCTYPE html>')) {
        const errorMatch = responseText.match(/Error: ([^<]+)/);
        const errorMessage = errorMatch ? errorMatch[1] : 'Error del servidor';
        throw new Error(errorMessage);
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ Error al parsear la respuesta como JSON:', parseError);
        throw new Error('La respuesta del servidor no es un JSON válido');
      }

      if (!response.ok) {
        throw new Error(data.message || `Error del servidor: ${response.status}`);
      }

      if (data.success) {
        showMessage('success', 'Datos actualizados correctamente');
        // Actualizamos el token si el username cambió
        if (data.data?.username !== formData.username) {
          console.log('Username actualizado, considera actualizar el token');
        }
      } else {
        throw new Error(data.message || 'Error al actualizar los datos');
      }
    } catch (err) {
      console.error('❌ Error al actualizar datos:', err);
      showMessage('error', err instanceof Error ? err.message : 'Error al actualizar los datos');
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showMessage('error', 'Las contraseñas no coinciden');
      return;
    }

    try {
      if (!userId) {
        showMessage('error', 'No pudimos obtener tu información de sesión');
        return;
      }

      const response = await fetch(`${environment.apiUrl}/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      const data = await response.json();
      if (data.success) {
        showMessage('success', 'Contraseña actualizada correctamente');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        throw new Error(data.message || 'Error al actualizar la contraseña');
      }
    } catch (err) {
      console.error('Error al actualizar contraseña:', err);
      showMessage('error', err instanceof Error ? err.message : 'Error al actualizar la contraseña');
    }
  };

  const handleLogout = async () => {
    try {
      const response = await authService.logout();
      if (response.success) {
        showMessage('success', 'Sesión cerrada correctamente');
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        showMessage('error', response.message || 'No pudimos cerrar tu sesión');
      }
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      showMessage('error', 'No pudimos conectarnos al servidor. Por favor, verifica tu conexión a internet');
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-black text-white flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex">
      <Navbar />
      
      <div className="w-2/3 ml-[16.666667%] border-r border-gray-800">
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-8">CONFIGURACIÓN</h1>
          
          {message && (
            <Message
              type={message.type}
              message={message.text}
              onClose={clearMessage}
            />
          )}

          {activeSection === 'cuenta' && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
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
                  <label className="block text-sm font-medium mb-2">Correo electrónico</label>
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