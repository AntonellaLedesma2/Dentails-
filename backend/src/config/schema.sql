-- ============================================================
-- DENTALIS - Schema de base de datos
-- ============================================================

CREATE DATABASE IF NOT EXISTS dentalis CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE dentalis;

-- ------------------------------------------------------------
-- Tabla: usuarios
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  nombre        VARCHAR(100) NOT NULL,
  apellido      VARCHAR(100) NOT NULL,
  correo        VARCHAR(150) NOT NULL UNIQUE,
  username      VARCHAR(80) UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  rol           ENUM('administrador', 'recepcion', 'odontologo') NOT NULL DEFAULT 'recepcion',
  estado        ENUM('activo', 'inactivo') NOT NULL DEFAULT 'activo',
  -- OAuth
  google_id     VARCHAR(255) UNIQUE,
  facebook_id   VARCHAR(255) UNIQUE,
  github_id     VARCHAR(255) UNIQUE,
  -- 2FA
  two_fa_enabled   TINYINT(1) NOT NULL DEFAULT 0,
  two_fa_code      VARCHAR(10),
  two_fa_expires   DATETIME,
  -- Refresh token
  refresh_token    TEXT,
  -- Auditoría
  creado_por    INT,
  creado_en     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (creado_por) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Tabla: pacientes
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pacientes (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  nombre          VARCHAR(100) NOT NULL,
  apellido        VARCHAR(100) NOT NULL,
  dni             VARCHAR(20) UNIQUE,
  fecha_nacimiento DATE,
  sexo            ENUM('masculino', 'femenino', 'otro'),
  telefono        VARCHAR(30),
  correo          VARCHAR(150),
  direccion       VARCHAR(255),
  obra_social     VARCHAR(100),
  nro_afiliado    VARCHAR(50),
  observaciones   TEXT,
  estado          ENUM('activo', 'inactivo') NOT NULL DEFAULT 'activo',
  creado_por      INT,
  creado_en       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (creado_por) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Tabla: turnos
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS turnos (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  paciente_id     INT NOT NULL,
  odontologo_id   INT NOT NULL,
  fecha           DATE NOT NULL,
  hora            TIME NOT NULL,
  duracion_min    INT NOT NULL DEFAULT 30,
  motivo          VARCHAR(255),
  estado          ENUM('pendiente', 'confirmado', 'cancelado', 'realizado', 'reprogramado') NOT NULL DEFAULT 'pendiente',
  notas           TEXT,
  creado_por      INT,
  creado_en       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (paciente_id)   REFERENCES pacientes(id) ON DELETE CASCADE,
  FOREIGN KEY (odontologo_id) REFERENCES usuarios(id) ON DELETE RESTRICT,
  FOREIGN KEY (creado_por)    REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Tabla: fichas_clinicas
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fichas_clinicas (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  paciente_id     INT NOT NULL UNIQUE,
  antecedentes    TEXT,
  alergias        TEXT,
  medicacion      TEXT,
  observaciones   TEXT,
  creado_en       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Tabla: consultas (entradas dentro de la ficha clínica)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS consultas (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  ficha_id        INT NOT NULL,
  turno_id        INT,
  odontologo_id   INT NOT NULL,
  fecha           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  diagnostico     TEXT,
  procedimiento   TEXT,
  indicaciones    TEXT,
  proxima_cita    DATE,
  creado_en       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ficha_id)      REFERENCES fichas_clinicas(id) ON DELETE CASCADE,
  FOREIGN KEY (turno_id)      REFERENCES turnos(id) ON DELETE SET NULL,
  FOREIGN KEY (odontologo_id) REFERENCES usuarios(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Tabla: tratamientos
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tratamientos (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  paciente_id     INT NOT NULL,
  odontologo_id   INT NOT NULL,
  descripcion     VARCHAR(255) NOT NULL,
  estado          ENUM('planificado', 'en_curso', 'completado', 'cancelado') NOT NULL DEFAULT 'planificado',
  costo_total     DECIMAL(10, 2),
  notas           TEXT,
  creado_en       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (paciente_id)   REFERENCES pacientes(id) ON DELETE CASCADE,
  FOREIGN KEY (odontologo_id) REFERENCES usuarios(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Tabla: pagos
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pagos (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  paciente_id     INT NOT NULL,
  tratamiento_id  INT,
  importe         DECIMAL(10, 2) NOT NULL,
  metodo          ENUM('efectivo', 'tarjeta_debito', 'tarjeta_credito', 'transferencia', 'obra_social') NOT NULL,
  referencia      VARCHAR(100),
  fecha           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  registrado_por  INT,
  FOREIGN KEY (paciente_id)   REFERENCES pacientes(id) ON DELETE RESTRICT,
  FOREIGN KEY (tratamiento_id) REFERENCES tratamientos(id) ON DELETE SET NULL,
  FOREIGN KEY (registrado_por) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Tabla: registro_actividad
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS registro_actividad (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id  INT,
  accion      VARCHAR(100) NOT NULL,
  entidad     VARCHAR(50),
  entidad_id  INT,
  descripcion TEXT,
  ip          VARCHAR(45),
  creado_en   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Usuario administrador por defecto (cambiar password en producción)
-- password: Admin1234! (hash bcrypt)
-- ------------------------------------------------------------
INSERT IGNORE INTO usuarios (nombre, apellido, correo, username, password_hash, rol, estado)
VALUES (
  'Admin',
  'DENTALIS',
  'admin@dentalis.com',
  'admin',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  'administrador',
  'activo'
);
