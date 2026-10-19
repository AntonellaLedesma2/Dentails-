const AppointmentModel = require('../models/appointment.model');
const { logActivity } = require('../utils/activityLogger');

// GET /api/appointments
async function getAppointments(req, res, next) {
  try {
    const { fecha, odontologo_id, estado, paciente_id } = req.query;

    // El odontólogo solo ve sus propios turnos
    const odontologoId = req.user.rol === 'odontologo'
      ? req.user.id
      : odontologo_id || null;

    const appointments = await AppointmentModel.findAll({
      fecha,
      odontologoId,
      estado,
      pacienteId: paciente_id,
    });
    return res.status(200).json({ appointments });
  } catch (err) { next(err); }
}

// GET /api/appointments/:id
async function getAppointmentById(req, res, next) {
  try {
    const appt = await AppointmentModel.findById(req.params.id);
    if (!appt) return res.status(404).json({ error: true, message: 'Turno no encontrado' });

    // Odontólogo solo puede ver sus propios turnos
    if (req.user.rol === 'odontologo' && appt.odontologo_id !== req.user.id) {
      return res.status(403).json({ error: true, message: 'Sin permiso para ver este turno' });
    }
    return res.status(200).json({ appointment: appt });
  } catch (err) { next(err); }
}

// POST /api/appointments
async function createAppointment(req, res, next) {
  try {
    const { pacienteId, odontologoId, fecha, hora, duracionMin, motivo, notas } = req.body;

    const id = await AppointmentModel.create({
      pacienteId, odontologoId, fecha, hora,
      duracionMin: duracionMin || 30,
      motivo, notas,
      creadoPor: req.user.id,
    });

    await logActivity({
      usuarioId: req.user.id,
      accion: 'CREAR_TURNO',
      entidad: 'turnos',
      entidadId: id,
      ip: req.ip,
    });

    return res.status(201).json({ message: 'Turno creado correctamente', appointmentId: id });
  } catch (err) { next(err); }
}

// PUT /api/appointments/:id
async function updateAppointment(req, res, next) {
  try {
    const { id } = req.params;
    const updated = await AppointmentModel.update(id, req.body);
    if (!updated) return res.status(404).json({ error: true, message: 'Turno no encontrado' });

    await logActivity({
      usuarioId: req.user.id,
      accion: 'EDITAR_TURNO',
      entidad: 'turnos',
      entidadId: parseInt(id),
      ip: req.ip,
    });

    return res.status(200).json({ message: 'Turno actualizado correctamente' });
  } catch (err) { next(err); }
}

// PATCH /api/appointments/:id/estado
async function changeEstado(req, res, next) {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    const validEstados = ['pendiente', 'confirmado', 'cancelado', 'realizado', 'reprogramado'];
    if (!validEstados.includes(estado)) {
      return res.status(422).json({ error: true, message: 'Estado inválido' });
    }

    const updated = await AppointmentModel.setEstado(id, estado);
    if (!updated) return res.status(404).json({ error: true, message: 'Turno no encontrado' });

    await logActivity({
      usuarioId: req.user.id,
      accion: `TURNO_${estado.toUpperCase()}`,
      entidad: 'turnos',
      entidadId: parseInt(id),
      ip: req.ip,
    });

    return res.status(200).json({ message: `Turno marcado como ${estado}` });
  } catch (err) { next(err); }
}

// DELETE /api/appointments/:id  → cancelar
async function cancelAppointment(req, res, next) {
  try {
    const { id } = req.params;
    const updated = await AppointmentModel.setEstado(id, 'cancelado');
    if (!updated) return res.status(404).json({ error: true, message: 'Turno no encontrado' });

    await logActivity({
      usuarioId: req.user.id,
      accion: 'CANCELAR_TURNO',
      entidad: 'turnos',
      entidadId: parseInt(id),
      ip: req.ip,
    });

    return res.status(200).json({ message: 'Turno cancelado' });
  } catch (err) { next(err); }
}

module.exports = {
  getAppointments, getAppointmentById,
  createAppointment, updateAppointment,
  changeEstado, cancelAppointment,
};
