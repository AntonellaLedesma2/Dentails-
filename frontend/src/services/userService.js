import api from './api';

const userService = {
  async getMe() {
    const res = await api.get('/users/me');
    return res.data.user;
  },

  async getAll() {
    const res = await api.get('/users');
    return res.data.users;
  },

  async getById(id) {
    const res = await api.get(`/users/${id}`);
    return res.data.user;
  },

  async create(data) {
    const res = await api.post('/users', data);
    return res.data;
  },

  async update(id, data) {
    const res = await api.patch(`/users/${id}`, data);
    return res.data;
  },

  async changePassword(currentPassword, newPassword) {
    const res = await api.put('/users/me/password', { currentPassword, newPassword });
    return res.data;
  },
};

export default userService;
