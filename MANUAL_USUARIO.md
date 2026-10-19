# DENTALIS — Manual de Usuario

**Sistema de gestión odontológica**  
Versión 1.0.0

---

## Índice

1. [Introducción](#introducción)
2. [Acceso al sistema](#acceso-al-sistema)
3. [Roles de usuario](#roles-de-usuario)
4. [Guía por rol — Administrador](#guía-administrador)
5. [Guía por rol — Recepción](#guía-recepción)
6. [Guía por rol — Odontólogo](#guía-odontólogo)
7. [Funciones comunes](#funciones-comunes)
8. [Preguntas frecuentes](#preguntas-frecuentes)

---

## Introducción

DENTALIS es una aplicación móvil para la gestión interna de una clínica odontológica. Permite administrar pacientes, turnos y el equipo de trabajo desde cualquier dispositivo Android o iOS.

**Importante:** Los pacientes no necesitan una cuenta. Solo el personal de la clínica inicia sesión en el sistema.

---

## Acceso al sistema

### Inicio de sesión con usuario y contraseña

1. Abrí la app DENTALIS en tu dispositivo.
2. En la pantalla de inicio, ingresá tu **correo electrónico** o **nombre de usuario**.
3. Ingresá tu **contraseña**.
4. Tocá el botón **"Iniciar sesión"**.

> Si es tu primera vez, el administrador de la clínica debió haberte creado una cuenta previamente. Contactalo si no podés ingresar.

### Inicio de sesión con redes sociales

También podés iniciar sesión usando tu cuenta de **Google**, **GitHub** o **Facebook**. Para eso:

1. En la pantalla de inicio, tocá el botón del proveedor deseado (Google, GitHub o Facebook).
2. Completá la autenticación en la ventana que se abre.
3. Si tu correo de esa red social coincide con el correo de tu cuenta en DENTALIS, accederás automáticamente.

> Si tu cuenta de red social no está vinculada, contactá al administrador.

### Verificación en dos pasos (2FA)

Si el administrador activó la verificación en dos pasos para tu cuenta:

1. Ingresá tu correo y contraseña normalmente.
2. Recibirás un código de 6 dígitos en tu correo electrónico.
3. Ingresá el código en la pantalla de verificación.
4. El código expira en **10 minutos**. Si expiró, cerrá la pantalla e iniciá sesión nuevamente.

### Cierre de sesión

1. Tocá tu nombre o el ícono de perfil (arriba o en el menú).
2. Desplazate hasta el final de la pantalla de perfil.
3. Tocá **"Cerrar sesión"** y confirmá.

---

## Roles de usuario

DENTALIS tiene tres tipos de usuario. Cada uno ve opciones distintas:

| Rol | Para quién | Accesos principales |
|---|---|---|
| **Administrador** | Dueño o responsable de la clínica | Usuarios, agenda, pacientes, reportes |
| **Recepción** | Recepcionista o asistente administrativo | Pacientes, agenda, turnos, pagos |
| **Odontólogo** | Profesional que atiende pacientes | Agenda propia, pacientes, fichas clínicas, tratamientos |

---

## Guía Administrador

### Pantalla de inicio

Al iniciar sesión verás un resumen con:
- Cantidad de turnos del día de hoy
- Cantidad de usuarios activos
- Accesos rápidos a los módulos principales

### Gestión de usuarios

Desde **Inicio → Usuarios** podés:

**Ver la lista de usuarios:**
- Se muestra nombre, correo, rol y estado de cada persona del equipo.
- Usá la barra de búsqueda para filtrar por nombre o correo.

**Crear un usuario:**
1. Tocá el botón **"+"** (abajo a la derecha).
2. Completá nombre, apellido, correo y contraseña.
3. Seleccioná el rol: Administrador, Recepción u Odontólogo.
4. Tocá **"Crear usuario"**.

**Editar el rol de un usuario:**
1. En la lista, tocá el ícono de lápiz ✏️ del usuario.
2. Seleccioná el nuevo rol.
3. Tocá **"Guardar cambios"**.

**Desactivar o activar una cuenta:**
- Tocá el ícono 🚫 para desactivar o ✅ para activar.
- Las cuentas desactivadas no pueden iniciar sesión pero su historial se conserva.

> No se eliminan cuentas. Al desactivar, el registro histórico de esa persona queda guardado.

### Gestión de pacientes

Desde **Inicio → Pacientes**:

- Buscá pacientes por nombre, DNI o teléfono.
- Tocá un paciente para ver su ficha completa.
- Tocá **"+"** para registrar un nuevo paciente.
- Tocá **"Editar paciente"** para modificar sus datos.

### Agenda

Desde **Inicio → Agenda**:

- Usá el selector de días (parte superior) para navegar entre fechas.
- Cada turno muestra: hora, nombre del paciente, motivo y odontólogo asignado.
- Tocá un turno para ver o editar sus detalles.
- Tocá **"+"** para crear un nuevo turno.

---

## Guía Recepción

### Pantalla de inicio

Al iniciar sesión verás:
- Turnos de hoy
- Accesos rápidos a **Nuevo paciente** y **Nuevo turno**
- Módulos de Agenda, Pacientes y Pagos

### Registrar un nuevo paciente

1. Tocá **"+ Nuevo paciente"** en la pantalla de inicio, o desde el módulo Pacientes.
2. Completá los datos: nombre, apellido, DNI, fecha de nacimiento, teléfono, correo.
3. Si tiene obra social, completá los campos correspondientes.
4. Tocá **"Registrar paciente"**.

### Crear un turno

1. Tocá **"+ Nuevo turno"** en la pantalla de inicio, o desde el módulo Agenda.
2. Seleccioná el **paciente** de la lista.
3. Seleccioná el **odontólogo** disponible.
4. Ingresá la **fecha** (formato AAAA-MM-DD, por ej: 2024-03-15) y la **hora** (HH:MM, por ej: 09:30).
5. Seleccioná la **duración** del turno.
6. Opcionalmente ingresá el motivo de la consulta.
7. Tocá **"Crear turno"**.

### Confirmar o cancelar un turno

Desde la agenda, en cada turno con estado **Pendiente** verás dos botones:
- **✓** (verde): confirmar el turno
- **✕** (rojo): cancelar el turno

### Consultar agenda por día

1. Entrá al módulo **Agenda**.
2. Usá el selector de días en la parte superior para elegir la fecha.
3. Los turnos se muestran ordenados por hora.

---

## Guía Odontólogo

### Pantalla de inicio

Al iniciar sesión verás:
- Tu agenda de hoy con los pacientes que tenés asignados
- Accesos rápidos a Pacientes, Ficha clínica, Tratamientos y Mi agenda

> Solo ves tus propios turnos. No tenés acceso a la agenda de otros odontólogos.

### Ver tu agenda

1. Desde el inicio o desde **Mi agenda**.
2. Usá el selector de días para ver los turnos de cada fecha.
3. Cuando atendés a un paciente, tocá **✓** en el turno para marcarlo como **Realizado**.

### Ver pacientes

Desde **Pacientes** podés:
- Buscar cualquier paciente de la clínica.
- Ver sus datos de contacto e información administrativa.
- Los datos clínicos (ficha, tratamientos) solo los editás vos.

### Fichas clínicas y tratamientos

*(Módulo en desarrollo — disponible en la próxima versión)*

---

## Funciones comunes

### Mi perfil

Desde cualquier pantalla de inicio podés acceder a tu perfil:
1. Tocá tu nombre o avatar en la pantalla principal.
2. Verás tus datos: nombre, correo y rol.

### Cambiar contraseña

1. Entrá a **Mi perfil**.
2. Tocá **"Cambiar contraseña"**.
3. Ingresá tu contraseña actual.
4. Ingresá la nueva contraseña (mínimo 8 caracteres).
5. Repetila para confirmar.
6. Tocá **"Cambiar contraseña"**.

---

## Preguntas frecuentes

**¿Olvidé mi contraseña. ¿Qué hago?**  
En la primera versión, el administrador debe restablecer tu acceso. Contactalo para que te genere una nueva contraseña o te reactive la cuenta.

**¿Puedo usar la app desde el navegador web?**  
No, DENTALIS es una aplicación móvil para Android e iOS.

**¿Los datos de los pacientes están seguros?**  
Sí. Las contraseñas se guardan cifradas y cada usuario solo puede acceder a la información que corresponde a su rol. La comunicación entre la app y el servidor usa conexión segura.

**¿Puedo tener la app en varios dispositivos?**  
Sí. Podés iniciar sesión desde distintos dispositivos, pero solo una sesión activa a la vez.

**¿Qué pasa si cierro la app?**  
Tu sesión se mantiene activa. Al volver a abrir la app, entrás directamente sin necesidad de iniciar sesión nuevamente.

---

*DENTALIS v1.0.0 — Documento generado para la entrega del trabajo final*
