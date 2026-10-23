const pool = require('../config/db');

const TreatmentModel = {
  async findAll({ pacienteId, odontologoId, estado } = {}) {
    let where = 'WHERE 1=1';
    const params = [];
    if (pacienteId)   { where += ' AND t.paciente_id = ?';    params.push(pacienteId); }
    if (odontologoId) { where += ' AND t.odontologo_id = ?';  params.push(odontologoId); }
    if (estado)       { where += ' AND t.estado = ?';          params.push(estado); }

    const [rows] = await pool.execute(
      `SELECT t.*,
              CONCAT(p.nombre,' ',p.apellido) AS paciente_nombre,
              CONCAT(u.nombre,' ',u.apellido) AS odontologo_nombre
       FROM tratamientos t
       JOIN pacientes p ON p.id = t.paciente_id
       JOIN usuarios  u ON u.id = t.odontologo_id
       ${where}
       ORDER BY t.creado_en DESC`,
      params
    );
    return rows;
  },

  async findById(id) {
    const [rows] = await pool.execute(
      `SELECT t.*,
              CONCAT(p.nombre,' ',p.apellido) AS paciente_nombre,
              CONCAT(u.nombre,' ',u.apellido) AS odontologo_nombre
       FROM tratamientos t
       JOIN pacientes p ON p.id = t.paciente_id
       JOIN usuarios  u ON u.id = t.odontologo_id
       WHERE t.id = ? LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  },

  async isAssignedToOdontologo(id, odontologoId) {
    const [rows] = await pool.execute('SELECT 1 FROM tratamientos WHERE id = ? AND odontologo_id = ? LIMIT 1', [id, odontologoId]);
    return rows.length > 0;
  },

  async create({ pacienteId, odontologoId, descripcion, costoTotal, notas, creadoPor }) {
    const [result] = await pool.execute(
      `INSERT INTO tratamientos (paciente_id, odontologo_id, descripcion, costo_total, notas)
       VALUES (?, ?, ?, ?, ?)`,
      [pacienteId, odontologoId, descripcion, costoTotal || null, notas || null]
    );
    return result.insertId;
  },

  async update(id, { descripcion, estado, costoTotal, notas }, odontologoId = null) {
    const [result] = await pool.execute(
      `UPDATE tratamientos SET
         descripcion  = COALESCE(?, descripcion),
         estado       = COALESCE(?, estado),
         costo_total  = COALESCE(?, costo_total),
         notas        = COALESCE(?, notas)
       WHERE id = ? AND (? IS NULL OR odontologo_id = ?)`,
      [descripcion, estado, costoTotal, notas, id, odontologoId, odontologoId]
    );
    return result.affectedRows > 0;
  },

  async delete(id, odontologoId = null) {
    const [result] = await pool.execute(`DELETE FROM tratamientos WHERE id = ? AND (? IS NULL OR odontologo_id = ?)`, [id, odontologoId, odontologoId]);
    return result.affectedRows > 0;
  },
};

module.exports = TreatmentModel;
