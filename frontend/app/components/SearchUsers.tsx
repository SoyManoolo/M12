import { useState } from 'react';
import { useNavigate } from '@remix-run/react';
import { userService } from '~/services/user.service';
import { useAuth } from '~/hooks/useAuth';
import type { User } from '~/types/user.types';

export default function SearchUsers() {
    const [searchTerm, setSearchTerm] = useState('');
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { token } = useAuth();
    const navigate = useNavigate();

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault(); // Prevenir el comportamiento por defecto del formulario
        if (!searchTerm.trim() || !token) return;

        setIsLoading(true);
        setError(null);
        try {
            const response = await userService.searchUsers(searchTerm, token);
            if (response.success) {
                setUsers(response.data);
            } else {
                setError(response.message);
                setUsers([]);
            }
        } catch (err) {
            setError('Error al buscar usuarios');
            setUsers([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUserClick = (userId: string) => {
        navigate(`/profile/${userId}`);
    };

    return (
        <div className="w-full max-w-2xl mx-auto p-4">
            <form onSubmit={handleSearch} className="relative">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar usuarios... (presiona Enter)"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                        type="submit"
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                        Buscar
                    </button>
                </div>
                {isLoading && (
                    <div className="absolute right-3 top-2">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                    </div>
                )}
            </form>

            {error && (
                <div className="mt-2 text-red-500 text-sm">
                    {error}
                </div>
            )}

            <div className="mt-4 space-y-2">
                {users.map((user) => (
                    <div
                        key={user.user_id}
                        onClick={() => handleUserClick(user.user_id)}
                        className="flex items-center space-x-3 p-3 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
                    >
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200">
                            {user.profile_picture ? (
                                <img
                                    src={user.profile_picture}
                                    alt={`${user.name}'s profile`}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-300 text-gray-600">
                                    {user.name.charAt(0)}
                                </div>
                            )}
                        </div>
                        <div>
                            <h3 className="font-medium text-gray-900">{user.name} {user.surname}</h3>
                            <p className="text-sm text-gray-500">@{user.username}</p>
                        </div>
                    </div>
                ))}
                {searchTerm && !isLoading && users.length === 0 && !error && (
                    <div className="text-center text-gray-500 py-4">
                        No se encontraron usuarios
                    </div>
                )}
            </div>
        </div>
    );
} 