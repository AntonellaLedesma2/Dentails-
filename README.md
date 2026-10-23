# DENTALIS — Sistema de Gestión Odontológica

Aplicación móvil para la gestión de una clínica odontológica: pacientes, turnos, fichas clínicas, tratamientos y pagos.

---

## Estructura del proyecto

```
Trabajo final/
├── backend/    → API REST (Node.js + Express + MariaDB)
└── frontend/   → Aplicación móvil (React Native + Expo)
```

---

## Requisitos previos

| Herramienta | Versión recomendada |
|---|---|
| Node.js | 22.13+ (requerido por Expo SDK 58) |
| npm | 9+ |
| MariaDB | 10.6+ |
| Expo Go (opcional) | última versión en Play Store |

---

## Backend

### 1. Instalación

```bash
cd backend
npm install
```

### 2. Configuración

Editá el archivo `.env` con tus datos:

```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_contraseña
DB_NAME=dentalis
DB_PORT=3306

JWT_SECRET=clave_secreta_muy_larga
JWT_EXPIRES_IN=1h
JWT_REFRESH_SECRET=clave_refresh_muy_larga
JWT_REFRESH_EXPIRES_IN=7d

EMAIL_SERVICE=gmail
EMAIL_USER=tu_email@gmail.com
EMAIL_PASSWORD=tu_password_de_aplicacion
```

### 3. Base de datos

Ejecutá el script SQL en MariaDB:

```bash
mysql -u root -p < src/config/schema.sql
```

O desde el cliente MariaDB:
```sql
source /ruta/al/proyecto/backend/src/config/schema.sql
```

### 4. Ejecutar

```bash
npm run dev      # Modo desarrollo (nodemon)
npm start        # Modo producción
```

El servidor queda disponible en `http://localhost:3000`.

### Datos ficticios para recorrer las pantallas

Con MariaDB encendida y el esquema creado, desde la carpeta `backend` ejecutá:

```bash
npm run seed:demo
```

El comando carga 15 pacientes de prueba, 4 odontólogos, una cuenta de recepción, turnos anteriores y futuros, fichas clínicas con odontogramas, planes de tratamiento y pagos. Los datos usan nombres y contactos ficticios (`.test` / `example.test`). Podés repetirlo sin duplicar las citas o pagos de demostración.

Las cuentas de demostración son `ana.benitez@dentalis.test`, `mateo.gomez@dentalis.test`, `lucia.rojas@dentalis.test`, `nicolas.vera@dentalis.test` (odontólogos) y `recepcion.demo@dentalis.test` (recepción). La contraseña común es `DentalisDemo123!`. Cambiala o eliminá estas cuentas antes de usar una base real. El seed no crea ni modifica cuentas de administrador.

**Usuario administrador local por defecto:**
- Correo: `admin@dentalis.com`
- Contraseña: `Admin1234!` *(cambiala antes de usar una base real)*

---

## Frontend

### 1. Instalación

```bash
cd frontend
npm install
```

### 2. Configuración de la URL de la API

Configurá las URLs de API en `frontend/.env` (podés partir de `frontend/.env.example`):

| Entorno | URL |
|---|---|
| Emulador Android | `http://10.0.2.2:3000/api` |
| iPhone o Android físico | `EXPO_PUBLIC_API_URL_NATIVE=http://TU_IP_LOCAL:3000/api` |
| Web (Expo web) | `http://localhost:3000/api` |

Para encontrar tu IP local en Windows: ejecutá `ipconfig` en la terminal.

El teléfono y la computadora deben estar en la misma red Wi-Fi, MariaDB y el backend deben estar encendidos, y Windows debe permitir conexiones al puerto 3000. Si cambiás de red, actualizá `EXPO_PUBLIC_API_URL_NATIVE` y reiniciá Expo.

### 3. Configuración de inicio de sesión social

El backend intercambia el código OAuth y valida la identidad con el proveedor. Configurá en `backend/.env` los IDs y secretos de Google y GitHub, y también `FACEBOOK_APP_ID` y `FACEBOOK_APP_SECRET` para Meta. El `client ID` de cada proveedor debe coincidir con el `EXPO_PUBLIC_*_CLIENT_ID` o `EXPO_PUBLIC_FACEBOOK_APP_ID` incluido al crear la app.

