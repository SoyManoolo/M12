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
import { FaSignOutAlt, FaTrash, FaUser, FaEnvelope, FaLock, FaCamera, FaEdit, FaTimes } from 'react-icons/fa';
import { userService } from "~/services/user.service";
import type { UserProfile } from "~/types/user.types";
import { redirect } from "@remix-run/node";
import { useMessage } from '../hooks/useMessage';
import Message from '../components/Shared/Message';
import { authService } from '../services/auth.service';
import RedirectModal from '~/components/Shared/RedirectModal';
import Notification from '../components/Shared/Notification';
import ConfirmModal from '../components/Shared/ConfirmModal';
import { decodeToken } from '../utils/token';

/**
 * Función auxiliar para obtener el username del token JWT
 * @param token Token JWT
 * @returns Username del usuario
 */
const getUsernameFromToken = (token: string | null): string => {
  if (!token) return '';
  
  try {
    const decoded = decodeToken(token);
    return decoded?.username || '';
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
  const [showCountdownModal, setShowCountdownModal] = useState(false);
  const [countdown, setCountdown] = useState(3);

  // Regex para validar contraseñas (al menos 8 caracteres, mayúscula, minúscula, número, caracter especial)
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.#])[A-Za-z\d@$!%*?&.#]{8,}$/;

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

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showCountdownModal && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (countdown === 0) {
      handleLogout();
    }
    return () => clearTimeout(timer);
  }, [showCountdownModal, countdown]);

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
      if (!token || !userId || !user) {
        showMessage('error', 'No pudimos obtener tu información de sesión');
        return;
      }

      // Verificar que el token sea válido
      const decodedToken = decodeToken(token);
      if (!decodedToken) {
        showMessage('error', 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
        navigate('/login');
        return;
      }

      // Solo enviamos los campos que han cambiado y no están vacíos
      const requestBody: Record<string, string> = {};

      // Validaciones según el esquema del backend y el regex
      if (formData.username && formData.username !== user.username) {
        if (formData.username.length < 3 || formData.username.length > 50) {
          showMessage('error', 'El nombre de usuario debe tener entre 3 y 50 caracteres');
          return;
        }
        requestBody.username = formData.username.trim();
      }

      if (formData.email && formData.email !== user.email) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          showMessage('error', 'Por favor, introduce un correo electrónico válido');
          return;
        }
        requestBody.email = formData.email.trim();
      }

      if (formData.password && formData.password.trim() !== '') {
        // Validar la nueva contraseña con el regex
        if (!passwordRegex.test(formData.password)) {
          setNotification({
            message: 'La contraseña debe tener al menos 8 caracteres, incluyendo una mayúscula, una minúscula, un número y un caracter especial (@$!%*?&.#)',
            type: 'error'
          });
          return;
        }
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

      // Asegurarnos de que el token esté actualizado
      const currentToken = localStorage.getItem('token');
      if (!currentToken) {
        showMessage('error', 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
        navigate('/login');
        return;
      }

      const response = await userService.updateUserById(userId, requestBody, currentToken);

      if (response.success) {
        // Si se actualizaron datos sensibles (email, username o password)
        if (requestBody.email || requestBody.username || requestBody.password) {
          setShowCountdownModal(true);
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
        if (response.status === 401) {
          showMessage('error', 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
          navigate('/login');
        } else {
          setNotification({
            message: response.message || 'Error al actualizar los datos',
            type: 'error'
          });
        }
      }
    } catch (error) {
      console.error('Error al actualizar:', error);
      if (error instanceof Error && error.message.includes('401')) {
        showMessage('error', 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
        navigate('/login');
      } else {
        setNotification({
          message: 'Error al actualizar los datos',
          type: 'error'
        });
      }
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
      await userService.deleteUserById(userId, token);
      localStorage.clear();
      sessionStorage.clear();
      document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      window.location.href = '/login';
    } catch (error) {
      console.error('Error al eliminar cuenta:', error);
      window.location.href = '/login';
    }
  };

  // Agregar una función auxiliar para verificar el token
  const ensureToken = (): string => {
    if (!token) {
      throw new Error("No hay token de autenticación");
    }
    return token;
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-black text-white flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-black text-white flex overflow-hidden">
      <Navbar />
      
      <div className="w-5/6 ml-[16.666667%] p-4">
        {/* Encabezado con título y mensajes */}
        <div className="max-w-4xl mx-auto h-full flex flex-col">
          <div className="mb-2">
            <h1 className="text-3xl font-bold text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Configuración
          </h1>
            <p className="text-gray-400 text-center mb-2">Gestiona tu cuenta y personaliza tu perfil</p>
          </div>
          
          {message && (
            <Message
              type={message.type}
              message={message.text}
              onClose={clearMessage}
            />
          )}

          {/* Contenedor principal con grid de dos columnas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 h-[calc(100vh-12rem)]">
            {/* Columna izquierda - Foto de perfil y biografía */}
            <div className="flex flex-col space-y-6 h-full">
              {/* Bloque circular para la foto de perfil */}
              <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-gray-800/50 h-3/5 flex flex-col transition-all duration-300 hover:border-gray-700">
                <h2 className="text-xl font-semibold mb-4 text-center bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">Foto de Perfil</h2>
                <div className="flex-1 flex items-center justify-center">
                  <div className="relative w-64 h-64 group">
                    {user?.profile_picture ? (
                      <img
                        src={user.profile_picture}
                        alt="Foto de perfil"
                        className="w-full h-full rounded-full object-cover border-4 border-gray-700/50 shadow-lg transition-all duration-300 group-hover:border-blue-500/50"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "/default-avatar.png";
                        }}
                      />
                    ) : (
                      <div className="w-full h-full rounded-full border-4 border-gray-700/50 bg-gray-800/50 flex items-center justify-center shadow-lg group-hover:border-blue-500/50 transition-all duration-300">
                        <span className="text-gray-400 text-8xl group-hover:text-blue-500/50 transition-colors duration-300">{user.username.charAt(0).toUpperCase()}</span>
                      </div>
                    )}
                    {/* Overlay con botones (visible al hover) */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-full bg-black/50 backdrop-blur-sm">
                      <div className="flex flex-col space-y-3">
                        <label className="px-4 py-2 bg-blue-600/90 text-white rounded-lg cursor-pointer hover:bg-blue-500 transition-all duration-300 text-sm shadow-lg flex items-center space-x-2 transform hover:scale-105">
                          <FaCamera />
                          <span>Cambiar foto</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                (async () => {
                                  try {
                                    const t = ensureToken();
                                    const res = await userService.updateProfilePicture(userId, file, t);
                                    if (res.success) {
                                      const updatedUser = await userService.getUser({ user_id: userId }, t);
                                      if (updatedUser.success) {
                                        setUser(updatedUser.data);
                                        const img = document.querySelector('img[alt="Foto de perfil"]') as HTMLImageElement;
                                        if (img) {
                                          img.src = `${updatedUser.data.profile_picture}?t=${new Date().getTime()}`;
                                        }
                                      }
                                    } else {
                                      setNotification({ message: res.message || "Error al actualizar la foto de perfil", type: "error" });
                                    }
                                  } catch (err) {
                                    console.error("Error al actualizar foto de perfil:", err);
                                    setNotification({ message: (err instanceof Error) ? err.message : "Error al actualizar la foto de perfil", type: "error" });
                                  }
                                })();
                              }
                            }}
                          />
                        </label>
                        <button
                          onClick={() => {
                            (async () => {
                              try {
                                const t = ensureToken();
                                const res = await userService.deleteProfilePicture(userId, t);
                                if (res.success) {
                                  const updatedUser = await userService.getUser({ user_id: userId }, t);
                                  if (updatedUser.success) {
                                    setUser(updatedUser.data);
                                    const img = document.querySelector('img[alt="Foto de perfil"]') as HTMLImageElement;
                                    if (img) {
                                      img.src = "/default-avatar.png";
                                    }
                                  }
                                } else {
                                  setNotification({ message: res.message || "Error al eliminar la foto de perfil", type: "error" });
                                }
                              } catch (err) {
                                console.error("Error al eliminar foto de perfil:", err);
                                setNotification({ message: (err instanceof Error) ? err.message : "Error al eliminar la foto de perfil", type: "error" });
                              }
                            })();
                          }}
                          className="px-4 py-2 bg-red-600/90 text-white rounded-lg hover:bg-red-500 transition-all duration-300 text-sm shadow-lg flex items-center space-x-2 transform hover:scale-105"
                        >
                          <FaTimes />
                          <span>Eliminar foto</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Biografía */}
              <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-gray-800/50 h-2/5 flex flex-col transition-all duration-300 hover:border-gray-700">
                <h2 className="text-xl font-semibold mb-4 bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">Biografía</h2>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  className="w-full flex-1 px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent resize-none transition-all duration-300 placeholder-gray-500"
                  placeholder="Cuéntanos algo sobre ti..."
                />
              </div>
            </div>

            {/* Columna derecha - Información de la cuenta y acciones */}
            <div className="flex flex-col space-y-6 h-full">
              <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-gray-800/50 h-2/3 flex flex-col transition-all duration-300 hover:border-gray-700">
                <h2 className="text-xl font-semibold mb-6 bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">Información de la Cuenta</h2>
                <form onSubmit={handleSubmit} className="flex-1 flex flex-col space-y-6">
                  <div className="flex-1 flex flex-col space-y-6">
                    <div className="relative">
                    <label className="block text-sm font-medium mb-2 text-gray-300">Nombre de usuario</label>
                      <div className="relative">
                        <FaUser className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                          className="w-full pl-12 pr-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-300"
                      placeholder="Tu nombre de usuario"
                    />
                  </div>
                    </div>
                    <div className="relative">
                    <label className="block text-sm font-medium mb-2 text-gray-300">Correo electrónico</label>
                      <div className="relative">
                        <FaEnvelope className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                          className="w-full pl-12 pr-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-300"
                      placeholder="tu@email.com"
                    />
                  </div>
                    </div>
                    <div className="relative">
                    <label className="block text-sm font-medium mb-2 text-gray-300">Nueva Contraseña</label>
                      <div className="relative">
                        <FaLock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                          className="w-full pl-12 pr-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-300"
                      placeholder="••••••••"
                    />
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                      Debe tener al menos 8 caracteres, incluyendo una mayúscula, una minúscula, un número y un caracter especial (@$!%*?&.#)
                    </p>
                    </div>
                  </div>
                </form>
              </div>

              {/* Botones de acción */}
              <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-gray-800/50 h-1/3 flex flex-col transition-all duration-300 hover:border-gray-700">
                <h2 className="text-xl font-semibold mb-6 bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">Acciones de Cuenta</h2>
                <div className="flex-1 flex flex-col justify-center space-y-4">
                  <button
                    type="submit"
                    onClick={handleSubmit}
                    className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-500 hover:to-purple-500 transition-all duration-300 shadow-lg transform hover:scale-105 cursor-pointer flex items-center justify-center space-x-2"
                  >
                    <FaEdit />
                    <span>Guardar cambios</span>
                  </button>
                  <div className="flex space-x-4">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-500 hover:to-red-600 transition-all duration-300 shadow-lg transform hover:scale-105 flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      <FaSignOutAlt />
                      <span>Cerrar sesión</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteProfile}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-500 hover:to-red-600 transition-all duration-300 shadow-lg transform hover:scale-105 flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      <FaTrash />
                      <span>Eliminar cuenta</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modales */}
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

      {showCountdownModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-gray-900 p-6 rounded-lg shadow-lg text-center">
            <h2 className="text-2xl font-bold mb-4">Cambio exitoso</h2>
            <p className="text-xl mb-4">Serás redirigido a la página de login en {countdown} segundos...</p>
          </div>
        </div>
      )}
    </div>
  );
} 