const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const UserModel = require('../models/user.model');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { generateTwoFACode, sendTwoFACode } = require('../utils/email');
const { logActivity } = require('../utils/activityLogger');
const googleOAuthClient = new OAuth2Client();

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

async function registerPatient(req, res, next) {
  try {
    const nombre = req.body.nombre.trim();
    const apellido = req.body.apellido.trim();
    const correo = req.body.correo.trim().toLowerCase();
    const telefono = req.body.telefono?.trim() || null;
    const existing = await UserModel.findByEmailOrUsername(correo);
    if (existing) return res.status(409).json({ error: true, message: 'Ese correo ya tiene una cuenta. Iniciá sesión.' });

    const passwordHash = await bcrypt.hash(req.body.password, 10);
    const userId = await UserModel.createPatientAccount({ nombre, apellido, correo, telefono, passwordHash });
    const user = { id: userId, nombre, apellido, correo, rol: 'usuario' };
    const payload = { id: userId, rol: 'usuario' };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);
    await UserModel.saveRefreshToken(userId, refreshToken);
    await logActivity({ usuarioId: userId, accion: 'REGISTRO_PACIENTE', ip: req.ip });

    return res.status(201).json({ accessToken, refreshToken, user });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: true, message: 'Ese correo ya tiene una cuenta. Iniciá sesión.' });
    }
    // A patient account and its patient record are inserted together. Older
    // installations need migration 004 to add pacientes.usuario_id.
    if (err.code === 'ER_BAD_FIELD_ERROR' && /usuario_id/i.test(err.message || '')) {
      return res.status(503).json({
        error: true,
        message: 'La base de datos todavía no está preparada para registrar pacientes. Ejecutá backend/src/config/migrations/004_public_patient_accounts.sql en la base dentalis y volvé a intentar.',
      });
    }
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

function allowedOAuthRedirectUris() {
  const configured = (process.env.OAUTH_REDIRECT_URIS || '').split(',').map((uri) => uri.trim()).filter(Boolean);
  if (process.env.OAUTH_REDIRECT_URI) configured.push(process.env.OAUTH_REDIRECT_URI.trim());
  if (process.env.NODE_ENV !== 'production') {
    configured.push('http://localhost:8081', 'http://localhost:8081/');
  }
  configured.push('com.dentalis.app://oauth');
  return [...new Set(configured)];
}

function oauthClientConfigurations(provider) {
  if (provider === 'google') {
    return [
      {
        clientId: process.env.GOOGLE_WEB_CLIENT_ID || process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_WEB_CLIENT_SECRET,
        requiresSecret: true,
        tokenUrl: 'https://oauth2.googleapis.com/token',
      },
      {
        clientId: process.env.GOOGLE_ANDROID_CLIENT_ID,
        clientSecret: process.env.GOOGLE_ANDROID_CLIENT_SECRET,
        requiresSecret: false,
        tokenUrl: 'https://oauth2.googleapis.com/token',
      },
      {
        clientId: process.env.GOOGLE_IOS_CLIENT_ID,
        clientSecret: process.env.GOOGLE_IOS_CLIENT_SECRET,
        requiresSecret: false,
        tokenUrl: 'https://oauth2.googleapis.com/token',
      },
    ].filter((config) => config.clientId);
  }

  const config = provider === 'github'
    ? [
        {
          clientId: process.env.GITHUB_WEB_CLIENT_ID || process.env.GITHUB_CLIENT_ID,
          clientSecret: process.env.GITHUB_WEB_CLIENT_SECRET || process.env.GITHUB_CLIENT_SECRET,
        },
        {
          clientId: process.env.GITHUB_NATIVE_CLIENT_ID,
          clientSecret: process.env.GITHUB_NATIVE_CLIENT_SECRET,
        },
      ].filter((candidate) => candidate.clientId)
    : {
        clientId: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        tokenUrl: 'https://graph.facebook.com/v26.0/oauth/access_token',
      };
  if (Array.isArray(config)) {
    return config.map((candidate) => ({ ...candidate, tokenUrl: 'https://github.com/login/oauth/access_token' }));
  }
  return config.clientId ? [config] : [];
}

