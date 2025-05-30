# Documentación Técnica Frontend - FriendsGo

> **Nota**: Este documento es parte de la documentación técnica del proyecto FriendsGo y se encuentra en la carpeta `docs/frontend/`. Para la documentación general del proyecto, consulta el [README principal](https://github.com/SoyManoolo/M12) en la raíz del repositorio.

## Descripción General
FriendsGo es una aplicación web moderna construida con React, TypeScript y Tailwind CSS. La aplicación proporciona una plataforma social completa con funcionalidades de chat, videollamadas, gestión de amigos y más.

## Tecnologías Utilizadas

<div align="center">
  <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/react/react-original.svg" alt="React" width="50" height="50"/>
  <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/typescript/typescript-original.svg" alt="TypeScript" width="50" height="50"/>
  <img src="https://www.vectorlogo.zone/logos/tailwindcss/tailwindcss-icon.svg" alt="Tailwind" width="50" height="50"/>
  <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/vitejs/vitejs-original.svg" alt="Vite" width="50" height="50"/>
  <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/socketio/socketio-original.svg" alt="Socket.IO" width="50" height="50"/>
  <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/git/git-original.svg" alt="Git" width="50" height="50"/>
  <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/github/github-original.svg" alt="GitHub" width="50" height="50"/>
</div>

## Estructura del Proyecto
```
frontend/
├── app/
│   ├── components/     # Componentes reutilizables
│   ├── config/        # Configuraciones
│   ├── hooks/         # Hooks personalizados
│   ├── routes/        # Páginas y rutas
│   ├── services/      # Servicios de API
│   └── types/         # Definiciones de tipos
├── public/            # Archivos estáticos
└── package.json       # Dependencias y scripts
```

## Configuración del Entorno

### Configuración del Backend
La URL del backend se configura directamente en el archivo `app/config/environment.ts`:

```typescript
export const environment = {
  apiUrl: 'http://localhost:3000'  // Cambia esta URL según tu configuración
};
```

Para cambiar la URL del backend:
1. Abre el archivo `app/config/environment.ts`
2. Modifica el valor de `apiUrl` con la URL de tu backend
3. Guarda los cambios y reinicia la aplicación

## Instalación

1. Clona el repositorio:
```bash
git clone [URL_DEL_REPOSITORIO]
cd frontend
```

2. Instala las dependencias:
```bash
npm install
```

3. Inicia el servidor de desarrollo:
```bash
npm run dev
```

## Scripts Disponibles

- `npm run dev`: Inicia el servidor de desarrollo
- `npm run build`: Construye la aplicación para producción
- `npm run preview`: Previsualiza la versión de producción
- `npm run lint`: Ejecuta el linter
- `npm run type-check`: Verifica los tipos de TypeScript

## Características Principales

### Autenticación
- Registro de usuarios
- Inicio de sesión
- Recuperación de contraseña
- Gestión de tokens JWT

### Perfil de Usuario
- Foto de perfil personalizable
- Información personal editable
- Biografía
- Estadísticas de actividad

### Sistema de Amigos
- Búsqueda de usuarios
- Envío de solicitudes de amistad
- Gestión de amigos
- Lista de amigos

### Chat
- Mensajería en tiempo real
- Notificaciones de mensajes nuevos
- Indicador de escritura
- Historial de mensajes

### Videollamadas
- Llamadas de video en tiempo real
- Chat durante la llamada
- Control de audio/video
- Calidad de video adaptable

### Publicaciones
- Creación de posts
- Soporte para imágenes
- Sistema de likes
- Comentarios
- Compartir posts

## Componentes Principales

### Navbar
- Navegación principal
- Notificaciones
- Menú de usuario
- Búsqueda global

### RightPanel
- Lista de amigos
- Solicitudes de amistad
- Usuarios sugeridos
- Estado de conexión

### ChatItem
- Vista previa de conversación
- Último mensaje
- Indicador de no leídos
- Estado de conexión

## Servicios de API

### AuthService
- Gestión de autenticación
- Tokens JWT
- Sesiones de usuario

### UserService
- Gestión de perfiles
- Búsqueda de usuarios
- Actualización de datos

### ChatService
- Mensajería en tiempo real
- Historial de chats
- Estado de mensajes

### FriendshipService
- Gestión de amistades
- Solicitudes
- Lista de amigos

### PostService
- Creación de posts
- Interacciones
- Comentarios

## Estilos y Temas

### Colores Principales
- Azul primario: `#3B82F6` (blue-600)
- Púrpura: `#9333EA` (purple-600)
- Gris oscuro: `#1F2937`