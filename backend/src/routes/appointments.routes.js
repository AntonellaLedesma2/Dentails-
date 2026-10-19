const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const {
  getAppointments, getAppointmentById,
  createAppointment, updateAppointment,
  changeEstado, cancelAppointment,
} = require('../controllers/appointments.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');

router.use(authenticate);

// GET /api/appointments
router.get('/', authorize('administrador', 'recepcion', 'odontologo'), getAppointments);

// GET /api/appointments/:id
router.get('/:id', authorize('administrador', 'recepcion', 'odontologo'), getAppointmentById);

// POST /api/appointments
router.post(
  '/',
  authorize('administrador', 'recepcion'),
  [
    body('pacienteId').isInt().withMessage('pacienteId requerido'),
    body('odontologoId').isInt().withMessage('odontologoId requerido'),
    body('fecha').matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('fecha debe ser AAAA-MM-DD'),
    body('hora').matches(/^\d{2}:\d{2}$/).withMessage('hora debe ser HH:MM'),
  ],
  validate,
  createAppointment
);

// PUT /api/appointments/:id
router.put(
  '/:id',
  authorize('administrador', 'recepcion'),
  [
    body('fecha').optional().matches(/^\d{4}-\d{2}-\d{2}$/),
    body('hora').optional().matches(/^\d{2}:\d{2}$/),
  ],
  validate,
  updateAppointment
);

// PATCH /api/appointments/:id/estado
router.patch(
  '/:id/estado',
  authorize('administrador', 'recepcion', 'odontologo'),
  [body('estado').notEmpty().withMessage('estado requerido')],
  validate,
  changeEstado
);

// DELETE /api/appointments/:id  → cancelar
router.delete('/:id', authorize('administrador', 'recepcion'), cancelAppointment);

module.exports = router;
