import api from './api';

const patientService = {
  async getAll(search = '', estado = 'activo') {
    const res = await api.get('/patients', { params: { search, estado } });
    return res.data.patients;
  },

  async getById(id) {
    const res = await api.get(`/patients/${id}`);
    return res.data.patient;
  },

  async create(data) {
    const res = await api.post('/patients', data);
    return res.data;
  },

  async update(id, data) {
    const res = await api.put(`/patients/${id}`, data);
    return res.data;
  },

  async deactivate(id) {
    const res = await api.delete(`/patients/${id}`);
    return res.data;
  },
};

export default patientService;
