import { useNavigate, useLocation } from '@remix-run/react';
import { useAuth } from '../hooks/useAuth';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      // Redirigir al login usando navigate en lugar de Navigate component
      navigate('/login', { 
        state: { from: location.pathname }, 
        replace: true 
      });
    }
  }, [isAuthenticated, navigate, location.pathname]);

  // Si no está autenticado, no renderizar nada mientras se redirige
  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
} 