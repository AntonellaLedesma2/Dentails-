const TreatmentModel = require('../models/treatment.model');
const ClinicalRecordModel = require('../models/clinicalRecord.model');
const { logActivity } = require('../utils/activityLogger');

async function getTreatments(req, res, next) {
  try {
    const { paciente_id, odontologo_id, estado } = req.query;
    const odontologoId = req.user.rol === 'odontologo' ? req.user.id : odontologo_id;
    const treatments = await TreatmentModel.findAll({ pacienteId: paciente_id, odontologoId, estado });
    return res.status(200).json({ treatments });
  } catch (err) { next(err); }
}

async function getTreatmentById(req, res, next) {
  try {
    const t = await TreatmentModel.findById(req.params.id);
    if (!t) return res.status(404).json({ error: true, message: 'Tratamiento no encontrado' });
    if (req.user.rol === 'odontologo' && Number(t.odontologo_id) !== Number(req.user.id)) {
      return res.status(403).json({ error: true, message: 'Solo podés ver tratamientos de tus pacientes' });
    }
    return res.status(200).json({ treatment: t });
  } catch (err) { next(err); }
}

async function createTreatment(req, res, next) {
  try {
    const { pacienteId, descripcion, costoTotal, notas } = req.body;
    const odontologoId = req.user.rol === 'odontologo' ? req.user.id : req.body.odontologoId;
    if (req.user.rol === 'odontologo' && !(await ClinicalRecordModel.hasPatientAssignment(pacienteId, req.user.id))) {
      return res.status(403).json({ error: true, message: 'El paciente no pertenece a tu agenda' });
    }
    const id = await TreatmentModel.create({ pacienteId, odontologoId, descripcion, costoTotal, notas, creadoPor: req.user.id });
    await logActivity({ usuarioId: req.user.id, accion: 'CREAR_TRATAMIENTO', entidad: 'tratamientos', entidadId: id, ip: req.ip });
    return res.status(201).json({ message: 'Tratamiento creado', treatmentId: id });
  } catch (err) { next(err); }
}

async function updateTreatment(req, res, next) {
  try {
    if (req.user.rol === 'odontologo' && !(await TreatmentModel.isAssignedToOdontologo(req.params.id, req.user.id))) {
      return res.status(403).json({ error: true, message: 'Solo podés actualizar tus propios tratamientos' });
    }
    const updated = await TreatmentModel.update(req.params.id, req.body, req.user.rol === 'odontologo' ? req.user.id : null);
    if (!updated) return res.status(404).json({ error: true, message: 'Tratamiento no encontrado' });
    await logActivity({ usuarioId: req.user.id, accion: 'EDITAR_TRATAMIENTO', entidad: 'tratamientos', entidadId: parseInt(req.params.id), ip: req.ip });
    return res.status(200).json({ message: 'Tratamiento actualizado' });
  } catch (err) { next(err); }
}

async function deleteTreatment(req, res, next) {
  try {
    const deleted = await TreatmentModel.delete(req.params.id, req.user.rol === 'odontologo' ? req.user.id : null);
    if (!deleted) return res.status(404).json({ error: true, message: 'Tratamiento no encontrado' });
    return res.status(200).json({ message: 'Tratamiento eliminado' });
  } catch (err) { next(err); }
}

module.exports = { getTreatments, getTreatmentById, createTreatment, updateTreatment, deleteTreatment };
