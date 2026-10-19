import api from './api';
import * as SecureStore from 'expo-secure-store';

const authService = {
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
  async oauthLogin(provider, oauthId, email, nombre, apellido) {
    const res = await api.post('/auth/oauth', { provider, oauthId, email, nombre, apellido });
    return res.data;
  },

  /**
   * Logout
   */
  async logout() {
    try {
      await api.post('/auth/logout');
    } finally {
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');
      await SecureStore.deleteItemAsync('user');
    }
  },

  /**
   * Guardar tokens y datos del usuario en SecureStore
   */
  async saveSession(accessToken, refreshToken, user) {
    await SecureStore.setItemAsync('accessToken', accessToken);
    await SecureStore.setItemAsync('refreshToken', refreshToken);
    await SecureStore.setItemAsync('user', JSON.stringify(user));
  },

  /**
   * Recuperar sesión guardada
   */
  async getStoredSession() {
    const token = await SecureStore.getItemAsync('accessToken');
    const userStr = await SecureStore.getItemAsync('user');
    if (!token || !userStr) return null;
    return { token, user: JSON.parse(userStr) };
  },
};

export default authService;
