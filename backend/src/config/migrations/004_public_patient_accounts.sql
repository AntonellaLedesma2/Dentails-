-- Ejecutar una sola vez en bases DENTALIS existentes.
-- Vincula cada cuenta de paciente con una ficha propia.
ALTER TABLE pacientes
  ADD COLUMN usuario_id INT NULL,
  ADD UNIQUE KEY uq_pacientes_usuario (usuario_id),
  ADD CONSTRAINT fk_pacientes_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL;
