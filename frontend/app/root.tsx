import {
    Links,
    Meta,
    Outlet,
    Scripts,
    ScrollRestoration,
    useLocation,
} from "react-router";
import { AuthProvider } from "./hooks/useAuth.tsx";
import { ThemeProvider } from './hooks/useTheme';
import ThemeToggle from './components/Shared/ThemeToggle';

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
    { tagName: "link", rel: "apple-touch-icon", href: "/icons/apple-touch-icon.png" },
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
        <html lang="es" className="h-full" suppressHydrationWarning>
            <head>
                <meta charSet="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <script dangerouslySetInnerHTML={{ __html: "try{document.documentElement.dataset.theme=localStorage.getItem('friendsgo-theme')==='dark'?'dark':'light'}catch{document.documentElement.dataset.theme='light'}" }} />
                <Meta />
                <Links />
            </head>
            <body className="min-h-full bg-page text-ink antialiased">
                <ThemeProvider>
                {isPublicRoute && location.pathname !== '/' && <ThemeToggle className="theme-toggle-floating" />}
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
                </ThemeProvider>
                <ScrollRestoration />
                <Scripts />
            </body>
        </html>
    );
}
