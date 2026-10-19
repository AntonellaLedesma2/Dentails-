const express = require('express');
const { body, query } = require('express-validator');
const router = express.Router();

const {
  getPatients, getPatientById, createPatient, updatePatient, deactivatePatient,
} = require('../controllers/patients.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');

router.use(authenticate);

// GET /api/patients
router.get('/', authorize('administrador', 'recepcion', 'odontologo'), getPatients);

// GET /api/patients/:id
router.get('/:id', authorize('administrador', 'recepcion', 'odontologo'), getPatientById);

// POST /api/patients  (admin + recepcion)
router.post(
  '/',
  authorize('administrador', 'recepcion'),
  [
    body('nombre').notEmpty().withMessage('Nombre requerido'),
    body('apellido').notEmpty().withMessage('Apellido requerido'),
    body('correo').optional().isEmail().withMessage('Correo inválido'),
  ],
  validate,
  createPatient
);

// PUT /api/patients/:id  (admin + recepcion)
router.put(
  '/:id',
  authorize('administrador', 'recepcion'),
  [
    body('correo').optional().isEmail().withMessage('Correo inválido'),
  ],
  validate,
  updatePatient
);

// DELETE /api/patients/:id  → soft delete (solo admin)
router.delete('/:id', authorize('administrador'), deactivatePatient);

module.exports = router;
