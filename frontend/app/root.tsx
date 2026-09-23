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
import { ProtectedAdminRoute } from "./components/ProtectedAdminRoute";
import CallInvitationListener from "./components/Videollamada/CallInvitationListener";

import "./tailwind.css";
import "./styles/globals.css";

export const meta = () => [
    { "charSet": "utf-8" },
    { name: "viewport", content: "width=device-width, initial-scale=1" },
    { tagName: "link", rel: "icon", href: "/favicon.ico" },
    { tagName: "link", rel: "icon", type: "image/svg+xml", href: "/images/friendsgo-mark.svg" },
    { tagName: "link", rel: "manifest", href: "/manifest.webmanifest" },
    { title: "FriendsGo" },
    { name: "description", content: "Conecta y comparte con tus amigos." },
    { name: "robots", content: "noindex, nofollow" },
];

// Rutas públicas que no requieren autenticación
const publicRoutes = ['/', '/login', '/signup', '/forgot-password', '/reset-password'];

// Componente raíz de la aplicación
export default function App() {
    const location = useLocation(); // SE MANTIENE

    const isPublicRoute = publicRoutes.includes(location.pathname);

    return (
        <html lang="es" className="h-full">
            <head>
                <Meta />
                <Links />
            </head>
            <body className="min-h-full bg-black text-white antialiased">
                <AuthProvider>
                    <CallInvitationListener />
                    {/* El contenido se renderiza SIEMPRE, tanto en SSR como en Cliente */}
                    {isPublicRoute ? (
                        <Outlet />
                    ) : location.pathname.startsWith('/admin') ? (
                        <ProtectedRoute>
                            <ProtectedAdminRoute>
                                <Outlet />
                            </ProtectedAdminRoute>
                        </ProtectedRoute>
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
