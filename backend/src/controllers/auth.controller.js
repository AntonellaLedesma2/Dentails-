const bcrypt = require('bcryptjs');
const UserModel = require('../models/user.model');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { generateTwoFACode, sendTwoFACode } = require('../utils/email');
const { logActivity } = require('../utils/activityLogger');

// ─── Login con email/password ────────────────────────────────────────────────

async function login(req, res, next) {
  try {
    const { identifier, password } = req.body;

    const user = await UserModel.findByEmailOrUsername(identifier);

    if (!user) {
      return res.status(401).json({ error: true, message: 'Credenciales inválidas' });
    }

    if (user.estado !== 'activo') {
      return res.status(403).json({ error: true, message: 'La cuenta está desactivada' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: true, message: 'Credenciales inválidas' });
    }

    // Si tiene 2FA activado, enviar código y no emitir tokens todavía
    if (user.two_fa_enabled) {
      const code = generateTwoFACode();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

      await UserModel.saveTwoFACode(user.id, code, expiresAt);
      await sendTwoFACode(user.correo, code);

      await logActivity({
        usuarioId: user.id,
        accion: 'LOGIN_2FA_INICIADO',
        ip: req.ip,
      });

      return res.status(200).json({
        twoFARequired: true,
        userId: user.id,
        message: 'Código de verificación enviado al correo',
      });
    }

    // Sin 2FA: emitir tokens directamente
    const payload = { id: user.id, rol: user.rol };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    await UserModel.saveRefreshToken(user.id, refreshToken);

    await logActivity({
      usuarioId: user.id,
      accion: 'LOGIN',
      ip: req.ip,
    });

    return res.status(200).json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        nombre: user.nombre,
        apellido: user.apellido,
        correo: user.correo,
        rol: user.rol,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ─── Verificar código 2FA ────────────────────────────────────────────────────

async function verifyTwoFA(req, res, next) {
  try {
    const { userId, code } = req.body;

    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ error: true, message: 'Usuario no encontrado' });
    }

    // Recuperar código desde DB (necesitamos password_hash y two_fa_code)
    const [rows] = await require('../config/db').execute(
      `SELECT two_fa_code, two_fa_expires FROM usuarios WHERE id = ?`,
      [userId]
    );
    const record = rows[0];

    if (!record?.two_fa_code || new Date() > new Date(record.two_fa_expires)) {
      return res.status(400).json({ error: true, message: 'El código expiró, iniciá sesión nuevamente' });
    }

    if (record.two_fa_code !== code) {
      return res.status(400).json({ error: true, message: 'Código incorrecto' });
    }

    await UserModel.clearTwoFACode(userId);

    const payload = { id: user.id, rol: user.rol };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    await UserModel.saveRefreshToken(user.id, refreshToken);

    await logActivity({ usuarioId: user.id, accion: 'LOGIN_2FA_VERIFICADO', ip: req.ip });

    return res.status(200).json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        nombre: user.nombre,
        apellido: user.apellido,
        correo: user.correo,
        rol: user.rol,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ─── Refresh token ───────────────────────────────────────────────────────────

async function refreshToken(req, res, next) {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return res.status(400).json({ error: true, message: 'Refresh token requerido' });
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch {
      return res.status(401).json({ error: true, message: 'Refresh token inválido o expirado' });
    }

    // Verificar que el token coincide con el guardado
    const [rows] = await require('../config/db').execute(
      `SELECT refresh_token, estado FROM usuarios WHERE id = ?`,
      [decoded.id]
    );
    const record = rows[0];

    if (!record || record.refresh_token !== token || record.estado !== 'activo') {
      return res.status(401).json({ error: true, message: 'Refresh token inválido' });
    }

    const payload = { id: decoded.id, rol: decoded.rol };
    const newAccessToken = generateAccessToken(payload);
    const newRefreshToken = generateRefreshToken(payload);

    await UserModel.saveRefreshToken(decoded.id, newRefreshToken);

    return res.status(200).json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (err) {
    next(err);
  }
}

// ─── Logout ──────────────────────────────────────────────────────────────────

async function logout(req, res, next) {
  try {
    await UserModel.revokeRefreshToken(req.user.id);
    await logActivity({ usuarioId: req.user.id, accion: 'LOGOUT', ip: req.ip });
    return res.status(200).json({ message: 'Sesión cerrada correctamente' });
  } catch (err) {
    next(err);
  }
}

// ─── OAuth callback genérico ─────────────────────────────────────────────────

async function oauthCallback(req, res, next) {
  try {
    const { provider, oauthId, email, nombre, apellido } = req.body;

    const validProviders = ['google', 'facebook', 'github'];
    if (!validProviders.includes(provider)) {
      return res.status(400).json({ error: true, message: 'Proveedor no soportado' });
    }

    // Buscar si ya existe un usuario con ese OAuth ID
    let user = await UserModel.findByOAuthId(provider, oauthId);

    if (!user) {
      // Intentar vincular por correo si ya existe
      user = await UserModel.findByEmailOrUsername(email);
      if (user) {
        await UserModel.linkOAuth(user.id, provider, oauthId);
      } else {
        return res.status(404).json({
          error: true,
          message: 'No existe una cuenta asociada a este correo. Contactá al administrador para crear tu cuenta.',
        });
      }
    }

    if (user.estado !== 'activo') {
      return res.status(403).json({ error: true, message: 'La cuenta está desactivada' });
    }

    const payload = { id: user.id, rol: user.rol };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    await UserModel.saveRefreshToken(user.id, refreshToken);
    await logActivity({ usuarioId: user.id, accion: `LOGIN_OAUTH_${provider.toUpperCase()}`, ip: req.ip });

    return res.status(200).json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        nombre: user.nombre,
        apellido: user.apellido,
        correo: user.correo,
        rol: user.rol,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { login, verifyTwoFA, refreshToken, logout, oauthCallback };
