import {
    Links,
    Meta,
    Outlet,
    Scripts,
    ScrollRestoration,
    useLocation,
} from "react-router";
import { AuthProvider } from "./hooks/useAuth.tsx";

import { ProtectedRoute } from "./components/ProtectedRoute";

import "./tailwind.css";
import "./styles/globals.css";

// Rutas públicas que no requieren autenticación
const publicRoutes = ['/login', '/signup', '/forgot-password'];

// ... (loader y meta se quedan igual)

// Componente raíz de la aplicación
export default function App() {
    const location = useLocation(); // SE MANTIENE

    const isPublicRoute = publicRoutes.includes(location.pathname);

    return (
        <html lang="es" className="h-full">
            <head>
                <meta charSet="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <Meta />
                <Links />
            </head>
            <body className="min-h-full bg-black text-white antialiased">
                <AuthProvider>
                    {/* El contenido se renderiza SIEMPRE, tanto en SSR como en Cliente */}
                    {isPublicRoute ? (
                        <Outlet />
                    ) : (
                        <ProtectedRoute>
                            <Outlet />
                        </ProtectedRoute>
                    )}
                </AuthProvider>
                <ScrollRestoration />
                <Scripts />
            </body>
        </html>
    );
}