Agregá `com.dentalis.app://oauth` como URI de retorno permitida donde corresponda en la configuración OAuth de cada proveedor y mantené el mismo valor en `OAUTH_REDIRECT_URI`. Para Google, la configuración del cliente debe admitir el flujo de app Android y su esquema de retorno. GitHub debe permitir el callback de la aplicación. En Meta, habilitá el inicio de sesión y el permiso `email`.

Las credenciales OAuth privadas permanecen en el backend; no copies los secretos al frontend ni al APK.

### 4. Ejecutar

Usá dos terminales de PowerShell: primero encendé MariaDB en Servicios de Windows; luego iniciá la API:

```powershell
cd "C:\Users\ledes\OneDrive\Escritorio\Trabajo final\backend"
npm start
```

En otra terminal, iniciá Expo y escaneá el QR nuevo con Expo Go:

```bash
cd "C:\Users\ledes\OneDrive\Escritorio\Trabajo final\frontend"
npm start
```

El proyecto ahora usa Expo SDK 58; cerrá la sesión anterior de Expo Go y escaneá el QR del servidor recién iniciado.

---

## API — Documentación de endpoints

### Autenticación

| Método | Endpoint | Descripción | Auth |
|---|---|---|---|
| POST | `/api/auth/login` | Iniciar sesión | No |
| POST | `/api/auth/verify-2fa` | Verificar código 2FA | No |
| POST | `/api/auth/refresh` | Renovar access token | No |
| POST | `/api/auth/logout` | Cerrar sesión | Sí |
| POST | `/api/auth/oauth` | Login con Google/GitHub/Facebook | No |

**Body login:**
```json
{ "identifier": "admin@dentalis.com", "password": "Admin1234!" }
```

**Respuesta exitosa:**
```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "user": { "id": 1, "nombre": "Admin", "rol": "administrador" }
}
```

### Usuarios

| Método | Endpoint | Descripción | Roles permitidos |
|---|---|---|---|
| GET | `/api/users` | Listar todos los usuarios | administrador |
| GET | `/api/users/me` | Perfil propio | todos |
| GET | `/api/users/:id` | Ver usuario por ID | administrador |
| POST | `/api/users` | Crear usuario | administrador |
| PATCH | `/api/users/:id` | Editar rol o estado | administrador |
| PUT | `/api/users/me/password` | Cambiar contraseña propia | todos |

**Headers requeridos (rutas protegidas):**
```
Authorization: Bearer <accessToken>
```

**Crear usuario (body):**
```json
{
  "nombre": "María",
  "apellido": "González",
  "correo": "maria@dentalis.com",
  "password": "Contraseña123!",
  "rol": "recepcion"
}
```

**Roles válidos:** `administrador` | `recepcion` | `odontologo` | `usuario`

### Códigos de error comunes

| Código | Significado |
|---|---|
| 401 | Token inválido o expirado |
| 403 | Sin permisos para la operación |
| 404 | Recurso no encontrado |
| 409 | Conflicto (ej: correo ya registrado) |
| 422 | Error de validación en los datos enviados |

---

## Roles y permisos

| Funcionalidad | Administrador | Recepción | Odontólogo |
|---|:---:|:---:|:---:|
| Gestionar usuarios | ✅ | ❌ | ❌ |
| Ver agenda | ✅ | ✅ | ✅ (solo propia) |
| Gestionar pacientes | ✅ | ✅ | 👁️ (solo lectura) |
| Ficha clínica | ❌ | ❌ | ✅ |
| Tratamientos | ✅ | ❌ | ✅ |
| Registrar pagos | ✅ | ✅ | ❌ |
| Ver reportes | ✅ | ❌ | ❌ |
| Acceso de usuario básico | — | — | — |

---

## Control de versiones

Se usa Git para el control de versiones. Commits con mensajes descriptivos en español.

```bash
git init
git add .
git commit -m "feat: estructura inicial del proyecto DENTALIS"
```

---

## Variables de entorno — Resumen

| Variable | Descripción |
|---|---|
| `DB_*` | Conexión a MariaDB |
| `JWT_SECRET` | Clave para firmar access tokens |
| `JWT_REFRESH_SECRET` | Clave para firmar refresh tokens |
| `EMAIL_USER` | Email para envío de códigos 2FA |
| `EMAIL_PASSWORD` | Contraseña de aplicación de Gmail |
| `GOOGLE_CLIENT_ID` | ID de app en Google Cloud Console |
| `GITHUB_CLIENT_ID` | ID de app en GitHub Developer Settings |
| `FACEBOOK_APP_ID` | ID de app en Meta for Developers |
