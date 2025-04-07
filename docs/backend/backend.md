# Backend proyecto M12 - FriendsGO

## Introducción

## Tecnologías

- **Node.js 23.10.0** + **Express.js 5.0.1**
  *(Nota: en el `package.json` se indica la versión 4.21.2, pero el código y las rutas utilizan middlewares y prácticas compatibles con Express 5)*
- **MySQL 3.11.5** (Base de datos)
- **Sequelize 6.37.5** (ORM para MySQL)
- **JWT 9.0.7** (Autenticación)
- **TypeScript 5.7.3** (Tipado estático)
- **Dotenv 16.4.7** (Gestión de variables de entorno)
- **Celebrate 15.0.3** (Validación de datos, incluido DNI)
- **bcryptjs** (Encriptación de contraseñas)
- **cors** (Habilitar CORS)

## Requisitos previos

### 1. Instalación

### 1. Clonar el repositorio
```sh
git clone <URL_DEL_REPOSITORIO>
cd <NOMBRE_DEL_PROYECTO>
```

### 2. Instalar dependencias
```sh
npm install
```

O, si prefieres usar yarn:

```sh
yarn install
```

### 2. Generación de Clave Secreta para JWT

Para generar una clave segura para JWT, puedes usar:

#### 2.1. Usando OpenSSL (Recomendado)
```sh
openssl rand -hex 64
```
Esto generará una clave de 128 caracteres hexadecimales.

#### 2.2. Usando Node.js
```js
require('crypto').randomBytes(64).toString('hex');
```
Esto generará una clave de 128 caracteres.

#### 2.3. Usando Python
```python
import secrets
print(secrets.token_hex(64))
```
Esto generará una clave de 128 caracteres hexadecimales.

#### 2.4. Herramientas en línea
- Keygen
- Random.org

## Endpoints