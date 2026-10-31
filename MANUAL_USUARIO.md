# DENTALIS — Manual de Usuario
### Sistema de Gestión Odontológica · Versión 1.0.0

---

## Índice

1. [Introducción](#1-introducción)
2. [Requisitos del sistema](#2-requisitos-del-sistema)
3. [Acceso al sistema](#3-acceso-al-sistema)
4. [Roles de usuario](#4-roles-de-usuario)
5. [Módulo Administrador](#5-módulo-administrador)
6. [Módulo Recepción](#6-módulo-recepción)
7. [Módulo Odontólogo](#7-módulo-odontólogo)
8. [Funciones comunes](#8-funciones-comunes)
9. [Preguntas frecuentes](#9-preguntas-frecuentes)

---

## 1. Introducción

**DENTALIS** es una aplicación móvil y web para la gestión integral de una clínica odontológica. Permite administrar pacientes, turnos, fichas clínicas, tratamientos, cobros y el equipo de trabajo desde cualquier dispositivo.

**Características principales:**
- Acceso desde celular (Android / iPhone) y navegador web
- 3 roles diferenciados: Administrador, Recepción, Odontólogo
- Odontograma interactivo con estados por diente
- Gestión de turnos con agenda semanal
- Control de pagos por odontólogo y paciente
- Login con Google, GitHub y Discord

> **Importante:** Los pacientes de la clínica no necesitan cuenta en el sistema. Solo el personal inicia sesión.

---

## 2. Requisitos del sistema

| Plataforma | Requisito |
|---|---|
| iPhone | iOS 15 o superior, app DENTALIS instalada |
| Android | Android 8.0 o superior, app DENTALIS instalada |
| Web | Chrome, Firefox o Edge actualizados |
| Conexión | WiFi o datos móviles (la app necesita conectarse al servidor) |

---

## 3. Acceso al sistema

### 3.1 Pantalla de inicio de sesión

Al abrir la app se muestra la pantalla de login:

```
┌─────────────────────────────────┐
│                                 │
│           🦷  DENTALIS          │
│   Sistema de gestión dental     │
│                                 │
│  ┌───────────────────────────┐  │
│  │ ✉️  correo@dentalis.com   │  │
│  └───────────────────────────┘  │
│  ┌───────────────────────────┐  │
│  │ 🔑  ••••••••              │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │    INICIAR SESIÓN         │  │
│  └───────────────────────────┘  │
│                                 │
│  ─────  o continuar con  ─────  │
│                                 │
│  [G Google] [🐙 GitHub] [Discord]│
│                                 │
│  ¿Problemas? Contactá al admin  │
└─────────────────────────────────┘
```

**Pasos:**
1. Ingresá tu **correo electrónico** o **nombre de usuario**
2. Ingresá tu **contraseña**
3. Tocá **"Iniciar sesión"**

### 3.2 Login con redes sociales

Podés iniciar sesión con:
- **Google** — usá tu cuenta de Gmail
- **GitHub** — usá tu cuenta de GitHub
- **Discord** — usá tu cuenta de Discord

> El correo de la red social debe coincidir con el registrado en el sistema. Si no funciona, contactá al administrador.

### 3.3 Verificación en dos pasos (2FA)

Si tu cuenta tiene activado el 2FA:

```
┌─────────────────────────────────┐
│                                 │
│         🔐 Verificación         │
│         en 2 pasos              │
│                                 │
│  Ingresá el código de 6         │
│  dígitos enviado a tu correo    │
│                                 │
│         [ 4 8 3 2 1 7 ]         │
│                                 │
│  ┌───────────────────────────┐  │
│  │        VERIFICAR          │  │
│  └───────────────────────────┘  │
│                                 │
│  El código expira en 10 min     │
└─────────────────────────────────┘
```

1. Revisá tu correo electrónico
2. Ingresá el código de 6 dígitos
3. Tocá **"Verificar"**

> Si el código expiró, cerrá la pantalla e iniciá sesión nuevamente.

### 3.4 Cierre de sesión

1. Tocá tu nombre o el ícono de perfil
2. Ir a **"Mi perfil"**
3. Tocá el botón rojo **"Cerrar sesión"** al final de la pantalla
4. Confirmá tocando **"Cerrar sesión"** en el diálogo

---

## 4. Roles de usuario

| Rol | Para quién | Color en el sistema |
|---|---|---|
| **Administrador** | Dueño o responsable de la clínica | Azul |
| **Recepción** | Recepcionista o asistente administrativo | Verde |
| **Odontólogo** | Profesional que atiende pacientes | Amarillo |

Cada rol accede a módulos distintos. El menú lateral cambia automáticamente según el rol.

---

## 5. Módulo Administrador

### 5.1 Pantalla de inicio

```
┌─────────────────────────────────────────────────────────┐
│  ✦ DENTALIS                    🔔  👤 Admin DENTALIS    │
│  Clínica Dental · Administrador                         │
├──────────────┬──────────────────────────────────────────┤
│              │  Miércoles, 21 de octubre de 2026        │
│  CLÍNICA     │  Panel de administración,                │
│  ▦ Resumen   │  Admin.                      [Admin]     │
│  ▣ Agenda    │                                          │
│  ◉ Pacientes │  ┌────────┐  ┌──────────┐  ┌──────────┐ │
│              │  │Turnos  │  │ Usuarios │  │Pacientes │ │
│  GESTIÓN     │  │  hoy   │  │ activos  │  │ activos  │ │
│  ♙ Usuarios  │  │   4    │  │    5     │  │   47     │ │
│  ◇ Trat.     │  └────────┘  └──────────┘  └──────────┘ │
│  ▥ Reportes  │                                          │
│              │  ┌──────────────────────┐  ┌──────────┐ │
│  CUENTA      │  │  Agenda de hoy       │  │ Accesos  │ │
│  ○ Mi perfil │  │  09:00 García, Ana   │  │ rápidos  │ │
│              │  │  10:30 López, Juan   │  │          │ │
│  ↪ Cerrar    │  │  11:00 Pérez, María  │  │▦ Usuarios│ │
│              │  │  Ver agenda →        │  │▣ Agenda  │ │
│  👤 Admin    │  └──────────────────────┘  │◉ Pac.    │ │
│  Administrador│                           │▥ Report. │ │
└──────────────┴──────────────────────────────────────────┘
```

### 5.2 Gestión de usuarios

**Acceso:** Menú lateral → "Usuarios y roles"

#### Crear un nuevo usuario:
1. Tocá el botón **"+"** (abajo a la derecha)
2. Completá: Nombre, Apellido, Correo, Contraseña
3. Seleccioná el rol: Administrador / Recepción / Odontólogo
4. Tocá **"Crear usuario"**

#### Editar rol de un usuario:
1. En la lista, tocá el ícono ✏️ del usuario
2. Seleccioná el nuevo rol usando los botones de opción
3. Tocá **"Guardar cambios"**

#### Desactivar una cuenta:
1. En la lista, tocá el ícono 🚫 del usuario
2. Confirmá la desactivación
> Las cuentas desactivadas no pueden iniciar sesión, pero su historial se conserva.

#### Reactivar una cuenta:
- Tocá el ícono ✅ en una cuenta inactiva

### 5.3 Agenda general

**Acceso:** Menú lateral → "Agenda general"

```
┌─────────────────────────────────┐
│  Agenda                         │
│                                 │
│  [Lun] [Mar] [Mié✓] [Jue] [Vie]│
│         21 Oct 2026             │
│                                 │
│  09:00 ●  García, Ana           │
│          Limpieza · Dr. Martín  │
│          [✓ Confirmar] [✕]      │
│                                 │
│  10:30 ◷  López, Juan          │
│          Extracción · Dr. Ruiz  │
│          [✓] [✕]               │
│                                 │
│  Sin más turnos para hoy        │
│                              +  │
└─────────────────────────────────┘
```

- **Verde (●):** turno confirmado
- **Naranja (◷):** turno pendiente
- **Rojo (✕):** turno cancelado

### 5.4 Pacientes

**Acceso:** Menú lateral → "Pacientes"

- Buscá por nombre, DNI o teléfono
- Tocá un paciente para ver su ficha completa
- Tocá **"+"** para registrar un nuevo paciente

### 5.5 Reportes

**Acceso:** Menú lateral → "Reportes"

```
┌─────────────────────────────────┐
│  Reportes                       │
│                                 │
│  RESUMEN DEL MES                │
│  ┌──────────┐  ┌──────────┐    │
│  │ Cobrado  │  │  Pagos   │    │
│  │ $45.000  │  │   18     │    │
│  └──────────┘  └──────────┘    │
│                                 │
│  Cobros últimos 6 meses         │
│  ████                           │
│    ████                         │
│      ████ ████                  │
│        ████ ████ ████           │
│  May  Jun  Jul  Ago  Sep  Oct   │
│                                 │
│  POR ODONTÓLOGO                 │
│  Dr. Martín · 12 pac · $28.000  │
│  Dr. Ruiz   · 8 pac  · $17.000  │
└─────────────────────────────────┘
```

---

## 6. Módulo Recepción

### 6.1 Pantalla de inicio

```
┌─────────────────────────────────┐
│  Recepción, Antonella.          │
│  Miércoles, 21 de octubre       │
│                                 │
│  ┌──────┐  ┌──────┐  ┌──────┐  │
│  │ Turn.│  │Pend. │  │Conf. │  │
│  │  4   │  │  1   │  │  3   │  │
│  └──────┘  └──────┘  └──────┘  │
│                                 │
│  ┌─────────────────────────┐   │
│  │ + Nuevo turno           │   │
│  └─────────────────────────┘   │
│  ┌─────────────────────────┐   │
│  │ ◉ Nuevo paciente        │   │
│  └─────────────────────────┘   │
│                                 │
│  Agenda de hoy (4 turnos)       │
│  09:00  García, Ana  ●          │
│  10:30  López, Juan  ◷          │
│  Ver agenda →                   │
└─────────────────────────────────┘
```

### 6.2 Registrar un nuevo paciente

1. Tocá **"+ Nuevo paciente"** o ir a Pacientes → **"+"**
2. Completá los campos obligatorios: Nombre y Apellido
3. Completá los opcionales: DNI, fecha de nacimiento, teléfono, correo, dirección
4. Si tiene obra social, completá nombre y número de afiliado
5. Tocá **"Registrar paciente"**

### 6.3 Crear un turno

1. Tocá **"+ Nuevo turno"**
2. Seleccioná el **paciente** de la lista horizontal
3. Seleccioná el **odontólogo** disponible
4. Ingresá la **fecha** (formato AAAA-MM-DD, ejemplo: `2024-03-15`)
5. Ingresá la **hora** (formato HH:MM, ejemplo: `09:30`)
6. Seleccioná la **duración**: 15m / 20m / 30m / 45m / 60m / 90m
7. Opcionalmente ingresá el motivo de la consulta
8. Tocá **"Crear turno"**

### 6.4 Confirmar o cancelar un turno

Desde la agenda, cada turno con estado **Pendiente** muestra:
- **✓ verde:** confirmar el turno → pasa a "Confirmado"
- **✕ rojo:** cancelar el turno → pasa a "Cancelado"

### 6.5 Pagos y cuentas

**Acceso:** Menú lateral → "Pagos y cuentas"

```
┌─────────────────────────────────┐
│  Pagos y cuentas                │
│                                 │
│  [Dr. Martín] [Dr. Ruiz] [Dr+]  │
│                                 │
│  Dr. Martín                     │
│  12 pacientes · $28.000 cobrado │
│                                 │
│  CUENTAS DE PACIENTES           │
│  García, Ana                    │
│  Pagado: $5.000 · Al día ✓      │
│                                 │
│  López, Juan                    │
│  Pagado: $2.000 · Debe: $3.000  │
│                                 │
│  Pérez, María                   │
│  Pagado: $8.000 · Al día ✓      │
│                              +  │
└─────────────────────────────────┘
```

**Para registrar un pago:**
1. Tocá el **"+"**
2. Seleccioná el paciente
3. Seleccioná el tratamiento (opcional)
4. Ingresá el importe
5. Elegí el método: Efectivo / Débito / Crédito / Transferencia / Obra social
6. Tocá **"Registrar pago"**

---

## 7. Módulo Odontólogo

### 7.1 Pantalla de inicio

```
┌─────────────────────────────────┐
│  Buenos días, Dr/a. García.     │
│  Miércoles, 21 de octubre       │
│                                 │
│  ┌──────────────┐  ┌──────────┐ │
│  │  Turnos hoy  │  │Pacientes │ │
│  │      3       │  │   —      │ │
│  └──────────────┘  └──────────┘ │
│                                 │
│  Mi agenda de hoy               │
│  09:00  García, Ana  ●          │
│         Limpieza y control      │
│  10:30  López, Juan  ◷          │
│         Extracción pieza 36     │
│  Ver agenda →                   │
│                                 │
│  MÓDULOS CLÍNICOS               │
│  🦷 Pacientes   📋 Ficha clínica│
│  💊 Tratamientos  📅 Mi agenda  │
└─────────────────────────────────┘
```

### 7.2 Ver mi agenda

- Desde la pantalla de inicio o desde **"Mi agenda"**
- Usá el selector de días para navegar entre fechas
- Solo ves **tus propios turnos**
- Cuando atendés un paciente, tocá **✓** para marcarlo como **"Realizado"**

### 7.3 Ficha clínica del paciente

**Acceso:** Pacientes → tocá un paciente → "Ver ficha clínica"

La ficha clínica tiene tres secciones:

#### Antecedentes médicos
Mostrá alergias, medicación y antecedentes relevantes del paciente.

#### Odontograma interactivo
```
┌──────────────────────────────────────────────────┐
│ □ Sano  ■ Evaluado  □ En curso  □ Completado     │
│ □ Extracción  □ Ausente                          │
│                                                  │
│              Arcada superior                     │
│  18 17 16 15 14 13 12 11 | 21 22 23 24 25 26 27 28│
│  [⌐][⌐][⌐][⌐][⌐][⌐][/][/]|[/][/][⌐][⌐][⌐][⌐][⌐][⌐]│
│ ─────────────────────────────────────────────── │
│  [⌐][⌐][⌐][⌐][⌐][⌐][/][/]|[/][/][⌐][⌐][⌐][⌐][⌐][⌐]│
│  48 47 46 45 44 43 42 41 | 31 32 33 34 35 36 37 38│
│              Arcada inferior                     │
│                                                  │
│  Tocá un diente para cambiar su estado           │
└──────────────────────────────────────────────────┘
```

**Cómo usar el odontograma:**
1. Tocá cualquier diente
2. Se abre un menú con los estados posibles:
   - **Sano** — blanco
   - **Evaluado** — azul
   - **En curso** — amarillo
   - **Completado** — verde
   - **Extracción** — rojo
   - **Ausente** — gris
3. Seleccioná el estado y se guarda automáticamente

#### Historial de consultas

```
┌─────────────────────────────────┐
│  CONSULTAS (3)        + Nueva   │
│                                 │
│  15 oct 2026 · Dr. García       │
│  Diagnóstico: Caries pieza 36   │
│  Procedimiento: Obturación      │
│  Indicaciones: Evitar fríos     │
│  📅 Próxima cita: 15 nov 2026   │
│                                 │
│  03 sep 2026 · Dr. García       │
│  Diagnóstico: Control general   │
│  Procedimiento: Limpieza        │
└─────────────────────────────────┘
```

**Para agregar una consulta:**
1. Tocá **"+ Nueva"**
2. Completá: Diagnóstico (obligatorio), Procedimiento, Indicaciones
3. Si hay próxima cita, ingresá la fecha (AAAA-MM-DD)
4. Tocá **"Guardar consulta"**

### 7.4 Tratamientos

**Acceso:** Menú lateral → "Tratamientos"

```
┌─────────────────────────────────┐
│  Tratamientos                   │
│                                 │
│  García, Ana                    │
│  Ortodoncia fija                │
│  Estado: En curso               │
│  Costo: $85.000                 │
│                                 │
│  López, Juan                    │
│  Extracción pieza 36            │
│  Estado: Completado             │
│  Costo: $15.000                 │
│                                 │
│  Pérez, María                   │
│  Limpieza y blanqueamiento      │
│  Estado: Planificado            │
│  Costo: $25.000                 │
│                              +  │
└─────────────────────────────────┘
```

**Para crear un tratamiento:**
1. Tocá **"+"**
2. Seleccioná el paciente
3. Ingresá la descripción del tratamiento
4. Ingresá el costo total (en pesos)
5. Seleccioná el estado inicial: Planificado / En curso / Completado / Cancelado
6. Tocá **"Crear tratamiento"**

---

## 8. Funciones comunes

### 8.1 Mi perfil

Disponible para todos los roles.

```
┌─────────────────────────────────┐
│                                 │
│           [  AN  ]              │
│       Antonella García          │
│    agarcia@dentalis.com         │
│         [Recepción]             │
│                                 │
│  CUENTA                         │
│  🔑  Cambiar contraseña    ›    │
│  ❓  Ayuda y soporte       ›    │
│                                 │
│  ┌───────────────────────────┐  │
│  │     CERRAR SESIÓN         │  │
│  └───────────────────────────┘  │
│                                 │
│         DENTALIS v1.0.0         │
└─────────────────────────────────┘
```

### 8.2 Cambiar contraseña

1. Ir a **Mi perfil** → **"Cambiar contraseña"**
2. Ingresá tu contraseña actual
3. Ingresá la nueva contraseña (mínimo 8 caracteres)
4. Repetila para confirmar
5. Tocá **"Cambiar contraseña"**

### 8.3 Búsqueda de pacientes

En cualquier pantalla de pacientes:
- Buscá por **nombre**, **apellido**, **DNI** o **teléfono**
- La búsqueda es instantánea mientras escribís
- Tocá la **X** para limpiar la búsqueda

### 8.4 Indicadores de estado de turnos

| Color / Símbolo | Estado |
|---|---|
| 🟠 Naranja | Pendiente |
| 🟢 Verde | Confirmado |
| 🔵 Azul | Realizado |
| 🔴 Rojo | Cancelado |
| 🟡 Amarillo | Reprogramado |

---

## 9. Preguntas frecuentes

**¿Olvidé mi contraseña. ¿Qué hago?**
En la versión actual, el administrador debe restablecerte el acceso. Contactalo directamente.

**¿Puedo usar la app en varios dispositivos?**
Sí. Podés iniciar sesión desde distintos dispositivos. La sesión se mantiene activa hasta que cerrés sesión manualmente.

**¿Qué pasa si cierro la app sin cerrar sesión?**
Tu sesión se mantiene activa. Al volver a abrir la app, entrás directamente sin necesidad de volver a iniciar sesión.

**¿Por qué no puedo ver los turnos de los otros odontólogos?**
El rol Odontólogo solo tiene acceso a su propia agenda. Para ver todos los turnos, necesitás acceder con un rol de Administrador o Recepción.

**¿Se puede eliminar un paciente?**
No se eliminan pacientes — se desactivan. Esto preserva el historial clínico y los registros de cobros.

**¿Los datos están seguros?**
Sí. Las contraseñas se almacenan cifradas, la comunicación usa conexión segura, y cada rol solo accede a la información que le corresponde.

**¿La app funciona sin internet?**
No. La app requiere conexión para comunicarse con el servidor. Sin conexión, no se pueden cargar ni guardar datos.

---

*DENTALIS v1.0.0 — Sistema de Gestión Odontológica*
*Documento generado para la entrega del Trabajo Final*
