import api from './api';

const treatmentService = {
  async getAll(params = {}) {
    const res = await api.get('/treatments', { params });
    return res.data.treatments;
  },
  async getById(id) {
    const res = await api.get(`/treatments/${id}`);
    return res.data.treatment;
  },
  async create(data) {
    const res = await api.post('/treatments', data);
    return res.data;
  },
  async update(id, data) {
    const res = await api.put(`/treatments/${id}`, data);
    return res.data;
  },
  async remove(id) {
    const res = await api.delete(`/treatments/${id}`);
    return res.data;
  },
};

export default treatmentService;
