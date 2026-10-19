const pool = require('../config/db');

const UserModel = {
  /**
   * Busca un usuario por correo o username
   */
  async findByEmailOrUsername(identifier) {
    const [rows] = await pool.execute(
      `SELECT * FROM usuarios WHERE correo = ? OR username = ? LIMIT 1`,
      [identifier, identifier]
    );
    return rows[0] || null;
  },

  /**
   * Busca un usuario por ID
   */
  async findById(id) {
    const [rows] = await pool.execute(
      `SELECT id, nombre, apellido, correo, username, rol, estado, two_fa_enabled, 
              google_id, facebook_id, github_id, creado_en
       FROM usuarios WHERE id = ? LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  },

  /**
   * Busca usuario por ID de proveedor OAuth
   */
  async findByOAuthId(provider, oauthId) {
    const column = `${provider}_id`;
    const [rows] = await pool.execute(
      `SELECT * FROM usuarios WHERE ${column} = ? LIMIT 1`,
      [oauthId]
    );
    return rows[0] || null;
  },

  /**
   * Lista todos los usuarios (sin password_hash)
   */
  async findAll() {
    const [rows] = await pool.execute(
      `SELECT id, nombre, apellido, correo, username, rol, estado, 
              two_fa_enabled, creado_por, creado_en, actualizado_en
       FROM usuarios ORDER BY creado_en DESC`
    );
    return rows;
  },

  /**
   * Crea un nuevo usuario
   */
  async create({ nombre, apellido, correo, username, passwordHash, rol, creadoPor }) {
    const [result] = await pool.execute(
      `INSERT INTO usuarios (nombre, apellido, correo, username, password_hash, rol, creado_por)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [nombre, apellido, correo, username || null, passwordHash, rol, creadoPor || null]
    );
    return result.insertId;
  },

  /**
   * Actualiza rol y/o estado de un usuario
   */
  async updateRolEstado(id, { rol, estado }) {
    const [result] = await pool.execute(
      `UPDATE usuarios SET rol = COALESCE(?, rol), estado = COALESCE(?, estado)
       WHERE id = ?`,
      [rol || null, estado || null, id]
    );
    return result.affectedRows > 0;
  },

  /**
   * Guarda el refresh token en la DB
   */
  async saveRefreshToken(id, token) {
    await pool.execute(`UPDATE usuarios SET refresh_token = ? WHERE id = ?`, [token, id]);
  },

  /**
   * Revoca el refresh token (logout)
   */
  async revokeRefreshToken(id) {
    await pool.execute(`UPDATE usuarios SET refresh_token = NULL WHERE id = ?`, [id]);
  },

  /**
   * Guarda el código 2FA y su expiración
   */
  async saveTwoFACode(id, code, expiresAt) {
    await pool.execute(
      `UPDATE usuarios SET two_fa_code = ?, two_fa_expires = ? WHERE id = ?`,
      [code, expiresAt, id]
    );
  },

  /**
   * Limpia el código 2FA tras verificación
   */
  async clearTwoFACode(id) {
    await pool.execute(
      `UPDATE usuarios SET two_fa_code = NULL, two_fa_expires = NULL WHERE id = ?`,
      [id]
    );
  },

  /**
   * Vincula un proveedor OAuth a un usuario existente
   */
  async linkOAuth(id, provider, oauthId) {
    const column = `${provider}_id`;
    await pool.execute(`UPDATE usuarios SET ${column} = ? WHERE id = ?`, [oauthId, id]);
  },

  /**
   * Actualiza contraseña
   */
  async updatePassword(id, passwordHash) {
    await pool.execute(`UPDATE usuarios SET password_hash = ? WHERE id = ?`, [passwordHash, id]);
  },
};

module.exports = UserModel;
