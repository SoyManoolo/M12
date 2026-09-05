import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from 'path';

const root = process.cwd();

export default defineConfig(({ mode }) => {

  // Carga las variables de entorno que empiezan por VITE_ desde el archivo .env
  const env = loadEnv(mode, root, 'VITE_');

  // Utiliza la variable VITE_API_URL, con un fallback seguro si no está definida
  // **Asegúrate de que VITE_API_URL incluye el protocolo (https://)**
  const RAILWAY_API_URL = env.VITE_API_URL || 'http://localhost:8080';

  return { // 👈 Se retorna el objeto de configuración, solucionando el error.
    plugins: [
      reactRouter(),
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
            // Solo aplicar manual chunks para el build del cliente (no SSR)
            if (!id.includes('node_modules')) return;

            // React y sus dependencias core
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react';
            }

            // Remix y router (solo en cliente, no en SSR)
            if (id.includes('@react-router') || id.includes('react-router')) {
              return 'vendor-remix';
            }

            // Socket.IO y WebRTC
            if (id.includes('socket.io-client')) {
              return 'vendor-realtime';
            }

            // Utilidades de fecha
            if (id.includes('date-fns')) {
              return 'vendor-date';
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
      include: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'date-fns'
      ],
      exclude: [
        'react-router'
      ],
      esbuildOptions: {
        target: 'esnext'
      }
    },
  };
});
