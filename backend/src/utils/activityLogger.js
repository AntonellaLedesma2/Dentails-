const pool = require('../config/db');

/**
 * Registra una acción en la tabla registro_actividad
 * @param {Object} params
 * @param {number|null} params.usuarioId
 * @param {string} params.accion - ej: 'LOGIN', 'CREAR_USUARIO', 'EDITAR_PACIENTE'
 * @param {string|null} params.entidad - ej: 'usuarios', 'pacientes'
 * @param {number|null} params.entidadId
 * @param {string|null} params.descripcion
 * @param {string|null} params.ip
 */
async function logActivity({ usuarioId = null, accion, entidad = null, entidadId = null, descripcion = null, ip = null }) {
  try {
    await pool.execute(
      `INSERT INTO registro_actividad (usuario_id, accion, entidad, entidad_id, descripcion, ip)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [usuarioId, accion, entidad, entidadId, descripcion, ip]
    );
  } catch (error) {
    // El log no debe romper el flujo principal
    console.error('Error al registrar actividad:', error.message);
  }
}

module.exports = { logActivity };
