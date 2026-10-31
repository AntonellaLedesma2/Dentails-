# DENTALIS — Sistema de Gestión Odontológica

Aplicación móvil y web para la gestión integral de clínicas odontológicas.

**Stack:** React Native + Expo (frontend) · Node.js + Express (backend) · MariaDB (base de datos)

---

## Documentación

| Documento | Descripción |
|---|---|
| [Manual de Usuario](./MANUAL_USUARIO.md) | Cómo usar la aplicación |
| [Guía de Instalación](./GUIA_INSTALACION.md) | Cómo instalar y configurar el proyecto |
| Este README | Documentación técnica de la API |

---

## Estructura del proyecto

```
Dentalis-/
├── backend/                  → API REST
│   ├── src/
│   │   ├── config/           → Conexión DB y schema SQL
│   │   ├── controllers/      → Lógica de negocio
│   │   ├── middlewares/      → Auth, validación, errores
│   │   ├── models/           → Acceso a la base de datos
│   │   ├── routes/           → Definición de endpoints
│   │   └── utils/            → JWT, email, activity logger
│   ├── .env.example
│   └── server.js
└── frontend/                 → App React Native
    ├── src/
    │   ├── components/       → Componentes reutilizables
    │   ├── constants/        → Colores, roles
    │   ├── context/          → AuthContext (estado global)
    │   ├── hooks/            → Custom hooks
    │   ├── navigation/       → AppNavigator con WorkspaceShell
    │   ├── screens/          → Pantallas por rol
    │   └── services/         → Llamadas a la API
    └── App.js
```

---

## Instalación rápida

```bash
# 1. Clonar
git clone https://github.com/AntonellaLedesma2/Dentails-.git
cd Dentails-

# 2. Backend
cd backend && npm install
cp .env.example .env   # Completar con tus datos

# 3. Base de datos
mysql -u root -p < src/config/schema.sql

# 4. Frontend
cd ../frontend && npm install

# 5. Ejecutar (dos terminales)
# Terminal 1:
cd backend && npm run dev
# Terminal 2:
cd frontend && npm run web
```

Ver [Guía de Instalación](./GUIA_INSTALACION.md) para instrucciones detalladas.

---

## API — Documentación de endpoints

**URL base:** `http://localhost:3000/api`

**Autenticación:** Bearer Token en header `Authorization`
```
Authorization: Bearer <accessToken>
```

**Formato de respuesta:**
```json
{
  "data": { ... },
  "error": false
}
```

**Formato de error:**
```json
{
  "error": true,
  "message": "Descripción del error",
  "errors": [{ "field": "campo", "message": "detalle" }]
}
```

---

### Auth `/api/auth`

#### POST `/api/auth/login`
Iniciar sesión con correo/usuario y contraseña.

**Auth requerida:** No

**Body:**
```json
{
  "identifier": "admin@dentalis.com",
  "password": "Admin1234!"
}
```

**Respuesta 200 — Sin 2FA:**
```json
{
  "accessToken": "eyJhbGci...",
  "refreshToken": "eyJhbGci...",
  "user": {
    "id": 1,
    "nombre": "Admin",
    "apellido": "DENTALIS",
    "correo": "admin@dentalis.com",
    "rol": "administrador"
  }
}
```

**Respuesta 200 — Con 2FA activado:**
```json
{
  "twoFARequired": true,
  "userId": 1,
  "message": "Código de verificación enviado al correo"
}
```

**Errores:**
| Código | Motivo |
|---|---|
| 401 | Credenciales inválidas |
| 403 | Cuenta desactivada |
| 422 | Campos faltantes |

---

#### POST `/api/auth/verify-2fa`
Verificar código de dos factores.

**Auth requerida:** No

**Body:**
```json
{
  "userId": 1,
  "code": "483217"
}
```

**Respuesta 200:** igual al login exitoso

**Errores:**
| Código | Motivo |
|---|---|
| 400 | Código incorrecto o expirado |

---

#### POST `/api/auth/refresh`
Renovar access token usando refresh token.

**Auth requerida:** No

**Body:**
```json
{
  "refreshToken": "eyJhbGci..."
}
```

**Respuesta 200:**
```json
{
  "accessToken": "eyJhbGci...",
  "refreshToken": "eyJhbGci..."
}
```

---

#### POST `/api/auth/logout`
Cerrar sesión (revoca el refresh token).

**Auth requerida:** Sí

**Respuesta 200:**
```json
{ "message": "Sesión cerrada correctamente" }
```

---

#### POST `/api/auth/oauth`
Login con proveedor OAuth (Google, GitHub, Discord).

**Auth requerida:** No

**Body:**
```json
{
  "provider": "google",
  "oauthId": "1234567890",
  "email": "usuario@gmail.com",
  "nombre": "Ana",
  "apellido": "García"
}
```

**Providers válidos:** `google` | `github` | `facebook`

---

