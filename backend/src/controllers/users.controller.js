const bcrypt = require('bcryptjs');
const UserModel = require('../models/user.model');
const { logActivity } = require('../utils/activityLogger');

// ─── Listar usuarios ─────────────────────────────────────────────────────────

async function getUsers(req, res, next) {
  try {
    const users = await UserModel.findAll();
    return res.status(200).json({ users });
  } catch (err) {
    next(err);
  }
}

// ─── Obtener usuario por ID ──────────────────────────────────────────────────

async function getUserById(req, res, next) {
  try {
    const user = await UserModel.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: true, message: 'Usuario no encontrado' });
    }
    return res.status(200).json({ user });
  } catch (err) {
    next(err);
  }
}

// ─── Crear usuario (solo admin) ──────────────────────────────────────────────

async function createUser(req, res, next) {
  try {
    const { nombre, apellido, correo, username, password, rol } = req.body;

    // Verificar que el correo no esté en uso
    const existing = await UserModel.findByEmailOrUsername(correo);
    if (existing) {
      return res.status(409).json({ error: true, message: 'El correo ya está registrado' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newId = await UserModel.create({
      nombre,
      apellido,
      correo,
      username: username || null,
      passwordHash,
      rol,
      creadoPor: req.user.id,
    });

    await logActivity({
      usuarioId: req.user.id,
      accion: 'CREAR_USUARIO',
      entidad: 'usuarios',
      entidadId: newId,
      descripcion: `Creó usuario ${correo} con rol ${rol}`,
      ip: req.ip,
    });

    return res.status(201).json({
      message: 'Usuario creado correctamente',
      userId: newId,
    });
  } catch (err) {
    next(err);
  }
}

// ─── Editar rol o estado (solo admin) ────────────────────────────────────────

async function updateUser(req, res, next) {
  try {
    const { id } = req.params;
    const { rol, estado } = req.body;

    // No permitir que el admin se modifique a sí mismo aquí
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ error: true, message: 'No podés modificar tu propia cuenta desde aquí' });
    }

    const updated = await UserModel.updateRolEstado(id, { rol, estado });

    if (!updated) {
      return res.status(404).json({ error: true, message: 'Usuario no encontrado' });
    }

    await logActivity({
      usuarioId: req.user.id,
      accion: 'EDITAR_USUARIO',
      entidad: 'usuarios',
      entidadId: parseInt(id),
      descripcion: `Actualizó rol=${rol ?? '-'} estado=${estado ?? '-'}`,
      ip: req.ip,
    });

    return res.status(200).json({ message: 'Usuario actualizado correctamente' });
  } catch (err) {
    next(err);
  }
}

// ─── Cambiar contraseña propia ───────────────────────────────────────────────

async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;

    const [rows] = await require('../config/db').execute(
      `SELECT password_hash FROM usuarios WHERE id = ?`,
      [req.user.id]
    );
    const record = rows[0];

    const match = await bcrypt.compare(currentPassword, record.password_hash);
    if (!match) {
      return res.status(400).json({ error: true, message: 'La contraseña actual es incorrecta' });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await UserModel.updatePassword(req.user.id, newHash);

    await logActivity({
      usuarioId: req.user.id,
      accion: 'CAMBIAR_CONTRASEÑA',
      ip: req.ip,
    });

    return res.status(200).json({ message: 'Contraseña actualizada correctamente' });
  } catch (err) {
    next(err);
  }
}

// ─── Mi perfil ───────────────────────────────────────────────────────────────

async function getMe(req, res, next) {
  try {
    const user = await UserModel.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: true, message: 'Usuario no encontrado' });
    }
    return res.status(200).json({ user });
  } catch (err) {
    next(err);
  }
}

module.exports = { getUsers, getUserById, createUser, updateUser, changePassword, getMe };
