const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const {
  getAppointments, getAppointmentById,
  getAppointmentRequests,
  createAppointment, updateAppointment,
  changeEstado, cancelAppointment,
} = require('../controllers/appointments.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');

router.use(authenticate);

// GET /api/appointments
router.get('/', authorize('administrador', 'recepcion', 'odontologo'), getAppointments);
router.get('/requests', authorize('administrador', 'recepcion'), getAppointmentRequests);

// GET /api/appointments/:id
router.get('/:id', authorize('administrador', 'recepcion', 'odontologo'), getAppointmentById);

// POST /api/appointments
router.post(
  '/',
  authorize('administrador', 'recepcion', 'odontologo', 'usuario'),
  [
    body('pacienteId').optional().isInt().withMessage('pacienteId inválido'),
    body('odontologoId').isInt().withMessage('odontologoId requerido'),
    body('fecha').matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('fecha debe ser AAAA-MM-DD'),
    body('hora').matches(/^\d{2}:\d{2}$/).withMessage('hora debe ser HH:MM'),
    body('duracionMin').optional().isInt({ min: 1, max: 480 }).withMessage('duracionMin debe estar entre 1 y 480 minutos'),
  ],
  validate,
  createAppointment
);

// PUT /api/appointments/:id
router.put(
  '/:id',
  authorize('administrador'),
  [
    body('fecha').optional().matches(/^\d{4}-\d{2}-\d{2}$/),
    body('hora').optional().matches(/^\d{2}:\d{2}$/),
    body('duracionMin').optional().isInt({ min: 1, max: 480 }).withMessage('duracionMin debe estar entre 1 y 480 minutos'),
    body('estado').optional().isIn(['pendiente', 'confirmado', 'cancelado', 'reprogramado', 'realizado']),
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
router.delete('/:id', authorize('administrador'), cancelAppointment);

module.exports = router;
