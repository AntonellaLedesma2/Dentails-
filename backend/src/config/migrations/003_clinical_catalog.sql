-- Ejecutar una sola vez sobre una base DENTALIS ya creada.
ALTER TABLE fichas_clinicas
  ADD COLUMN IF NOT EXISTS odontograma LONGTEXT NULL AFTER observaciones;

CREATE TABLE IF NOT EXISTS catalogo_tratamientos (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  nombre          VARCHAR(160) NOT NULL UNIQUE,
  categoria       VARCHAR(80) NOT NULL DEFAULT 'General',
  descripcion     VARCHAR(255),
  precio          DECIMAL(12, 2) NOT NULL DEFAULT 0,
  duracion_min    INT NOT NULL DEFAULT 30,
  activo          TINYINT(1) NOT NULL DEFAULT 1,
  creado_en       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;
