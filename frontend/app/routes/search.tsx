import { useAuth } from '~/hooks/useAuth';
import SearchUsers from '~/components/SearchUsers';

export default function SearchPage() {
    const { isAuthenticated } = useAuth();

    if (!isAuthenticated) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-black px-4 text-white">
                <p className="text-gray-600">Por favor, inicia sesión para buscar usuarios.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black px-4 py-8 text-white">
          <div className="mx-auto max-w-2xl">
            <h1 className="text-2xl font-bold text-center mb-8">Buscar Usuarios</h1>
            <SearchUsers />
          </div>
        </div>
    );
} 
