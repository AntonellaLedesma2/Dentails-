const pool = require('../config/db');

const PaymentModel = {
  async findAll({ pacienteId, odontologoId, desde, hasta } = {}) {
    let where = 'WHERE 1=1';
    const params = [];
    if (pacienteId)   { where += ' AND pa.paciente_id = ?'; params.push(pacienteId); }
    if (odontologoId) { where += ' AND tr.odontologo_id = ?'; params.push(odontologoId); }
    if (desde)        { where += ' AND pa.fecha >= ?'; params.push(desde); }
    if (hasta)        { where += ' AND pa.fecha <= ?'; params.push(hasta); }

    const [rows] = await pool.execute(
      `SELECT pa.*,
              CONCAT(p.nombre,' ',p.apellido)  AS paciente_nombre,
              tr.descripcion                    AS tratamiento_desc,
              tr.odontologo_id,
              CONCAT(u.nombre,' ',u.apellido)  AS odontologo_nombre
       FROM pagos pa
       JOIN pacientes p ON p.id = pa.paciente_id
       LEFT JOIN tratamientos tr ON tr.id = pa.tratamiento_id
       LEFT JOIN usuarios u ON u.id = tr.odontologo_id
       ${where}
       ORDER BY pa.fecha DESC`,
      params
    );
    return rows;
  },

  async findById(id) {
    const [rows] = await pool.execute(
      `SELECT pa.*,
              CONCAT(p.nombre,' ',p.apellido) AS paciente_nombre,
              tr.descripcion AS tratamiento_desc
       FROM pagos pa
       JOIN pacientes p ON p.id = pa.paciente_id
       LEFT JOIN tratamientos tr ON tr.id = pa.tratamiento_id
       WHERE pa.id = ? LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  },

  async create({ pacienteId, tratamientoId, importe, metodo, referencia, registradoPor }) {
    const [result] = await pool.execute(
      `INSERT INTO pagos (paciente_id, tratamiento_id, importe, metodo, referencia, registrado_por)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [pacienteId, tratamientoId || null, importe, metodo, referencia || null, registradoPor || null]
    );
    return result.insertId;
  },

  // Resumen por odontólogo (para recepción)
  async summaryByOdontologo() {
    const [rows] = await pool.execute(
      `SELECT u.id AS odontologo_id,
              CONCAT(u.nombre,' ',u.apellido) AS odontologo_nombre,
              COUNT(DISTINCT pa.paciente_id) AS total_pacientes,
              COUNT(pa.id)                   AS total_pagos,
              COALESCE(SUM(pa.importe), 0)   AS total_cobrado
       FROM usuarios u
       LEFT JOIN tratamientos tr ON tr.odontologo_id = u.id
       LEFT JOIN pagos pa ON pa.tratamiento_id = tr.id
       WHERE u.rol = 'odontologo' AND u.estado = 'activo'
       GROUP BY u.id
       ORDER BY u.apellido`
    );
    return rows;
  },

  // Pagos de pacientes de un odontólogo específico
  async byOdontologoPacientes(odontologoId) {
    const [rows] = await pool.execute(
      `SELECT p.id AS paciente_id,
              CONCAT(p.nombre,' ',p.apellido) AS paciente_nombre,
              COUNT(pa.id)                    AS total_pagos,
              COALESCE(SUM(pa.importe), 0)    AS total_pagado,
              COALESCE(SUM(tr.costo_total), 0) AS total_tratamientos,
              COALESCE(SUM(tr.costo_total), 0) - COALESCE(SUM(pa.importe), 0) AS saldo_pendiente
       FROM pacientes p
       JOIN tratamientos tr ON tr.paciente_id = p.id AND tr.odontologo_id = ?
       LEFT JOIN pagos pa ON pa.paciente_id = p.id AND pa.tratamiento_id = tr.id
       GROUP BY p.id
       ORDER BY p.apellido`,
      [odontologoId]
    );
    return rows;
  },

  // Reportes para admin
  async adminSummary() {
    const [[totales]] = await pool.execute(
      `SELECT
         COALESCE(SUM(importe), 0) AS total_mes,
         COUNT(*) AS cantidad_pagos
       FROM pagos
       WHERE MONTH(fecha) = MONTH(CURDATE()) AND YEAR(fecha) = YEAR(CURDATE())`
    );

    const [porMes] = await pool.execute(
      `SELECT
         DATE_FORMAT(fecha, '%Y-%m') AS mes,
         COALESCE(SUM(importe), 0)  AS total,
         COUNT(*) AS cantidad
       FROM pagos
       WHERE fecha >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
       GROUP BY mes
       ORDER BY mes ASC`
    );

    return { totales, porMes };
  },
};

module.exports = PaymentModel;
