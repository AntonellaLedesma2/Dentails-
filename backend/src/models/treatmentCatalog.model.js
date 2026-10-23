const pool = require('../config/db');

const TreatmentCatalogModel = {
  async findAll({ includeInactive = false } = {}) {
    const [rows] = await pool.execute(
      `SELECT id, nombre, categoria, descripcion, precio, duracion_min, activo
       FROM catalogo_tratamientos ${includeInactive ? '' : 'WHERE activo = 1'}
       ORDER BY categoria, nombre`
    );
    return rows;
  },

  async create({ nombre, categoria, descripcion, precio, duracionMin }) {
    const [result] = await pool.execute(
      `INSERT INTO catalogo_tratamientos (nombre, categoria, descripcion, precio, duracion_min)
       VALUES (?, ?, ?, ?, ?)`,
      [nombre, categoria || 'General', descripcion || null, precio, duracionMin || 30]
    );
    return result.insertId;
  },

  async update(id, { nombre, categoria, descripcion, precio, duracionMin, activo }) {
    const [result] = await pool.execute(
      `UPDATE catalogo_tratamientos SET
         nombre = COALESCE(?, nombre), categoria = COALESCE(?, categoria),
         descripcion = COALESCE(?, descripcion), precio = COALESCE(?, precio),
         duracion_min = COALESCE(?, duracion_min), activo = COALESCE(?, activo)
       WHERE id = ?`,
      [nombre ?? null, categoria ?? null, descripcion ?? null, precio ?? null,
        duracionMin ?? null, activo === undefined ? null : Number(activo), id]
    );
    return result.affectedRows > 0;
  },
};

module.exports = TreatmentCatalogModel;
