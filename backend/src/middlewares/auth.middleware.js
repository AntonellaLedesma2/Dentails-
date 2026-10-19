const { verifyAccessToken } = require('../utils/jwt');

/**
 * Verifica que el request tenga un JWT válido.
 * Adjunta el payload decodificado en req.user
 */
function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: true,
      message: 'Token de acceso requerido',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: true,
        message: 'El token expiró, iniciá sesión nuevamente',
        code: 'TOKEN_EXPIRED',
      });
    }
    return res.status(401).json({
      error: true,
      message: 'Token inválido',
    });
  }
}

/**
 * Fábrica de middleware que verifica que el usuario tenga uno de los roles permitidos.
 * Debe usarse después de authenticate.
 * @param {...string} roles - Roles permitidos: 'administrador', 'recepcion', 'odontologo'
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: true, message: 'No autenticado' });
    }

    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({
        error: true,
        message: 'No tenés permiso para realizar esta acción',
      });
    }

    next();
  };
}

module.exports = { authenticate, authorize };
