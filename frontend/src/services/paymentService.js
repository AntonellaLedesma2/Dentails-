import api from './api';

const paymentService = {
  async getAll(params = {}) {
    const res = await api.get('/payments', { params });
    return res.data.payments;
  },
  async create(data) {
    const res = await api.post('/payments', data);
    return res.data;
  },
  async getSummaryByOdontologo() {
    const res = await api.get('/payments/summary');
    return res.data.summary;
  },
  async getByOdontologoPacientes(odontologoId) {
    const res = await api.get(`/payments/by-odontologo/${odontologoId}`);
    return res.data.pacientes;
  },
  async getAdminSummary() {
    const res = await api.get('/payments/admin-summary');
    return res.data;
  },
};

export default paymentService;
