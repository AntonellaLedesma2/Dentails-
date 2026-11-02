const AppointmentModel = require('../models/appointment.model');
const PatientModel = require('../models/patient.model');
const { logActivity } = require('../utils/activityLogger');

function timeToMinutes(time) {
  const match = String(time || '').match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

function normalizeDate(date) {
  return date instanceof Date ? date.toISOString().slice(0, 10) : String(date || '').slice(0, 10);
}

async function hasScheduleConflict({ fecha, hora, odontologoId, duracionMin, excludeId }) {
  const start = timeToMinutes(hora);
  const duration = Number(duracionMin);
  if (start === null || !Number.isInteger(duration) || duration < 1 || start + duration > 24 * 60) {
    return { invalidSchedule: true };
  }

  const existingAppointments = await AppointmentModel.findByDateAndOdontologo(
    normalizeDate(fecha), odontologoId, excludeId
  );
  const end = start + duration;

  const conflict = existingAppointments.find((appointment) => {
    const existingStart = timeToMinutes(appointment.hora);
    const existingDuration = Number(appointment.duracion_min) || 30;
    if (existingStart === null) return false;
    return start < existingStart + existingDuration && existingStart < end;
  });

  return conflict ? { conflict } : null;
}

function sendScheduleConflict(res, result) {
  if (result?.invalidSchedule) {
    res.status(422).json({ error: true, message: 'El horario o la duración del turno no son válidos' });
    return true;
  }
  if (result?.conflict) {
    res.status(409).json({ error: true, message: 'El odontólogo ya tiene un turno que se superpone con ese horario' });
    return true;
  }
  return false;
}

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

async function getAppointmentRequests(req, res, next) {
  try {
    const appointments = await AppointmentModel.findAppointmentRequests();
    return res.status(200).json({ appointments });
  } catch (err) { next(err); }
}

// GET /api/appointments/:id
async function getAppointmentById(req, res, next) {
  try {
    const appt = await AppointmentModel.findById(req.params.id);
    if (!appt) return res.status(404).json({ error: true, message: 'Turno no encontrado' });

    // Odontólogo solo puede ver sus propios turnos
    if (req.user.rol === 'odontologo' && Number(appt.odontologo_id) !== Number(req.user.id)) {
      return res.status(403).json({ error: true, message: 'Sin permiso para ver este turno' });
    }
    return res.status(200).json({ appointment: appt });
  } catch (err) { next(err); }
}

// POST /api/appointments
async function createAppointment(req, res, next) {
  try {
    const { fecha, hora, duracionMin, motivo, notas } = req.body;
    let pacienteId = req.body.pacienteId;
    const odontologoId = req.user.rol === 'odontologo' ? req.user.id : req.body.odontologoId;
    if (req.user.rol === 'usuario') {
      const patient = await PatientModel.findByUserId(req.user.id);
      if (!patient) return res.status(404).json({ error: true, message: 'No se encontró tu ficha de paciente. Contactá a recepción.' });
      pacienteId = patient.id;
    }
    if (req.user.rol === 'odontologo') {
      const patient = await PatientModel.findById(pacienteId, req.user.id);
      if (!patient) return res.status(403).json({ error: true, message: 'Solo podés solicitar turnos para pacientes asignados a tu agenda' });
    }
    if (req.user.rol !== 'usuario' && !pacienteId) {
      return res.status(422).json({ error: true, message: 'Seleccioná un paciente' });
    }
    const duracion = duracionMin ?? 30;
    const scheduleResult = await hasScheduleConflict({
      fecha, hora, odontologoId, duracionMin: duracion,
    });
    if (sendScheduleConflict(res, scheduleResult)) return;

    const id = await AppointmentModel.create({
      pacienteId, odontologoId, fecha, hora,
      duracionMin: duracion,
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
    const { estado, ...appointmentData } = req.body;
    const currentAppointment = await AppointmentModel.findById(id);
    if (!currentAppointment) return res.status(404).json({ error: true, message: 'Turno no encontrado' });

    if (estado !== undefined) {
      const validEstados = ['pendiente', 'confirmado', 'cancelado', 'reprogramado', 'realizado'];
      if (!validEstados.includes(estado)) {
        return res.status(422).json({ error: true, message: 'Estado inválido' });
      }
      if (req.user.rol === 'recepcion' && estado === 'realizado') {
        return res.status(403).json({ error: true, message: 'Recepción no puede marcar un turno como realizado' });
      }
    }

    const targetEstado = estado ?? currentAppointment.estado;
    const scheduleChanged = ['fecha', 'hora', 'odontologoId', 'duracionMin']
      .some((field) => appointmentData[field] !== undefined);
    const reactivating = currentAppointment.estado === 'cancelado' && targetEstado !== 'cancelado';
    if (targetEstado !== 'cancelado' && (scheduleChanged || reactivating)) {
      const scheduleResult = await hasScheduleConflict({
        fecha: appointmentData.fecha ?? currentAppointment.fecha,
        hora: appointmentData.hora ?? currentAppointment.hora,
        odontologoId: appointmentData.odontologoId ?? currentAppointment.odontologo_id,
        duracionMin: appointmentData.duracionMin ?? currentAppointment.duracion_min,
        excludeId: id,
      });
      if (sendScheduleConflict(res, scheduleResult)) return;
    }

    await AppointmentModel.update(id, appointmentData);
    if (estado !== undefined) {
      await AppointmentModel.setEstado(id, estado);
    }

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

    const appointment = await AppointmentModel.findById(id);
    if (!appointment) return res.status(404).json({ error: true, message: 'Turno no encontrado' });
    const appointmentRequest = await AppointmentModel.isAppointmentRequest(id);
    if (req.user.rol === 'recepcion' && (appointment.estado !== 'pendiente' || (estado !== 'confirmado' && !(estado === 'cancelado' && appointmentRequest)))) {
      return res.status(403).json({ error: true, message: 'Recepción puede confirmar turnos pendientes y rechazar solicitudes pendientes' });
    }
    if (req.user.rol === 'odontologo' && estado !== 'realizado') {
      return res.status(403).json({ error: true, message: 'El odontólogo solo puede marcar turnos como realizados' });
    }
    if (req.user.rol === 'odontologo' && Number(appointment.odontologo_id) !== Number(req.user.id)) {
      return res.status(403).json({ error: true, message: 'Solo podés actualizar turnos de tu propia agenda' });
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
  getAppointments, getAppointmentRequests, getAppointmentById,
  createAppointment, updateAppointment,
  changeEstado, cancelAppointment,
};
