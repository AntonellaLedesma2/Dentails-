import api from './api';

const clinicalRecordService = {
  async getRecord(pacienteId) {
    const res = await api.get(`/clinical-records/${pacienteId}`);
    return res.data;
  },
  async updateRecord(pacienteId, data) {
    const res = await api.put(`/clinical-records/${pacienteId}`, data);
    return res.data;
  },
  async addConsulta(pacienteId, data) {
    const res = await api.post(`/clinical-records/${pacienteId}/consultas`, data);
    return res.data;
  },
  async saveOdontograma(pacienteId, odontograma) {
    const res = await api.put(`/clinical-records/${pacienteId}/odontograma`, { odontograma });
    return res.data;
  },
};

export default clinicalRecordService;
