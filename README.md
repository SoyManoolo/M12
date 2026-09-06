# FriendsGo 🌟

[![React](https://img.shields.io/badge/React-18.2.0-blue)](https://reactjs.org/)
[![React Router](https://img.shields.io/badge/React_Router-7.18.3-blue)](https://reactrouter.com/)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-green)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.0.1-lightgrey)](https://expressjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.2-blue)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14.x-blue)](https://www.postgresql.org/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8.1-black)](https://socket.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)

**[🔗 Demo en vivo](https://friendsgofrontend.vercel.app)** · [Documentación](#documentación) · [Instalación](#instalación)

> Frontend desplegado en **Vercel**, backend desplegado en **Railway**.

---

## Introducción

FriendsGo es una red social Full Stack desarrollada como Trabajo Final del CFGS de Desarrollo de Aplicaciones Web. Nace de una idea concreta: la persona media usa varias redes distintas para cubrir necesidades sociales diferentes (Instagram para contenido, Tinder/Omegle para conocer gente nueva, WhatsApp para chat). FriendsGo centraliza ese conjunto de funciones —publicaciones, perfiles, videollamadas aleatorias y chat— en una sola plataforma, combinando funcionalidades tradicionales de red social con comunicación en tiempo real mediante **Socket.IO** y videollamadas P2P mediante **WebRTC**.

El flujo social central es el siguiente: dos usuarios pueden conectarse mediante una videollamada aleatoria; si ambos deciden continuar la relación ("hacer match"), se habilita un chat persistente entre ellos. Al finalizar la llamada, cada usuario puede valorar la interacción, lo cual queda reflejado públicamente en el perfil del otro.

El proyecto se desarrolló en un plazo de tres meses siguiendo metodología **Scrum** (sprints semanales gestionados en Taiga.io), con el objetivo de diseñar una aplicación completa basada en una arquitectura cliente-servidor, poniendo especial énfasis en la comunicación en tiempo real, la seguridad y la organización del software.

> Desarrollado por dos personas: [SoyManoolo](https://github.com/SoyManoolo) y [Rediaj04](https://github.com/Rediaj04). Ver detalle de roles en [Equipo](#equipo).

---

## Características

### Red social
- Gestión de usuarios y perfiles.
- Sistema de publicaciones, comentarios y valoraciones.
- Sistema de amistades y solicitudes (búsqueda directa o tras videollamada).
- Búsqueda de usuarios.
- Moderación de contenido (panel de staff: sanciones, revisión de publicaciones y usuarios).

### Comunicación en tiempo real
```mermaid
sequenceDiagram
    participant A as Usuario A
    participant S as Socket.IO Server
    participant B as Usuario B

    A->>S: add_to_queue
    B->>S: add_to_queue

    S-->>A: match_found
    S-->>B: match_found

    A->>S: send_offer (SDP)
    S-->>B: receive_offer (SDP)

    B->>S: send_answer (SDP)
    S-->>A: receive_answer (SDP)

    A->>S: send_ice_candidate
    S-->>B: receive_ice_candidate

    B->>S: send_ice_candidate
    S-->>A: receive_ice_candidate

    Note over A,B: Conexión WebRTC P2P establecida
```

### Backend
- API REST desarrollada con Express 5 y TypeScript, desplegada en Railway.
- PostgreSQL como base de datos principal, con Sequelize como ORM.
- Autenticación basada en JWT, con verificación adicional contra base de datos (permite invalidación real en logout).
- Rate limiting global y específico para autenticación (5 intentos / 15 min).
- Seguridad mediante Helmet, CORS y enforcement de HTTPS en producción.
- Testing de integración automatizado con Jest + Supertest.
- Internacionalización de mensajes en 7 idiomas (es, en, ca, de, fr, ja, zh).
- Logging dual (consola + base de datos) y tareas programadas (purga de logs y de datos eliminados, configurable por entorno).

### Frontend
- React Router 7 (SSR) + React, con protección explícita contra SSR en todo lo que depende de APIs del navegador (Socket.IO, WebRTC, almacenamiento local).
- TailwindCSS 4.
- Diseño responsive en perfiles, mensajería, administración y videollamadas.
- Fallback de vídeo sintético cuando no hay cámara disponible, para no romper la conexión P2P.
- Feed limitado a publicaciones propias y de amistades confirmadas; las sugerencias excluyen amistades existentes.
- Historiales de chat persistentes aunque se elimine una amistad.
- Sanitización con DOMPurify de publicaciones, comentarios, biografías y mensajes.
- Sesión cliente invalidada al expirar el JWT y vista de solicitud de recuperación de contraseña.
- Pruebas unitarias con Vitest para expiración de tokens y sanitización.

### Mejoras recientes
- Actualización de dependencias directas y transitivas de seguridad; las auditorías de los lockfiles del repositorio, backend y frontend no detectan vulnerabilidades conocidas.
- Migración del frontend de Remix 2 a React Router 7.18, con configuración de rutas, SSR y Vite actualizada.
- Adaptación del despliegue SSR a Vercel mediante `@vercel/react-router`, su preset oficial y `frontend/vercel.json`.
- Actualización de Multer a 2.3, node-cron a 4.6 y de las resoluciones de Lodash, UUID, qs, Vite, esbuild y Ajv.
- Base de datos de pruebas `friendsgo_test` inicializada localmente y batería de integración validada: 7 suites y 8 pruebas superadas.
- Release `v1.2.0`: mejoras de experiencia social, seguridad del contenido y cobertura de pruebas del frontend.

---

## Arquitectura

```mermaid
graph TD
    Frontend["🎨 Frontend (Vercel)<br>React Router 7 + React"]
    Frontend -->|"REST API / Socket.IO"| Split
    style Split fill:none,stroke:none,color:none
    Split[ ]
    BackendAPI["🛠️ Express API (Railway)<br>JWT · Sequelize · Helmet · Rate Limiting"]
    BackendSocket["⚡ Socket.IO Server<br>Chat · Comments · WebRTC Signalling · Matchmaking"]
    TURN["📡 Servidor STUN/TURN<br>coturn"]
    Split --> BackendAPI
    Split --> BackendSocket
    Frontend -.->|"WebRTC P2P"| TURN
    BackendAPI --> DB[("💾 PostgreSQL Database")]
    BackendSocket --> DB
```

El frontend se comunica con el backend a través de dos canales: peticiones REST para operaciones CRUD convencionales (perfiles, publicaciones, amistades) y una conexión persistente vía Socket.IO para todo lo que requiere baja latencia (chat, señalización WebRTC, emparejamiento de videollamadas). Ambos canales comparten la misma base de datos PostgreSQL. El backend corre detrás de un proxy inverso en Railway, por lo que la aplicación fuerza HTTPS a nivel de código inspeccionando la cabecera `x-forwarded-proto`.

---

## Tecnologías

| Categoría | Tecnologías |
|---|---|
| **Frontend** | React 18, React Router 7 (SSR), Vite 6, TailwindCSS 4, TypeScript |
| **Backend** | Node.js, Express 5, TypeScript, Sequelize |
| **Base de datos** | PostgreSQL |
| **Tiempo real** | Socket.IO, WebRTC |
| **Autenticación** | JWT (con verificación en base de datos) |
| **Seguridad** | Helmet, CORS, express-rate-limit, enforcement de HTTPS |
| **Internacionalización** | i18n (7 idiomas) |
| **Testing** | Vitest (frontend) · Jest + Supertest (backend) |
| **Calidad de código** | ESLint |
| **Despliegue** | Vercel (frontend) · Railway (backend) |

---

## Decisiones técnicas

Algunas decisiones de diseño relevantes tomadas durante el desarrollo, junto con las alternativas que se valoraron:

- **React Router 7 como evolución de Remix:** inicialmente se eligió Remix por su modelo SSR y de rutas para una aplicación con estado e interacción constante. El frontend se migró posteriormente a React Router 7, que continúa ese modelo de framework y cuenta con integración SSR oficial para Vercel.
- **Node.js sobre Deno y Bun:** se compararon los tres entornos de ejecución de JavaScript/TypeScript. Deno destaca en seguridad y Bun en rendimiento, pero se eligió Node.js por su comunidad más extensa, mayor disponibilidad de recursos y mejor compatibilidad con sistemas y servidores existentes — priorizando estabilidad y soporte sobre rendimiento marginal.
- **Express sobre NestJS:** se priorizó la simplicidad y el bajo nivel de imposición estructural de Express frente a frameworks más opinionados, lo que facilita la integración directa con Socket.IO y WebRTC sin pelear contra el framework.
- **PostgreSQL sobre MySQL y Cassandra:** se eligió PostgreSQL por su equilibrio entre potencia, consistencia fuerte y soporte de relaciones complejas (tipos JSONB, búsqueda full-text, integridad referencial). Cassandra se descartó porque prioriza disponibilidad sobre consistencia, lo cual no encajaba con un modelo de datos relacional como el de una red social.
- **WebRTC + Socket.IO para videollamadas:** WebRTC se eligió por permitir conexiones P2P de baja latencia con cifrado obligatorio, reduciendo carga de servidor. Socket.IO gestiona la señalización (intercambio de metadatos para establecer la conexión WebRTC) y se reutiliza como infraestructura común para chat y notificaciones, gracias a su reconexión automática y fallback sobre WebSockets. El proyecto despliega su propio servidor STUN/TURN (coturn), con TURNS cifrado como opción prioritaria y TURN sin cifrar como respaldo si el cifrado falla.
- **JWT + Helmet + CSP:** autenticación sin estado en servidor (escalable horizontalmente) combinada con cabeceras de seguridad estrictas para mitigar XSS e inyección de contenido. Las contraseñas se almacenan con hash (bcrypt), nunca en texto plano. Como matiz: el token no solo se verifica criptográficamente, sino que también se comprueba su existencia en base de datos, lo que permite invalidar sesiones de forma real en el logout (algo que un JWT puramente sin estado no permite).
- **TypeScript en todo el stack:** se decidió tipar tanto frontend como backend para detectar errores en tiempo de compilación y compartir un modelo de datos consistente entre ambas partes.
- **Emparejamiento de videollamadas con cola en memoria:** en vez de resolver el matching directamente vía Socket.IO en cada conexión, el servidor mantiene una cola de espera en memoria y ejecuta una ronda de emparejamiento aleatorio cada 5 segundos, creando el registro de llamada en base de datos y notificando a ambos usuarios quién actúa como iniciador de la señalización WebRTC.
- **Internacionalización en el backend, no solo en el frontend:** los mensajes de error y éxito de la API se traducen dinámicamente según la cabecera `Accept-Language` de cada petición (7 idiomas soportados), resueltos mediante una jerarquía de categorías de error en vez de un mapeo plano clave-valor.

### Calidad de código: refactorización del componente Post

Como ejercicio de mejora de mantenibilidad, el componente `Post` del frontend —que había crecido hasta 878 líneas con lógica de UI, estado y red mezclada— se descompuso en 7 componentes reutilizables (`UserAvatar`, `PostHeader`, `PostActions`, `PostComments`, `CommentInput`, `PostDescription`, `PostMedia`) y 3 hooks personalizados (`usePostLike`, `useComments`, `useTimeFormat`):

| Métrica | Antes | Después | Mejora |
|---|---|---|---|
| Líneas de código | 878 | 232 | −73% |
| Tamaño del archivo | 34 KB | 7 KB | −80% |
| Código duplicado (mobile/desktop) | ~300 líneas | 0 | −100% |
| Componentes reutilizables | 0 | 7 | — |

La duplicación entre las vistas de escritorio y móvil se resolvió con CSS responsive en lugar de ramas de código separadas, y la lógica de negocio (likes, comentarios, formateo de fechas) se extrajo a hooks independientes, lo que facilita testearla de forma aislada.

---

## Estructura del proyecto

```
M12/
├── frontend/          # ⚛️ Aplicación React Router + React (SSR)
│   └── app/
│       ├── routes/        # Rutas basadas en archivos
│       ├── components/    # Inicio, Chats, Perfil, Videollamada, Shared
│       ├── hooks/          # useAuth, useVideoCall, useMessage...
│       ├── services/        # Servicios HTTP + singletons de Socket.IO/WebRTC
│       └── types/
├── Backend/           # 🛠️ Servidor Node.js + Express
│   └── src/
│       ├── controllers/   # Un controlador por dominio
│       ├── services/        # Lógica de negocio
│       ├── models/            # Modelos Sequelize + asociaciones
│       ├── routes/              # Endpoints REST
│       ├── socket/                # Eventos de Socket.IO (chat, comentarios, videollamadas)
│       ├── middlewares/             # Validación y manejo de errores
│       └── lang/                      # Traducciones (7 idiomas)
├── database/          # 💾 Scripts y schema de PostgreSQL
├── docs/              # 📚 Documentación del proyecto
│   ├── frontend/       # Documentación del frontend
│   ├── backend/        # Documentación del backend
│   └── api/             # Documentación de la API
└── LICENSE            # 📜 Licencia MIT
```

---

## Instalación

### Requisitos previos
- Node.js v20 o superior
- npm v9 o superior
- PostgreSQL v14 o superior
- Git

### Clonar el repositorio

```bash
git clone https://github.com/SoyManoolo/M12.git
cd M12
```

### Base de datos

```bash
psql
CREATE DATABASE friendsgo;
```

Configura las credenciales en el `.env` del backend:

```env
JWT_SECRET=tu_jwt_secret_seguro
PORT=3000
NODE_ENV=development

DB_PORT=5432
DB_USER=postgres
DB_PASS=tu_contraseña_postgres
DB_NAME=friendsgo
DB_NAME_TEST=friendsgo_test
DB_HOST=localhost
DB_UPDATE=true   # crea las tablas automáticamente al iniciar

LOGS_DAYS=7
CLEAN_USERS=30     # días de retención antes de purgar usuarios eliminados
CLEAN_POSTS=15     # días de retención antes de purgar publicaciones eliminadas
CLEAN_COMMENTS=7   # días de retención antes de purgar comentarios eliminados
```

### Backend

```bash
cd Backend
npm install
# Crea un archivo .env en esta carpeta con las variables del bloque anterior
npm run dev             # http://localhost:3000
```

### Frontend

```bash
cd frontend
npm install
echo "VITE_API_URL=http://localhost:3000" > .env
npm run dev             # http://localhost:5173
```

### Scripts disponibles

**Frontend**
| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo (React Router + Vite) |
| `npm run build` | Build de producción SSR (React Router + Vite) |
| `npm start` | Sirve el build SSR fuera de Vercel |
| `npm test` | Pruebas unitarias con Vitest |
| `npm run test:watch` | Vitest en modo observación |
| `npm run lint` | Linter (ESLint) |
| `npm run preview` | Previsualiza el build de producción |
| `npm run analyze` | Analiza el bundle de producción |

**Backend**
| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo (nodemon) |
| `npm run build` | Compila TypeScript y copia los ficheros de idioma |
| `npm start` | Modo producción |
| `npm run test` | Tests de integración con Jest + Supertest |
| `npm run test:watch` | Tests en modo watch |
| `npm run test:reset-db` | Resetea la base de datos de pruebas |
| `npm run sync-translations` | Sincroniza claves entre los ficheros de idioma |
| `npm run start:cleanup` / `stop:cleanup` / `delete:cleanup` | Gestiona el job de limpieza programada con PM2 |

---

## Alcance del proyecto

Como Trabajo Final de Grado desarrollado en tres meses, se tomaron decisiones conscientes de alcance para priorizar las funcionalidades core. El proyecto está desplegado públicamente (frontend en Vercel, backend en Railway) e incluye medidas de seguridad de nivel razonable —rate limiting, hash de contraseñas, invalidación de sesión vía base de datos, HTTPS forzado en producción—, pero quedan límites explícitos:

- No se han realizado pruebas formales de usabilidad o accesibilidad, aunque se siguieron patrones de diseño habituales en redes sociales para mantener una navegación intuitiva.
- El sistema de notificaciones en tiempo real vía Socket.IO está implementado pero no cubre aún el 100% de los eventos de la aplicación.
- No hay un pipeline de CI/CD formal ni monitorización de errores en producción más allá del logging propio.
- El emparejamiento de videollamadas funciona en memoria de un único proceso; escalar a varias instancias del backend requeriría mover esa cola a un almacén compartido (Redis, por ejemplo).

Documentar estas decisiones explícitamente —en vez de presentarlas como si no existieran— fue una elección deliberada: permite distinguir entre lo que está terminado, lo que es una limitación de alcance y lo que queda como trabajo futuro.

## Documentación

La documentación detallada de cada parte del proyecto vive en su propio README:

- 🎨 **[Frontend](docs/frontend/README.md)** — componentes, hooks, gestión de estado y rutas.
- 🔧 **[Backend](docs/backend/README.md)** — modelos, middleware, controladores y lógica de negocio.
- 🔌 **[API](docs/api/README.md)** — endpoints, autenticación y manejo de errores.
- 💾 **[Schema de base de datos](database/schema.sql)** — modelos, relaciones e índices.

## Pendiente y hoja de ruta

Estas mejoras están identificadas, pero no forman parte de la versión actual. Se incluyen para hacer explícito el siguiente alcance técnico y de producto.

| Prioridad | Área | Pendiente | Posible implementación |
|---|---|---|---|
| Alta | Entrega continua | Automatizar la validación antes de cada despliegue. | GitHub Actions con `npm ci`, `npm audit`, build de frontend/backend y pruebas de integración contra PostgreSQL efímero. |
| Alta | Observabilidad | Detectar y diagnosticar errores de producción con rapidez. | Monitorización de excepciones (por ejemplo, Sentry), health checks, alertas y métricas de latencia/errores. |
| Alta | Escalabilidad en tiempo real | Hacer que chat y matchmaking funcionen con varias instancias del backend. | Adaptador Socket.IO para Redis y cola de emparejamiento compartida, con métricas y caducidad de sesiones. |
| Media | Calidad | Ampliar la cobertura funcional y de accesibilidad. | Pruebas E2E con Playwright, pruebas de componentes y auditorías periódicas con Lighthouse/axe. |
| Media | Comunicación | Llamadas y videollamadas directas entre amistades. | Señalización Socket.IO con salas privadas, permisos de amistad y notificaciones de llamada. |
| Media | Chat | Envío de imágenes, vídeos y archivos. | Almacenamiento de objetos con URLs firmadas, validación de tipo/tamaño, análisis antimalware y CDN. |
| Media | Autenticación | Inicio de sesión social y refuerzo de la recuperación de cuenta. | OAuth 2.0/OIDC (Google/Facebook), verificación de correo y tokens de recuperación con expiración. |
| Baja | Cliente móvil | Aplicación móvil nativa. | React Native compartiendo contratos de API y capa de autenticación; notificaciones push con FCM/APNs. |

### Mantenimiento de dependencias

Las actualizaciones de seguridad se revisan localmente con auditorías, build y pruebas antes de aceptarse. Para reducir regresiones en el futuro, cada cambio destinado a producción debe revisarse antes de crear el commit o enviarlo al remoto.

---

## Equipo

| | [SoyManoolo](https://github.com/SoyManoolo) | [Rediaj04](https://github.com/Rediaj04) |
|---|---|---|
| **Rol principal** | Backend | Frontend |
| **Responsabilidades** | Arquitectura del servidor, API REST, modelado de PostgreSQL, autenticación JWT, infraestructura Socket.IO, signalling WebRTC, servidor STUN/TURN, testing automatizado, seguridad (Helmet/CSP) | Interfaz con React Router y React, experiencia de usuario, componentes reutilizables, vistas de la aplicación, integración con la API REST, diseño responsive, soporte a funcionalidades en tiempo real |

---

## Aprendizajes

Este proyecto, además de los objetivos propios de la aplicación, se planteó como un ejercicio de crecimiento técnico para ambos desarrolladores. Permitió:

- Reforzar TypeScript, HTML y CSS de forma intensiva en un proyecto real de extremo a extremo.
- Adquirir experiencia práctica con React y Express más allá del nivel introductorio del ciclo formativo.
- Familiarizarse con WebRTC, Socket.io y Node.js mediante la implementación de funcionalidades de tiempo real desde cero, no a partir de tutoriales guiados.
- Diseñar e implementar una API REST completa, con autenticación, validación y manejo de errores propio.
- Modelar una base de datos relacional con relaciones complejas (amistades, publicaciones, valoraciones, moderación) manteniendo la integridad de los datos.
- Organizar un proyecto Full Stack de dos personas con metodología Scrum, gestionando sprints semanales y reparto de responsabilidades de forma autónoma.

---

## Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo [LICENSE](LICENSE) para más detalles.
