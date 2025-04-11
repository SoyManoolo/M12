# M12 - Frontend Architecture
Desarrollo del proyecto final de curso - FriendsGo

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
│   ├── Inicio/        # Componentes de la página principal
│   │   └── Navbar.tsx # Barra de navegación principal
│   ├── Settings/      # Componentes de configuración
│   ├── Shared/        # Componentes compartidos
│   ├── Videollamada/  # Componentes de videollamada
│   └── Perfil/        # Componentes de perfil
├── routes/            # Configuración de rutas y páginas
│   ├── _index.tsx     # Página principal
│   ├── inicio.tsx     # Feed principal
│   ├── login.tsx      # Página de inicio de sesión
│   ├── signup.tsx     # Página de registro
│   ├── perfil.tsx     # Perfil de usuario
│   ├── publicar.tsx   # Página de creación de publicaciones
│   ├── configuracion.tsx # Configuración de usuario
│   ├── videollamada.tsx # Sistema de videollamadas
│   └── notificaciones.tsx # Centro de notificaciones
├── services/          # Servicios API y lógica de negocio
├── styles/            # Estilos globales y módulos CSS
├── types/            # Definiciones de tipos TypeScript
├── config/           # Configuraciones de la aplicación
├── assets/           # Recursos estáticos (imágenes, fuentes)
├── entry.client.tsx  # Punto de entrada del cliente
├── entry.server.tsx  # Punto de entrada del servidor
└── root.tsx          # Componente raíz de la aplicación
```

### Características Implementadas

#### Sistema de Navegación
- **Navbar Lateral**
  - Navegación principal de la aplicación
  - Acceso rápido a todas las funcionalidades
  - Diseño oscuro y moderno
  - Iconos intuitivos

#### Páginas Principales
- **Inicio (Feed)**
  - Visualización de publicaciones
  - Interacción con contenido
  - Diseño responsive

- **Publicar**
  - Interfaz de publicación moderna
  - Subida de imágenes con vista previa
  - Editor de descripción
  - Diseño centrado y optimizado

- **Perfil**
  - Visualización de información personal
  - Gestión de contenido propio
  - Estadísticas de usuario

- **Videollamada**
  - Sistema de comunicación en tiempo real
  - Interfaz de usuario intuitiva

#### Diseño y UI/UX
- **Tema Oscuro**
  - Paleta de colores oscura consistente
  - Contraste optimizado
  - Elementos UI modernos

- **Componentes Interactivos**
  - Botones con feedback visual
  - Formularios optimizados
  - Animaciones suaves
  - Loading states

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
