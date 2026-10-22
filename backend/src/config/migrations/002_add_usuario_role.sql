USE dentalis;

ALTER TABLE usuarios
  MODIFY rol ENUM('administrador', 'recepcion', 'odontologo', 'usuario') NOT NULL DEFAULT 'recepcion';
