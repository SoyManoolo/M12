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

interface UserProfileData {
    user_id: string;
    name: string;
    surname: string;
    username: string;
    email: string;
    profile_picture_url: string | null;
    bio: string | null;
    email_verified: boolean;
    is_moderator: boolean;
    deleted_at: string | null;
    created_at: string;
    updated_at: string;
    active_video_call: boolean;
}

interface UserProfileProps {
    userId?: string;
    username?: string;
    isOwnProfile: boolean;
    onEditProfile: () => void;
}

export default function UserProfile({ userId, username, isOwnProfile, onEditProfile }: UserProfileProps) {
    const [user, setUser] = useState<UserProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { token } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUserData = async () => {
            if (!token) {
                setError('No hay token de autenticación');
                setLoading(false);
                return;
            }

            try {
                let response;
                if (userId) {
                    response = await userService.getUserById(userId, token);
                } else if (username) {
                    response = await userService.getUserByUsername(username, token);
                } else {
                    throw new Error('Se requiere userId o username');
                }

                if (response.success && response.data) {
                    setUser(response.data);
                } else {
                    setError(response.message || 'Error al cargar el perfil');
                }
            } catch (err) {
                setError('Error al cargar el perfil');
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [userId, username, token]);

    const handleUpdateProfile = async (updateData: Partial<UserProfileData>) => {
        if (!token || !user) return;

        try {
            let response;
            if (userId) {
                response = await userService.updateUserById(userId, updateData, token);
            } else if (username) {
                response = await userService.updateUserByUsername(username, updateData, token);
            }

            if (response?.success && response.data) {
                setUser(response.data);
            } else {
                setError(response?.message || 'Error al actualizar el perfil');
            }
        } catch (err) {
            setError('Error al actualizar el perfil');
        }
    };

    const handleDeleteProfile = async () => {
        if (!token || !user) return;

        try {
            let response;
            if (userId) {
                response = await userService.deleteUserById(userId, token);
            } else if (username) {
                response = await userService.deleteUserByUsername(username, token);
            }

            if (response?.success) {
                // Redirigir al login o página principal
                window.location.href = '/login';
            } else {
                setError(response?.message || 'Error al eliminar el perfil');
            }
        } catch (err) {
            setError('Error al eliminar el perfil');
        }
    };

    const handleEditProfile = () => {
        navigate('/configuracion?section=cuenta');
    };

    if (loading) {
        return (
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                <div className="flex items-center justify-center h-32">
                    <p className="text-gray-400">Cargando perfil...</p>
                </div>
            </div>
        );
    }

    if (error || !user) {
        return (
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                <div className="flex items-center justify-center h-32">
                    <p className="text-red-500">{error || 'Error al cargar el perfil'}</p>
                </div>
            </div>
        );
    }

    return (
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
                                    onClick={handleEditProfile}
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
    );
} 