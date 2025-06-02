import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { vitePlugin as remix } from "@remix-run/dev";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from 'path';

declare module "@remix-run/node" {
  interface Future {
    v3_singleFetch: true;
  }
}

export default defineConfig({
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
      '39e1-37-133-29-123.ngrok-free.app',
    ],
    watch: {
      usePolling: false,
      interval: 1000,
    },
    proxy: {
      '/api': {
        target: 'https://332f-37-133-29-123.ngrok-free.app',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '')
      },
      '/media': {
        target: 'https://332f-37-133-29-123.ngrok-free.app',
        changeOrigin: true,
        secure: false,
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
});
