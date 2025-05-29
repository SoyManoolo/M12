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
import { FaEdit, FaCamera, FaTimes } from 'react-icons/fa';
import { userService } from '../../services/user.service';
import { useAuth } from '../../hooks/useAuth.tsx';
import { useNavigate } from 'react-router-dom';
import type { User } from '~/types/user.types';
import ImageZoomModal from '../Shared/ImageZoomModal';
import Notification from '../Shared/Notification';

interface UserProfileProps {
    user?: User;
    userId?: string;
    username?: string;
    isOwnProfile: boolean;
    onEditProfile?: () => void;
}

export default function UserProfile({ user, isOwnProfile, onEditProfile }: UserProfileProps) {
    const { token } = useAuth();
    const [showZoomModal, setShowZoomModal] = useState(false);
    const [isHovering, setIsHovering] = useState(false);
    const [notification, setNotification] = useState<{
        message: string;
        type: 'success' | 'error';
    } | null>(null);

    if (!user) return null;

    const handleProfilePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !token || !user.user_id) return;

        try {
            const response = await userService.updateProfilePicture(user.user_id, file, token);
            if (response.success) {
                const updatedUser = await userService.getUser({ user_id: user.user_id }, token);
                if (updatedUser.success) {
                    // Actualizar la imagen en el DOM
                    const img = document.querySelector(`img[alt="${user.username} profile"]`) as HTMLImageElement;
                    if (img) {
                        img.src = `${updatedUser.data.profile_picture}?t=${new Date().getTime()}`;
                    }
                    setNotification({
                        message: 'Foto de perfil actualizada correctamente',
                        type: 'success'
                    });
                }
            } else {
                setNotification({
                    message: response.message || 'Error al actualizar la foto de perfil',
                    type: 'error'
                });
            }
        } catch (error) {
            console.error('Error al actualizar foto de perfil:', error);
            setNotification({
                message: error instanceof Error ? error.message : 'Error al actualizar la foto de perfil',
                type: 'error'
            });
        }
    };

    const handleDeleteProfilePicture = async () => {
        if (!token || !user.user_id) return;

        try {
            const response = await userService.deleteProfilePicture(user.user_id, token);
            if (response.success) {
                const updatedUser = await userService.getUser({ user_id: user.user_id }, token);
                if (updatedUser.success) {
                    // Actualizar la imagen en el DOM
                    const img = document.querySelector(`img[alt="${user.username} profile"]`) as HTMLImageElement;
                    if (img) {
                        img.src = '/default-avatar.png';
                    }
                    setNotification({
                        message: 'Foto de perfil eliminada correctamente',
                        type: 'success'
                    });
                }
            } else {
                setNotification({
                    message: response.message || 'Error al eliminar la foto de perfil',
                    type: 'error'
                });
            }
        } catch (error) {
            console.error('Error al eliminar foto de perfil:', error);
            setNotification({
                message: error instanceof Error ? error.message : 'Error al eliminar la foto de perfil',
                type: 'error'
            });
        }
    };

    return (
        <>
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                <div className="flex items-start space-x-6">
                    {/* Foto de perfil con efecto hover */}
                    <div 
                        className="relative group"
                        onMouseEnter={() => setIsHovering(true)}
                        onMouseLeave={() => setIsHovering(false)}
                    >
                        {user.profile_picture ? (
                            <img
                                src={user.profile_picture}
                                alt={`${user.username} profile`}
                                className="w-40 h-40 rounded-full object-cover border-4 border-gray-800 cursor-pointer transition-all duration-300 group-hover:border-blue-500/50 group-hover:scale-105"
                                onClick={() => setShowZoomModal(true)}
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = "/default-avatar.png";
                                }}
                            />
                        ) : (
                            <div className="w-40 h-40 rounded-full border-4 border-gray-800 bg-gray-800 flex items-center justify-center cursor-pointer transition-all duration-300 group-hover:border-blue-500/50 group-hover:scale-105">
                                <span className="text-gray-400 text-6xl group-hover:text-blue-500/50 transition-colors duration-300">
                                    {user.username.charAt(0).toUpperCase()}
                                </span>
                            </div>
                        )}
                        {/* Overlay con botones al hover */}
                        {isOwnProfile && isHovering && (
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-full bg-black/50 backdrop-blur-sm">
                                <div className="flex flex-col space-y-2">
                                    <label className="px-3 py-1.5 bg-blue-600/90 text-white rounded-lg cursor-pointer hover:bg-blue-500 transition-all duration-300 text-xs shadow-lg flex items-center space-x-1.5 transform hover:scale-105">
                                        <FaCamera className="text-xs" />
                                        <span>Cambiar foto</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleProfilePictureChange}
                                        />
                                    </label>
                                    {user.profile_picture && (
                                        <button
                                            onClick={handleDeleteProfilePicture}
                                            className="px-3 py-1.5 bg-red-600/90 text-white rounded-lg hover:bg-red-500 transition-all duration-300 text-xs shadow-lg flex items-center space-x-1.5 transform hover:scale-105"
                                        >
                                            <FaTimes className="text-xs" />
                                            <span>Eliminar foto</span>
                                        </button>
                                    )}
                                </div>
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
                                <button
                                    onClick={onEditProfile}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center space-x-2 transition-colors"
                                >
                                    <FaEdit />
                                    <span>Editar perfil</span>
                                </button>
                            )}
                        </div>

                        {/* Biografía simple */}
                        <p className="text-gray-300 whitespace-pre-wrap">
                            {user.bio || "Sin biografía"}
                        </p>
                    </div>
                </div>
            </div>

            {/* Modal de zoom para la imagen de perfil */}
            {user.profile_picture && (
                <ImageZoomModal
                    isOpen={showZoomModal}
                    onClose={() => setShowZoomModal(false)}
                    imageUrl={user.profile_picture}
                    alt={`Foto de perfil de ${user.username}`}
                />
            )}

            {/* Notificación */}
            {notification && (
                <Notification
                    message={notification.message}
                    type={notification.type}
                    onClose={() => setNotification(null)}
                />
            )}
        </>
    );
} 