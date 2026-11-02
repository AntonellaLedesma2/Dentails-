const pool = require('../config/db');

const PatientModel = {
  async findAll({ search = '', estado = 'activo', odontologoId = null } = {}) {
    const like = `%${search}%`;
    const stateFilter = estado && estado !== 'todos' ? 'estado = ? AND' : '';
    const doctorScope = odontologoId
      ? 'AND EXISTS (SELECT 1 FROM turnos t WHERE t.paciente_id = pacientes.id AND t.odontologo_id = ?)'
      : '';
    const params = [...(stateFilter ? [estado] : []), ...Array(11).fill(like)];
    if (odontologoId) params.push(odontologoId);
    const [rows] = await pool.execute(
      `SELECT id, nombre, apellido, dni, fecha_nacimiento, telefono, correo,
              obra_social, estado, creado_en
       FROM pacientes
       WHERE ${stateFilter}
         (nombre LIKE ? OR apellido LIKE ? OR dni LIKE ? OR correo LIKE ?
              OR telefono LIKE ? OR direccion LIKE ? OR obra_social LIKE ?
              OR nro_afiliado LIKE ? OR sexo LIKE ?
              OR CAST(fecha_nacimiento AS CHAR) LIKE ? OR CAST(observaciones AS CHAR) LIKE ?)
         ${doctorScope}
       ORDER BY apellido ASC, nombre ASC`,
      params
    );
    return rows;
  },

  async findById(id, odontologoId = null) {
    const doctorScope = odontologoId
      ? 'AND EXISTS (SELECT 1 FROM turnos t WHERE t.paciente_id = pacientes.id AND t.odontologo_id = ?)'
      : '';
    const params = [id];
    if (odontologoId) params.push(odontologoId);
    const [rows] = await pool.execute(
      `SELECT * FROM pacientes WHERE id = ? ${doctorScope} LIMIT 1`,
      params
    );
    return rows[0] || null;
  },

  async findByUserId(userId) {
    const [rows] = await pool.execute(
      `SELECT * FROM pacientes WHERE usuario_id = ? AND estado = 'activo' LIMIT 1`, [userId]
    );
    return rows[0] || null;
  },

  async findByDni(dni) {
    const [rows] = await pool.execute(
      `SELECT id FROM pacientes WHERE dni = ? LIMIT 1`,
      [dni]
    );
    return rows[0] || null;
  },

  async create({ nombre, apellido, dni, fechaNacimiento, sexo, telefono, correo, direccion, obraSocial, nroAfiliado, observaciones, creadoPor }) {
    const [result] = await pool.execute(
      `INSERT INTO pacientes
         (nombre, apellido, dni, fecha_nacimiento, sexo, telefono, correo,
          direccion, obra_social, nro_afiliado, observaciones, creado_por)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [nombre, apellido, dni || null, fechaNacimiento || null, sexo || null,
       telefono || null, correo || null, direccion || null,
       obraSocial || null, nroAfiliado || null, observaciones || null, creadoPor || null]
    );
    return result.insertId;
  },

  async update(id, { nombre, apellido, dni, fechaNacimiento, sexo, telefono, correo, direccion, obraSocial, nroAfiliado, observaciones }) {
    const [result] = await pool.execute(
      `UPDATE pacientes SET
         nombre = COALESCE(?, nombre),
         apellido = COALESCE(?, apellido),
         dni = COALESCE(?, dni),
         fecha_nacimiento = COALESCE(?, fecha_nacimiento),
         sexo = COALESCE(?, sexo),
         telefono = COALESCE(?, telefono),
         correo = COALESCE(?, correo),
         direccion = COALESCE(?, direccion),
         obra_social = COALESCE(?, obra_social),
         nro_afiliado = COALESCE(?, nro_afiliado),
         observaciones = COALESCE(?, observaciones)
       WHERE id = ?`,
      [nombre, apellido, dni, fechaNacimiento, sexo, telefono, correo,
       direccion, obraSocial, nroAfiliado, observaciones, id]
    );
    return result.affectedRows > 0;
  },

  async setEstado(id, estado) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const [patients] = await connection.execute(
        `SELECT usuario_id FROM pacientes WHERE id = ? FOR UPDATE`, [id]
      );
      if (!patients.length) {
        await connection.rollback();
        return false;
      }
      await connection.execute(`UPDATE pacientes SET estado = ? WHERE id = ?`, [estado, id]);
      if (patients[0].usuario_id) {
        await connection.execute(`UPDATE usuarios SET estado = ? WHERE id = ?`, [estado, patients[0].usuario_id]);
      }
      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },
};

module.exports = PatientModel;
