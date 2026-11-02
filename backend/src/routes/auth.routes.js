const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const { registerPatient, login, verifyTwoFA, refreshToken, logout, oauthCallback } = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');

function allowedOAuthRedirectUris() {
  const uris = (process.env.OAUTH_REDIRECT_URIS || '')
    .split(',')
    .map((uri) => uri.trim())
    .filter(Boolean);
  if (process.env.OAUTH_REDIRECT_URI) uris.push(process.env.OAUTH_REDIRECT_URI.trim());
  if (process.env.NODE_ENV !== 'production') uris.push('http://localhost:8081', 'http://localhost:8081/');
  uris.push('com.dentalis.app://oauth');
  return [...new Set(uris)];
}

// POST /api/auth/login
router.post(
  '/register',
  [
    body('nombre').trim().notEmpty().withMessage('Nombre requerido'),
    body('apellido').trim().notEmpty().withMessage('Apellido requerido'),
    body('correo').trim().isEmail().withMessage('Ingresá un correo válido'),
    body('password').isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres'),
    body('telefono').optional({ values: 'falsy' }).isLength({ max: 30 }).withMessage('El teléfono es demasiado largo'),
  ],
  validate,
  registerPatient
);

router.post(
  '/login',
  [
    body('identifier').notEmpty().withMessage('Correo o usuario requerido'),
    body('password').notEmpty().withMessage('Contraseña requerida'),
  ],
  validate,
  login
);

// POST /api/auth/verify-2fa
router.post(
  '/verify-2fa',
  [
    body('userId').isInt().withMessage('userId inválido'),
    body('code').isLength({ min: 6, max: 6 }).withMessage('El código debe tener 6 dígitos'),
  ],
  validate,
  verifyTwoFA
);

// POST /api/auth/refresh
router.post(
  '/refresh',
  [body('refreshToken').notEmpty().withMessage('Refresh token requerido')],
  validate,
  refreshToken
);

// POST /api/auth/logout  (requiere autenticación)
router.post('/logout', authenticate, logout);

// POST /api/auth/oauth  (callback desde la app con datos del proveedor)
router.post(
  '/oauth',
  [
    body('provider').isIn(['google', 'facebook', 'github']).withMessage('Proveedor inválido'),
    body('clientId').notEmpty().withMessage('Cliente OAuth requerido'),
    body('code').optional().isString(),
    body('redirectUri').optional().custom((uri) => allowedOAuthRedirectUris().includes(uri)).withMessage('URI de retorno inválida'),
    body('codeVerifier').optional().isLength({ min: 43, max: 128 }).withMessage('Verificador OAuth inválido'),
    body('idToken').optional().isString(),
    body('accessToken').optional().isString(),
    body('provider').custom((provider, { req }) => {
      const payload = req.body;
      if (payload.provider === 'google' && payload.idToken) return true;
      if (payload.provider === 'facebook' && payload.accessToken) return true;
      return Boolean(payload.code && payload.redirectUri && payload.codeVerifier);
    }).withMessage('Faltan credenciales OAuth válidas'),
  ],
  validate,
  oauthCallback
);

module.exports = router;
