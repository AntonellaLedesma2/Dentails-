import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Cambiá esta IP por la de tu máquina en la red local cuando pruebes en dispositivo físico
// Para emulador Android: 10.0.2.2  |  Para dispositivo físico: IP de tu PC
// Emulador Android: http://10.0.2.2:3000/api
// Dispositivo físico: usar la IP de tu PC en la red local
const BASE_URL = 'http://192.168.100.34:3000/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Interceptor: adjunta el access token a cada request ──────────────────────
api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Interceptor: maneja token expirado y refresca automáticamente ─────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (
      error.response?.status === 401 &&
      error.response?.data?.code === 'TOKEN_EXPIRED' &&
      !original._retry
    ) {
      original._retry = true;

      try {
        const refreshToken = await SecureStore.getItemAsync('refreshToken');
        const res = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });

        await SecureStore.setItemAsync('accessToken', res.data.accessToken);
        await SecureStore.setItemAsync('refreshToken', res.data.refreshToken);

        original.headers.Authorization = `Bearer ${res.data.accessToken}`;
        return api(original);
      } catch {
        // Si el refresh falla, limpiar sesión
        await SecureStore.deleteItemAsync('accessToken');
        await SecureStore.deleteItemAsync('refreshToken');
        await SecureStore.deleteItemAsync('user');
      }
    }

    return Promise.reject(error);
  }
);

export default api;
