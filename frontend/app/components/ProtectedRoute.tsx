import { useNavigate, useLocation } from 'react-router';
import { useAuth } from '../hooks/useAuth';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Redirigir al login usando navigate en lugar de Navigate component
      navigate('/login', { 
        state: { from: location.pathname }, 
        replace: true 
      });
    }
  }, [isAuthenticated, isLoading, navigate, location.pathname]);

  // Mostrar loading mientras verificamos la autenticación
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  // Si no está autenticado, no renderizar nada mientras se redirige
  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
} 
