const pool = require('../config/db');

const ClinicalRecordModel = {
  async findByPatient(pacienteId) {
    const [rows] = await pool.execute(
      `SELECT * FROM fichas_clinicas WHERE paciente_id = ? LIMIT 1`,
      [pacienteId]
    );
    return rows[0] || null;
  },

  async createOrUpdate(pacienteId, { antecedentes, alergias, medicacion, observaciones }) {
    const existing = await this.findByPatient(pacienteId);
    if (existing) {
      await pool.execute(
        `UPDATE fichas_clinicas SET
           antecedentes  = COALESCE(?, antecedentes),
           alergias      = COALESCE(?, alergias),
           medicacion    = COALESCE(?, medicacion),
           observaciones = COALESCE(?, observaciones)
         WHERE paciente_id = ?`,
        [antecedentes, alergias, medicacion, observaciones, pacienteId]
      );
      return existing.id;
    } else {
      const [result] = await pool.execute(
        `INSERT INTO fichas_clinicas (paciente_id, antecedentes, alergias, medicacion, observaciones)
         VALUES (?, ?, ?, ?, ?)`,
        [pacienteId, antecedentes || null, alergias || null, medicacion || null, observaciones || null]
      );
      return result.insertId;
    }
  },

  // Consultas de la ficha
  async getConsultas(fichaId) {
    const [rows] = await pool.execute(
      `SELECT c.*, CONCAT(u.nombre,' ',u.apellido) AS odontologo_nombre
       FROM consultas c
       JOIN usuarios u ON u.id = c.odontologo_id
       WHERE c.ficha_id = ?
       ORDER BY c.fecha DESC`,
      [fichaId]
    );
    return rows;
  },

  async addConsulta(fichaId, odontologoId, { diagnostico, procedimiento, indicaciones, proximaCita }) {
    const [result] = await pool.execute(
      `INSERT INTO consultas (ficha_id, odontologo_id, diagnostico, procedimiento, indicaciones, proxima_cita)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [fichaId, odontologoId, diagnostico || null, procedimiento || null, indicaciones || null, proximaCita || null]
    );
    return result.insertId;
  },

  // Odontograma (guardado como JSON en la tabla)
  async getOdontograma(pacienteId) {
    const [rows] = await pool.execute(
      `SELECT odontograma FROM fichas_clinicas WHERE paciente_id = ? LIMIT 1`,
      [pacienteId]
    );
    if (!rows[0] || !rows[0].odontograma) return {};
    try { return JSON.parse(rows[0].odontograma); } catch { return {}; }
  },

  async saveOdontograma(pacienteId, odontograma) {
    await pool.execute(
      `UPDATE fichas_clinicas SET odontograma = ? WHERE paciente_id = ?`,
      [JSON.stringify(odontograma), pacienteId]
    );
  },
};

module.exports = ClinicalRecordModel;