### Usuarios `/api/users`

#### GET `/api/users`
Listar todos los usuarios.

**Auth requerida:** Sí · **Roles:** `administrador`

**Query params opcionales:**
- ninguno

**Respuesta 200:**
```json
{
  "users": [
    {
      "id": 1,
      "nombre": "Ana",
      "apellido": "García",
      "correo": "ana@dentalis.com",
      "username": "agarcia",
      "rol": "recepcion",
      "estado": "activo",
      "creado_en": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

#### GET `/api/users/me`
Obtener perfil propio.

**Auth requerida:** Sí · **Roles:** todos

---

#### GET `/api/users/:id`
Obtener usuario por ID.

**Auth requerida:** Sí · **Roles:** `administrador`

---

#### POST `/api/users`
Crear usuario.

**Auth requerida:** Sí · **Roles:** `administrador`

**Body:**
```json
{
  "nombre": "Ana",
  "apellido": "García",
  "correo": "ana@dentalis.com",
  "password": "Contraseña123!",
  "rol": "recepcion"
}
```

**Roles válidos:** `administrador` | `recepcion` | `odontologo`

**Errores:** 409 si el correo ya está registrado

---

#### PATCH `/api/users/:id`
Editar rol o estado de un usuario.

**Auth requerida:** Sí · **Roles:** `administrador`

**Body (campos opcionales):**
```json
{
  "rol": "odontologo",
  "estado": "inactivo"
}
```

---

#### PUT `/api/users/me/password`
Cambiar contraseña propia.

**Auth requerida:** Sí · **Roles:** todos

**Body:**
```json
{
  "currentPassword": "actual",
  "newPassword": "nueva123!"
}
```

---

### Pacientes `/api/patients`

#### GET `/api/patients`
Listar pacientes.

**Auth requerida:** Sí · **Roles:** todos

**Query params opcionales:**
- `search` — busca en nombre, apellido, DNI, correo
- `estado` — `activo` (default) | `inactivo`

---

#### GET `/api/patients/:id`
Obtener paciente por ID.

**Auth requerida:** Sí · **Roles:** todos

---

#### POST `/api/patients`
Crear paciente.

**Auth requerida:** Sí · **Roles:** `administrador` | `recepcion`

**Body:**
```json
{
  "nombre": "Juan",
  "apellido": "López",
  "dni": "38500123",
  "fechaNacimiento": "1990-05-15",
  "sexo": "masculino",
  "telefono": "1155443322",
  "correo": "juan@email.com",
  "direccion": "Av. Siempreviva 742",
  "obraSocial": "OSDE",
  "nroAfiliado": "1234567"
}
```

---

#### PUT `/api/patients/:id`
Actualizar datos del paciente.

**Auth requerida:** Sí · **Roles:** `administrador` | `recepcion`

---

#### DELETE `/api/patients/:id`
Desactivar paciente (soft delete).

**Auth requerida:** Sí · **Roles:** `administrador`

---

### Turnos `/api/appointments`

#### GET `/api/appointments`
Listar turnos.

**Auth requerida:** Sí · **Roles:** todos

**Query params opcionales:**
- `fecha` — formato AAAA-MM-DD
- `odontologo_id` — ID del odontólogo (el rol `odontologo` solo ve los propios)
- `estado` — `pendiente` | `confirmado` | `cancelado` | `realizado` | `reprogramado`
- `paciente_id`

---

#### POST `/api/appointments`
Crear turno.

**Auth requerida:** Sí · **Roles:** `administrador` | `recepcion`

**Body:**
```json
{
  "pacienteId": 5,
  "odontologoId": 3,
  "fecha": "2024-03-15",
  "hora": "09:30",
  "duracionMin": 30,
  "motivo": "Control general"
}
```

---

#### PUT `/api/appointments/:id`
Actualizar turno.

**Auth requerida:** Sí · **Roles:** `administrador` | `recepcion`

---

#### PATCH `/api/appointments/:id/estado`
Cambiar estado del turno.

**Auth requerida:** Sí · **Roles:** todos

**Body:**
```json
{ "estado": "confirmado" }
```

**Estados válidos:** `pendiente` | `confirmado` | `cancelado` | `realizado` | `reprogramado`

---

#### DELETE `/api/appointments/:id`
Cancelar turno.

**Auth requerida:** Sí · **Roles:** `administrador` | `recepcion`

---

### Tratamientos `/api/treatments`

#### GET `/api/treatments`
Listar tratamientos.

**Auth requerida:** Sí · **Roles:** todos

**Query params:** `paciente_id`, `odontologo_id`, `estado`

---

#### POST `/api/treatments`
Crear tratamiento.

**Auth requerida:** Sí · **Roles:** `administrador` | `odontologo`

**Body:**
```json
{
  "pacienteId": 5,
  "odontologoId": 3,
  "descripcion": "Ortodoncia fija",
  "costoTotal": 85000.00,
  "notas": "Revisión mensual"
}
```

---

#### PUT `/api/treatments/:id`
Actualizar tratamiento.

**Body:**
```json
{
  "estado": "en_curso",
  "costoTotal": 90000.00
}
```

**Estados válidos:** `planificado` | `en_curso` | `completado` | `cancelado`

---

### Pagos `/api/payments`

#### GET `/api/payments`
Listar pagos.

**Auth requerida:** Sí · **Roles:** `administrador` | `recepcion`

**Query params:** `paciente_id`, `odontologo_id`, `desde`, `hasta`

---

#### POST `/api/payments`
Registrar pago.

**Auth requerida:** Sí · **Roles:** `administrador` | `recepcion`

**Body:**
```json
{
  "pacienteId": 5,
  "tratamientoId": 12,
  "importe": 15000.00,
  "metodo": "efectivo",
  "referencia": "Recibo #1234"
}
```

**Métodos válidos:** `efectivo` | `tarjeta_debito` | `tarjeta_credito` | `transferencia` | `obra_social`

---

#### GET `/api/payments/summary`
Resumen de cobros por odontólogo.

**Auth requerida:** Sí · **Roles:** `administrador` | `recepcion`

---

#### GET `/api/payments/admin-summary`
Resumen ejecutivo para reportes del admin.

**Auth requerida:** Sí · **Roles:** `administrador`

---

#### GET `/api/payments/by-odontologo/:odontologoId`
Cuentas de pacientes de un odontólogo.

**Auth requerida:** Sí · **Roles:** `administrador` | `recepcion`

---

### Fichas Clínicas `/api/clinical-records`

#### GET `/api/clinical-records/:pacienteId`
Obtener ficha clínica completa (antecedentes + consultas + odontograma).

**Auth requerida:** Sí · **Roles:** `odontologo` | `administrador`

**Respuesta 200:**
```json
{
  "record": {
    "id": 1,
    "paciente_id": 5,
    "antecedentes": "Hipertensión controlada",
    "alergias": "Penicilina",
    "medicacion": "Enalapril 10mg"
  },
  "consultas": [
    {
      "id": 3,
      "fecha": "2024-03-15T09:30:00Z",
      "diagnostico": "Caries pieza 36",
      "procedimiento": "Obturación",
      "odontologo_nombre": "Ana García"
    }
  ],
  "odontograma": {
    "36": "en_curso",
    "11": "completado"
  }
}
```

---

#### PUT `/api/clinical-records/:pacienteId`
Actualizar antecedentes médicos.

**Auth requerida:** Sí · **Roles:** `odontologo`

---

#### POST `/api/clinical-records/:pacienteId/consultas`
Agregar consulta a la ficha.

**Auth requerida:** Sí · **Roles:** `odontologo`

**Body:**
```json
{
  "diagnostico": "Caries pieza 36",
  "procedimiento": "Obturación directa",
  "indicaciones": "Evitar alimentos fríos por 48hs",
  "proximaCita": "2024-04-15"
}
```

---

#### PUT `/api/clinical-records/:pacienteId/odontograma`
Guardar estado del odontograma.

**Auth requerida:** Sí · **Roles:** `odontologo`

**Body:**
```json
{
  "odontograma": {
    "11": "sano",
    "36": "en_curso",
    "46": "extraccion"
  }
}
```

**Estados válidos por diente:** `sano` | `evaluado` | `en_curso` | `completado` | `extraccion` | `ausente`

---

## Códigos de error

| Código | Significado |
|---|---|
| 400 | Solicitud incorrecta |
| 401 | No autenticado o token expirado |
| 403 | Sin permisos para esta operación |
| 404 | Recurso no encontrado |
| 409 | Conflicto (ej: correo duplicado) |
| 422 | Error de validación en los datos |
| 500 | Error interno del servidor |

---

## Roles y permisos

| Endpoint | Administrador | Recepción | Odontólogo |
|---|:---:|:---:|:---:|
| Gestión de usuarios | ✅ | ❌ | ❌ |
| Ver agenda | ✅ | ✅ | ✅ (propia) |
| Crear/editar turno | ✅ | ✅ | ❌ |
| Ver pacientes | ✅ | ✅ | ✅ |
| Crear/editar paciente | ✅ | ✅ | ❌ |
| Fichas clínicas | ✅ (lectura) | ❌ | ✅ |
| Tratamientos | ✅ | ❌ | ✅ |
| Registrar pagos | ✅ | ✅ | ❌ |
| Ver reportes | ✅ | ❌ | ❌ |

---

## APK Android

Descargá la última versión:
```
https://expo.dev/artifacts/eas/4cvfFpfpRBioZmSw7GXiN_fEWm3xNybvvieh7qj46qM.apk
```

---

## Repositorio

GitHub: https://github.com/AntonellaLedesma2/Dentails-

---

*DENTALIS v1.0.0 — Trabajo Final*
