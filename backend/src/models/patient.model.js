const pool = require('../config/db');

const PatientModel = {
  async findAll({ search = '', estado = 'activo' } = {}) {
    const like = `%${search}%`;
    const [rows] = await pool.execute(
      `SELECT id, nombre, apellido, dni, fecha_nacimiento, telefono, correo,
              obra_social, estado, creado_en
       FROM pacientes
       WHERE estado = ?
         AND (nombre LIKE ? OR apellido LIKE ? OR dni LIKE ? OR correo LIKE ?)
       ORDER BY apellido ASC, nombre ASC`,
      [estado, like, like, like, like]
    );
    return rows;
  },

  async findById(id) {
    const [rows] = await pool.execute(
      `SELECT * FROM pacientes WHERE id = ? LIMIT 1`,
      [id]
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
    const [result] = await pool.execute(
      `UPDATE pacientes SET estado = ? WHERE id = ?`,
      [estado, id]
    );
    return result.affectedRows > 0;
  },
};

module.exports = PatientModel;
