# M12 - Frontend Architecture
Desarrollo del proyecto final de curso

## Arquitectura y Stack Tecnológico

### Stack Tecnológico Principal
- **Framework**: React 18.x
- **Lenguaje**: TypeScript 5.x
- **Bundler**: Vite 5.x
- **Estilos**: Tailwind CSS 3.x
- **Linting**: ESLint 8.x
- **Formateo**: Prettier
- **Optimización**: SWC (Rust-based compiler)

### Configuración del Proyecto
- **TypeScript Configuration**
  - `tsconfig.json`: Configuración base
  - `tsconfig.app.json`: Configuración específica para la aplicación
  - `tsconfig.node.json`: Configuración para Node.js
- **Build Configuration**
  - `vite.config.ts`: Configuración de Vite
  - `tailwind.config.ts`: Configuración de Tailwind CSS
- **Code Quality**
  - `.eslintrc.cjs`: Reglas de linting
  - `eslint.config.js`: Configuración extendida de ESLint

### Estructura de Directorios
```
/app
├── components/         # Componentes reutilizables
├── routes/            # Configuración de rutas y páginas
├── services/          # Servicios API y lógica de negocio
├── styles/            # Estilos globales y módulos CSS
├── types/             # Definiciones de tipos TypeScript
├── config/            # Configuraciones de la aplicación
├── assets/            # Recursos estáticos (imágenes, fuentes)
├── entry.client.tsx   # Punto de entrada del cliente
├── entry.server.tsx   # Punto de entrada del servidor
└── root.tsx           # Componente raíz de la aplicación
```

### Arquitectura de la Aplicación
- **Client-Side Rendering (CSR)**
  - Optimizado con Vite para desarrollo rápido
  - Hot Module Replacement (HMR) activado
  - Code splitting automático
- **Server-Side Rendering (SSR)**
  - Configuración inicial para SSR
  - Hydration automática
- **State Management**
  - React Context API
  - Hooks personalizados

### Configuración de Entorno
- **Variables de Entorno**
  - `.env`: Variables de entorno de desarrollo
  - `.env.production`: Variables de entorno de producción
- **Build Optimization**
  - Tree-shaking activado
  - Minificación automática
  - Compresión de assets

### Dependencias Principales
- **Core**
  - `react`: ^18.2.0
  - `react-dom`: ^18.2.0
  - `typescript`: ^5.0.0
- **Styling**
  - `tailwindcss`: ^3.0.0
  - `postcss`: ^8.0.0
  - `autoprefixer`: ^10.0.0
- **Development**
  - `@vitejs/plugin-react`: ^4.0.0
  - `@types/react`: ^18.0.0
  - `@types/react-dom`: ^18.0.0
- **Testing**
  - `vitest`: ^1.0.0
  - `@testing-library/react`: ^14.0.0

### Características Técnicas
- **Performance**
  - Lazy loading de componentes
  - Optimización de imágenes
  - Caché de assets
- **Seguridad**
  - Sanitización de inputs
  - Protección contra XSS
  - Headers de seguridad configurados
- **Accesibilidad**
  - ARIA labels implementados
  - Navegación por teclado
  - Contraste de colores WCAG 2.1
