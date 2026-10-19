const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const { login, verifyTwoFA, refreshToken, logout, oauthCallback } = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');

// POST /api/auth/login
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
    body('oauthId').notEmpty().withMessage('oauthId requerido'),
    body('email').isEmail().withMessage('Email inválido'),
  ],
  validate,
  oauthCallback
);

module.exports = router;
