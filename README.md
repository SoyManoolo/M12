# M12 - FriendsGo 🌟
Desarrollo del proyecto final de curso - Red social para hacer amigos

## Instalación y Configuración 🚀

### Requisitos Previos 📋
- Node.js (v18 o superior)
- npm (v9 o superior)
- PostgreSQL (v14 o superior)
- Git

### Clonar el Repositorio 📥
```bash
# Clonar el repositorio
git clone https://github.com/SoyManoolo/M12.git

# Entrar al directorio del proyecto
cd M12
```

### Configuración de la Base de Datos 💾
1. Crear una base de datos en PostgreSQL
```bash
# Conectar a PostgreSQL
psql

# Crear la base de datos
CREATE DATABASE friendsgo;
```

2. Configurar las credenciales en el archivo `.env` del backend:
```env
# Configuración JWT
JWT_SECRET=tu_jwt_secret_seguro

# Configuración del servidor
PORT=3000
NODE_ENV=development

# Configuración de la base de datos
DB_PORT=5432
DB_USER=postgres
DB_PASS=tu_contraseña_postgres
DB_NAME=friendsgo
DB_NAME_TEST=friendsgo_test
DB_HOST=localhost
DB_UPDATE=true  # Esto creará las tablas automáticamente al iniciar

# Configuración de logs
LOGS_DAYS=7
```

### Configuración del Frontend ⚛️
```bash
# Entrar al directorio del frontend
cd frontend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar el archivo .env con la URL del backend

# Iniciar el servidor de desarrollo
npm run dev

# El frontend estará disponible en: http://localhost:5173
```

### Configuración del Backend 🛠️
```bash
# Entrar al directorio del backend
cd ../Backend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar el archivo .env con tus credenciales

# Iniciar el servidor de desarrollo
npm run dev

# El backend estará disponible en: http://localhost:3000
```

### Scripts Disponibles ⚙️

