# M12 - FriendsGo 🌟
Desarrollo del proyecto final de curso - Red social para hacer amigos

## Instalación y Configuración 🚀

### Requisitos Previos 📋
- Node.js (v18 o superior)
- npm (v9 o superior)
- PostgreSQL (v14 o superior)

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
JWT_SECRET=JWT SECRETA

# Configuración del servidor
PORT=3000
NODE_ENV=development

# Configuración de la base de datos
DB_PORT=5432
DB_USER=postgres
DB_PASS=tu_contraseña_postgres
DB_NAME=friends_go
DB_NAME_TEST=friends_go_test
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
[![React](https://img.shields.io/badge/React-18.x-blue)](https://reactjs.org/)
- `npm run dev`: Inicia el servidor de desarrollo
- `npm run build`: Construye la aplicación para producción
- `npm run lint`: Ejecuta el linter
- `npm run preview`: Previsualiza la build de producción

#### Backend
[![Node.js](https://img.shields.io/badge/Node.js-18.x-green)](https://nodejs.org/)
- `npm run dev`: Inicia el servidor en modo desarrollo
- `npm run build`: Compila el código TypeScript
- `npm start`: Inicia el servidor en modo producción
- `npm run lint`: Ejecuta el linter

## Documentación 📚
La documentación completa del proyecto está organizada en las siguientes secciones:

### Frontend 🎨
[![Frontend Docs](https://img.shields.io/badge/Docs-Frontend-blue)](https://github.com/SoyManoolo/M12/blob/main/docs/frontend/README.md)
- Documentación detallada del frontend de la aplicación
- Tecnologías: React, TypeScript, Tailwind CSS
- [Ver documentación →](https://github.com/SoyManoolo/M12/blob/main/docs/frontend/README.md)

### Backend 🔧
[![Backend Docs](https://img.shields.io/badge/Docs-Backend-green)](https://github.com/SoyManoolo/M12/blob/main/docs/backend/README.md)
- Documentación del servidor y lógica de negocio
- Tecnologías: Node.js, Express, PostgreSQL
- [Ver documentación →](https://github.com/SoyManoolo/M12/blob/main/docs/backend/README.md)

### API 🔌
[![API Docs](https://img.shields.io/badge/Docs-API-orange)](https://github.com/SoyManoolo/M12/blob/main/docs/api/README.md)
- Documentación de endpoints y servicios
- Especificaciones de la API REST
- [Ver documentación →](https://github.com/SoyManoolo/M12/blob/main/docs/api/README.md)

### Base de Datos 💾
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14.x-blue)](https://www.postgresql.org/)
- Schema completo de la base de datos
- Modelos y relaciones
- Consultas principales

## Estructura del Proyecto 📁
```
M12/
├── frontend/          # ⚛️ Aplicación React (Frontend)
├── Backend/           # 🛠️ Servidor Node.js (Backend)
├── database/         # 💾 Scripts y schema de PostgreSQL
├── docs/             # 📚 Documentación del proyecto
│   ├── frontend/     # 🎨 Documentación del frontend
│   ├── backend/      # 🔧 Documentación del backend
│   └── api/          # 🔌 Documentación de la API
└── LICENSE           # 📜 Licencia MIT
```

## Tecnologías Principales 🔥
- [![React](https://img.shields.io/badge/React-Frontend-blue)](https://reactjs.org/)
- [![Node.js](https://img.shields.io/badge/Node.js-Backend-green)](https://nodejs.org/)
- [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-blue)](https://www.postgresql.org/)
- [![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
- [![Tailwind](https://img.shields.io/badge/Tailwind-CSS-38B2AC)](https://tailwindcss.com/)

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
