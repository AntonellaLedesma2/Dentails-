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
              COALESCE(SUM(pay.total_pagos), 0) AS total_pagos,
              COALESCE(SUM(pay.total_pagado), 0) AS total_pagado,
              COALESCE(SUM(tr.costo_total), 0) AS total_tratamientos,
              GREATEST(COALESCE(SUM(tr.costo_total), 0) - COALESCE(SUM(pay.total_pagado), 0), 0) AS saldo_pendiente
       FROM pacientes p
       JOIN tratamientos tr ON tr.paciente_id = p.id AND tr.odontologo_id = ?
       LEFT JOIN (
         SELECT tratamiento_id, COUNT(*) AS total_pagos, SUM(importe) AS total_pagado
         FROM pagos GROUP BY tratamiento_id
       ) pay ON pay.tratamiento_id = tr.id
       GROUP BY p.id, p.nombre, p.apellido
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

    const [[metricas]] = await pool.execute(
      `SELECT
         (SELECT COUNT(*) FROM pacientes WHERE estado = 'activo') AS pacientes,
         (SELECT COUNT(*) FROM usuarios WHERE rol = 'odontologo' AND estado = 'activo') AS odontologos,
         (SELECT COUNT(*) FROM usuarios WHERE estado = 'activo') AS usuarios_activos,
         (SELECT COUNT(*) FROM turnos WHERE fecha = CURDATE() AND estado <> 'cancelado') AS turnos_hoy,
         (SELECT COUNT(*) FROM turnos WHERE YEAR(fecha) = YEAR(CURDATE()) AND MONTH(fecha) = MONTH(CURDATE())) AS turnos_mes,
         (SELECT COUNT(*) FROM turnos WHERE fecha >= CURDATE() AND estado IN ('pendiente','confirmado')) AS proximos_turnos,
         (SELECT COUNT(*) FROM tratamientos WHERE estado IN ('planificado','en_curso')) AS tratamientos_activos`
    );

    const [turnosPorMes] = await pool.execute(
      `SELECT DATE_FORMAT(fecha, '%Y-%m') AS mes,
              COUNT(*) AS total,
              SUM(estado = 'realizado') AS realizados,
              SUM(estado = 'cancelado') AS cancelados
       FROM turnos
       WHERE fecha >= DATE_SUB(CURDATE(), INTERVAL 5 MONTH) AND fecha <= CURDATE()
       GROUP BY mes ORDER BY mes`
    );

    const [estadosTurno] = await pool.execute(
      `SELECT estado, COUNT(*) AS total FROM turnos
       WHERE fecha >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH) AND fecha <= CURDATE() GROUP BY estado`
    );

    const [proximosTurnos] = await pool.execute(
      `SELECT t.id, t.fecha, t.hora, t.estado, t.motivo,
              CONCAT(p.nombre, ' ', p.apellido) AS paciente_nombre,
              CONCAT(u.nombre, ' ', u.apellido) AS odontologo_nombre
       FROM turnos t JOIN pacientes p ON p.id = t.paciente_id
       JOIN usuarios u ON u.id = t.odontologo_id
       WHERE t.fecha >= CURDATE() AND t.estado IN ('pendiente','confirmado')
       ORDER BY t.fecha, t.hora LIMIT 6`
    );

    const [topTratamientos] = await pool.execute(
      `SELECT descripcion AS nombre, COUNT(*) AS cantidad, COALESCE(SUM(costo_total), 0) AS valor
       FROM tratamientos GROUP BY descripcion ORDER BY cantidad DESC LIMIT 5`
    );

    const [porMetodo] = await pool.execute(
      `SELECT metodo, COUNT(*) AS cantidad, COALESCE(SUM(importe), 0) AS total
       FROM pagos WHERE YEAR(fecha) = YEAR(CURDATE()) AND MONTH(fecha) = MONTH(CURDATE())
       GROUP BY metodo ORDER BY total DESC`
    );

    return { totales, porMes, metricas, turnosPorMes, estadosTurno, proximosTurnos, topTratamientos, porMetodo };
  },
};

module.exports = PaymentModel;