#### Frontend
[![React](https://img.shields.io/badge/React-18.2.0-blue)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2.3-purple)](https://vitejs.dev/)
[![Tailwind](https://img.shields.io/badge/Tailwind-4.0.15-38B2AC)](https://tailwindcss.com/)
- `npm run dev`: Inicia el servidor de desarrollo con Vite
- `npm run build`: Construye la aplicación con Remix y Vite
- `npm run lint`: Ejecuta ESLint para verificar el código
- `npm run preview`: Previsualiza la build de producción
- `npm run analyze`: Analiza el bundle de producción

#### Backend
[![Node.js](https://img.shields.io/badge/Node.js-18.x-green)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.0.1-lightgrey)](https://expressjs.com/)
[![Sequelize](https://img.shields.io/badge/Sequelize-6.37.5-blue)](https://sequelize.org/)
- `npm run dev`: Inicia el servidor en modo desarrollo con nodemon
- `npm run build`: Compila TypeScript y copia archivos de idiomas
- `npm start`: Inicia el servidor en modo producción
- `npm run test`: Ejecuta las pruebas con Jest
- `npm run test:watch`: Ejecuta las pruebas en modo watch
- `npm run test:reset-db`: Resetea la base de datos de pruebas
- `npm run sync-translations`: Sincroniza las traducciones
- `npm run start:cleanup`: Inicia el job de limpieza con PM2
- `npm run stop:cleanup`: Detiene el job de limpieza
- `npm run delete:cleanup`: Elimina el job de limpieza

## Documentación 📚
La documentación completa del proyecto está organizada en las siguientes secciones:

### Frontend 🎨
[![Frontend Docs](https://img.shields.io/badge/Docs-Frontend-blue)](https://github.com/SoyManoolo/M12/blob/main/docs/frontend/README.md)
- Documentación detallada del frontend de la aplicación
- Tecnologías: React, TypeScript, Vite, Tailwind CSS
- Componentes y hooks personalizados
- Gestión de estado y rutas
- [Ver documentación →](https://github.com/SoyManoolo/M12/blob/main/docs/frontend/README.md)

### Backend 🔧
[![Backend Docs](https://img.shields.io/badge/Docs-Backend-green)](https://github.com/SoyManoolo/M12/blob/main/docs/backend/README.md)
- Documentación del servidor y lógica de negocio
- Tecnologías: Node.js, Express, Sequelize, PostgreSQL
- Modelos y relaciones
- Middleware y controladores
- [Ver documentación →](https://github.com/SoyManoolo/M12/blob/main/docs/backend/README.md)

### API 🔌
[![API Docs](https://img.shields.io/badge/Docs-API-orange)](https://github.com/SoyManoolo/M12/blob/main/docs/api/README.md)
- Documentación de endpoints y servicios
- Especificaciones de la API REST
- Autenticación y autorización
- Manejo de errores
- [Ver documentación →](https://github.com/SoyManoolo/M12/blob/main/docs/api/README.md)

### Base de Datos 💾
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14.x-blue)](https://www.postgresql.org/)
- Schema completo de la base de datos
- Modelos y relaciones
- Índices y optimizaciones
- Consultas principales
- [Ver schema →](https://github.com/SoyManoolo/M12/blob/main/database/schema.sql)

## Estructura del Proyecto 📁
```
M12/
├── frontend/          # ⚛️ Aplicación React (Frontend)
│   ├── app/          # Componentes y páginas
│   ├── public/       # Archivos estáticos
│   └── src/          # Código fuente
├── Backend/          # 🛠️ Servidor Node.js (Backend)
│   ├── src/          # Código fuente
│   │   ├── config/   # Configuraciones
│   │   ├── models/   # Modelos Sequelize
│   │   ├── routes/   # Rutas API
│   │   └── types/    # Tipos TypeScript
│   └── media/        # Archivos multimedia
├── database/         # 💾 Scripts y schema de PostgreSQL
├── docs/             # 📚 Documentación del proyecto
│   ├── frontend/     # 🎨 Documentación del frontend
│   ├── backend/      # 🔧 Documentación del backend
│   └── api/          # 🔌 Documentación de la API
└── LICENSE           # 📜 Licencia MIT
```

## Tecnologías Principales 🔥
- [![React](https://img.shields.io/badge/React-18.2.0-blue)](https://reactjs.org/)
- [![Vite](https://img.shields.io/badge/Vite-6.2.3-purple)](https://vitejs.dev/)
- [![Node.js](https://img.shields.io/badge/Node.js-18.x-green)](https://nodejs.org/)
- [![Express](https://img.shields.io/badge/Express-5.0.1-lightgrey)](https://expressjs.com/)
- [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14.x-blue)](https://www.postgresql.org/)
- [![Sequelize](https://img.shields.io/badge/Sequelize-6.37.5-blue)](https://sequelize.org/)
- [![TypeScript](https://img.shields.io/badge/TypeScript-5.7.2-blue)](https://www.typescriptlang.org/)
- [![Tailwind](https://img.shields.io/badge/Tailwind-4.0.15-38B2AC)](https://tailwindcss.com/)
- [![ESLint](https://img.shields.io/badge/ESLint-9.21.0-purple)](https://eslint.org/)
- [![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8.1-black)](https://socket.io/)
- [![Jest](https://img.shields.io/badge/Jest-29.7.0-red)](https://jestjs.io/)
- [![Remix](https://img.shields.io/badge/Remix-2.16.2-blue)](https://remix.run/)

## Características Principales ✨
- 🔐 Autenticación JWT
- 👥 Gestión de usuarios y perfiles
- 📱 Videollamadas en tiempo real
- 💬 Chat en tiempo real
- 👥 Sistema de amigos y solicitudes
- 📝 Publicaciones y comentarios
- ⭐ Sistema de valoraciones
- 🛡️ Moderación de contenido
- 📊 Logs y monitoreo
- 🔍 Búsqueda de usuarios
- 🎨 Diseño responsive

## Autores ✨

<table>
  <tr>
    <td align="center">
      <a href="https://github.com/SoyManoolo">
        <img src="https://github.com/SoyManoolo.png" width="100px;" alt=""/>
        <br />
        <b>SoyManoolo</b>
        <br />
        <img src="https://img.shields.io/badge/GitHub-SoyManoolo-181717?logo=github" alt="GitHub"/>
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/Rediaj04">
        <img src="https://github.com/Rediaj04.png" width="100px;" alt=""/>
        <br />
        <b>Rediaj04</b>
        <br />
        <img src="https://img.shields.io/badge/GitHub-Rediaj04-181717?logo=github" alt="GitHub"/>
      </a>
    </td>
  </tr>
</table>

## Licencia 📜
Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
