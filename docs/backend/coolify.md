# Despliegue del backend en Coolify (Geekom)

El backend se construye con **Railpack** (builder por defecto de Coolify), sin Dockerfile ni Compose. Node 20 sale de `engines` en `Backend/package.json`.
El tráfico público entra por el túnel de Cloudflare `geekom-web` → Traefik de Coolify (`localhost:80`) → app.

## 1. Base de datos

En el proyecto de Coolify: **+ New → Database → PostgreSQL 16**.

- Recurso `friendsgo-db`, usuario y base `friendsgo`. Sin puerto público.
- El hostname interno es el UUID del recurso (se usa como `DB_HOST`).
- Activa copias programadas en *Backups*.

## 2. Aplicación

**+ New → Public/Private Repository** → `SoyManoolo/M12`, rama `main`.

| Campo | Valor |
| --- | --- |
| Build Pack | Railpack |
| Comandos | `npm ci` / `npm run build` / `npm start` |
| Base Directory | `/Backend` |
| Ports Exposes | `8080` |
| Domain | `http://api.lakbast.com` (ver paso 4) |
| Health Check | path `/health`, puerto `8080`, start period 30 s (actívalo solo si la imagen tiene `curl` o `wget`) |

**Persistent Storage**: volumen en `/app/media` (imágenes y vídeos subidos). Sin él se pierden en cada despliegue.

## 3. Variables de entorno

| Variable | Valor |
| --- | --- |
| `PORT` | `8080` |
| `DB_HOST` | Hostname interno del paso 1 |
| `DB_PORT`, `DB_NAME`, `DB_USER` | `5432`, `friendsgo`, `friendsgo` |
| `DB_PASS` | Contraseña generada por Coolify para `friendsgo-db` |
| `DB_UPDATE` | `true` (aplica migraciones al arrancar) |
| `JWT_SECRET` | Aleatorio, ≥ 32 caracteres (`openssl rand -hex 32`) |
| `FRONTEND_URL` | URL pública del frontend, sin `/` final |
| `CORS_ORIGINS` | Orígenes extra separados por comas (opcional) |
| `TRUST_PROXY` | `2` (cloudflared + Traefik) |
| `FORCE_HTTPS` | `false` (Cloudflare ya fuerza HTTPS en el borde) |
| `LOGS_DAYS`, `CLEAN_USERS`, `CLEAN_POSTS`, `CLEAN_COMMENTS` | `7`, `30`, `15`, `7` |
| `RESEND_API_KEY`, `EMAIL_FROM` | Recuperación de contraseña (opcional) |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL` | Login con Google (opcional). Callback: `https://api.lakbast.com/auth/google/callback` |

No definas `NODE_ENV`: llega también al build y `npm ci` omitiría las devDependencies (TypeScript, cross-env). `npm start` ya fija `NODE_ENV=production`.

Alternativa: `DATABASE_URL` con la URL interna y `DB_SSL=false` (las `DB_*` siguen siendo obligatorias por el esquema).

## 4. Dominio público

1. En Cloudflare Zero Trust → túnel `geekom-web` → *Public Hostname*: `api.lakbast.com` → `http://localhost:80`.
2. En Coolify, el dominio de la app con `http://` (el TLS lo termina Cloudflare; con `https://` Traefik redirigiría y provocaría un bucle).
3. Cloudflare → *Network*: WebSockets activado (Socket.IO).

## 5. Administrador

Tras el primer despliegue, en la terminal de la app en Coolify:

```bash
npm run create-admin
```

Necesita `BOOTSTRAP_ADMIN_USERNAME`, `BOOTSTRAP_ADMIN_EMAIL`, `BOOTSTRAP_ADMIN_NAME`, `BOOTSTRAP_ADMIN_SURNAME` y `BOOTSTRAP_ADMIN_PASSWORD`. Añádelas, ejecútalo y bórralas después.

## 6. Comprobación

```bash
curl https://api.lakbast.com/health
```

Debe devolver `{"status":"ok",...,"checks":{"database":"ok"}}`.