async function exchangeOAuthCode(provider, clientId, code, redirectUri, codeVerifier) {
  if (!allowedOAuthRedirectUris().includes(redirectUri)) {
    const error = new Error(`URI de retorno no permitida: ${redirectUri}`);
    error.status = 400;
    throw error;
  }

  const config = oauthClientConfigurations(provider).find((candidate) => candidate.clientId === clientId);
  if (!config || (config.requiresSecret !== false && !config.clientSecret)) {
    const error = new Error(`El cliente OAuth de ${provider} no está configurado correctamente en el servidor.`);
    error.status = 503;
    throw error;
  }

  const params = new URLSearchParams({
    client_id: config.clientId,
    code,
    redirect_uri: redirectUri,
  });
  if (provider === 'google') params.set('grant_type', 'authorization_code');
  if (config.clientSecret) params.set('client_secret', config.clientSecret);
  if (codeVerifier) params.set('code_verifier', codeVerifier);
  const tokenResponse = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  });
  const tokenData = await tokenResponse.json();
  const accessToken = tokenData.access_token;
  if (!tokenResponse.ok || !accessToken) {
    // Keep provider diagnostics in the server log without exposing secrets or
    // authorization codes to the client response.
    console.error('[OAuth token exchange rejected]', {
      provider,
      status: tokenResponse.status,
      error: tokenData.error || 'unknown_error',
      description: tokenData.error_description || tokenData.error_message || 'No description returned',
      redirectUri,
    });
    const error = new Error('El proveedor rechazó el código de autenticación. Verificá las credenciales y la URI de retorno.');
    error.status = 401;
    throw error;
  }

  let profile;
  if (provider === 'google') {
    const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    profile = await response.json();
    if (!response.ok || profile.email_verified !== true) {
      const error = new Error('Google no devolvió un correo verificado.');
      error.status = 401;
      throw error;
    }
    profile.oauthId = profile.sub;
  } else if (provider === 'github') {
    const headers = { Authorization: `Bearer ${accessToken}`, Accept: 'application/vnd.github+json' };
    const [userResponse, emailsResponse] = await Promise.all([
      fetch('https://api.github.com/user', { headers }),
      fetch('https://api.github.com/user/emails', { headers }),
    ]);
    const user = await userResponse.json();
    const emails = await emailsResponse.json();
    const email = Array.isArray(emails)
      ? emails.find((item) => item.primary && item.verified)?.email
      : null;
    if (!userResponse.ok || !emailsResponse.ok || !user.id || !email) {
      const error = new Error('GitHub no devolvió un correo verificado y principal.');
      error.status = 401;
      throw error;
    }
    profile = { oauthId: String(user.id), email, name: user.name || user.login };
  } else {
    const response = await fetch(`https://graph.facebook.com/v26.0/me?fields=id,name,email&access_token=${encodeURIComponent(accessToken)}`);
    profile = await response.json();
    if (!response.ok || !profile.id || !profile.email) {
      const error = new Error('Facebook no devolvió el correo. Revisá el permiso email en Meta for Developers.');
      error.status = 401;
      throw error;
    }
    profile.oauthId = profile.id;
  }

  const parts = (profile.name || '').trim().split(/\s+/).filter(Boolean);
  return {
    oauthId: String(profile.oauthId),
    email: profile.email,
    nombre: parts.shift() || '',
    apellido: parts.join(' '),
  };
}

function normalizeOAuthProfile(profile, oauthId) {
  const parts = (profile.name || '').trim().split(/\s+/).filter(Boolean);
  return {
    oauthId: String(oauthId),
    email: profile.email,
    nombre: parts.shift() || '',
    apellido: parts.join(' '),
  };
}

async function verifyGoogleIdToken(idToken, clientId) {
  const allowedClient = oauthClientConfigurations('google').some((candidate) => candidate.clientId === clientId);
  if (!allowedClient) {
    const error = new Error('El cliente Google enviado no está autorizado en el servidor.');
    error.status = 401;
    throw error;
  }

  let payload;
  try {
    const ticket = await googleOAuthClient.verifyIdToken({ idToken, audience: clientId });
    payload = ticket.getPayload();
  } catch {
    payload = null;
  }
  if (!payload?.sub || !payload.email || payload.email_verified !== true) {
    const error = new Error('Google rechazó la identidad o el correo no está verificado.');
    error.status = 401;
    throw error;
  }
  return normalizeOAuthProfile({ ...payload, name: payload.name || `${payload.given_name || ''} ${payload.family_name || ''}` }, payload.sub);
}

