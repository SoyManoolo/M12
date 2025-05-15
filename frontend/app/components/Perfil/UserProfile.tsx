/**
 * Componente UserProfile
 * 
 * Este componente muestra la información principal del perfil de usuario.
 * Incluye:
 * - Foto de perfil
 * - Nombre completo
 * - Nombre de usuario
 * - Biografía
 * 
 * @module UserProfile
 * @requires react
 */

import { useEffect, useState } from 'react';
import { FaEdit } from 'react-icons/fa';
import { userService } from '../../services/user.service';
import { useAuth } from '../../hooks/useAuth.tsx';
import { useNavigate } from 'react-router-dom';
import type { User } from '~/types/user.types';

interface UserProfileProps {
    user?: User;
    userId?: string;
    username?: string;
    isOwnProfile: boolean;
    onEditProfile?: () => void;
}

export default function UserProfile({ user, isOwnProfile, onEditProfile }: UserProfileProps) {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const handleDeleteProfile = async () => {
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!token || !user) return;

        try {
            const response = await userService.deleteUserById(user.user_id, token);
            if (response?.success) {
                window.location.href = '/login';
            } else {
                setError(response?.message || 'Error al eliminar el perfil');
            }
        } catch (err) {
            setError('Error al eliminar el perfil');
        }
        setShowDeleteModal(false);
    };

    if (error) {
        return (
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                <div className="flex items-center justify-center h-32">
                    <p className="text-red-500">{error}</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                <div className="flex items-center justify-center h-32">
                    <p className="text-gray-400">Cargando perfil...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                <div className="flex items-start space-x-6">
                    {/* Foto de perfil */}
                    <div className="relative">
                        {user.profile_picture_url ? (
                            <img
                                src={user.profile_picture_url}
                                alt={`${user.username} profile`}
                                className="w-32 h-32 rounded-full object-cover border-4 border-gray-800"
                            />
                        ) : (
                            <div className="w-32 h-32 rounded-full border-4 border-gray-800 bg-gray-800 flex items-center justify-center">
                                <span className="text-gray-400 text-sm text-center px-2">Sin foto de perfil</span>
                            </div>
                        )}
                    </div>

                    {/* Información del usuario */}
                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h1 className="text-2xl font-bold text-white">
                                    {user.name} {user.surname}
                                </h1>
                                <p className="text-gray-400">@{user.username}</p>
                            </div>
                            
                            {isOwnProfile && (
                                <div className="flex space-x-2">
                                    <button
                                        onClick={onEditProfile}
                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center space-x-2 transition-colors"
                                    >
                                        <FaEdit />
                                        <span>Editar perfil</span>
                                    </button>
                                    <button
                                        onClick={handleDeleteProfile}
                                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                                    >
                                        Eliminar cuenta
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Biografía */}
                        <div className="mt-4">
                            <p className="text-gray-300 whitespace-pre-wrap">
                                {user.bio || "Sin biografía"}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal de confirmación de eliminación */}
            {showDeleteModal && (
                <div className="fixed inset-0 flex items-center justify-center z-50">
                    <div className="bg-gray-900 rounded-xl p-6 max-w-sm mx-auto border border-gray-800 shadow-lg">
                        <h3 className="text-xl font-semibold text-white mb-4">¿Estás seguro?</h3>
                        <p className="text-gray-300 mb-6">¿Estás seguro de que quieres eliminar tu cuenta? Esta acción no se puede deshacer.</p>
                        <div className="flex justify-end space-x-4">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="px-4 py-2 text-gray-300 hover:text-white rounded-lg cursor-pointer transition-colors duration-200"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 cursor-pointer transition-colors duration-200"
                            >
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
} 