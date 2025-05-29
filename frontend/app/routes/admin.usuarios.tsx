/**
 * Página de Administración de Usuarios
 * 
 * Esta página permite gestionar todos los usuarios de la aplicación.
 * Incluye:
 * - Lista de usuarios con opciones de edición y eliminación
 * - Filtros y búsqueda
 * - Gestión de roles y permisos
 */

import { useState, useEffect } from 'react';
import Navbar from '~/components/Inicio/Navbar';
import { FaSearch, FaEdit, FaTrash, FaFilter } from 'react-icons/fa';
import { userService } from '~/services/user.service';
import type { UserProfile, User } from '~/types/user.types';
import ConfirmModal from '~/components/Shared/ConfirmModal';
import Notification from '~/components/Shared/Notification';
import { useAuth } from '~/hooks/useAuth';
import { Link } from '@remix-run/react';

// El modal de edición espera UserProfile. Necesitaremos convertir User a UserProfile al abrir el modal.
interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  onSave: (userId: string, formData: any) => void;
  isLoading: boolean;
}

function EditUserModal({ isOpen, onClose, user, onSave, isLoading }: EditUserModalProps) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    name: '',
    surname: '',
    bio: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        name: user.name || '',
        surname: user.surname || '',
        bio: user.bio || ''
      });
    } else {
      setFormData({
        username: '',
        email: '',
        name: '',
        surname: '',
        bio: ''
      });
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (user) {
      onSave(user.user_id, formData);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-gray-900 rounded-lg shadow-2xl w-full max-w-md mx-4 p-6" onClick={e => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-white mb-6 text-center">Editar Usuario</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-300">Nombre de usuario</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-300">Correo electrónico</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-300">Nombre</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-300">Apellido</label>
            <input
              type="text"
              name="surname"
              value={formData.surname}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-300">Biografía</label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white resize-none min-h-[100px]"
            />
          </div>
          <div className="flex justify-end space-x-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              disabled={isLoading}
            >
              {isLoading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminUsuarios() {
  const { token } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'recent' | 'oldest' | 'admin'>('all');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);
  
  // userToEdit sigue siendo UserProfile | null porque el modal lo espera
  const [showEditModal, setShowEditModal] = useState(false);
  const [userToEdit, setUserToEdit] = useState<UserProfile | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = async () => {
    if (!token) {
      setError('Por favor, inicia sesión para ver los usuarios');
      setLoading(false);
      return;
    }

    try {
      const response = await userService.getAllUsersForAdmin(token);
      if (response.success) {
        setUsers(response.data.users);
        setFilteredUsers(response.data.users);
      } else {
        throw new Error(response.message || 'No pudimos cargar los usuarios');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar los usuarios');
    } finally {
      setLoading(false);
    }
  };

  // Efecto para cargar datos iniciales
  useEffect(() => {
    fetchData();
  }, [token]);

  // Efecto para filtrar y ordenar usuarios
  useEffect(() => {
    let filtered = [...users];

    // Aplicar filtro de búsqueda
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(user => 
        (user.username?.toLowerCase() || '').includes(query) ||
        (user.name?.toLowerCase() || '').includes(query) ||
        (user.email?.toLowerCase() || '').includes(query)
      );
    }

    // Aplicar filtro de administradores
    if (activeFilter === 'admin') {
      filtered = filtered.filter(user => user.is_moderator === true);
    }

    // Aplicar ordenamiento por fecha
    switch (activeFilter) {
      case 'recent':
        filtered.sort((a, b) => {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateB - dateA;
        });
        break;
      case 'oldest':
        filtered.sort((a, b) => {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateA - dateB;
        });
        break;
      default:
        // 'all' y 'admin' no requieren ordenamiento especial
        break;
    }

    setFilteredUsers(filtered);
  }, [searchQuery, users, activeFilter]);

  const handleDelete = (userId: string) => {
    setUserToDelete(userId);
    setShowDeleteModal(true);
  };

  // handleEdit ahora convierte User a UserProfile antes de establecer userToEdit
  const handleEdit = (user: User) => {
    // Mapear User a UserProfile, manejando las diferencias de tipo
    const userProfileForEdit: UserProfile = {
      user_id: user.user_id,
      username: user.username,
      email: user.email, // email existe en User
      name: user.name,
      surname: user.surname,
      bio: user.bio ?? undefined, // Convertir null a undefined si UserProfile lo espera así
      profile_picture: user.profile_picture ?? undefined, // Convertir null a undefined
      email_verified: user.email_verified,
      is_moderator: user.is_moderator,
      // id_deleted existe en UserProfile, pero no en User. Derivar o manejar.
      // Basado en la definición, UserProfile tiene id_deleted: boolean.
      // Si deleted_at (en User) no es null, el usuario está eliminado.
      id_deleted: user.deleted_at !== null,
      created_at: user.created_at,
      updated_at: user.updated_at,
      // active_video_call existe en User pero no en UserProfile - no se incluye en UserProfileForEdit
    };
    setUserToEdit(userProfileForEdit);
    setShowEditModal(true);
  };

  const handleSaveEdit = async (userId: string, formData: any) => {
    if (!token) {
      setNotification({ message: 'No autorizado', type: 'error' });
      return;
    }

    setIsSaving(true);
    try {
      // Solo enviamos los campos que han cambiado y no están vacíos (validación simplificada para admin)
      // Ahora buscamos en la lista de `users` (tipo User[]), pero comparamos con `userProfile` (UserProfile)
      const userOriginal = users.find(u => u.user_id === userId);
      // Si necesitas comparar con el userToEdit (UserProfile), usa ese objeto
      // const userProfileEdited = userToEdit; // Si userToEdit ya está actualizado con los cambios del modal

      const requestBody: Record<string, string | undefined> = {}; // Allow undefined for removal?

      // Comparamos con el usuario original (tipo User) para ver qué ha cambiado
      if (formData.username && formData.username !== userOriginal?.username) requestBody.username = formData.username.trim();
      if (formData.email && formData.email !== userOriginal?.email) requestBody.email = formData.email.trim();
      if (formData.name && formData.name !== userOriginal?.name) requestBody.name = formData.name.trim();
      if (formData.surname && formData.surname !== userOriginal?.surname) requestBody.surname = formData.surname.trim();

      // Para bio, si el formulario está vacío y el original no era null, enviamos vacío para borrarla
      // Si el formulario no está vacío y es diferente, enviamos el nuevo valor
      if (formData.bio !== userOriginal?.bio) {
           if (formData.bio?.trim() === '') {
               // Si el formulario está vacío y la bio original no era nula, enviamos null o vacío para borrarla
               // Asumimos que enviar una cadena vacía en el body la borrará en el backend
              requestBody.bio = ''; // Enviar cadena vacía para indicar borrado
           } else if (formData.bio !== undefined) { // Si no está vacío y no es undefined
               requestBody.bio = formData.bio.trim();
           }
           // Si formData.bio es undefined, significa que el campo no estaba en el formulario (no se tocó), no hacemos nada.
      }

      // Eliminar campos con undefined si tu API espera que no estén presentes
      Object.keys(requestBody).forEach(key => requestBody[key] === undefined && delete requestBody[key]);

      if (Object.keys(requestBody).length === 0) {
        setNotification({ message: 'No hay cambios válidos para actualizar', type: 'error' });
        setIsSaving(false);
        setShowEditModal(false);
        return;
      }

      const response = await userService.updateUserById(userId, requestBody, token);
      if (response.success) {
        setNotification({ message: 'Usuario actualizado correctamente', type: 'success' });
        fetchData(); // Refrescar la lista completa
        setShowEditModal(false);
      } else {
        setNotification({ message: response.message || 'Error al actualizar usuario', type: 'error' });
      }
    } catch (error) {
      console.error('Error al guardar edición:', error);
      setNotification({ message: 'Error al guardar cambios', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!token || !userToDelete) {
      setNotification({ message: 'No autorizado o usuario no seleccionado', type: 'error' });
      return;
    }

    try {
      // Asegurarse de que estamos eliminando el usuario correcto
      await userService.deleteUserById(userToDelete, token);
      setNotification({ message: 'Usuario eliminado correctamente', type: 'success' });
      // Filtrar la lista local para remover el usuario eliminado (lista de tipo User[])
      setUsers(prevUsers => prevUsers.filter(user => user.user_id !== userToDelete));
      setShowDeleteModal(false);
      setUserToDelete(null);
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      setNotification({ message: 'Error al eliminar usuario', type: 'error' });
    }
  };

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
              <p className="text-gray-400 mt-2">Administra y modera los usuarios de la plataforma</p>
            </div>
            
            {/* Barra de búsqueda */}
            <div className="relative w-96">
              <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, usuario o email..."
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
              <button 
                onClick={() => setActiveFilter('all')}
                className={`px-4 py-2 rounded-lg transition-colors cursor-pointer ${
                  activeFilter === 'all' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-800 text-white hover:bg-gray-700'
                }`}
              >
                Todas
              </button>
              <button 
                onClick={() => setActiveFilter('admin')}
                className={`px-4 py-2 rounded-lg transition-colors cursor-pointer ${
                  activeFilter === 'admin' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-800 text-white hover:bg-gray-700'
                }`}
              >
                Administrador
              </button>
              <button 
                onClick={() => setActiveFilter('recent')}
                className={`px-4 py-2 rounded-lg transition-colors cursor-pointer ${
                  activeFilter === 'recent' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-800 text-white hover:bg-gray-700'
                }`}
              >
                Nuevos
              </button>
              <button 
                onClick={() => setActiveFilter('oldest')}
                className={`px-4 py-2 rounded-lg transition-colors cursor-pointer ${
                  activeFilter === 'oldest' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-800 text-white hover:bg-gray-700'
                }`}
              >
                Antiguos
              </button>
            </div>
          </div>

          {/* Lista de usuarios */}
          <div className="space-y-4">
            {error ? (
              <div className="bg-red-500/10 text-red-500 p-4 rounded-lg">
                {error}
              </div>
            ) : loading && filteredUsers.length === 0 ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center text-gray-500">
                {searchQuery ? 'No se encontraron usuarios' : 'No hay usuarios para mostrar'}
              </div>
            ) : (
              filteredUsers.map((user) => (
                <div key={user.user_id} className="bg-gray-900 rounded-lg p-4 border border-gray-800 hover:border-blue-500 transition-colors">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                      <Link 
                        to={`/perfil?username=${user.username}`}
                        className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity"
                      >
                        {user.profile_picture ? (
                          <img
                            src={user.profile_picture}
                            alt="Usuario"
                            className="w-10 h-10 rounded-full object-cover border border-gray-800"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = "/default-avatar.png";
                            }}
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full border border-gray-800 bg-gray-800 flex items-center justify-center">
                            <span className="text-gray-400 text-sm">{user.username.charAt(0).toUpperCase()}</span>
                          </div>
                        )}
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold text-sm">{user.username}</h3>
                            <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-500 rounded-full text-xs">
                              {user.is_moderator ? 'Moderador' : 'Usuario'}
                            </span>
                            {user.deleted_at === null && (
                              <span className="px-1.5 py-0.5 bg-green-500/10 text-green-500 rounded-full text-xs">
                                Activo
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400">{user.name} {user.surname}</p>
                          <p className="text-xs text-gray-400">{user.email}</p>
                        </div>
                      </Link>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-xs text-gray-400">
                        <p>Registro: {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</p>
                        {user.deleted_at !== null && user.deleted_at !== undefined && (
                          <p>Eliminado: {new Date(user.deleted_at).toLocaleDateString()}</p>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="p-2.5 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors cursor-pointer"
                          title="Editar usuario"
                        >
                          <FaEdit className="text-base" />
                        </button>
                        <button
                          onClick={() => handleDelete(user.user_id)}
                          className="p-2.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                          title="Eliminar usuario"
                        >
                          <FaTrash className="text-base" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modales */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Eliminar usuario"
        message={`¿Estás seguro de que quieres eliminar al usuario ${userToDelete}? Esta acción es irreversible y perderá todo su contenido.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
      />

      <EditUserModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        user={userToEdit}
        onSave={handleSaveEdit}
        isLoading={isSaving}
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