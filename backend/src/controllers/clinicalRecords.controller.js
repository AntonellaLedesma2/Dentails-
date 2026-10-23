const ClinicalRecordModel = require('../models/clinicalRecord.model');
const { logActivity } = require('../utils/activityLogger');

async function getRecord(req, res, next) {
  try {
    const { pacienteId } = req.params;
    if (req.user.rol !== 'odontologo' || !(await ClinicalRecordModel.hasPatientAssignment(pacienteId, req.user.id))) {
      return res.status(403).json({ error: true, message: 'Solo podés acceder a fichas de pacientes de tu agenda' });
    }
    let record = await ClinicalRecordModel.findByPatient(pacienteId);
    if (!record) {
      // Crear ficha vacía automáticamente
      await ClinicalRecordModel.createOrUpdate(pacienteId, {});
      record = await ClinicalRecordModel.findByPatient(pacienteId);
    }
    const consultas = await ClinicalRecordModel.getConsultas(record.id);
    const odontograma = await ClinicalRecordModel.getOdontograma(pacienteId);
    return res.status(200).json({ record, consultas, odontograma });
  } catch (err) { next(err); }
}

async function updateRecord(req, res, next) {
  try {
    const { pacienteId } = req.params;
    if (!(await ClinicalRecordModel.hasPatientAssignment(pacienteId, req.user.id))) {
      return res.status(403).json({ error: true, message: 'Solo podés editar fichas de pacientes de tu agenda' });
    }
    await ClinicalRecordModel.createOrUpdate(pacienteId, req.body);
    await logActivity({ usuarioId: req.user.id, accion: 'EDITAR_FICHA', entidad: 'fichas_clinicas', ip: req.ip });
    return res.status(200).json({ message: 'Ficha actualizada' });
  } catch (err) { next(err); }
}

async function addConsulta(req, res, next) {
  try {
    const { pacienteId } = req.params;
    if (!(await ClinicalRecordModel.hasPatientAssignment(pacienteId, req.user.id))) {
      return res.status(403).json({ error: true, message: 'Solo podés registrar consultas de pacientes de tu agenda' });
    }
    let record = await ClinicalRecordModel.findByPatient(pacienteId);
    if (!record) {
      await ClinicalRecordModel.createOrUpdate(pacienteId, {});
      record = await ClinicalRecordModel.findByPatient(pacienteId);
    }
    const { diagnostico, procedimiento, indicaciones, proximaCita } = req.body;
    const id = await ClinicalRecordModel.addConsulta(record.id, req.user.id, { diagnostico, procedimiento, indicaciones, proximaCita });
    await logActivity({ usuarioId: req.user.id, accion: 'AGREGAR_CONSULTA', entidad: 'consultas', entidadId: id, ip: req.ip });
    return res.status(201).json({ message: 'Consulta registrada', consultaId: id });
  } catch (err) { next(err); }
}

async function saveOdontograma(req, res, next) {
  try {
    const { pacienteId } = req.params;
    if (!(await ClinicalRecordModel.hasPatientAssignment(pacienteId, req.user.id))) {
      return res.status(403).json({ error: true, message: 'Solo podés editar odontogramas de pacientes de tu agenda' });
    }
    const { odontograma } = req.body;
    // Asegurar que existe la ficha
    let record = await ClinicalRecordModel.findByPatient(pacienteId);
    if (!record) await ClinicalRecordModel.createOrUpdate(pacienteId, {});
    await ClinicalRecordModel.saveOdontograma(pacienteId, odontograma);
    await logActivity({ usuarioId: req.user.id, accion: 'GUARDAR_ODONTOGRAMA', entidad: 'fichas_clinicas', ip: req.ip });
    return res.status(200).json({ message: 'Odontograma guardado' });
  } catch (err) { next(err); }
}

module.exports = { getRecord, updateRecord, addConsulta, saveOdontograma };
