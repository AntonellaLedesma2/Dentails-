# DENTALIS — Guía de Instalación y Configuración
### Versión 1.0.0

---

## Índice

1. [Requisitos previos](#1-requisitos-previos)
2. [Clonar el repositorio](#2-clonar-el-repositorio)
3. [Configurar el Backend](#3-configurar-el-backend)
4. [Configurar la Base de Datos](#4-configurar-la-base-de-datos)
5. [Configurar el Frontend](#5-configurar-el-frontend)
6. [Ejecutar el proyecto](#6-ejecutar-el-proyecto)
7. [Instalar la app en Android](#7-instalar-la-app-en-android)
8. [Variables de entorno](#8-variables-de-entorno)
9. [Solución de problemas comunes](#9-solución-de-problemas-comunes)

---

## 1. Requisitos previos

Instalá las siguientes herramientas antes de comenzar:

| Herramienta | Versión | Descarga |
|---|---|---|
| Node.js | 18 o superior | https://nodejs.org |
| npm | 9 o superior (incluido con Node.js) | — |
| MariaDB | 10.6 o superior | https://mariadb.org/download |
| Git | cualquier versión reciente | https://git-scm.com |

**Verificar instalación:**
```bash
node --version     # debe mostrar v18.x.x o superior
npm --version      # debe mostrar 9.x.x o superior
git --version      # debe mostrar git version x.x.x
```

---

## 2. Clonar el repositorio

```bash
git clone https://github.com/AntonellaLedesma2/Dentails-.git
cd Dentails-
```

La estructura del proyecto es:
```
Dentails-/
├── backend/     → API REST (Node.js + Express)
├── frontend/    → App móvil (React Native + Expo)
├── README.md
├── MANUAL_USUARIO.md
└── GUIA_INSTALACION.md
```

---

## 3. Configurar el Backend

### 3.1 Instalar dependencias

```bash
cd backend
npm install
```

### 3.2 Crear el archivo de entorno

Copiá el archivo de ejemplo y editalo con tus datos:

```bash
# En Windows (PowerShell)
Copy-Item .env.example .env
```

Abrí el archivo `.env` con cualquier editor de texto y completá los valores:

```env
# Puerto del servidor
PORT=3000
NODE_ENV=development

# Base de datos MariaDB
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_contraseña_de_mariadb
DB_NAME=dentalis
DB_PORT=3306

# JWT — Cambiá estos valores por cadenas largas y aleatorias
JWT_SECRET=clave_secreta_muy_larga_y_segura_cambiar
JWT_EXPIRES_IN=1h
JWT_REFRESH_SECRET=clave_refresh_muy_larga_y_segura_cambiar
JWT_REFRESH_EXPIRES_IN=7d

# Email para 2FA (opcional para desarrollo)
EMAIL_SERVICE=gmail
EMAIL_USER=tu_correo@gmail.com
EMAIL_PASSWORD=contraseña_de_aplicacion_gmail
```

> **Nota:** Para `EMAIL_PASSWORD` necesitás una contraseña de aplicación de Gmail, no tu contraseña normal. Podés generarla en: Cuenta de Google → Seguridad → Verificación en 2 pasos → Contraseñas de aplicaciones.

---

## 4. Configurar la Base de Datos

### 4.1 Crear la base de datos

Abrí una terminal y conectate a MariaDB:

```bash
# En Windows, ajustar la ruta según tu instalación
"C:\Program Files\MariaDB 10.6\bin\mysql.exe" -u root -p
```

Ingresá tu contraseña cuando se solicite. Luego ejecutá:

```sql
CREATE DATABASE IF NOT EXISTS dentalis CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

### 4.2 Ejecutar el schema

**Opción A — Desde PowerShell:**
```powershell
Get-Content "backend\src\config\schema.sql" | & "C:\Program Files\MariaDB 10.6\bin\mysql.exe" -u root -p dentalis
```

**Opción B — Desde el cliente MariaDB:**
```sql
USE dentalis;
SOURCE C:/ruta/al/proyecto/backend/src/config/schema.sql;
```

**Opción C — Con HeidiSQL o DBeaver:**
1. Conectate a `localhost` con tu usuario y contraseña
2. Seleccioná la base de datos `dentalis`
3. Abrí el archivo `backend/src/config/schema.sql`
4. Ejecutalo

### 4.3 Verificar la instalación

```sql
USE dentalis;
SHOW TABLES;
```

Deberías ver estas tablas:
- `consultas`
- `fichas_clinicas`
- `pacientes`
- `pagos`
- `registro_actividad`
- `tratamientos`
- `turnos`
- `usuarios`

### 4.4 Usuario administrador por defecto

El script crea automáticamente un usuario administrador:

| Campo | Valor |
|---|---|
| Correo | admin@dentalis.com |
| Usuario | admin |
| Contraseña | `password` |
| Rol | administrador |

> ⚠️ **Importante:** Cambiá la contraseña del administrador inmediatamente después del primer inicio de sesión.

---

## 5. Configurar el Frontend

### 5.1 Instalar dependencias

```bash
cd frontend
npm install
```

### 5.2 Configurar la URL de la API

Editá el archivo `frontend/src/services/api.js` según tu entorno:

**Para desarrollo en web (Chrome):**
```javascript
// La URL se detecta automáticamente como localhost:3000
// No es necesario cambiar nada
```

**Para dispositivo físico Android/iOS:**
```bash
# Buscá tu IP local en Windows
ipconfig
# Buscá "Dirección IPv4" — ejemplo: 192.168.1.100
```

Luego editá `frontend/.env`:
```env
EXPO_PUBLIC_API_URL_NATIVE=http://192.168.1.100:3000/api
```

> El celular y la PC deben estar en la **misma red WiFi**.

### 5.3 Configurar OAuth (opcional)

Si querés usar login con Google, GitHub o Discord, completá los IDs en `frontend/src/screens/auth/OAuthLoginScreen.js`:

```javascript
const PROVIDERS = {
  google: {
    clientId: 'TU_GOOGLE_WEB_CLIENT_ID.apps.googleusercontent.com',
    // ...
  },
  github: {
    clientId: 'TU_GITHUB_CLIENT_ID',
    // ...
  },
  // ...
};
```

---

## 6. Ejecutar el proyecto

Necesitás **dos terminales** abiertas simultáneamente:

### Terminal 1 — Backend:
```bash
cd backend
npm run dev
```

Salida esperada:
```
✅ Conexión a MariaDB establecida correctamente
🚀 Servidor corriendo en http://localhost:3000
📝 Entorno: development
```

### Terminal 2 — Frontend (web):
```bash
cd frontend
npm run web
```

Se abre automáticamente en `http://localhost:8081`.

### Terminal 2 — Frontend (Expo Go en celular):
```bash
cd frontend
npm start
```

Escaneá el código QR con la app **Expo Go** (disponible en Play Store y App Store).

---

## 7. Instalar la app en Android

### Opción A — APK directo (recomendado)

Descargá el APK desde:
```
https://expo.dev/artifacts/eas/4cvfFpfpRBioZmSw7GXiN_fEWm3xNybvvieh7qj46qM.apk
```

**En el celular Android:**
1. Abrí el link desde el navegador del celular
2. Descargá el archivo `.apk`
3. Abrí el archivo descargado
4. Si aparece "Google Play Protect bloqueó la app":
   - Tocá **"Más detalles"**
   - Tocá **"Instalar de todas formas"**
5. La app aparece como **DENTALIS** en el cajón de aplicaciones

### Opción B — Generar nuevo APK con EAS

Requiere cuenta en [expo.dev](https://expo.dev):

```bash
# Instalar EAS CLI
npm install -g eas-cli

# Iniciar sesión
eas login

# Generar APK
cd frontend
eas build --platform android --profile preview
```

Al finalizar (10-15 min), EAS proporciona un link de descarga.

---

## 8. Variables de entorno

### Backend — `backend/.env`

| Variable | Descripción | Ejemplo |
|---|---|---|
| `PORT` | Puerto del servidor | `3000` |
| `NODE_ENV` | Entorno de ejecución | `development` |
| `DB_HOST` | Host de MariaDB | `localhost` |
| `DB_USER` | Usuario de MariaDB | `root` |
| `DB_PASSWORD` | Contraseña de MariaDB | `mipassword` |
| `DB_NAME` | Nombre de la base de datos | `dentalis` |
| `DB_PORT` | Puerto de MariaDB | `3306` |
| `JWT_SECRET` | Clave secreta para tokens | cadena larga aleatoria |
| `JWT_EXPIRES_IN` | Expiración del access token | `1h` |
| `JWT_REFRESH_SECRET` | Clave para refresh tokens | cadena larga aleatoria |
| `JWT_REFRESH_EXPIRES_IN` | Expiración del refresh token | `7d` |
| `EMAIL_SERVICE` | Servicio de email | `gmail` |
| `EMAIL_USER` | Correo para envío de 2FA | `correo@gmail.com` |
| `EMAIL_PASSWORD` | Contraseña de aplicación | — |
| `GOOGLE_CLIENT_ID` | Client ID de Google OAuth | — |
| `GITHUB_CLIENT_ID` | Client ID de GitHub OAuth | — |
| `DISCORD_CLIENT_ID` | Client ID de Discord OAuth | — |

### Frontend — `frontend/.env`

| Variable | Descripción | Ejemplo |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | URL de la API (automática) | `http://localhost:3000/api` |
| `EXPO_PUBLIC_API_URL_NATIVE` | URL para dispositivo físico | `http://192.168.1.100:3000/api` |

---

## 9. Solución de problemas comunes

### El backend no conecta a MariaDB

```
❌ Error al conectar con MariaDB: Access denied
```

**Solución:** Verificá que la contraseña en `.env` sea correcta:
```bash
"C:\Program Files\MariaDB 10.6\bin\mysql.exe" -u root -p
# Si accedés, la contraseña es correcta
```

---

### La app no se conecta al backend desde el celular

**Síntomas:** La app carga pero no trae datos, da error de red.

**Soluciones:**
1. Verificá que el backend esté corriendo (`npm run dev`)
2. Verificá que el celular esté en la **misma WiFi** que la PC
3. Confirmá la IP de la PC con `ipconfig`
4. Actualizá `EXPO_PUBLIC_API_URL_NATIVE` con la IP correcta
5. Desactivá temporalmente el Firewall de Windows para probar

---

### Puerto 8081 ocupado al iniciar el frontend

```
Port 8081 is being used by another process
```

**Solución:** Presioná **Y** cuando pregunte si usar el puerto 8082. No afecta el funcionamiento.

---

### Error "cannot find module" al iniciar el backend

```
Error: Cannot find module 'express'
```

**Solución:**
```bash
cd backend
npm install
```

---

### El APK no se instala en Android

Si aparece "Aplicación no instalada":
1. Asegurate de haber descargado el archivo completo
2. Activá **"Fuentes desconocidas"** en Configuración → Seguridad del celular
3. Si sigue sin funcionar, descargá el APK directamente desde el celular (no lo transfieras por cable)

---

*DENTALIS v1.0.0 — Guía de Instalación*
