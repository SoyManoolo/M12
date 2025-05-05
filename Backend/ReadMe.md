# Backend proyecto M12 - FriendsGO

## Índice

1. [Introducción](#introducción)
2. [Tecnologías](#tecnologías)
3. [Requisitos previos](#requisitos-previos)
   1. [Instalación](#1-instalación)
   2. [Configuración](#2-configuración)
   3. [Base de datos](#3-base-de-datos)
   4. [Compilar y ejecutar](#4-compilar-y-ejecutar)
4. [Estructura del proyecto](#estructura-del-proyecto)
5. [API Endpoints](#api-endpoints)
   1. [Autenticación](#autenticación)
   2. [Usuarios](#usuarios)
   3. [Posts](#posts)
   4. [Chat](#chat)
6. [WebSockets](#websockets)
7. [Testing](#testing)
8. [Licencia](#licencia)

## Introducción

**FriendsGO** es una plataforma de redes sociales que permite a los usuarios conectar mediante publicaciones, comentarios, mensajes directos y videollamadas. Este repositorio contiene el backend de la aplicación, desarrollado con **Node.js**, **Express** y **PostgreSQL**.

---

## Tecnologías

* **Node.js** 23.10.0 + **Express.js** 5.0.1
  *(Nota: en el package.json se indica la versión 4.21.2, pero el código y las rutas utilizan middlewares y prácticas compatibles con Express 5)*
* **PostgreSQL** 8.13.3 (Base de datos)
* **Sequelize** 6.37.5 (ORM para PostgreSQL)
* **JWT** 9.0.7 (Autenticación)
* **TypeScript** 5.7.3 (Tipado estático)
* **Socket.io** 4.8.1 (Comunicación en tiempo real)
* **Dotenv** 16.4.7 (Gestión de variables de entorno)
* **Celebrate** 15.0.3 (Validación de datos)
* **bcryptjs** (Encriptación de contraseñas)
* **i18n** (Internacionalización)
* **Jest** (Testing)

---

## Requisitos previos

### 1. Instalación

#### 1.1. Clonar el repositorio

```bash
git clone <URL_DEL_REPOSITORIO>
cd <NOMBRE_DEL_PROYECTO>
```

#### 1.2. Instalar dependencias

```bash
npm install
```

O, si prefieres usar yarn:

```bash
yarn install
```

---

### 2. Configuración

#### 2.1. Archivo `.env`

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
# Entorno
NODE_ENV=development

# Servidor
PORT=3000

# Base de datos
DB_HOST=localhost
DB_USER=postgres
DB_PASS=your_password
DB_NAME=friendsgo
DB_NAME_TEST=friendsgo_test
DB_PORT=5432
DB_UPDATE=true

# JWT
JWT_SECRET=your_jwt_secret

# Logs
LOGS_DAYS=7

# Limpieza de datos (días)
CLEAN_USERS=30
CLEAN_POSTS=15
CLEAN_COMMENTS=7
```

#### 2.2. Generación de Clave Secreta para JWT

##### 2.2.1. Usando OpenSSL (Recomendado)

```bash
openssl rand -hex 64
```

##### 2.2.2. Usando Node.js

```js
require('crypto').randomBytes(64).toString('hex');
```

##### 2.2.3. Usando Python

```python
import secrets
print(secrets.token_hex(64))
```

##### 2.2.4. Herramientas en línea

* [Keygen](https://keygen.io/)
* [Random.org](https://www.random.org/)

---

### 3. Base de datos

La aplicación utiliza **PostgreSQL**. Asegúrate de tenerlo instalado y configurado correctamente.

---

### 4. Compilar y ejecutar

```bash
# Compilar el proyecto
npm run build

# Iniciar en modo producción
npm start

# Iniciar en modo desarrollo
npm run dev

# Ejecutar tests
npm test
```

---

## Estructura del proyecto

```
/src
  /config         # Configuración (base de datos, i18n, etc.)
  /controllers    # Controladores
  /lang           # Archivos de traducción
  /middlewares    # Middlewares de autenticación, errores, etc.
  /models         # Modelos de Sequelize
  /routes         # Rutas de la API
  /scripts        # Scripts de mantenimiento
  /services       # Lógica de negocio
  /socket         # Manejadores de eventos de Socket.io
  /types          # Definiciones de tipos
  /utils          # Utilidades
  /__tests__      # Tests
  app.ts          # Configuración de Express
  server.ts       # Punto de entrada principal
```

---

## API Endpoints

### Autenticación

#### `POST /auth/register`

Registra un nuevo usuario.

```sh
curl -X POST http://localhost:3000/auth/register
```

**Body:**

```json
{
  "email": "usuario@ejemplo.com",
  "username": "usuario",
  "name": "Nombre",
  "surname": "Apellido",
  "password": "contraseña"
}
```

**Respuesta:**

```json
{
  "success": true,
  "status": 200,
  "message": "Usuario registrado correctamente",
  "token": "jwt_token"
}
```

#### `POST /auth/login`

```sh
curl -X POST http://localhost:3000/auth/login
```

Inicia sesión.

**Body:**

```json
{
  "id": "usuario@ejemplo.com",
  "password": "contraseña"
}
```

**Respuesta:**

```json
{
  "success": true,
  "status": 200,
  "message": "Inicio de sesión correcto",
  "token": "jwt_token"
}
```

### Usuarios

#### `GET /users`

Obtiene todos los usuarios.

```sh
curl -X GET http://localhost:3000/users
```

**Headers:**

```
Authorization: Bearer token
```

**Respuesta:**

```json
{
  "success": true,
  "status": 200,
  "message": "Usuarios obtenidos correctamente",
  "data": [
    {
      "user_id": "uuid",
      "username": "usuario",
      "email": "usuario@ejemplo.com",
      // ...otros campos del usuario
    }
  ]
}
```

#### `GET /users/:id`

Obtiene un usuario específico por ID.

```sh
curl -X GET http://localhost:3000/users/:id
```

**Headers:**

```
Authorization: Bearer token
```

**Respuesta:**

```json
{
  "success": true,
  "status": 200,
  "message": "Usuario obtenido correctamente",
  "data": {
    "user_id": "uuid",
    "username": "usuario",
    "email": "usuario@ejemplo.com",
    // ...otros campos del usuario
  }
}
```

#### `GET /users/username`

Obtiene un usuario específico por nombre de usuario.

```sh
curl -X POST http://localhost:3000/users/username?username=nombre_usuario
```

**Headers:**

```
Authorization: Bearer token
```

**Query Params:**

```
username=nombreUsuario
```

**Respuesta:**

```json
{
  "success": true,
  "status": 200,
  "message": "Usuario obtenido correctamente",
  "data": {
    "user_id": "uuid",
    "username": "usuario",
    "email": "usuario@ejemplo.com",
    // ...otros campos del usuario
  }
}
```

#### `PATCH /users/:id`

Actualiza la información de un usuario por ID.

```sh
curl -X PATCH http://localhost:3000/users/:id
```

**Headers:**

```
Authorization: Bearer token
```

**Body:**

```json
{
  "username": "nuevoUsuario",
  "name": "Nuevo Nombre",
  // ...otros campos a actualizar
}
```

**Respuesta:**

```json
{
  "success": true,
  "status": 200,
  "message": "Usuario actualizado correctamente",
  "data": {
    // Datos del usuario actualizado
  }
}
```

#### `PATCH /users`

Actualiza la información del usuario autenticado.

```sh
curl -X PATCH http://localhost:3000/users/username?username=nombre_usuario
```

**Headers:**

```
Authorization: Bearer token
```

**Body:**

```json
{
  "username": "nuevoUsuario",
  "name": "Nuevo Nombre",
  // ...otros campos a actualizar
}
```

**Respuesta:**

```json
{
  "success": true,
  "status": 200,
  "message": "Usuario actualizado correctamente",
  "data": {
    // Datos del usuario actualizado
  }
}
```

#### `DELETE /users/:id`

Elimina un usuario específico por ID.

```sh
curl -X DELETE http://localhost:3000/users/:id
```

**Headers:**

```
Authorization: Bearer token
```

**Respuesta:**

```json
{
  "success": true,
  "status": 200,
  "message": "Usuario eliminado correctamente"
}
```

#### `DELETE /users/username`

Elimina el usuario autenticado.

**Headers:**

```
Authorization: Bearer token
```

**Respuesta:**

```json
{
  "success": true,
  "status": 200,
  "message": "Usuario eliminado correctamente"
}
```

### Posts

#### `POST /posts`

Crea una nueva publicación.

```sh
curl -X POST http://localhost:3000/posts
```

**Headers:**

```
Authorization: Bearer token
Content-Type: multipart/form-data
```

**Body:**

```
description: "Texto de la publicación"
media: [archivo] (opcional)
```

**Respuesta:**

```json
{
  "success": true,
  "status": 200,
  "message": "Publicación creada correctamente",
  "newPost": {
    "post_id": "uuid",
    "user_id": "uuid",
    "description": "Texto de la publicación",
    "createdAt": "2023-06-01T12:00:00.000Z",
    // ...otros campos
  }
}
```

#### `GET /posts`

Obtiene publicaciones paginadas.

```sh
curl -X GET http://localhost:3000/posts
```

**Query Params (opcionales):**

```
limit=10
cursor=post_id
```

**Respuesta:**

```json
{
  "success": true,
  "status": 200,
  "message": "Publicaciones obtenidas correctamente",
  "data": {
    "posts": [
      {
        "post_id": "uuid",
        "user_id": "uuid",
        "description": "Texto de la publicación",
        "createdAt": "2023-06-01T12:00:00.000Z",
        // ...otros campos
      }
    ],
    "hasNextPage": true,
    "nextCursor": "post_id"
  }
}
```

#### `PATCH /posts/:id`

Actualiza una publicación específica.

```sh
curl -X PATCH http://localhost:3000/posts/:id
```

**Headers:**

```
Authorization: Bearer token
```

**Body:**

```json
{
  "description": "Nuevo texto de la publicación"
}
```

**Respuesta:**

```json
{
  "success": true,
  "status": 200,
  "message": "Publicación actualizada correctamente",
  "data": {
    "post_id": "uuid",
    "user_id": "uuid",
    "description": "Nuevo texto de la publicación",
    "updatedAt": "2023-06-01T13:00:00.000Z",
    // ...otros campos
  }
}
```

#### `DELETE /posts/:id`

Elimina una publicación específica.

```sh
curl -X DELETE http://localhost:3000/posts/:id
```

**Headers:**

```
Authorization: Bearer token
```

**Respuesta:**

```json
{
  "success": true,
  "status": 200,
  "message": "Publicación eliminada correctamente",
  "data": {
    "post_id": "uuid",
    // ...información básica sobre la publicación eliminada
  }
}
```

### Chat

#### `GET /chat`

Obtiene los mensajes entre dos usuarios.

```sh
curl -X GET http://localhost:3000/chat
```

**Headers:**

```
Authorization: Bearer token
```

**Body:**

```json
{
  "receiver_id": "uuid"
}
```

**Respuesta:**

```json
{
  "success": true,
  "status": 200,
  "message": "Mensajes obtenidos correctamente",
  "data": [
    {
      "message_id": "uuid",
      "sender_id": "uuid",
      "receiver_id": "uuid",
      "content": "Hola, ¿cómo estás?",
      "sent_at": "2023-06-01T12:00:00.000Z",
      "read": true,
      // ...otros campos
    }
  ]
}
```

---

## WebSockets

La aplicación utiliza Socket.IO para la comunicación en tiempo real. Algunos de los eventos disponibles son:

### Chat

- `join_room`: Unirse a una sala de chat
- `leave_room`: Salir de una sala de chat
- `send_message`: Enviar un mensaje
- `receive_message`: Recibir un mensaje
- `typing`: Usuario está escribiendo
- `stop_typing`: Usuario dejó de escribir

### Videollamada

- `call_user`: Llamar a otro usuario
- `answer_call`: Responder a una llamada
- `end_call`: Finalizar llamada
- `reject_call`: Rechazar llamada
- `ice_candidate`: Intercambio de candidatos ICE
- `offer`: Enviar oferta SDP
- `answer`: Enviar respuesta SDP

---

## Testing

El proyecto incluye pruebas unitarias e integración usando Jest. Para ejecutar las pruebas:

```bash
npm test
```

---

## Licencia

Este proyecto está licenciado bajo la licencia MIT - ver el archivo LICENSE para más detalles.