async function verifyFacebookAccessToken(accessToken, clientId) {
  const appId = process.env.FACEBOOK_APP_ID;
  const appSecret = process.env.FACEBOOK_APP_SECRET;
  if (!appId || !appSecret || clientId !== appId) {
    const error = new Error('Facebook no está configurado correctamente en el servidor.');
    error.status = 503;
    throw error;
  }

  const appAccessToken = `${appId}|${appSecret}`;
  const debugUrl = new URL('https://graph.facebook.com/v26.0/debug_token');
  debugUrl.searchParams.set('input_token', accessToken);
  debugUrl.searchParams.set('access_token', appAccessToken);
  const debugResponse = await fetch(debugUrl);
  const debugResult = await debugResponse.json();
  const token = debugResult.data;
  if (!debugResponse.ok || !token?.is_valid || token.app_id !== appId) {
    const error = new Error('Facebook devolvió un token inválido para esta aplicación.');
    error.status = 401;
    throw error;
  }

  const profileUrl = new URL('https://graph.facebook.com/v26.0/me');
  profileUrl.searchParams.set('fields', 'id,name,email');
  profileUrl.searchParams.set('access_token', accessToken);
  const profileResponse = await fetch(profileUrl);
  const profile = await profileResponse.json();
  if (!profileResponse.ok || !profile.id || !profile.email) {
    const error = new Error('Facebook no devolvió el correo. Revisá que el permiso email esté habilitado.');
    error.status = 401;
    throw error;
  }
  return normalizeOAuthProfile(profile, profile.id);
}

async function oauthCallback(req, res, next) {
  try {
    const { provider, code, redirectUri, codeVerifier, clientId, idToken, accessToken: providerAccessToken } = req.body;

    const validProviders = ['google', 'facebook', 'github'];
    if (!validProviders.includes(provider)) {
      return res.status(400).json({ error: true, message: 'Proveedor no soportado' });
    }

    let profile;
    if (provider === 'google' && idToken) {
      profile = await verifyGoogleIdToken(idToken, clientId);
    } else if (provider === 'facebook' && providerAccessToken) {
      profile = await verifyFacebookAccessToken(providerAccessToken, clientId);
    } else if (code) {
      profile = await exchangeOAuthCode(provider, clientId, code, redirectUri, codeVerifier);
    } else {
      return res.status(400).json({ error: true, message: 'Falta la credencial OAuth del proveedor.' });
    }
    const { oauthId, email } = profile;

    // Buscar si ya existe un usuario con ese OAuth ID
    let user = await UserModel.findByOAuthId(provider, oauthId);

    if (!user) {
      // Intentar vincular por correo si ya existe
      user = await UserModel.findByEmailOrUsername(email);
      if (user) {
        await UserModel.linkOAuth(user.id, provider, oauthId);
      } else {
        const nombre = profile.nombre || email.split('@')[0] || 'Paciente';
        const apellido = profile.apellido || 'Paciente';
        const randomPasswordHash = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);
        try {
          const userId = await UserModel.createPatientAccount({
            nombre, apellido, correo: email.trim().toLowerCase(),
            passwordHash: randomPasswordHash,
          });
          await UserModel.linkOAuth(userId, provider, oauthId);
          user = { id: userId, nombre, apellido, correo: email.trim().toLowerCase(), rol: 'usuario', estado: 'activo', two_fa_enabled: 0 };
          await logActivity({ usuarioId: userId, accion: 'REGISTRO_PACIENTE_OAUTH', ip: req.ip });
        } catch (createError) {
          if (createError.code !== 'ER_DUP_ENTRY') throw createError;
          user = await UserModel.findByEmailOrUsername(email);
          if (!user) throw createError;
          await UserModel.linkOAuth(user.id, provider, oauthId);
        }
      }
    }

    if (user.estado !== 'activo') {
      return res.status(403).json({ error: true, message: 'La cuenta está desactivada' });
    }

    if (user.two_fa_enabled) {
      const twoFACode = generateTwoFACode();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
      await UserModel.saveTwoFACode(user.id, twoFACode, expiresAt);
      await sendTwoFACode(user.correo, twoFACode);
      await logActivity({ usuarioId: user.id, accion: 'LOGIN_OAUTH_2FA_INICIADO', ip: req.ip });
      return res.status(200).json({
        twoFARequired: true,
        userId: user.id,
        message: 'Código de verificación enviado al correo',
      });
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

module.exports = { registerPatient, login, verifyTwoFA, refreshToken, logout, oauthCallback };
