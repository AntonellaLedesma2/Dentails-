const PatientModel = require('../models/patient.model');
const { logActivity } = require('../utils/activityLogger');

// GET /api/patients
async function getPatients(req, res, next) {
  try {
    const { search = '', estado = 'activo' } = req.query;
    const patients = await PatientModel.findAll({ search, estado });
    return res.status(200).json({ patients });
  } catch (err) { next(err); }
}

// GET /api/patients/:id
async function getPatientById(req, res, next) {
  try {
    const patient = await PatientModel.findById(req.params.id);
    if (!patient) return res.status(404).json({ error: true, message: 'Paciente no encontrado' });
    return res.status(200).json({ patient });
  } catch (err) { next(err); }
}

// POST /api/patients
async function createPatient(req, res, next) {
  try {
    const { nombre, apellido, dni } = req.body;

    if (dni) {
      const existing = await PatientModel.findByDni(dni);
      if (existing) return res.status(409).json({ error: true, message: 'Ya existe un paciente con ese DNI' });
    }

    const id = await PatientModel.create({ ...req.body, creadoPor: req.user.id });

    await logActivity({
      usuarioId: req.user.id,
      accion: 'CREAR_PACIENTE',
      entidad: 'pacientes',
      entidadId: id,
      descripcion: `Creó paciente ${nombre} ${apellido}`,
      ip: req.ip,
    });

    return res.status(201).json({ message: 'Paciente creado correctamente', patientId: id });
  } catch (err) { next(err); }
}

// PUT /api/patients/:id
async function updatePatient(req, res, next) {
  try {
    const { id } = req.params;
    const updated = await PatientModel.update(id, req.body);
    if (!updated) return res.status(404).json({ error: true, message: 'Paciente no encontrado' });

    await logActivity({
      usuarioId: req.user.id,
      accion: 'EDITAR_PACIENTE',
      entidad: 'pacientes',
      entidadId: parseInt(id),
      ip: req.ip,
    });

    return res.status(200).json({ message: 'Paciente actualizado correctamente' });
  } catch (err) { next(err); }
}

// DELETE /api/patients/:id  → desactivar (soft delete)
async function deactivatePatient(req, res, next) {
  try {
    const { id } = req.params;
    const updated = await PatientModel.setEstado(id, 'inactivo');
    if (!updated) return res.status(404).json({ error: true, message: 'Paciente no encontrado' });

    await logActivity({
      usuarioId: req.user.id,
      accion: 'DESACTIVAR_PACIENTE',
      entidad: 'pacientes',
      entidadId: parseInt(id),
      ip: req.ip,
    });

    return res.status(200).json({ message: 'Paciente desactivado' });
  } catch (err) { next(err); }
}

module.exports = { getPatients, getPatientById, createPatient, updatePatient, deactivatePatient };
