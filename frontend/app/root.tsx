import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import { AuthProvider } from "./hooks/useAuth.tsx";
import { useState, useEffect } from "react";

import "./tailwind.css";

// Definir metadatos por defecto para la aplicación
export const meta = () => {
  return [
    { title: "FriendsGO" },
    { name: "description", content: "Una aplicación construida con Remix y Tailwind" },
    { name: "viewport", content: "width=device-width,initial-scale=1" },
  ];
};

// Componente Layout que proporciona la estructura HTML base
export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="h-full">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

// Componente raíz de la aplicación
export default function App() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <AuthProvider>
      {mounted ? <Outlet /> : null}
    </AuthProvider>
  );
}
