import {
    Links,
    Meta,
    Outlet,
    Scripts,
    ScrollRestoration,
    useLocation,
} from "@remix-run/react";
import { AuthProvider } from "./hooks/useAuth.tsx";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ClientOnly } from "./components/ClientOnly.tsx"; // 👈 Nueva importación

import "./tailwind.css";
import "./styles/globals.css";

// Rutas públicas que no requieren autenticación
const publicRoutes = ['/login', '/signup', '/forgot-password'];

export default function App() {
    const location = useLocation();

    // NOTA: isPublicRoute se calcula fuera de ClientOnly porque depende de useLocation,
    // que es seguro en SSR.
    const isPublicRoute = publicRoutes.includes(location.pathname); 
    
    // Si la ruta es pública, renderiza el AuthProvider y Outlet inmediatamente.
    // Esto es NECESARIO porque AuthProvider contiene el fallo TDZ.
    // Si la ruta es PROTEGIDA, envolvemos TODO lo que depende de AuthProvider/ProtectedRoute
    // dentro de ClientOnly.

    return (
        <html lang="es" className="h-full">
            <head>
                {/* ... Meta y Links ... */}
            </head>
            <body className="h-full">
                <AuthProvider> 
                    {/* AuthProvider sigue aquí porque necesitamos el token, pero su contenido lo aislamos */}
                    {isPublicRoute ? (
                        <Outlet /> // Rutas públicas no necesitan protección
                    ) : (
                        <ClientOnly> 
                            {/* Solo se monta en el cliente, después de la inicialización de React */}
                            <ProtectedRoute> 
                                <Outlet />
                            </ProtectedRoute>
                        </ClientOnly>
                    )}
                </AuthProvider>
                <ScrollRestoration />
                <Scripts />
            </body>
        </html>
    );
}