import api from './api';
import secureStorage from './secureStorage';

const authService = {
  async registerPatient(data) {
    const res = await api.post('/auth/register', data);
    return res.data;
  },

  /**
   * Login con email/usuario y contraseña
   */
  async login(identifier, password) {
    const res = await api.post('/auth/login', { identifier, password });
    return res.data;
  },

  /**
   * Verificar código 2FA
   */
  async verifyTwoFA(userId, code) {
    const res = await api.post('/auth/verify-2fa', { userId, code });
    return res.data;
  },

  /**
   * Login con OAuth (Google, Facebook, GitHub)
   */
  async oauthLogin(provider, credentials) {
    const res = await api.post('/auth/oauth', { provider, ...credentials });
    return res.data;
  },

  /**
   * Logout
   */
  async logout() {
    try {
      await api.post('/auth/logout');
    } finally {
      await secureStorage.deleteItemAsync('accessToken');
      await secureStorage.deleteItemAsync('refreshToken');
      await secureStorage.deleteItemAsync('user');
    }
  },

  /**
   * Guardar tokens y datos del usuario en SecureStore
   */
  async saveSession(accessToken, refreshToken, user) {
    await secureStorage.setItemAsync('accessToken', accessToken);
    await secureStorage.setItemAsync('refreshToken', refreshToken);
    await secureStorage.setItemAsync('user', JSON.stringify(user));
  },

  /**
   * Recuperar sesión guardada
   */
  async getStoredSession() {
    const token = await secureStorage.getItemAsync('accessToken');
    const userStr = await secureStorage.getItemAsync('user');
    if (!token || !userStr) return null;
    return { token, user: JSON.parse(userStr) };
  },
};

export default authService;
