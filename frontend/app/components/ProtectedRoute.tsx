import { useNavigate, useLocation } from '@remix-run/react';
import { useAuth } from '../hooks/useAuth';
import { useEffect, useState } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, token } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Dar un pequeño tiempo para que el token se cargue desde localStorage
    const timer = setTimeout(() => {
      setIsChecking(false);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isChecking && !isAuthenticated && !token) {
      console.log('❌ No autenticado, redirigiendo a login desde:', location.pathname);
      // Redirigir al login usando navigate en lugar de Navigate component
      navigate('/login', { 
        state: { from: location.pathname }, 
        replace: true 
      });
    }
  }, [isAuthenticated, token, isChecking, navigate, location.pathname]);

  // Mostrar loading mientras verificamos la autenticación
  if (isChecking) {
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
  if (!isAuthenticated || !token) {
    return null;
  }

  return <>{children}</>;
} 