import axios, { create as createAxios } from 'axios';
import { Platform } from 'react-native';
import secureStorage from './secureStorage';

// Cambiá esta IP por la de tu máquina en la red local cuando pruebes en dispositivo físico
// Para emulador Android: 10.0.2.2  |  Para dispositivo físico: IP de tu PC
// Emulador Android: http://10.0.2.2:3000/api
// Dispositivo físico: usar la IP de tu PC en la red local
const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL;
const webApiUrl = process.env.EXPO_PUBLIC_API_URL_WEB;
const nativeApiUrl = process.env.EXPO_PUBLIC_API_URL_NATIVE;
const emulatorApiUrl = 'http://10.0.2.2:3000/api';
const defaultApiUrl = Platform.OS === 'web' ? 'http://localhost:3000/api' : emulatorApiUrl;
// EXPO_PUBLIC_API_URL_NATIVE should point at the computer's LAN IP when using
// a physical phone. 10.0.2.2 is only reachable from the Android emulator.
const BASE_URL = Platform.OS === 'web'
  ? webApiUrl || (configuredApiUrl?.includes('10.0.2.2') ? configuredApiUrl.replace('10.0.2.2', 'localhost') : configuredApiUrl) || defaultApiUrl
  : nativeApiUrl || configuredApiUrl || defaultApiUrl;

const api = createAxios({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Interceptor: adjunta el access token a cada request ──────────────────────
api.interceptors.request.use(
  async (config) => {
    const token = await secureStorage.getItemAsync('accessToken');
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
        const refreshToken = await secureStorage.getItemAsync('refreshToken');
        const res = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });

        await secureStorage.setItemAsync('accessToken', res.data.accessToken);
        await secureStorage.setItemAsync('refreshToken', res.data.refreshToken);

        original.headers.Authorization = `Bearer ${res.data.accessToken}`;
        return api(original);
      } catch {
        // Si el refresh falla, limpiar sesión
        await secureStorage.deleteItemAsync('accessToken');
        await secureStorage.deleteItemAsync('refreshToken');
        await secureStorage.deleteItemAsync('user');
      }
    }

    return Promise.reject(error);
  }
);

export default api;
