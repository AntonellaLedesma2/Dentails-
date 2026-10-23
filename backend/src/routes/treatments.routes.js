const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { getTreatments, getTreatmentById, createTreatment, updateTreatment, deleteTreatment } = require('../controllers/treatments.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');

router.use(authenticate);

router.get('/',    authorize('administrador','recepcion','odontologo'), getTreatments);
router.get('/:id', authorize('administrador','recepcion','odontologo'), getTreatmentById);

router.post('/',
  authorize('odontologo'),
  [
    body('pacienteId').isInt().withMessage('pacienteId requerido'),
    body('odontologoId').isInt().withMessage('odontologoId requerido'),
    body('descripcion').notEmpty().withMessage('descripción requerida'),
    body('costoTotal').optional().isFloat({ min: 0 }).withMessage('costo inválido'),
  ],
  validate, createTreatment
);

router.put('/:id',
  authorize('odontologo'),
  [
    body('estado').optional().isIn(['planificado','en_curso','completado','cancelado']),
    body('costoTotal').optional().isFloat({ min: 0 }),
  ],
  validate, updateTreatment
);

router.delete('/:id', authorize('odontologo'), deleteTreatment);

module.exports = router;
