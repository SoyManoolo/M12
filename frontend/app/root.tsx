import './utils/fetchWithNgrok.client.ts';
import {
    Links,
    Meta,
    Outlet,
    Scripts,
    ScrollRestoration,
    useLocation,
} from "@remix-run/react";
import { AuthProvider } from "./hooks/useAuth.tsx";
import { useState, useEffect } from "react";
import { json } from "@remix-run/node";
import type { LoaderFunction } from "@remix-run/node";
import { ProtectedRoute } from "./components/ProtectedRoute";

import "./tailwind.css";
import "./styles/globals.css";

// Rutas públicas que no requieren autenticación
const publicRoutes = ['/login', '/signup', '/forgot-password'];

// Middleware para manejar rutas específicas
export const loader: LoaderFunction = async ({ request }) => {
    const url = new URL(request.url);

    // Si es una ruta de Chrome DevTools, devolver 200 OK
    if (url.pathname.includes("/.well-known/appspecific/com.chrome.devtools.json")) {
        return json({}, { status: 200 });
    }

    return null;
};

// Definir metadatos por defecto para la aplicación
export const meta = () => {
    return [
        { title: "FriendsGO" },
        { name: "description", content: "Una aplicación construida con Remix y Tailwind" },
        { name: "viewport", content: "width=device-width,initial-scale=1" },
    ];
};

// Componente raíz de la aplicación
export default function App() {
    const [mounted, setMounted] = useState(false);
    const location = useLocation();

    useEffect(() => {
        setMounted(true);
    }, []);

    const isPublicRoute = publicRoutes.includes(location.pathname);

    return (
        <html lang="es" className="h-full">
            <head>
                <meta charSet="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <Meta />
                <Links />
            </head>
            <body className="h-full">
                <AuthProvider>
                    {mounted ? (
                        isPublicRoute ? (
                            <Outlet />
                        ) : (
                            <ProtectedRoute>
                                <Outlet />
                            </ProtectedRoute>
                        )
                    ) : null}
                </AuthProvider>
                <ScrollRestoration />
                <Scripts />
            </body>
        </html>
    );
}
