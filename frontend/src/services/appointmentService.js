import api from './api';

const appointmentService = {
  async getAll(params = {}) {
    const res = await api.get('/appointments', { params });
    return res.data.appointments;
  },

  async getById(id) {
    const res = await api.get(`/appointments/${id}`);
    return res.data.appointment;
  },

  async create(data) {
    const res = await api.post('/appointments', data);
    return res.data;
  },

  async update(id, data) {
    const res = await api.put(`/appointments/${id}`, data);
    return res.data;
  },

  async changeEstado(id, estado) {
    const res = await api.patch(`/appointments/${id}/estado`, { estado });
    return res.data;
  },

  async cancel(id) {
    const res = await api.delete(`/appointments/${id}`);
    return res.data;
  },
};

export default appointmentService;
