import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { useAuth } from '~/hooks/useAuth';

/** Evita mostrar pantallas administrativas a usuarios que no son moderadores. */
export function ProtectedAdminRoute({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <div className="min-h-screen bg-black" aria-busy="true" />;
  }

  if (!user.is_moderator) {
    return <Navigate to="/inicio" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
