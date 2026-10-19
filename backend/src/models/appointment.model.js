const pool = require('../config/db');

const AppointmentModel = {
  async findAll({ fecha, odontologoId, estado, pacienteId } = {}) {
    let where = 'WHERE 1=1';
    const params = [];

    if (fecha)        { where += ' AND t.fecha = ?';           params.push(fecha); }
    if (odontologoId) { where += ' AND t.odontologo_id = ?';   params.push(odontologoId); }
    if (estado)       { where += ' AND t.estado = ?';          params.push(estado); }
    if (pacienteId)   { where += ' AND t.paciente_id = ?';     params.push(pacienteId); }

    const [rows] = await pool.execute(
      `SELECT t.*,
              CONCAT(p.nombre, ' ', p.apellido) AS paciente_nombre,
              p.telefono                          AS paciente_telefono,
              CONCAT(u.nombre, ' ', u.apellido)  AS odontologo_nombre
       FROM turnos t
       JOIN pacientes p ON p.id = t.paciente_id
       JOIN usuarios  u ON u.id = t.odontologo_id
       ${where}
       ORDER BY t.fecha ASC, t.hora ASC`,
      params
    );
    return rows;
  },

  async findById(id) {
    const [rows] = await pool.execute(
      `SELECT t.*,
              CONCAT(p.nombre, ' ', p.apellido) AS paciente_nombre,
              p.telefono                          AS paciente_telefono,
              p.correo                            AS paciente_correo,
              CONCAT(u.nombre, ' ', u.apellido)  AS odontologo_nombre
       FROM turnos t
       JOIN pacientes p ON p.id = t.paciente_id
       JOIN usuarios  u ON u.id = t.odontologo_id
       WHERE t.id = ? LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  },

  async findByDateAndOdontologo(fecha, odontologoId, excludeId = null) {
    let sql = `SELECT id, hora, duracion_min FROM turnos
               WHERE fecha = ? AND odontologo_id = ? AND estado NOT IN ('cancelado')`;
    const params = [fecha, odontologoId];
    if (excludeId) { sql += ' AND id != ?'; params.push(excludeId); }
    const [rows] = await pool.execute(sql, params);
    return rows;
  },

  async create({ pacienteId, odontologoId, fecha, hora, duracionMin = 30, motivo, notas, creadoPor }) {
    const [result] = await pool.execute(
      `INSERT INTO turnos (paciente_id, odontologo_id, fecha, hora, duracion_min, motivo, notas, creado_por)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [pacienteId, odontologoId, fecha, hora, duracionMin, motivo || null, notas || null, creadoPor || null]
    );
    return result.insertId;
  },

  async update(id, { pacienteId, odontologoId, fecha, hora, duracionMin, motivo, notas, estado }) {
    const [result] = await pool.execute(
      `UPDATE turnos SET
         paciente_id   = COALESCE(?, paciente_id),
         odontologo_id = COALESCE(?, odontologo_id),
         fecha         = COALESCE(?, fecha),
         hora          = COALESCE(?, hora),
         duracion_min  = COALESCE(?, duracion_min),
         motivo        = COALESCE(?, motivo),
         notas         = COALESCE(?, notas),
         estado        = COALESCE(?, estado)
       WHERE id = ?`,
      [pacienteId, odontologoId, fecha, hora, duracionMin, motivo, notas, estado, id]
    );
    return result.affectedRows > 0;
  },

  async setEstado(id, estado) {
    const [result] = await pool.execute(
      `UPDATE turnos SET estado = ? WHERE id = ?`,
      [estado, id]
    );
    return result.affectedRows > 0;
  },
};

module.exports = AppointmentModel;
