import { useState } from 'react';
import { useNavigate } from 'react-router';
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
        } catch {
            setError('Error al buscar usuarios');
            setUsers([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUserClick = (username: string) => {
        navigate(`/perfil?username=${encodeURIComponent(username)}`);
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
                        className="w-full rounded-lg border border-line bg-surface px-4 py-2 text-ink placeholder-muted focus:border-transparent focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                        type="submit"
                        className="px-4 py-2 bg-primary-hover text-white rounded-lg hover:bg-primary transition-colors"
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
                    <button
                        type="button"
                        key={user.user_id}
                        onClick={() => handleUserClick(user.username)}
                        className="flex w-full items-center space-x-3 rounded-lg p-3 text-left transition-colors hover:bg-soft"
                    >
                        <div className="h-10 w-10 overflow-hidden rounded-full bg-soft">
                            {user.profile_picture ? (
                                <img
                                    src={user.profile_picture}
                                    alt={`${user.name}'s profile`}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center bg-hover text-copy">
                                    {user.name.charAt(0)}
                                </div>
                            )}
                        </div>
                        <div>
                            <h3 className="font-medium text-ink">{user.name} {user.surname}</h3>
                            <p className="text-sm text-muted">@{user.username}</p>
                        </div>
                    </button>
                ))}
                {searchTerm && !isLoading && users.length === 0 && !error && (
                    <div className="py-4 text-center text-muted">
                        No se encontraron usuarios
                    </div>
                )}
            </div>
        </div>
    );
}
