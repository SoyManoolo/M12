import { useAuth } from '~/hooks/useAuth';
import SearchUsers from '~/components/SearchUsers';

export default function SearchPage() {
    const { isAuthenticated } = useAuth();

    if (!isAuthenticated) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-gray-600">Por favor, inicia sesión para buscar usuarios.</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8">
            <h1 className="text-2xl font-bold text-center mb-8">Buscar Usuarios</h1>
            <SearchUsers />
        </div>
    );
} 