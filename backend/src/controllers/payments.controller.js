const PaymentModel = require('../models/payment.model');
const { logActivity } = require('../utils/activityLogger');

async function getPayments(req, res, next) {
  try {
    const { paciente_id, odontologo_id, desde, hasta } = req.query;
    const payments = await PaymentModel.findAll({ pacienteId: paciente_id, odontologoId: odontologo_id, desde, hasta });
    return res.status(200).json({ payments });
  } catch (err) { next(err); }
}

async function createPayment(req, res, next) {
  try {
    const { pacienteId, tratamientoId, importe, metodo, referencia } = req.body;
    const id = await PaymentModel.create({ pacienteId, tratamientoId, importe, metodo, referencia, registradoPor: req.user.id });
    await logActivity({ usuarioId: req.user.id, accion: 'REGISTRAR_PAGO', entidad: 'pagos', entidadId: id, ip: req.ip });
    return res.status(201).json({ message: 'Pago registrado', paymentId: id });
  } catch (err) { next(err); }
}

async function getSummaryByOdontologo(req, res, next) {
  try {
    const summary = await PaymentModel.summaryByOdontologo();
    return res.status(200).json({ summary });
  } catch (err) { next(err); }
}

async function getByOdontologoPacientes(req, res, next) {
  try {
    const data = await PaymentModel.byOdontologoPacientes(req.params.odontologoId);
    return res.status(200).json({ pacientes: data });
  } catch (err) { next(err); }
}

async function getAdminSummary(req, res, next) {
  try {
    const data = await PaymentModel.adminSummary();
    return res.status(200).json(data);
  } catch (err) { next(err); }
}

module.exports = { getPayments, createPayment, getSummaryByOdontologo, getByOdontologoPacientes, getAdminSummary };
