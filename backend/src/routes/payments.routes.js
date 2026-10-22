const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { getPayments, createPayment, getSummaryByOdontologo, getByOdontologoPacientes, getAdminSummary } = require('../controllers/payments.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');

router.use(authenticate);

router.get('/',                                    authorize('administrador','recepcion'), getPayments);
router.get('/summary',                             authorize('administrador','recepcion'), getSummaryByOdontologo);
router.get('/admin-summary',                       authorize('administrador'), getAdminSummary);
router.get('/by-odontologo/:odontologoId',         authorize('administrador','recepcion'), getByOdontologoPacientes);

router.post('/',
  authorize('administrador','recepcion'),
  [
    body('pacienteId').isInt().withMessage('pacienteId requerido'),
    body('importe').isFloat({ min: 0.01 }).withMessage('importe inválido'),
    body('metodo').isIn(['efectivo','tarjeta_debito','tarjeta_credito','transferencia','obra_social']).withMessage('método inválido'),
  ],
  validate, createPayment
);

module.exports = router;
