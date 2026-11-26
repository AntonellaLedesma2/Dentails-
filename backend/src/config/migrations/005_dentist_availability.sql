ALTER TABLE usuarios
  ADD COLUMN disponibilidad ENUM('disponible', 'ausente', 'vacaciones') NOT NULL DEFAULT 'disponible',
  ADD COLUMN disponibilidad_hasta DATE NULL,
  ADD COLUMN disponibilidad_motivo VARCHAR(160) NULL;
