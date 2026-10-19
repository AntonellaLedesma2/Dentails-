const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const { getUsers, getUserById, createUser, updateUser, changePassword, getMe } = require('../controllers/users.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');

// Todos los endpoints requieren autenticación
router.use(authenticate);

// GET /api/users/me  - perfil propio (cualquier rol)
router.get('/me', getMe);

// PUT /api/users/me/password  - cambiar contraseña propia (cualquier rol)
router.put(
  '/me/password',
  [
    body('currentPassword').notEmpty().withMessage('Contraseña actual requerida'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('La nueva contraseña debe tener al menos 8 caracteres'),
  ],
  validate,
  changePassword
);

// ─── Solo administrador ───────────────────────────────────────────────────────

// GET /api/users  - listar todos
router.get('/', authorize('administrador'), getUsers);

// GET /api/users/:id
router.get('/:id', authorize('administrador'), getUserById);

// POST /api/users  - crear usuario
router.post(
  '/',
  authorize('administrador'),
  [
    body('nombre').notEmpty().withMessage('Nombre requerido'),
    body('apellido').notEmpty().withMessage('Apellido requerido'),
    body('correo').isEmail().withMessage('Correo inválido'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('La contraseña debe tener al menos 8 caracteres'),
    body('rol')
      .isIn(['administrador', 'recepcion', 'odontologo'])
      .withMessage('Rol inválido'),
  ],
  validate,
  createUser
);

// PATCH /api/users/:id  - editar rol o estado
router.patch(
  '/:id',
  authorize('administrador'),
  [
    body('rol')
      .optional()
      .isIn(['administrador', 'recepcion', 'odontologo'])
      .withMessage('Rol inválido'),
    body('estado')
      .optional()
      .isIn(['activo', 'inactivo'])
      .withMessage('Estado inválido'),
  ],
  validate,
  updateUser
);

module.exports = router;
