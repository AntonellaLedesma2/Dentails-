import api from './api';

const treatmentCatalogService = {
  async getAll() {
    const res = await api.get('/treatment-catalog');
    return res.data.treatments;
  },
  async create(data) {
    const res = await api.post('/treatment-catalog', data);
    return res.data;
  },
  async update(id, data) {
    const res = await api.patch(`/treatment-catalog/${id}`, data);
    return res.data;
  },
};

export default treatmentCatalogService;
