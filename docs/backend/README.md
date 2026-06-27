# Backend — FriendsGo

> Documentación técnica del servidor de FriendsGo. Para la visión general del proyecto, ver el [README principal](../../README.md).

## Índice

1. [Arquitectura](#arquitectura)
2. [Stack técnico](#stack-técnico)
3. [Estructura del código](#estructura-del-código)
4. [Decisiones de implementación](#decisiones-de-implementación)
5. [Modelo de datos](#modelo-de-datos)
6. [Seguridad](#seguridad)
7. [Internacionalización](#internacionalización)
8. [Tareas programadas](#tareas-programadas)
9. [Testing](#testing)
10. [Instalación](#instalación)
11. [Referencia de API REST](#referencia-de-api-rest)
12. [Eventos de Socket.IO](#eventos-de-socketio)
13. [Licencia](#licencia)

---

## Arquitectura

El backend sigue una arquitectura en capas (**rutas → middleware → controlador → servicio → modelo**), con Express gestionando la API REST para operaciones CRUD y Socket.IO gestionando todo lo que requiere estado en tiempo real (chat, señalización WebRTC, emparejamiento de videollamadas).

```
Request → Router → Middleware (auth/validación) → Controller → Service → Model (Sequelize) → PostgreSQL
                                                         ↓
                                                    Socket.IO (eventos en tiempo real)
```

Los controladores son finos: extraen datos de `req`, delegan al servicio correspondiente y formatean la respuesta. Toda la lógica de negocio —incluida la validación de reglas de dominio (por ejemplo, comprobar que dos usuarios no estén ya bloqueados antes de aceptar una solicitud de amistad)— vive en la capa de servicio, no en el controlador ni en el modelo.

**Particularidad importante:** las notificaciones y las videollamadas no tienen rutas REST propias (`routes/notification.ts` y `routes/videoCall.ts` existen como esqueletos pero no están montados en `app.ts`). Toda su lógica vive en los manejadores de Socket.IO (`socket/ChatEvents.ts`, `socket/VideoCallEvents.ts`), porque son flujos inherentemente de tiempo real sin necesidad de una representación REST.

### Sistema de emparejamiento de videollamadas

El `VideoCallService` mantiene una cola de espera y un registro de llamadas activas en memoria (singleton con `Map`), sincronizados con la base de datos. Un intervalo en `server.ts` ejecuta una ronda de emparejamiento cada 5 segundos: si hay al menos dos usuarios en cola, los empareja aleatoriamente, crea el registro `VideoCalls` en BD y notifica a ambos vía el evento `match_found`, indicando quién actúa como iniciador de la señalización WebRTC.

```ts
// server.ts
matchingInterval = setInterval(async () => {
    await VideoCallService.performMatchingRound(io);
}, 5000);
```

---

## Stack técnico

| Categoría | Tecnología |
|---|---|
| Runtime | Node.js + TypeScript |
| Framework HTTP | Express 5 |
| Base de datos | PostgreSQL |
| ORM | Sequelize |
| Tiempo real | Socket.IO |
| Autenticación | JWT (con verificación en base de datos) |
| Validación | Celebrate (Joi) + express-validator |
| Subida de archivos | Multer |
| Seguridad | Helmet, CORS, express-rate-limit |
| Logging | Pino (consola) + persistencia en BD + Winston (tipos) |
| Tareas programadas | node-cron + PM2 |
| Internacionalización | i18n (7 idiomas) |
| Testing | Jest + Supertest |

---

## Estructura del código

```
src/
├── app.ts                  # Configuración de Express: middlewares, rutas, manejo de errores
├── server.ts                # Punto de entrada: HTTP server, Socket.IO, sistema de matching
├── config/                  # Base de datos, CORS, Helmet, i18n, logger
├── controllers/              # Una clase por dominio (auth, user, post, chat, comment, friendship, videoCall, notification)
├── services/                  # Lógica de negocio, una clase por dominio
├── models/                     # Modelos Sequelize + definición de asociaciones (models/index.ts)
├── routes/                      # Definición de endpoints Express
├── socket/                       # Manejadores de eventos Socket.IO (chat, comentarios, videollamadas)
├── middlewares/
│   ├── validation/                  # Celebrate/express-validator por dominio
│   └── errors/                       # AppError, AppErrorHandler, CelebrateErrorHandler
├── lang/                              # Traducciones (ca, de, en, es, fr, ja, zh)
├── scripts/                            # cleanup, seed de usuarios, scripts de prueba manual
├── types/                                # Tipos compartidos (custom.d.ts)
└── __tests__/                             # Tests de integración con Supertest
```

---

## Decisiones de implementación

- **JWT con verificación en base de datos:** además de comprobar la firma criptográfica del token, `AuthToken.verifyToken` consulta la tabla `JWT` para confirmar que el token sigue siendo válido. Esto permite invalidar sesiones de forma centralizada (logout real) sin perder la ventaja de un JWT sin estado para el resto de la petición.
- **Errores tipados con `AppError`:** en vez de lanzar errores genéricos, los servicios lanzan `new AppError(status, type)`, donde `type` es una clave que el `AppErrorHandler` resuelve contra los ficheros de traducción siguiendo una jerarquía de categorías (`validation`, `jwt`, `user`, `registry`, `status`, `connection`). Esto desacopla el código de error del mensaje final mostrado al usuario.
- **Doble pipeline de manejo de errores:** los errores de validación de Celebrate se interceptan en `CelebrateErrorHandler` antes de llegar al handler genérico de `AppError`, evitando que errores de esquema (Joi) se traten como errores de aplicación.
- **Rate limiting diferenciado:** límite global de 1000 req/10min en producción, pero un limitador específico de 5 intentos/15min sobre `/auth`, que además ignora los logins exitosos (`skipSuccessfulRequests`) para no penalizar el uso normal.
- **Logging dual:** cada log se escribe en consola con Pino (con colores en desarrollo, formato estructurado en producción) y se persiste en la tabla `Logs` de PostgreSQL, lo que permite consultar el historial de eventos del servidor sin depender de un proveedor externo de logs.
- **Soft delete + purga programada:** los modelos críticos (`User`, `Post`, `PostComments`) usan `paranoid: true` de Sequelize (borrado lógico vía `deleted_at`). Un cron job (`scripts/cleanup.ts`) purga físicamente los registros ya borrados que superan un periodo de retención configurable por variables de entorno (`CLEAN_USERS`, `CLEAN_POSTS`, `CLEAN_COMMENTS`).
- **Despliegue consciente del proxy:** el servidor escucha explícitamente en `0.0.0.0` y fuerza HTTPS en producción inspeccionando la cabecera `x-forwarded-proto`, ya que el despliegue (Railway) está detrás de un proxy inverso que termina TLS antes de reenviar al contenedor.

---

## Modelo de datos

14 modelos Sequelize con relaciones explícitas (definidas en `models/index.ts`, no infraestructura automática):

| Modelo | Propósito |
|---|---|
| `User` | Cuenta de usuario, perfil, flags (`is_moderator`, `active_video_call`) |
| `Post` / `PostLikes` / `PostComments` | Publicaciones y sus interacciones |
| `SavedPosts` | Publicaciones guardadas por usuario |
| `FriendRequest` / `Friends` | Solicitudes y relaciones de amistad confirmadas |
| `ChatMessages` | Mensajería entre usuarios, con estado de entrega/lectura |
| `VideoCalls` / `VideoCallRatings` | Llamadas emparejadas y valoraciones tras la llamada |
| `UserBlocks` | Bloqueos entre usuarios |
| `Reports` / `ContentModeration` | Reportes de usuarios/contenido y acciones de moderación |
| `Notifications` | Notificaciones persistidas por usuario |
| `JWT` | Tokens activos, para permitir invalidación server-side |
| `Logs` | Histórico de logs de aplicación |

Todas las claves primarias son UUID. Las relaciones siguen el patrón `User.hasMany(...)` / `belongsTo(...)` con alias explícitos por dirección (p. ej. `sentFriendRequests` / `receivedFriendRequests`, `blockedUsers` / `blockedBy`), necesario porque varios modelos tienen dos claves foráneas distintas hacia `User`.

---

## Seguridad

- Contraseñas con hash (bcrypt).
- JWT con expiración (1h) + verificación de existencia en BD para invalidación real.
- Cabeceras de seguridad vía Helmet y política CORS explícita por entorno.
- Rate limiting global y específico para autenticación (ver [Decisiones de implementación](#decisiones-de-implementación)).
- Enforcement de HTTPS en producción a nivel de aplicación.
- Validación de payloads en el borde (Celebrate/Joi y express-validator) antes de llegar a los controladores.
- Límite de tamaño de subida de archivos (30 MB) y filtrado de tipo MIME en Multer.
- Endpoints de moderación (`isModerator`) protegidos por un middleware adicional que comprueba el flag `is_moderator` del usuario autenticado.

---

## Internacionalización

Las respuestas de error y éxito se traducen dinámicamente según la cabecera `Accept-Language` de cada petición, usando `i18n` sobre ficheros JSON en `src/lang/`. Idiomas soportados actualmente: catalán, alemán, inglés, español, francés, japonés y chino. El script `lang/syncTranslations.ts` (`npm run sync-translations`) ayuda a mantener sincronizadas las claves entre los distintos ficheros de idioma.

---

## Tareas programadas

| Tarea | Mecanismo | Frecuencia |
|---|---|---|
| Purga de logs antiguos | `node-cron` (in-process) | Diaria, 00:00 |
| Purga de soft-deletes (usuarios, posts, comentarios) | Script standalone + PM2 (`start:cleanup`) | Cron configurable |
| Ronda de emparejamiento de videollamadas | `setInterval` (in-process) | Cada 5 segundos |

---

## Testing

Tests de integración con **Jest + Supertest**, ejecutados contra la app de Express real (no mocks) sobre una base de datos de test separada (`DB_NAME_TEST`). Cobertura sobre los flujos principales: autenticación, usuarios, posts, comentarios, chat, notificaciones y videollamadas.

```bash
npm test              # Suite completa con coverage
npm run test:watch    # Modo watch
npm run test:reset-db # Resetea la base de datos de test
```

---

## Instalación

### Requisitos previos
- Node.js 18+ y npm 9+
- PostgreSQL 14+

### Pasos

```bash
git clone https://github.com/SoyManoolo/M12.git
cd M12/Backend
npm install
```

Crea un `.env` en la raíz del backend:

```env
NODE_ENV=development
PORT=3000

DB_HOST=localhost
DB_USER=postgres
DB_PASS=tu_contraseña
DB_NAME=friendsgo
DB_NAME_TEST=friendsgo_test
DB_PORT=5432
DB_UPDATE=true

JWT_SECRET=         # openssl rand -hex 64
LOGS_DAYS=7
CLEAN_USERS=30
CLEAN_POSTS=15
CLEAN_COMMENTS=7
```

```bash
npm run build   # Compila TypeScript y copia los ficheros de idioma a dist/
npm run dev      # Modo desarrollo (nodemon)
npm start         # Modo producción
```

---

## Referencia de API REST

> Todas las respuestas siguen el formato `{ success, status, message, data? }`. Los endpoints marcados con 🔒 requieren cabecera `Authorization: Bearer <token>`.

### Autenticación (`/auth`)

Sujeto al rate limiter estricto (5 intentos / 15 min).

#### `POST /auth/register`

```sh
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"usuario@ejemplo.com","username":"usuario","name":"Nombre","surname":"Apellido","password":"contraseña"}'
```

```json
{ "success": true, "status": 200, "message": "Usuario registrado correctamente", "token": "jwt_token" }
```

#### `POST /auth/login`

```sh
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"id":"usuario@ejemplo.com","password":"contraseña"}'
```

`id` acepta email o username indistintamente.

#### `DELETE /auth/logout` 🔒

Invalida el token actual eliminándolo de la tabla `JWT`.

### Usuarios (`/users`)

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| GET | `/users` | Lista todos los usuarios | — |
| GET | `/users/search` | Búsqueda flexible de usuarios | — |
| GET | `/users/username?username=` | Busca por username exacto | — |
| GET | `/users/:id` | Busca por UUID | — |
| PATCH | `/users/username` | Actualiza el usuario autenticado | 🔒 |
| PATCH | `/users/:id` | Actualiza un usuario por ID | 🔒 |
| DELETE | `/users/username` | Elimina el usuario autenticado (soft delete) | — |
| DELETE | `/users/:id` | Elimina un usuario por ID (soft delete) | — |
| POST | `/users/username/profile-picture` | Sube foto de perfil (`multipart/form-data`, campo `media`) | 🔒 |
| DELETE | `/users/username/profile-picture` | Elimina la foto de perfil | 🔒 |
| POST | `/users/:id/profile-picture` | Sube foto de perfil por ID | 🔒 |
| DELETE | `/users/:id/profile-picture` | Elimina foto de perfil por ID | 🔒 |

### Posts (`/posts`)

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| GET | `/posts` | Publicaciones paginadas (`?limit=&cursor=`) | — |
| GET | `/posts/:id` | Publicaciones de un usuario | — |
| GET | `/posts/username` | Publicaciones de un usuario por username | — |
| POST | `/posts` | Crea publicación (`multipart/form-data`: `description`, `media` opcional) | 🔒 |
| PATCH | `/posts/:id` | Actualiza la descripción de una publicación | 🔒 |
| DELETE | `/posts/:id` | Elimina una publicación (soft delete) | 🔒 |
| POST | `/posts/:id/like` | Da like | 🔒 |
| DELETE | `/posts/:id/like` | Quita like | 🔒 |
| GET | `/posts/:id/like` | Comprueba si el usuario autenticado ha dado like | 🔒 |

```json
// POST /posts → 200
{
  "success": true, "status": 200, "message": "Publicación creada correctamente",
  "newPost": { "post_id": "uuid", "user_id": "uuid", "description": "...", "createdAt": "..." }
}
```

### Comentarios (`/comments`)

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| POST | `/comments` | Crea un comentario | 🔒 |
| GET | `/comments/:postId` | Lista comentarios de una publicación | — |
| DELETE | `/comments/:commentId` | Elimina un comentario | 🔒 |

### Chat (`/chat`) 🔒

Todas las rutas requieren autenticación. El envío en tiempo real ocurre vía Socket.IO; estos endpoints cubren consulta e historial.

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/chat/list` | Lista de conversaciones del usuario |
| GET | `/chat?receiver_id=` | Mensajes entre el usuario autenticado y otro |
| POST | `/chat` | Crea un mensaje |
| DELETE | `/chat/:message_id` | Elimina un mensaje |
| POST | `/chat/:message_id/delivered` | Marca como entregado |
| POST | `/chat/:message_id/read` | Marca como leído |

### Amistad (`/friendship`) 🔒

Todas las rutas requieren autenticación.

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/friendship/request` | Envía solicitud de amistad |
| POST | `/friendship/request/:request_id/accept` | Acepta solicitud |
| POST | `/friendship/request/:request_id/reject` | Rechaza solicitud |
| POST | `/friendship/request/:request_id/cancel` | Cancela solicitud enviada |
| GET | `/friendship/requests/pending` | Solicitudes pendientes recibidas |
| GET | `/friendship/requests/sent` | Solicitudes enviadas |
| GET | `/friendship/friends` | Lista de amigos |
| GET | `/friendship/status/:other_user_id` | Estado de la relación con otro usuario |
| DELETE | `/friendship/remove/:friend_id` | Elimina una amistad |

> **Nota:** las notificaciones y las videollamadas no exponen rutas REST propias; toda su lógica se gestiona vía Socket.IO (ver siguiente sección).

---

## Eventos de Socket.IO

### Chat (`socket/ChatEvents.ts`)

| Evento (cliente → servidor) | Evento de respuesta | Descripción |
|---|---|---|
| `join-user` | `connection-success` / `error` | Autentica el socket con el token JWT y lo asocia al `user_id` |
| `chat-message` | `new-message` (al receptor) + `chat-message-sent` (al emisor) | Envía un mensaje |
| `message-delivered` | `message-delivery-status` | Marca un mensaje como entregado |
| `message-read` | `message-read-status` | Marca un mensaje como leído |
| `typing` | `user-typing` (al receptor) | Indicador de "escribiendo…" |
| `message-delete` | `message-deleted` (a ambos) | Elimina un mensaje |
| `get-user-status` | `user-status` | Consulta si un usuario está conectado |
| `disconnect` | `user-status` (broadcast) | Notifica desconexión a otros clientes |

### Videollamadas (`socket/VideoCallEvents.ts`)

| Evento (cliente → servidor) | Evento de respuesta | Descripción |
|---|---|---|
| `add_to_queue` | `queue_result` | Se une a la cola de emparejamiento aleatorio |
| _(automático, cada 5s)_ | `match_found` | El servidor empareja dos usuarios en cola y notifica a ambos, indicando quién inicia la señalización |
| `leave_queue` | `leave_queue_result` | Abandona la cola sin esperar match |
| `send_offer` | `receive_offer` (al otro participante) | Reenvía la oferta SDP de WebRTC |
| `send_answer` | `receive_answer` (al otro participante) | Reenvía la respuesta SDP de WebRTC |
| `send_ice_candidate` | `receive_ice_candidate` (al otro participante) | Reenvía candidatos ICE para establecer la conexión P2P |
| `call_connected` | `call_connected_result` | Marca la llamada como conectada en BD y en memoria |
| `end_call` | `end_call_result` | Finaliza la llamada, calcula duración y libera el registro en memoria |
| `disconnect` | — | Limpieza de cola/llamada activa si el usuario se desconecta abruptamente |

### Comentarios (`socket/CommentEvent.ts`)

| Evento | Descripción |
|---|---|
| `post-comment` | Notifica un nuevo comentario en tiempo real |
| `comment-update` | Notifica edición de un comentario |
| `comment-delete` | Notifica eliminación de un comentario |

---

## Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo [LICENSE](../../LICENSE) en la raíz del repositorio.
