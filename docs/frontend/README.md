# M12 - Frontend Architecture
Desarrollo del proyecto final de curso - FriendsGo

## Arquitectura y Stack Tecnológico

### Stack Tecnológico Principal
- **Framework**: React 18.2.0
- **Lenguaje**: TypeScript 5.7.2
- **Bundler**: Vite 6.2.3
- **Framework Web**: Remix 2.16.2
- **Estilos**: Tailwind CSS 4.0.15
- **Linting**: ESLint 9.21.0
- **Comunicación en Tiempo Real**: Socket.IO Client 4.8.1

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
frontend/
├── app/              # Componentes y rutas de la aplicación
│   ├── components/   # Componentes reutilizables
│   ├── routes/       # Configuración de rutas y páginas
│   ├── services/     # Servicios API y lógica de negocio
│   ├── styles/       # Estilos globales
│   ├── types/        # Definiciones de tipos TypeScript
│   ├── config/       # Configuraciones de la aplicación
│   ├── assets/       # Recursos estáticos
│   ├── entry.client.tsx  # Punto de entrada del cliente
│   ├── entry.server.tsx  # Punto de entrada del servidor
│   └── root.tsx      # Componente raíz de la aplicación
├── public/           # Archivos estáticos
├── vite.config.ts    # Configuración de Vite
├── tailwind.config.ts # Configuración de Tailwind
├── tsconfig.json     # Configuración base de TypeScript
├── tsconfig.app.json # Configuración de TypeScript para la app
├── tsconfig.node.json # Configuración de TypeScript para Node
├── eslint.config.js  # Configuración de ESLint
└── .eslintrc.cjs     # Reglas de ESLint
```

### Scripts Disponibles
```bash
npm run dev     # Inicia el servidor de desarrollo con Vite
npm run build   # Construye la aplicación con Remix y Vite
npm run lint    # Ejecuta ESLint para verificar el código
npm run preview # Previsualiza la build de producción
npm run analyze # Analiza el bundle de producción
```

### Características Implementadas

#### Sistema de Autenticación
- Autenticación JWT
- Gestión de sesiones
- Protección de rutas
- Manejo de tokens

#### Comunicación en Tiempo Real
- Chat en tiempo real con Socket.IO
- Notificaciones instantáneas
- Sistema de videollamadas
- Estado de conexión de usuarios

#### Interfaz de Usuario
- Diseño responsive con Tailwind CSS
- Tema oscuro
- Componentes reutilizables
- Animaciones y transiciones
- Loading states y feedback visual

#### Funcionalidades Principales
- Sistema de publicaciones
- Gestión de perfiles de usuario
- Búsqueda de usuarios
- Sistema de amigos
- Moderación de contenido
- Gestión de notificaciones

#### Optimizaciones
- Lazy loading de componentes
- Code splitting con Vite
- Optimización de imágenes
- Caché de assets
- Compresión de bundles

### Dependencias Principales
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@remix-run/react": "^2.16.2",
    "@remix-run/node": "^2.16.2",
    "socket.io-client": "^4.8.1",
    "tailwindcss": "^4.0.15"
  },
  "devDependencies": {
    "typescript": "~5.7.2",
    "vite": "^6.2.3",
    "eslint": "^9.21.0",
    "@vitejs/plugin-react": "^4.3.4"
  }
}
```

### Características Técnicas
- **Performance**
  - Lazy loading de componentes
  - Optimización de imágenes
  - Caché de assets
  - Code splitting con Vite

- **Seguridad**
  - Sanitización de inputs
  - Protección contra XSS
  - Headers de seguridad configurados
  - Validación de datos

- **Accesibilidad**
  - ARIA labels implementados
  - Navegación por teclado
  - Contraste de colores WCAG 2.1
  - Semántica HTML correcta
