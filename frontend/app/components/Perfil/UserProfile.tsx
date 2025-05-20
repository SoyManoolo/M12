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
import ImageZoomModal from '../Shared/ImageZoomModal';

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

    if (!user) return null;

    return (
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <div className="flex items-start space-x-6">
                {/* Foto de perfil */}
                <div className="relative">
                    {user.profile_picture ? (
                        <img
                            src={user.profile_picture}
                            alt={`${user.username} profile`}
                            className="w-32 h-32 rounded-full object-cover border-4 border-gray-800 cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => setShowZoomModal(true)}
                            onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = "/default-avatar.png";
                            }}
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
                            <button
                                onClick={onEditProfile}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center space-x-2 transition-colors"
                            >
                                <FaEdit />
                                <span>Editar perfil</span>
                            </button>
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

            {/* Modal de zoom para la imagen de perfil */}
            {user.profile_picture && (
                <ImageZoomModal
                    isOpen={showZoomModal}
                    onClose={() => setShowZoomModal(false)}
                    imageUrl={user.profile_picture}
                    alt={`Foto de perfil de ${user.username}`}
                />
            )}
        </div>
    );
} 