import type { ReactNode } from 'react';
import Navbar from '~/components/Inicio/Navbar';

interface AppLayoutProps {
  children: ReactNode;
  rightPanel?: ReactNode;
  mainClassName?: string;
}

/**
 * Estructura común para las rutas autenticadas.
 * La navegación ocupa una columna fija en escritorio y deja espacio para las
 * barras móviles. El panel derecho solo se muestra cuando hay ancho suficiente.
 */
export default function AppLayout({ children, rightPanel, mainClassName = '' }: AppLayoutProps) {
  return (
    <div className="min-h-screen overflow-x-clip bg-black text-white">
      <Navbar />
      <div className="min-h-screen pt-16 pb-16 lg:ml-[16.666667%] lg:pt-0 lg:pb-0">
        <div className="mx-auto flex min-h-screen min-w-0 w-full max-w-[1920px]">
          <main className={`min-w-0 flex-1 ${mainClassName}`}>{children}</main>
          {rightPanel && (
            <aside className="hidden w-[370px] shrink-0 border-l border-gray-800 xl:block">
              {rightPanel}
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
