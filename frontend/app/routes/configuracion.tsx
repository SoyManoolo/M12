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
import { FaSignOutAlt, FaTrash } from 'react-icons/fa';
import { userService } from "~/services/user.service";
import type { UserProfile } from "~/types/user.types";
import { redirect } from "@remix-run/node";
import { useMessage } from '../hooks/useMessage';
import Message from '../components/Shared/Message';
import { authService } from '../services/auth.service';
import RedirectModal from '~/components/Shared/RedirectModal';
import Notification from '../components/Shared/Notification';
import ConfirmModal from '../components/Shared/ConfirmModal';

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
  const [showRedirectModal, setShowRedirectModal] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    name: '',
    surname: '',
    password: '',
    bio: ''
  });
  const [userId, setUserId] = useState<string>('');
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);

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
            password: '',
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!token || !userId) {
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

      if (formData.password && formData.password.trim() === '') {
        showMessage('error', 'La contraseña no puede estar vacía');
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

      if (formData.password && formData.password.trim() !== '') {
        requestBody.password = formData.password.trim();
      }
      
      if (formData.bio !== user?.bio && formData.bio?.trim() !== '') {
        requestBody.bio = formData.bio.trim();
      }

      // Verificar que al menos un campo ha cambiado y no está vacío
      if (Object.keys(requestBody).length === 0) {
        showMessage('error', 'No hay cambios válidos para actualizar');
        return;
      }

      const response = await userService.updateUserById(userId, requestBody, token);

      if (response.success) {
        // Si se actualizaron datos sensibles (email, username o password)
        if (requestBody.email || requestBody.username || requestBody.password) {
          setShowRedirectModal(true);
        } else {
          // Si solo se actualizó la bio u otros datos no sensibles
          setNotification({
            message: 'Datos actualizados correctamente',
            type: 'success'
          });
          // Actualizar los datos del usuario en el estado
          if (user) {
            setUser({
              ...user,
              ...requestBody
            });
          }
        }
      } else {
        setNotification({
          message: response.message || 'Error al actualizar los datos',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error al actualizar:', error);
      setNotification({
        message: 'Error al actualizar los datos',
        type: 'error'
      });
    }
  };

  const handleLogout = async () => {
    try {
      const response = await authService.logout();
      if (response.success) {
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

  const handleDeleteProfile = () => {
    setShowDeleteAccountModal(true);
  };

  const confirmDeleteAccount = async () => {
    if (!token || !userId) return;
    
    try {
      const response = await userService.deleteUserById(userId, token);
      
      if (response.success) {
        localStorage.clear();
        sessionStorage.clear();
        document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        window.location.href = '/login';
      } else {
        setNotification({
          message: 'Error al eliminar la cuenta',
          type: 'error'
        });
        setShowDeleteAccountModal(false);
      }
    } catch (error) {
      console.error('Error al eliminar cuenta:', error);
      setNotification({
        message: 'Error al eliminar la cuenta',
        type: 'error'
      });
      setShowDeleteAccountModal(false);
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
      
      <div className="w-5/6 ml-[16.666667%]">
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-8">CONFIGURACIÓN</h1>
          
          {message && (
            <Message
              type={message.type}
              message={message.text}
              onClose={clearMessage}
            />
          )}

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
                <label className="block text-sm font-medium mb-2">Nueva Contraseña</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
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
              <div className="flex justify-between items-center">
                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={handleDeleteProfile}
                    className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center space-x-2 cursor-pointer"
                  >
                    <FaTrash />
                    <span>Eliminar cuenta</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center space-x-2 cursor-pointer"
                  >
                    <FaSignOutAlt />
                    <span>Cerrar sesión</span>
                  </button>
                </div>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  Guardar cambios
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <RedirectModal
        isOpen={showRedirectModal}
        message="Datos actualizados correctamente"
        onRedirect={() => {
          // Limpiar el token y redirigir al login
          document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
          window.location.href = '/login';
        }}
      />

      <ConfirmModal
        isOpen={showDeleteAccountModal}
        onClose={() => setShowDeleteAccountModal(false)}
        onConfirm={confirmDeleteAccount}
        title="Eliminar cuenta"
        message="¿Estás seguro de que quieres eliminar tu cuenta? Esta acción es irreversible y perderás todo tu contenido y datos."
        confirmText="Eliminar cuenta"
        cancelText="Cancelar"
      />

      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
} 