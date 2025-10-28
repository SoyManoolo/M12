import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { vitePlugin as remix } from "@remix-run/dev";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from 'path';

const root = process.cwd();

declare module "@remix-run/node" {
  interface Future {
    v3_singleFetch: true;
  }
}

export default defineConfig(({ mode }) => {

  // Carga las variables de entorno que empiezan por VITE_ desde el archivo .env
  const env = loadEnv(mode, root, 'VITE_');

  // Utiliza la variable VITE_API_URL, con un fallback seguro si no está definida
  // **Asegúrate de que VITE_API_URL incluye el protocolo (https://)**
  const RAILWAY_API_URL = env.VITE_API_URL || 'http://localhost:8080';

  return { // 👈 Se retorna el objeto de configuración, solucionando el error.
    plugins: [
      remix({
        future: {
          v3_fetcherPersist: true,
          v3_relativeSplatPath: true,
          v3_throwAbortReason: true,
          v3_singleFetch: true,
          v3_lazyRouteDiscovery: true,
        },
      }),
      react({
        jsxRuntime: 'automatic',
        babel: {
          plugins: [
            ['@babel/plugin-transform-react-jsx', { runtime: 'automatic' }]
          ]
        }
      }),
      tsconfigPaths(),
      tailwindcss()
    ],
    server: {
      host: true,
      hmr: false,
      allowedHosts: [
        'localhost',
        '127.0.0.1',
      ],
      watch: {
        usePolling: false,
        interval: 1000,
      },
      proxy: {
        // El proxy de desarrollo apunta a la variable segura
        '/api': {
          target: RAILWAY_API_URL,
          changeOrigin: true,
          secure: false, // Puedes cambiar a true si RAILWAY_API_URL es HTTPS
          rewrite: (path) => path.replace(/^\/api/, '')
        },
        // El proxy de media también apunta a la variable segura
        '/media': {
          target: RAILWAY_API_URL,
          changeOrigin: true,
          secure: false, // Puedes cambiar a true si RAILWAY_API_URL es HTTPS
          ws: true,
          headers: {
            'Access-Control-Allow-Origin': '*'
          }
        }
      }
    },
    build: {
      target: 'esnext',
      minify: 'terser',
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('react/') || id.includes('react-dom/')) {
                return 'vendor-react';
              }
              return 'vendor';
            }
          }
        }
      }
    },
    resolve: {
      alias: {
        '~': resolve(__dirname, './app'),
      },
    },
    publicDir: 'public',
    optimizeDeps: {
      include: ['react', 'react-dom'],
      exclude: ['@remix-run/react']
    },
  };
});